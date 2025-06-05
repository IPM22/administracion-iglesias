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
      });
    }
  }, [iglesiaActiva]);

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
      const response = await fetch(`/api/iglesias/${iglesiaActiva.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(iglesiaData),
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
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Configuración</h1>
      </div>

      <div className="space-y-6">
        {/* Navigation */}
        <div className="flex flex-wrap gap-2 border-b">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.value}
                variant={activeTab === tab.value ? "default" : "ghost"}
                disabled={tab.disabled}
                onClick={() => setActiveTab(tab.value as TabValue)}
                className="flex items-center gap-2 relative"
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.badge && (
                  <Badge variant="destructive" className="text-xs ml-1">
                    {tab.badge}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>

        {/* Perfil Tab */}
        {activeTab === "perfil" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información Personal
              </CardTitle>
              <CardDescription>
                Actualiza tu información personal y preferencias de cuenta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
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
                <div className="space-y-1">
                  <h3 className="font-semibold">
                    {perfilData.nombres} {perfilData.apellidos}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {usuarioCompleto?.email}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {iglesiaActiva?.rol || "MIEMBRO"}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nombres">Nombres</Label>
                  <Input
                    id="nombres"
                    value={perfilData.nombres}
                    onChange={(e) =>
                      setPerfilData({ ...perfilData, nombres: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellidos">Apellidos</Label>
                  <Input
                    id="apellidos"
                    value={perfilData.apellidos}
                    onChange={(e) =>
                      setPerfilData({
                        ...perfilData,
                        apellidos: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={perfilData.telefono}
                    onChange={(e) =>
                      setPerfilData({ ...perfilData, telefono: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={usuarioCompleto?.email || ""} disabled />
                </div>
              </div>

              <Button
                onClick={handleGuardarPerfil}
                disabled={isLoading}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Iglesia Tab */}
        {activeTab === "iglesia" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Información de la Iglesia
              </CardTitle>
              <CardDescription>
                Configura los datos generales de tu congregación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
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
                <div className="space-y-1">
                  <h3 className="font-semibold">{iglesiaData.nombre}</h3>
                  <Badge variant="outline" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Administrador
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nombre-iglesia">Nombre de la Iglesia</Label>
                  <Input
                    id="nombre-iglesia"
                    value={iglesiaData.nombre}
                    onChange={(e) =>
                      setIglesiaData({ ...iglesiaData, nombre: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono-iglesia">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Teléfono
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-iglesia">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Email
                  </Label>
                  <Input
                    id="email-iglesia"
                    type="email"
                    value={iglesiaData.correo}
                    onChange={(e) =>
                      setIglesiaData({ ...iglesiaData, correo: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sitio-web">
                    <Globe className="h-4 w-4 inline mr-1" />
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
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Dirección
                </Label>
                <Input
                  id="direccion"
                  value={iglesiaData.direccion}
                  onChange={(e) =>
                    setIglesiaData({
                      ...iglesiaData,
                      direccion: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
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
                />
              </div>

              <Button
                onClick={handleGuardarIglesia}
                disabled={isLoading}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Guardando..." : "Guardar Configuración"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Usuarios Tab */}
        {activeTab === "usuarios" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
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
            <CardContent>
              {loadingUsuarios ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Cargando usuarios...
                  </p>
                </div>
              ) : usuarios.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="font-semibold mb-2">Sin Usuarios</h3>
                  <p className="text-sm">
                    No hay usuarios activos en esta congregación
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {usuarios.map((usuarioIglesia) => (
                    <div
                      key={usuarioIglesia.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={usuarioIglesia.usuario.avatar} />
                          <AvatarFallback>
                            {usuarioIglesia.usuario.nombres.charAt(0)}
                            {usuarioIglesia.usuario.apellidos.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">
                            {usuarioIglesia.usuario.nombres}{" "}
                            {usuarioIglesia.usuario.apellidos}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {usuarioIglesia.usuario.email}
                          </p>
                          {usuarioIglesia.usuario.telefono && (
                            <p className="text-sm text-muted-foreground">
                              📱 {usuarioIglesia.usuario.telefono}
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
                      <div className="flex items-center gap-2">
                        <Badge variant={getRolBadgeVariant(usuarioIglesia.rol)}>
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
                            className="text-xs border rounded px-2 py-1"
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
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
            <CardContent>
              {loadingSolicitudes ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Cargando solicitudes...
                  </p>
                </div>
              ) : solicitudes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="font-semibold mb-2">
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
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={solicitud.usuario.avatar} />
                          <AvatarFallback>
                            {solicitud.usuario.nombres.charAt(0)}
                            {solicitud.usuario.apellidos.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">
                            {solicitud.usuario.nombres}{" "}
                            {solicitud.usuario.apellidos}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {solicitud.usuario.email}
                          </p>
                          {solicitud.permisos?.mensaje && (
                            <p className="text-sm text-muted-foreground italic">
                              &ldquo;{solicitud.permisos.mensaje}&rdquo;
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Solicitado:{" "}
                            {new Date(solicitud.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleResponderSolicitud(solicitud.id, "ACTIVO")
                          }
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <Check className="h-4 w-4" />
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleResponderSolicitud(solicitud.id, "RECHAZADO")
                          }
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
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
