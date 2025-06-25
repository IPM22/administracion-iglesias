import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import {
  MessageSquare,
  Users,
  Send,
  Loader2,
  CheckCircle,
  XCircle,
  Phone,
  Heart,
  AlertTriangle,
  Edit3,
  MessageCircle,
  Smartphone,
} from "lucide-react";

interface Persona {
  id: number;
  nombres: string;
  apellidos: string;
  celular?: string;
  rol: string;
  fechaPrimeraVisita?: string;
}

interface MensajeMasivoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personas: Persona[];
  seccionActual: string;
  eventoNombre?: string;
}

interface ResultadoEnvio {
  success: boolean;
  resultados?: {
    exitosos: Array<{ persona: string; telefono: string }>;
    fallidos: Array<{ persona: string; error: string }>;
    total: number;
  };
  resumen?: {
    total: number;
    exitosos: number;
    fallidos: number;
    porcentajeExito: string;
  };
  error?: string;
}

interface TemplateData {
  key: string;
  preview: string;
}

interface DatosPersonalizacion {
  [key: string]: string;
  nombreIglesia: string;
  evento: string;
  proximoEvento: string;
  hora: string;
}

type TemplateKey = keyof typeof templates;

const templates = {
  agradecimientoVisita: {
    nombre: "Agradecimiento por Visita",
    descripcion: "Mensaje personalizado para agradecer a las visitas",
    icono: <Heart className="h-4 w-4" />,
    variables: ["nombre", "evento", "nombreIglesia"],
  },
  agradecimientoGeneral: {
    nombre: "Agradecimiento General",
    descripcion: "Mensaje general de agradecimiento",
    icono: <MessageSquare className="h-4 w-4" />,
    variables: ["nombre", "nombreIglesia"],
  },
  invitacionRetorno: {
    nombre: "Invitación a Regresar",
    descripcion: "Invitación amable para una próxima visita",
    icono: <Users className="h-4 w-4" />,
    variables: ["nombre", "proximoEvento", "hora", "nombreIglesia"],
  },
} as const;

export function MensajeMasivoModal({
  open,
  onOpenChange,
  personas,
  seccionActual,
  eventoNombre,
}: MensajeMasivoModalProps) {
  // Obtener información de la iglesia del contexto
  const { iglesiaActiva } = useAuth();

  const [tipoEnvio, setTipoEnvio] = useState<"whatsapp" | "sms">("whatsapp");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey>(
    "agradecimientoVisita"
  );
  const [datosPersonalizacion, setDatosPersonalizacion] =
    useState<DatosPersonalizacion>({
      nombreIglesia: iglesiaActiva?.nombre || "Mi Iglesia",
      evento: eventoNombre || "nuestro culto dominical",
      proximoEvento: "domingo",
      hora: "10:00 AM",
    });
  const [mensajePersonalizado, setMensajePersonalizado] = useState("");
  const [modoEdicion, setModoEdicion] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoEnvio | null>(null);
  const [vistaResultados, setVistaResultados] = useState(false);

  // Actualizar nombre de iglesia cuando cambie el contexto
  useEffect(() => {
    if (iglesiaActiva?.nombre) {
      setDatosPersonalizacion((prev) => ({
        ...prev,
        nombreIglesia: iglesiaActiva.nombre,
      }));
    }
  }, [iglesiaActiva]);

  // Actualizar evento cuando cambie la prop eventoNombre
  useEffect(() => {
    if (eventoNombre) {
      setDatosPersonalizacion((prev) => ({
        ...prev,
        evento: eventoNombre,
      }));
    }
  }, [eventoNombre]);

  // Cargar mensaje del template cuando cambie la selección
  useEffect(() => {
    const cargarMensaje = async () => {
      try {
        const response = await fetch(`/api/${tipoEnvio}/masivo`);
        if (response.ok) {
          const data = await response.json();
          const template = data.templates?.find(
            (t: TemplateData) => t.key === selectedTemplate
          );
          if (template) {
            // Personalizar el mensaje con los datos actuales
            let mensaje = template.preview;
            Object.keys(datosPersonalizacion).forEach((key) => {
              const regex = new RegExp(`{{${key}}}`, "g");
              mensaje = mensaje.replace(regex, datosPersonalizacion[key] || "");
            });
            setMensajePersonalizado(mensaje);
          }
        }
      } catch (error) {
        console.error("Error cargando template:", error);
      }
    };

    if (selectedTemplate && !modoEdicion) {
      cargarMensaje();
    }
  }, [selectedTemplate, datosPersonalizacion, tipoEnvio, modoEdicion]);

  // Filtrar personas según la sección actual
  const personasFiltradas = React.useMemo(() => {
    if (seccionActual === "visitas") {
      return personas.filter((p) => p.rol === "VISITA");
    }
    return personas;
  }, [personas, seccionActual]);

  // Contar personas con celular
  const personasConCelular = personasFiltradas.filter(
    (p) => p.celular && p.celular.trim() !== ""
  );

  const handleEnviar = async () => {
    try {
      setEnviando(true);
      setResultado(null);

      const endpoint =
        tipoEnvio === "whatsapp" ? "/api/whatsapp/masivo" : "/api/sms/masivo";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personas: personasConCelular,
          templateKey: selectedTemplate,
          datosPersonalizacion,
          filtrarSoloConCelular: true,
          // Si está en modo edición, enviar el mensaje personalizado
          ...(modoEdicion && { mensajePersonalizado }),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResultado(data);
        setVistaResultados(true);
      } else {
        setResultado({ success: false, error: data.error });
      }
    } catch (error) {
      console.error("Error enviando mensajes:", error);
      setResultado({
        success: false,
        error: "Error de conexión al enviar mensajes",
      });
    } finally {
      setEnviando(false);
    }
  };

  const resetModal = () => {
    setVistaResultados(false);
    setResultado(null);
    setEnviando(false);
    setModoEdicion(false);
  };

  const handleClose = () => {
    resetModal();
    onOpenChange(false);
  };

  const personalizarMensaje = (template: string) => {
    let mensaje = template;
    Object.keys(datosPersonalizacion).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      mensaje = mensaje.replace(regex, datosPersonalizacion[key] || "");
    });
    return mensaje;
  };

  if (vistaResultados && resultado?.success) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className="max-h-[80vh] overflow-y-auto bg-background"
          style={{ maxWidth: "80rem", width: "95vw" }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Mensajes Enviados
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Resumen del envío masivo de{" "}
              {tipoEnvio === "whatsapp" ? "WhatsApp" : "SMS"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Resumen */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg text-card-foreground">
                  Resumen del Envío
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {resultado.resumen?.total}
                    </div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {resultado.resumen?.exitosos}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Exitosos
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {resultado.resumen?.fallidos}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Fallidos
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {resultado.resumen?.porcentajeExito}%
                    </div>
                    <div className="text-sm text-muted-foreground">Éxito</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mensajes exitosos */}
            {resultado.resultados?.exitosos &&
              resultado.resultados.exitosos.length > 0 && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <CheckCircle className="h-4 w-4" />
                      Mensajes Exitosos ({resultado.resultados.exitosos.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {resultado.resultados.exitosos.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between py-2 border-b border-border"
                        >
                          <span className="font-medium text-foreground">
                            {item.persona}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-green-600 dark:text-green-400 border-green-200 dark:border-green-800"
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            {item.telefono}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Mensajes fallidos */}
            {resultado.resultados?.fallidos &&
              resultado.resultados.fallidos.length > 0 && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                      <XCircle className="h-4 w-4" />
                      Mensajes Fallidos ({resultado.resultados.fallidos.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {resultado.resultados.fallidos.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between py-2 border-b border-border"
                        >
                          <span className="font-medium text-foreground">
                            {item.persona}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                          >
                            {item.error}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

            <div className="flex justify-end gap-2">
              <Button
                onClick={handleClose}
                className="bg-primary hover:bg-primary/90"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto bg-background"
        style={{ maxWidth: "90rem", width: "95vw" }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Envío Masivo de Mensajes
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Envía mensajes personalizados a las personas seleccionadas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selector de tipo de envío */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg text-card-foreground">
                Tipo de Mensaje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs
                value={tipoEnvio}
                onValueChange={(v) => setTipoEnvio(v as "whatsapp" | "sms")}
              >
                <TabsList className="grid w-full grid-cols-2 bg-muted">
                  <TabsTrigger
                    value="whatsapp"
                    className="flex items-center gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </TabsTrigger>
                  <TabsTrigger value="sms" className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    SMS
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>

          {/* Estadísticas */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg text-card-foreground">
                Destinatarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {personasFiltradas.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total {seccionActual === "visitas" ? "visitas" : "personas"}
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {personasConCelular.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Con número celular
                  </div>
                </div>
              </div>

              {personasConCelular.length === 0 && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                  <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">
                      No hay personas con números de celular registrados para
                      enviar mensajes.
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selección de template */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg text-card-foreground">
                Template de Mensaje
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                {Object.entries(templates).map(([key, template]) => (
                  <div
                    key={key}
                    className={`flex-1 p-4 border rounded-lg cursor-pointer transition-all hover:border-primary/50 ${
                      selectedTemplate === key
                        ? "border-primary bg-primary/5 dark:bg-primary/10"
                        : "border-border hover:border-border/80"
                    }`}
                    onClick={() => setSelectedTemplate(key as TemplateKey)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {template.icono}
                      <h4 className="font-medium text-sm text-foreground">
                        {template.nombre}
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {template.descripcion}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Datos de personalización */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg text-card-foreground">
                Personalización
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {/* Nombre de la Iglesia en fila completa */}
                <div className="space-y-2">
                  <Label htmlFor="nombreIglesia" className="text-foreground">
                    Nombre de la Iglesia
                  </Label>
                  <Input
                    id="nombreIglesia"
                    value={datosPersonalizacion.nombreIglesia}
                    onChange={(e) =>
                      setDatosPersonalizacion({
                        ...datosPersonalizacion,
                        nombreIglesia: e.target.value,
                      })
                    }
                    placeholder="Mi Iglesia"
                    className="bg-background border-border text-foreground"
                  />
                </div>

                {/* Evento en fila completa para evitar truncamiento */}
                <div className="space-y-2">
                  <Label htmlFor="evento" className="text-foreground">
                    Evento
                  </Label>
                  <Textarea
                    id="evento"
                    value={datosPersonalizacion.evento}
                    onChange={(e) =>
                      setDatosPersonalizacion({
                        ...datosPersonalizacion,
                        evento: e.target.value,
                      })
                    }
                    placeholder="nuestro culto dominical"
                    className="bg-background border-border text-foreground w-full min-h-[60px] resize-none"
                    rows={2}
                  />
                </div>

                {/* Campos adicionales para invitación en grid */}
                {selectedTemplate === "invitacionRetorno" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="proximoEvento"
                        className="text-foreground"
                      >
                        Próximo Evento
                      </Label>
                      <Input
                        id="proximoEvento"
                        value={datosPersonalizacion.proximoEvento}
                        onChange={(e) =>
                          setDatosPersonalizacion({
                            ...datosPersonalizacion,
                            proximoEvento: e.target.value,
                          })
                        }
                        placeholder="domingo"
                        className="bg-background border-border text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hora" className="text-foreground">
                        Hora
                      </Label>
                      <Input
                        id="hora"
                        value={datosPersonalizacion.hora}
                        onChange={(e) =>
                          setDatosPersonalizacion({
                            ...datosPersonalizacion,
                            hora: e.target.value,
                          })
                        }
                        placeholder="10:00 AM"
                        className="bg-background border-border text-foreground"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Vista previa del mensaje */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <Edit3 className="h-4 w-4" />
                Vista Previa del Mensaje
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setModoEdicion(!modoEdicion)}
                  className="ml-auto"
                >
                  {modoEdicion ? "Vista Previa" : "Editar"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {modoEdicion ? (
                <div className="space-y-2">
                  <Label
                    htmlFor="mensajePersonalizado"
                    className="text-foreground"
                  >
                    Editar Mensaje
                  </Label>
                  <Textarea
                    id="mensajePersonalizado"
                    value={mensajePersonalizado}
                    onChange={(e) => setMensajePersonalizado(e.target.value)}
                    rows={8}
                    className="bg-background border-border text-foreground font-mono text-sm"
                    placeholder="Escribe tu mensaje personalizado aquí..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Puedes usar variables como:{" "}
                    {templates[selectedTemplate]?.variables
                      .map((v: string) => `{{${v}}}`)
                      .join(", ")}
                  </p>
                </div>
              ) : (
                <div className="bg-muted/50 p-4 rounded-lg border-l-4 border-primary">
                  <div className="whitespace-pre-wrap text-sm text-foreground font-mono">
                    {personalizarMensaje(
                      mensajePersonalizado || "Cargando vista previa..."
                    )}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    📏 Longitud:{" "}
                    {personalizarMensaje(mensajePersonalizado).length}{" "}
                    caracteres
                    {tipoEnvio === "sms" &&
                      personalizarMensaje(mensajePersonalizado).length >
                        160 && (
                        <span className="text-orange-600 dark:text-orange-400 ml-2">
                          ⚠️ Mensaje largo - se usará versión corta para SMS
                        </span>
                      )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botones de acción */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={enviando}
              className="border-border hover:bg-muted"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEnviar}
              disabled={enviando || personasConCelular.length === 0}
              className="bg-primary hover:bg-primary/90"
            >
              {enviando ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar {tipoEnvio === "whatsapp" ? "WhatsApp" : "SMS"} (
                  {personasConCelular.length})
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
