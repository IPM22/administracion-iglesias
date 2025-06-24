import React, { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
};

export function MensajeMasivoModal({
  open,
  onOpenChange,
  personas,
  seccionActual,
}: MensajeMasivoModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState(
    "agradecimientoVisita"
  );
  const [datosPersonalizacion, setDatosPersonalizacion] = useState({
    nombreIglesia: "Iglesia Vida Nueva",
    evento: "nuestro culto dominical",
    proximoEvento: "domingo",
    hora: "10:00 AM",
  });
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoEnvio | null>(null);
  const [vistaResultados, setVistaResultados] = useState(false);

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

      const response = await fetch("/api/whatsapp/masivo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personas: personasConCelular,
          templateKey: selectedTemplate,
          datosPersonalizacion,
          filtrarSoloConCelular: true,
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
  };

  const handleClose = () => {
    resetModal();
    onOpenChange(false);
  };

  if (vistaResultados && resultado?.success) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Mensajes Enviados
            </DialogTitle>
            <DialogDescription>
              Resumen del envío masivo de WhatsApp
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Resumen */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumen del Envío</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {resultado.resumen?.total}
                    </div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {resultado.resumen?.exitosos}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Exitosos
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {resultado.resumen?.fallidos}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Fallidos
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
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
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="h-4 w-4" />
                      Mensajes Exitosos ({resultado.resultados.exitosos.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {resultado.resultados.exitosos.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between py-2 border-b border-gray-100"
                        >
                          <span className="font-medium">{item.persona}</span>
                          <Badge variant="outline" className="text-green-600">
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
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700">
                      <XCircle className="h-4 w-4" />
                      Mensajes Fallidos ({resultado.resultados.fallidos.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {resultado.resultados.fallidos.map((item, index) => (
                        <div
                          key={index}
                          className="py-2 border-b border-gray-100"
                        >
                          <div className="font-medium">{item.persona}</div>
                          <div className="text-sm text-red-600">
                            {item.error}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

            <div className="flex justify-end gap-2">
              <Button onClick={resetModal} variant="outline">
                Enviar Más Mensajes
              </Button>
              <Button onClick={handleClose}>Cerrar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Mensaje Masivo por WhatsApp
          </DialogTitle>
          <DialogDescription>
            Envía mensajes de agradecimiento a todas las visitas que tengan
            WhatsApp registrado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información de destinatarios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Destinatarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {personasFiltradas.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total {seccionActual === "visitas" ? "visitas" : "personas"}
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {personasConCelular.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Con WhatsApp
                  </div>
                </div>
              </div>

              {personasConCelular.length === 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center gap-2 text-yellow-800">
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
          <div className="space-y-3">
            <Label htmlFor="template">Tipo de Mensaje</Label>
            <Select
              value={selectedTemplate}
              onValueChange={setSelectedTemplate}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un template" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(templates).map(([key, template]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      {template.icono}
                      <div>
                        <div className="font-medium">{template.nombre}</div>
                        <div className="text-xs text-muted-foreground">
                          {template.descripcion}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Campos de personalización */}
          <div className="space-y-4">
            <Label>Personalización del Mensaje</Label>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombreIglesia">Nombre de la Iglesia</Label>
                <Input
                  id="nombreIglesia"
                  value={datosPersonalizacion.nombreIglesia}
                  onChange={(e) =>
                    setDatosPersonalizacion((prev) => ({
                      ...prev,
                      nombreIglesia: e.target.value,
                    }))
                  }
                  placeholder="Iglesia Vida Nueva"
                />
              </div>

              {templates[
                selectedTemplate as keyof typeof templates
              ].variables.includes("evento") && (
                <div>
                  <Label htmlFor="evento">Evento/Culto</Label>
                  <Input
                    id="evento"
                    value={datosPersonalizacion.evento}
                    onChange={(e) =>
                      setDatosPersonalizacion((prev) => ({
                        ...prev,
                        evento: e.target.value,
                      }))
                    }
                    placeholder="nuestro culto dominical"
                  />
                </div>
              )}

              {templates[
                selectedTemplate as keyof typeof templates
              ].variables.includes("proximoEvento") && (
                <div>
                  <Label htmlFor="proximoEvento">Próximo Evento</Label>
                  <Input
                    id="proximoEvento"
                    value={datosPersonalizacion.proximoEvento}
                    onChange={(e) =>
                      setDatosPersonalizacion((prev) => ({
                        ...prev,
                        proximoEvento: e.target.value,
                      }))
                    }
                    placeholder="domingo"
                  />
                </div>
              )}

              {templates[
                selectedTemplate as keyof typeof templates
              ].variables.includes("hora") && (
                <div>
                  <Label htmlFor="hora">Hora</Label>
                  <Input
                    id="hora"
                    value={datosPersonalizacion.hora}
                    onChange={(e) =>
                      setDatosPersonalizacion((prev) => ({
                        ...prev,
                        hora: e.target.value,
                      }))
                    }
                    placeholder="10:00 AM"
                  />
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Error */}
          {resultado && !resultado.success && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2 text-red-800">
                <XCircle className="h-4 w-4" />
                <span className="text-sm">{resultado.error}</span>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleEnviar}
              disabled={enviando || personasConCelular.length === 0}
            >
              {enviando ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar a {personasConCelular.length} personas
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
