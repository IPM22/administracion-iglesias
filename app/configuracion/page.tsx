"use client";

import { useState } from "react";
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
import {
  User,
  Building2,
  Users,
  Settings,
  Camera,
  Save,
  UserPlus,
  Shield,
} from "lucide-react";

type TabValue = "perfil" | "iglesia" | "usuarios" | "solicitudes";

export default function ConfiguracionPage() {
  const { usuarioCompleto, iglesiaActiva } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>("perfil");

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
    email: "",
    descripcion: "",
    logoUrl: iglesiaActiva?.logoUrl || "",
  });

  const esAdmin =
    iglesiaActiva?.rol === "ADMIN" || iglesiaActiva?.rol === "PASTOR";

  const handleGuardarPerfil = async () => {
    setIsLoading(true);
    try {
      // Implementar guardado de perfil
      // TODO: Implementar API call para guardar perfil
    } catch (error) {
      console.error("Error guardando perfil:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuardarIglesia = async () => {
    setIsLoading(true);
    try {
      // Implementar guardado de iglesia
      // TODO: Implementar API call para guardar iglesia
    } catch (error) {
      console.error("Error guardando iglesia:", error);
    } finally {
      setIsLoading(false);
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
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                {tab.label}
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
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={perfilData.avatar} />
                    <AvatarFallback className="text-lg">
                      {perfilData.nombres.charAt(0)}
                      {perfilData.apellidos.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-2 -right-2"
                  >
                    <Camera className="h-3 w-3" />
                  </Button>
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
                Guardar Cambios
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
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={iglesiaData.logoUrl} />
                    <AvatarFallback className="text-lg">
                      <Building2 className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-2 -right-2"
                  >
                    <Camera className="h-3 w-3" />
                  </Button>
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
                  <Label htmlFor="telefono-iglesia">Teléfono</Label>
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
                  <Label htmlFor="email-iglesia">Email</Label>
                  <Input
                    id="email-iglesia"
                    type="email"
                    value={iglesiaData.email}
                    onChange={(e) =>
                      setIglesiaData({ ...iglesiaData, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="direccion">Dirección</Label>
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
                Guardar Configuración
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
              </CardTitle>
              <CardDescription>
                Administra los usuarios de tu congregación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-semibold mb-2">Gestión de Usuarios</h3>
                <p className="text-sm">
                  Esta funcionalidad estará disponible próximamente
                </p>
              </div>
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
              </CardTitle>
              <CardDescription>
                Revisa y gestiona las solicitudes de acceso a la congregación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-semibold mb-2">
                  Sin Solicitudes Pendientes
                </h3>
                <p className="text-sm">
                  No hay solicitudes de acceso pendientes de revisión
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
