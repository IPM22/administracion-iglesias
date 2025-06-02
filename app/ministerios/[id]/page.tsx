"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "../../../components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Edit,
  UserPlus,
  Users,
  Calendar,
  MapPin,
  AlertTriangle,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { ModeToggle } from "../../../components/mode-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MinisterioMiembro {
  id: number;
  miembro: {
    id: number;
    nombres: string;
    apellidos: string;
    foto?: string;
    correo?: string;
    telefono?: string;
    celular?: string;
  };
  rol?: string;
  esLider: boolean;
  fechaInicio: string;
  fechaFin?: string;
  estado: string;
}

interface MinisterioActividad {
  id: number;
  nombre: string;
  fecha: string;
  estado: string;
  ubicacion?: string;
}

interface MinisterioDetalle {
  id: number;
  nombre: string;
  descripcion?: string;
  createdAt: string;
  updatedAt: string;
  miembros: MinisterioMiembro[];
  actividades: MinisterioActividad[];
  _count: {
    miembros: number;
    actividades: number;
  };
}

export default function MinisterioDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [ministerio, setMinisterio] = useState<MinisterioDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cambiarLiderazgo, setCambiarLiderazgo] = useState(false);

  useEffect(() => {
    if (id) {
      fetchMinisterio();
    }
  }, [id]);

  const fetchMinisterio = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ministerios/${id}`);

      if (!response.ok) {
        throw new Error("Error al cargar el ministerio");
      }

      const data = await response.json();
      setMinisterio(data);
    } catch (error) {
      console.error("Error:", error);
      setError("Error al cargar los detalles del ministerio");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "Activo":
        return <Badge variant="default">Activo</Badge>;
      case "Inactivo":
        return <Badge variant="secondary">Inactivo</Badge>;
      case "Programada":
        return <Badge variant="outline">Programada</Badge>;
      case "En curso":
        return <Badge variant="default">En curso</Badge>;
      case "Finalizada":
        return <Badge variant="secondary">Finalizada</Badge>;
      case "Cancelada":
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const getLider = () => {
    return ministerio?.miembros.find((m) => m.estado === "Activo" && m.esLider);
  };

  const cambiarLider = async (nuevoLiderId: number) => {
    try {
      const response = await fetch(`/api/ministerios/${id}/liderazgo`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nuevoLiderId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al cambiar el liderazgo");
      }

      // Actualizar los datos
      fetchMinisterio();
      setCambiarLiderazgo(false);
    } catch (error) {
      console.error("Error:", error);
      alert(
        error instanceof Error ? error.message : "Error al cambiar el liderazgo"
      );
    }
  };

  const removerLiderazgo = async () => {
    if (!confirm("¿Estás seguro de que quieres remover el liderazgo actual?")) {
      return;
    }

    try {
      const response = await fetch(`/api/ministerios/${id}/liderazgo`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al remover el liderazgo");
      }

      // Actualizar los datos
      fetchMinisterio();
    } catch (error) {
      console.error("Error:", error);
      alert(
        error instanceof Error ? error.message : "Error al remover el liderazgo"
      );
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando detalles del ministerio...</span>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (error || !ministerio) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <div className="flex items-center justify-between flex-1">
                <h1 className="text-lg font-semibold">Error</h1>
                <ModeToggle />
              </div>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-500 mb-4">
                  {error || "Ministerio no encontrado"}
                </p>
                <Button onClick={() => router.push("/ministerios")}>
                  Volver a Ministerios
                </Button>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const lider = getLider();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4 flex-1">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/ministerios">
                    Ministerios
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{ministerio.nombre}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="ml-auto">
              <ModeToggle />
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/ministerios/${id}/miembros`)}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Gestionar Miembros
              </Button>
              <Button onClick={() => router.push(`/ministerios/${id}/editar`)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Información principal */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl">
                        {ministerio.nombre}
                      </CardTitle>
                      {ministerio.descripcion && (
                        <p className="text-muted-foreground mt-2">
                          {ministerio.descripcion}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary">
                      {ministerio._count.miembros} miembros
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 text-sm">
                    <div>
                      <span className="font-medium">Creado:</span>{" "}
                      {formatDate(ministerio.createdAt)}
                    </div>
                    <div>
                      <span className="font-medium">Última actualización:</span>{" "}
                      {formatDateTime(ministerio.updatedAt)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Miembros */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Miembros ({ministerio._count.miembros})
                    </CardTitle>
                    <Button
                      size="sm"
                      onClick={() => router.push(`/ministerios/${id}/miembros`)}
                    >
                      <Plus className="mr-2 h-3 w-3" />
                      Agregar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {ministerio.miembros.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        No hay miembros asignados
                      </p>
                      <Button
                        size="sm"
                        onClick={() =>
                          router.push(`/ministerios/${id}/miembros`)
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar primer miembro
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {ministerio.miembros.slice(0, 5).map((miembro) => (
                        <div
                          key={miembro.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={miembro.miembro.foto || "/placeholder.svg"}
                              />
                              <AvatarFallback>
                                {`${miembro.miembro.nombres[0]}${miembro.miembro.apellidos[0]}`}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {miembro.miembro.nombres}{" "}
                                {miembro.miembro.apellidos}
                              </p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{miembro.rol || "Miembro"}</span>
                                <span>•</span>
                                <span>
                                  Desde {formatDate(miembro.fechaInicio)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getEstadoBadge(miembro.estado)}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(
                                      `/miembros/${miembro.miembro.id}`
                                    )
                                  }
                                >
                                  Ver perfil
                                </DropdownMenuItem>
                                <DropdownMenuItem>Editar rol</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remover
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                      {ministerio.miembros.length > 5 && (
                        <div className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(`/ministerios/${id}/miembros`)
                            }
                          >
                            Ver todos los miembros ({ministerio.miembros.length}
                            )
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actividades */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Actividades Recientes ({ministerio._count.actividades})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {ministerio.actividades.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        No hay actividades organizadas
                      </p>
                      <Button
                        size="sm"
                        onClick={() => router.push("/actividades/nueva")}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Crear primera actividad
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {ministerio.actividades.slice(0, 5).map((actividad) => (
                        <div
                          key={actividad.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{actividad.nombre}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(actividad.fecha)}</span>
                              {actividad.ubicacion && (
                                <>
                                  <span>•</span>
                                  <MapPin className="h-3 w-3" />
                                  <span>{actividad.ubicacion}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getEstadoBadge(actividad.estado)}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                router.push(`/actividades/${actividad.id}`)
                              }
                            >
                              Ver
                            </Button>
                          </div>
                        </div>
                      ))}
                      {ministerio.actividades.length > 5 && (
                        <div className="text-center">
                          <Button variant="ghost" size="sm">
                            Ver todas las actividades (
                            {ministerio.actividades.length})
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Panel lateral */}
            <div className="space-y-6">
              {/* Líder */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Liderazgo</CardTitle>
                </CardHeader>
                <CardContent>
                  {lider ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={lider.miembro.foto || "/placeholder.svg"}
                          />
                          <AvatarFallback>
                            {`${lider.miembro.nombres[0]}${lider.miembro.apellidos[0]}`}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {lider.miembro.nombres} {lider.miembro.apellidos}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {lider.rol || "Líder"}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 h-auto text-xs"
                            onClick={() =>
                              router.push(`/miembros/${lider.miembro.id}`)
                            }
                          >
                            Ver perfil
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCambiarLiderazgo(true)}
                        >
                          Cambiar líder
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={removerLiderazgo}
                        >
                          Remover liderazgo
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-2">
                        Sin líder asignado
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCambiarLiderazgo(true)}
                      >
                        Asignar líder
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Dialog para cambiar liderazgo */}
              {cambiarLiderazgo && (
                <Dialog
                  open={cambiarLiderazgo}
                  onOpenChange={setCambiarLiderazgo}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {lider ? "Cambiar Liderazgo" : "Asignar Líder"}
                      </DialogTitle>
                      <DialogDescription>
                        Selecciona un miembro activo para designar como líder
                        del ministerio.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {ministerio.miembros
                        .filter((m) => m.estado === "Activo")
                        .map((miembro) => (
                          <div
                            key={miembro.id}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage
                                  src={
                                    miembro.miembro.foto || "/placeholder.svg"
                                  }
                                />
                                <AvatarFallback>
                                  {`${miembro.miembro.nombres[0]}${miembro.miembro.apellidos[0]}`}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {miembro.miembro.nombres}{" "}
                                  {miembro.miembro.apellidos}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {miembro.rol || "Miembro"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {miembro.esLider && (
                                <Badge variant="default">Líder actual</Badge>
                              )}
                              <Button
                                size="sm"
                                onClick={() => cambiarLider(miembro.miembro.id)}
                                disabled={miembro.esLider}
                              >
                                {miembro.esLider ? "Es líder" : "Hacer líder"}
                              </Button>
                            </div>
                          </div>
                        ))}

                      {ministerio.miembros.filter((m) => m.estado === "Activo")
                        .length === 0 && (
                        <div className="text-center py-4">
                          <p className="text-muted-foreground">
                            No hay miembros activos para asignar como líder
                          </p>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setCambiarLiderazgo(false)}
                      >
                        Cancelar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {/* Estadísticas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Estadísticas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Miembros activos:
                    </span>
                    <span className="font-medium">
                      {
                        ministerio.miembros.filter((m) => m.estado === "Activo")
                          .length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Total actividades:
                    </span>
                    <span className="font-medium">
                      {ministerio._count.actividades}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Actividades activas:
                    </span>
                    <span className="font-medium">
                      {
                        ministerio.actividades.filter(
                          (a) =>
                            a.estado === "Programada" || a.estado === "En curso"
                        ).length
                      }
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Acciones rápidas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Acciones Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push(`/ministerios/${id}/miembros`)}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Agregar miembro
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push("/actividades/nueva")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva actividad
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push(`/ministerios/${id}/editar`)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar información
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
