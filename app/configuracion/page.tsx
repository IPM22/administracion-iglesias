"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { CloudinaryUploader } from "@/components/CloudinaryUploader";
import { GoogleMapsEmbed } from "@/components/GoogleMapsEmbed";
import {
  User,
  Building2,
  Users,
  Settings,
  Save,
  UserPlus,
  Shield,
  Check,
  X,
  Mail,
  Phone,
  MapPin,
  Globe,
  Clock,
  Calendar,
  Copy,
} from "lucide-react";

type TabValue = "perfil" | "iglesia" | "usuarios" | "solicitudes";

interface Solicitud {
  id: number;
  usuario: {
    id: string;
    nombres: string;
    apellidos: string;
    email: string;
    avatar?: string;
    createdAt: string;
  };
  estado: string;
  createdAt: string;
  permisos?: { mensaje?: string };
}

interface UsuarioIglesia {
  id: number;
  rol: string;
  estado: string;
  fechaUnion: string;
  usuario: {
    id: string;
    nombres: string;
    apellidos: string;
    email: string;
    avatar?: string;
    telefono?: string;
    createdAt: string;
    ultimoLogin?: string;
  };
}

export default function ConfiguracionPage() {
  const { usuarioCompleto, iglesiaActiva, refetch } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>("perfil");
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(false);
  const [usuarios, setUsuarios] = useState<UsuarioIglesia[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);

  const [perfilData, setPerfilData] = useState({
    nombres: usuarioCompleto?.nombres || "",
    apellidos: usuarioCompleto?.apellidos || "",
    telefono: usuarioCompleto?.telefono || "",
    avatar: usuarioCompleto?.avatar || "",
  });

  const [iglesiaData, setIglesiaData] = useState({
    nombre: iglesiaActiva?.nombre || "",
    direccion: "",
    telefono: "",
    correo: "",
    descripcion: "",
    logoUrl: iglesiaActiva?.logoUrl || "",
    sitioWeb: "",
    googleMapsEmbed: "",
    ubicacionReferencia: "",
    horariosCultos: "",
    horarioOficina: "",
    numeroWhatsapp: "",
    mensajePromocion: "¡Te esperamos en nuestra iglesia! 🙏",
    configNotificaciones: true,
  });

  const esAdmin =
    iglesiaActiva?.rol === "ADMIN" || iglesiaActiva?.rol === "PASTOR";

  // Actualizar datos cuando cambien los props
  useEffect(() => {
    if (usuarioCompleto) {
      setPerfilData({
        nombres: usuarioCompleto.nombres || "",
        apellidos: usuarioCompleto.apellidos || "",
        telefono: usuarioCompleto.telefono || "",
        avatar: usuarioCompleto.avatar || "",
      });
    }
  }, [usuarioCompleto]);

  useEffect(() => {
    if (iglesiaActiva) {
      setIglesiaData({
        nombre: iglesiaActiva.nombre || "",
        direccion: "",
        telefono: "",
        correo: "",
        descripcion: "",
        logoUrl: iglesiaActiva.logoUrl || "",
        sitioWeb: "",
        googleMapsEmbed: "",
        ubicacionReferencia: "",
        horariosCultos: "",
        horarioOficina: "",
        numeroWhatsapp: "",
        mensajePromocion: "¡Te esperamos en nuestra iglesia! 🙏",
        configNotificaciones: true,
      });

      // Cargar datos completos de la iglesia
      cargarDatosCompletos();
    }
  }, [iglesiaActiva]);

  // Cargar datos completos de la iglesia
  const cargarDatosCompletos = async () => {
    if (!iglesiaActiva?.id) return;

    try {
      const response = await fetch(`/api/iglesias/${iglesiaActiva.id}`);
      if (response.ok) {
        const data = await response.json();
        // Actualizar con datos completos si existen
        setIglesiaData((prev) => ({
          ...prev,
          direccion: data.direccion || "",
          telefono: data.telefono || "",
          correo: data.correo || "",
          descripcion: data.descripcion || "",
          sitioWeb: data.sitioWeb || "",
          // Si hay configuración guardada, cargarla
          ...(data.configuracion && typeof data.configuracion === "object"
            ? data.configuracion
            : {}),
        }));
      }
    } catch (error) {
      console.error("Error cargando datos completos:", error);
    }
  };

  // Cargar solicitudes cuando se cambie al tab de solicitudes
  useEffect(() => {
    if (activeTab === "solicitudes" && esAdmin && iglesiaActiva?.id) {
      cargarSolicitudes();
    }
  }, [activeTab, esAdmin, iglesiaActiva?.id]);

  // Cargar usuarios cuando se cambie al tab de usuarios
  useEffect(() => {
    if (activeTab === "usuarios" && esAdmin && iglesiaActiva?.id) {
      cargarUsuarios();
    }
  }, [activeTab, esAdmin, iglesiaActiva?.id]);

  const cargarSolicitudes = async () => {
    if (!iglesiaActiva?.id) return;

    setLoadingSolicitudes(true);
    try {
      const response = await fetch(
        `/api/solicitudes?iglesiaId=${iglesiaActiva.id}&estado=PENDIENTE`
      );
      if (response.ok) {
        const data = await response.json();
        setSolicitudes(data.solicitudes || []);
      }
    } catch (error) {
      console.error("Error cargando solicitudes:", error);
      toast.error("Error al cargar solicitudes");
    } finally {
      setLoadingSolicitudes(false);
    }
  };

  const cargarUsuarios = async () => {
    if (!iglesiaActiva?.id) return;

    setLoadingUsuarios(true);
    try {
      const response = await fetch(
        `/api/iglesias/${iglesiaActiva.id}/usuarios?estado=ACTIVO`
      );
      if (response.ok) {
        const data = await response.json();
        setUsuarios(data.usuarios || []);
      }
    } catch (error) {
      console.error("Error cargando usuarios:", error);
      toast.error("Error al cargar usuarios");
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const handleGuardarPerfil = async () => {
    if (!usuarioCompleto?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/usuarios/${usuarioCompleto.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(perfilData),
      });

      if (response.ok) {
        toast.success("Perfil actualizado correctamente");
        await refetch();
      } else {
        throw new Error("Error al actualizar perfil");
      }
    } catch (error) {
      console.error("Error guardando perfil:", error);
      toast.error("Error al guardar el perfil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuardarIglesia = async () => {
    if (!iglesiaActiva?.id) return;

    setIsLoading(true);

    try {
      // Preparar los datos de configuración extendida
      const configuracionExtendida = {
        googleMapsEmbed: iglesiaData.googleMapsEmbed,
        ubicacionReferencia: iglesiaData.ubicacionReferencia,
        horariosCultos: iglesiaData.horariosCultos,
        horarioOficina: iglesiaData.horarioOficina,
        numeroWhatsapp: iglesiaData.numeroWhatsapp,
        mensajePromocion: iglesiaData.mensajePromocion,
        configNotificaciones: iglesiaData.configNotificaciones,
      };

      const response = await fetch(`/api/iglesias/${iglesiaActiva.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: iglesiaData.nombre,
          direccion: iglesiaData.direccion,
          telefono: iglesiaData.telefono,
          correo: iglesiaData.correo,
          descripcion: iglesiaData.descripcion,
          logoUrl: iglesiaData.logoUrl,
          sitioWeb: iglesiaData.sitioWeb,
          configuracion: configuracionExtendida,
        }),
      });

      if (response.ok) {
        toast.success("Información de la iglesia actualizada");
        await refetch();
      } else {
        throw new Error("Error al actualizar iglesia");
      }
    } catch (error) {
      console.error("Error guardando iglesia:", error);
      toast.error("Error al guardar la información de la iglesia");
    } finally {
      setIsLoading(false);
    }
  };

  // Funciones de utilidad para ubicación
  const copiarMensajePromocion = () => {
    const mensaje = `${iglesiaData.mensajePromocion}\n\n📍 ${
      iglesiaData.direccion
    }\n📞 ${iglesiaData.numeroWhatsapp || iglesiaData.telefono}\n🌐 ${
      iglesiaData.sitioWeb
    }`;
    navigator.clipboard.writeText(mensaje);
    toast.success("Mensaje promocional copiado");
  };

  const handleResponderSolicitud = async (
    solicitudId: number,
    estado: "ACTIVO" | "RECHAZADO"
  ) => {
    try {
      const response = await fetch("/api/solicitudes", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: solicitudId,
          estado,
          rol: "MIEMBRO",
        }),
      });

      if (response.ok) {
        toast.success(
          estado === "ACTIVO"
            ? "Solicitud aprobada correctamente"
            : "Solicitud rechazada"
        );
        await cargarSolicitudes();
      } else {
        throw new Error("Error al responder solicitud");
      }
    } catch (error) {
      console.error("Error respondiendo solicitud:", error);
      toast.error("Error al procesar la solicitud");
    }
  };

  const handleCambiarRolUsuario = async (
    usuarioId: string,
    nuevoRol: string
  ) => {
    if (!iglesiaActiva?.id) return;

    try {
      const response = await fetch(
        `/api/iglesias/${iglesiaActiva.id}/usuarios`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            usuarioId,
            rol: nuevoRol,
          }),
        }
      );

      if (response.ok) {
        toast.success("Rol actualizado correctamente");
        await cargarUsuarios();
      } else {
        throw new Error("Error al actualizar rol");
      }
    } catch (error) {
      console.error("Error actualizando rol:", error);
      toast.error("Error al actualizar el rol del usuario");
    }
  };

  const getRolBadgeVariant = (rol: string) => {
    switch (rol) {
      case "ADMIN":
        return "destructive";
      case "PASTOR":
        return "default";
      case "LIDER":
        return "secondary";
      case "SECRETARIO":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getRolDisplayName = (rol: string) => {
    switch (rol) {
      case "ADMIN":
        return "Administrador";
      case "PASTOR":
        return "Pastor";
      case "LIDER":
        return "Líder";
      case "SECRETARIO":
        return "Secretario";
      case "MIEMBRO":
        return "Miembro";
      default:
        return rol;
    }
  };

  const tabs = [
    { value: "perfil", label: "Mi Perfil", icon: User },
    { value: "iglesia", label: "Iglesia", icon: Building2, disabled: !esAdmin },
    { value: "usuarios", label: "Usuarios", icon: Users, disabled: !esAdmin },
    {
      value: "solicitudes",
      label: "Solicitudes",
      icon: UserPlus,
      disabled: !esAdmin,
      badge: solicitudes.length > 0 ? solicitudes.length : undefined,
    },
  ];

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="flex items-center gap-3">
        <Settings className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
      </div>

      <div className="space-y-8">
        {/* Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-border/40 pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.value}
                variant={activeTab === tab.value ? "default" : "ghost"}
                disabled={tab.disabled}
                onClick={() => setActiveTab(tab.value as TabValue)}
                className="flex items-center gap-2 relative h-11 px-4 py-2"
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.badge && (
                  <Badge
                    variant="destructive"
                    className="text-xs ml-1 h-5 px-1.5"
                  >
                    {tab.badge}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>

        {/* Perfil Tab */}
        {activeTab === "perfil" && (
          <Card className="shadow-sm">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3">
                <User className="h-5 w-5 text-primary" />
                Información Personal
              </CardTitle>
              <CardDescription>
                Actualiza tu información personal y preferencias de cuenta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex items-center gap-6 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <CloudinaryUploader
                    value={perfilData.avatar}
                    onChange={(url) =>
                      setPerfilData({ ...perfilData, avatar: url })
                    }
                    onRemove={() =>
                      setPerfilData({ ...perfilData, avatar: "" })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">
                    {perfilData.nombres} {perfilData.apellidos}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {usuarioCompleto?.email}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {getRolDisplayName(iglesiaActiva?.rol || "MIEMBRO")}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="nombres" className="text-sm font-medium">
                    Nombres
                  </Label>
                  <Input
                    id="nombres"
                    value={perfilData.nombres}
                    onChange={(e) =>
                      setPerfilData({ ...perfilData, nombres: e.target.value })
                    }
                    className="h-11"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="apellidos" className="text-sm font-medium">
                    Apellidos
                  </Label>
                  <Input
                    id="apellidos"
                    value={perfilData.apellidos}
                    onChange={(e) =>
                      setPerfilData({
                        ...perfilData,
                        apellidos: e.target.value,
                      })
                    }
                    className="h-11"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="telefono" className="text-sm font-medium">
                    Teléfono
                  </Label>
                  <Input
                    id="telefono"
                    value={perfilData.telefono}
                    onChange={(e) =>
                      setPerfilData({ ...perfilData, telefono: e.target.value })
                    }
                    className="h-11"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Email</Label>
                  <Input
                    value={usuarioCompleto?.email || ""}
                    disabled
                    className="h-11"
                  />
                </div>
              </div>

              <Button
                onClick={handleGuardarPerfil}
                disabled={isLoading}
                className="w-full h-11"
                size="lg"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Iglesia Tab */}
        {activeTab === "iglesia" && (
          <div className="space-y-6">
            {/* Información Básica */}
            <Card className="shadow-sm">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-primary" />
                  Información Básica
                </CardTitle>
                <CardDescription>
                  Configura los datos generales de tu congregación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="flex items-center gap-6 p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-2">
                    <CloudinaryUploader
                      value={iglesiaData.logoUrl}
                      onChange={(url) =>
                        setIglesiaData({ ...iglesiaData, logoUrl: url })
                      }
                      onRemove={() =>
                        setIglesiaData({ ...iglesiaData, logoUrl: "" })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">
                      {iglesiaData.nombre}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      Administrador
                    </Badge>
                    {iglesiaData.logoUrl && (
                      <p className="text-xs text-muted-foreground">
                        Logo disponible para usar en actividades y promociones
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label
                      htmlFor="nombre-iglesia"
                      className="text-sm font-medium"
                    >
                      Nombre de la Iglesia
                    </Label>
                    <Input
                      id="nombre-iglesia"
                      value={iglesiaData.nombre}
                      onChange={(e) =>
                        setIglesiaData({
                          ...iglesiaData,
                          nombre: e.target.value,
                        })
                      }
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label
                      htmlFor="email-iglesia"
                      className="text-sm font-medium"
                    >
                      <Mail className="h-4 w-4 inline mr-2" />
                      Email
                    </Label>
                    <Input
                      id="email-iglesia"
                      type="email"
                      value={iglesiaData.correo}
                      onChange={(e) =>
                        setIglesiaData({
                          ...iglesiaData,
                          correo: e.target.value,
                        })
                      }
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label
                      htmlFor="telefono-iglesia"
                      className="text-sm font-medium"
                    >
                      <Phone className="h-4 w-4 inline mr-2" />
                      Teléfono Principal
                    </Label>
                    <Input
                      id="telefono-iglesia"
                      value={iglesiaData.telefono}
                      onChange={(e) =>
                        setIglesiaData({
                          ...iglesiaData,
                          telefono: e.target.value,
                        })
                      }
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="sitio-web" className="text-sm font-medium">
                      <Globe className="h-4 w-4 inline mr-2" />
                      Sitio Web
                    </Label>
                    <Input
                      id="sitio-web"
                      type="url"
                      placeholder="https://..."
                      value={iglesiaData.sitioWeb}
                      onChange={(e) =>
                        setIglesiaData({
                          ...iglesiaData,
                          sitioWeb: e.target.value,
                        })
                      }
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="descripcion" className="text-sm font-medium">
                    Descripción
                  </Label>
                  <Textarea
                    id="descripcion"
                    placeholder="Descripción de la iglesia..."
                    value={iglesiaData.descripcion}
                    onChange={(e) =>
                      setIglesiaData({
                        ...iglesiaData,
                        descripcion: e.target.value,
                      })
                    }
                    className="min-h-24"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Ubicación y Contacto */}
            <Card className="shadow-sm">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  Ubicación y Contacto
                </CardTitle>
                <CardDescription>
                  Información de ubicación que se usará en actividades y eventos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <GoogleMapsEmbed
                  direccion={iglesiaData.direccion}
                  googleMapsEmbed={iglesiaData.googleMapsEmbed}
                  onLocationChange={(data) => {
                    setIglesiaData({
                      ...iglesiaData,
                      direccion: data.direccion,
                      googleMapsEmbed: data.googleMapsEmbed || "",
                    });
                  }}
                />

                <div className="space-y-3">
                  <Label
                    htmlFor="ubicacion-referencia"
                    className="text-sm font-medium"
                  >
                    Referencias de Ubicación
                  </Label>
                  <Input
                    id="ubicacion-referencia"
                    value={iglesiaData.ubicacionReferencia}
                    onChange={(e) =>
                      setIglesiaData({
                        ...iglesiaData,
                        ubicacionReferencia: e.target.value,
                      })
                    }
                    placeholder="Cerca del centro comercial, frente al parque..."
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Estas referencias ayudarán a los visitantes a encontrar
                    mejor la ubicación
                  </p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="whatsapp" className="text-sm font-medium">
                    <Phone className="h-4 w-4 inline mr-2" />
                    WhatsApp para Promoción
                  </Label>
                  <Input
                    id="whatsapp"
                    value={iglesiaData.numeroWhatsapp}
                    onChange={(e) =>
                      setIglesiaData({
                        ...iglesiaData,
                        numeroWhatsapp: e.target.value,
                      })
                    }
                    placeholder="+52 55 1234 5678"
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Este número se usará para promocionar actividades
                  </p>
                </div>

                {iglesiaData.googleMapsEmbed && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-400">
                        ✅ Embed de Google Maps configurado
                      </p>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-500">
                      Esta ubicación se reutilizará automáticamente al crear
                      nuevas actividades
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(iglesiaData.googleMapsEmbed, "_blank")
                      }
                      className="mt-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      Ver en Google Maps
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Horarios */}
            <Card className="shadow-sm">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  Horarios
                </CardTitle>
                <CardDescription>
                  Información de horarios para compartir con los miembros
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label
                      htmlFor="horarios-cultos"
                      className="text-sm font-medium"
                    >
                      <Calendar className="h-4 w-4 inline mr-2" />
                      Horarios de Cultos
                    </Label>
                    <Textarea
                      id="horarios-cultos"
                      value={iglesiaData.horariosCultos}
                      onChange={(e) =>
                        setIglesiaData({
                          ...iglesiaData,
                          horariosCultos: e.target.value,
                        })
                      }
                      placeholder="Domingo: 10:00 AM y 6:00 PM&#10;Miércoles: 7:00 PM&#10;Viernes: 7:30 PM"
                      className="min-h-24"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label
                      htmlFor="horario-oficina"
                      className="text-sm font-medium"
                    >
                      <Clock className="h-4 w-4 inline mr-2" />
                      Horario de Oficina
                    </Label>
                    <Textarea
                      id="horario-oficina"
                      value={iglesiaData.horarioOficina}
                      onChange={(e) =>
                        setIglesiaData({
                          ...iglesiaData,
                          horarioOficina: e.target.value,
                        })
                      }
                      placeholder="Lunes a Viernes: 9:00 AM - 5:00 PM&#10;Sábado: 9:00 AM - 1:00 PM"
                      className="min-h-24"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Promoción */}
            <Card className="shadow-sm">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  Promoción y Mensajería
                </CardTitle>
                <CardDescription>
                  Configura mensajes predeterminados para promocionar
                  actividades
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="mensaje-promocion"
                    className="text-sm font-medium"
                  >
                    Mensaje Promocional Base
                  </Label>
                  <Textarea
                    id="mensaje-promocion"
                    value={iglesiaData.mensajePromocion}
                    onChange={(e) =>
                      setIglesiaData({
                        ...iglesiaData,
                        mensajePromocion: e.target.value,
                      })
                    }
                    placeholder="¡Te esperamos en nuestra iglesia! 🙏"
                    className="min-h-20"
                  />
                  <p className="text-xs text-muted-foreground">
                    Este mensaje se usará como base para promocionar actividades
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={copiarMensajePromocion}
                  className="w-full"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Mensaje Completo de Promoción
                </Button>
              </CardContent>
            </Card>

            {/* Botón de Guardar */}
            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <Button
                  onClick={handleGuardarIglesia}
                  disabled={isLoading}
                  className="w-full h-12"
                  size="lg"
                >
                  <Save className="h-5 w-5 mr-2" />
                  {isLoading
                    ? "Guardando..."
                    : "Guardar Configuración de la Iglesia"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Usuarios Tab */}
        {activeTab === "usuarios" && (
          <Card className="shadow-sm">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                Gestión de Usuarios
                {usuarios.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {usuarios.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Administra los usuarios de tu congregación
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {loadingUsuarios ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-4">
                    Cargando usuarios...
                  </p>
                </div>
              ) : usuarios.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="font-semibold mb-2 text-lg">Sin Usuarios</h3>
                  <p className="text-sm">
                    No hay usuarios activos en esta congregación
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {usuarios.map((usuarioIglesia) => (
                    <div
                      key={usuarioIglesia.id}
                      className="flex items-center justify-between p-6 border border-border/50 rounded-lg hover:border-border transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={usuarioIglesia.usuario.avatar} />
                          <AvatarFallback className="text-sm font-medium">
                            {usuarioIglesia.usuario.nombres.charAt(0)}
                            {usuarioIglesia.usuario.apellidos.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <h4 className="font-semibold text-base">
                            {usuarioIglesia.usuario.nombres}{" "}
                            {usuarioIglesia.usuario.apellidos}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {usuarioIglesia.usuario.email}
                          </p>
                          {usuarioIglesia.usuario.telefono && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {usuarioIglesia.usuario.telefono}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Miembro desde:{" "}
                            {new Date(
                              usuarioIglesia.fechaUnion
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={getRolBadgeVariant(usuarioIglesia.rol)}
                          className="px-3 py-1"
                        >
                          {getRolDisplayName(usuarioIglesia.rol)}
                        </Badge>
                        {usuarioIglesia.usuario.id !== usuarioCompleto?.id && (
                          <select
                            value={usuarioIglesia.rol}
                            onChange={(e) =>
                              handleCambiarRolUsuario(
                                usuarioIglesia.usuario.id,
                                e.target.value
                              )
                            }
                            className="text-sm border border-border rounded-md px-3 py-2 bg-background"
                          >
                            <option value="MIEMBRO">Miembro</option>
                            <option value="SECRETARIO">Secretario</option>
                            <option value="LIDER">Líder</option>
                            <option value="PASTOR">Pastor</option>
                            {(iglesiaActiva?.rol === "ADMIN" ||
                              iglesiaActiva?.rol === "PASTOR") && (
                              <option value="ADMIN">Administrador</option>
                            )}
                          </select>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Solicitudes Tab */}
        {activeTab === "solicitudes" && (
          <Card className="shadow-sm">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3">
                <UserPlus className="h-5 w-5 text-primary" />
                Solicitudes de Acceso
                {solicitudes.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {solicitudes.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Revisa y gestiona las solicitudes de acceso a la congregación
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {loadingSolicitudes ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-4">
                    Cargando solicitudes...
                  </p>
                </div>
              ) : solicitudes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <UserPlus className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="font-semibold mb-2 text-lg">
                    Sin Solicitudes Pendientes
                  </h3>
                  <p className="text-sm">
                    No hay solicitudes de acceso pendientes de revisión
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {solicitudes.map((solicitud) => (
                    <div
                      key={solicitud.id}
                      className="flex items-center justify-between p-6 border border-border/50 rounded-lg hover:border-border transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={solicitud.usuario.avatar} />
                          <AvatarFallback className="text-sm font-medium">
                            {solicitud.usuario.nombres.charAt(0)}
                            {solicitud.usuario.apellidos.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <h4 className="font-semibold text-base">
                            {solicitud.usuario.nombres}{" "}
                            {solicitud.usuario.apellidos}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {solicitud.usuario.email}
                          </p>
                          {solicitud.permisos?.mensaje && (
                            <p className="text-sm text-muted-foreground italic bg-muted/50 rounded px-2 py-1 mt-2">
                              &ldquo;{solicitud.permisos.mensaje}&rdquo;
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Solicitado:{" "}
                            {new Date(solicitud.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleResponderSolicitud(solicitud.id, "ACTIVO")
                          }
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleResponderSolicitud(solicitud.id, "RECHAZADO")
                          }
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Rechazar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
