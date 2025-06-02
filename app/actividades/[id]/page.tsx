"use client";

import { use, useEffect, useState } from "react";
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
import {
  ArrowLeft,
  Edit,
  Calendar,
  Clock,
  MapPin,
  Users,
  Share2,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ModeToggle } from "../../../components/mode-toggle";
import { MiembroAvatar } from "../../../components/MiembroAvatar";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Interfaces para tipado
interface TipoActividad {
  id: number;
  nombre: string;
  tipo: string;
}

interface HistorialVisita {
  id: number;
  fecha: string;
  visita: {
    id: number;
    nombres: string;
    apellidos: string;
    foto?: string;
  };
  invitadoPor?: {
    id: number;
    nombres: string;
    apellidos: string;
  };
  observaciones?: string;
}

interface ActividadDetalle {
  id: number;
  nombre: string;
  descripcion?: string;
  fecha: string;
  horaInicio?: string;
  horaFin?: string;
  ubicacion?: string;
  responsable?: string;
  estado: string;
  createdAt: string;
  updatedAt: string;
  tipoActividad: TipoActividad;
  historialVisitas: HistorialVisita[];
  banner?: string;
}

export default function DetalleActividadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [actividad, setActividad] = useState<ActividadDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchActividad = async () => {
      try {
        const response = await fetch(`/api/actividades/${id}`);
        if (!response.ok) {
          throw new Error("Error al obtener los datos de la actividad");
        }
        const data = await response.json();
        setActividad(data);
      } catch (error) {
        console.error("Error:", error);
        setError("Error al cargar la actividad");
      } finally {
        setLoading(false);
      }
    };

    fetchActividad();
  }, [id]);

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatearHora = (hora?: string) => {
    if (!hora) return "";
    try {
      const [hours, minutes] = hora.split(":");
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return hora;
    }
  };

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case "Programada":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "En curso":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "Finalizada":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      case "Cancelada":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo) {
      case "Regular":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      case "Especial":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const compartirActividad = async () => {
    if (!actividad) return;

    const url = `${window.location.origin}/actividades/${actividad.id}/promocion`;
    const texto = `${actividad.nombre} - ${formatearFecha(actividad.fecha)}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: actividad.nombre,
          text: texto,
          url: url,
        });
      } catch {
        await navigator.clipboard.writeText(url);
        alert("Enlace copiado al portapapeles");
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert("Enlace copiado al portapapeles");
    }
  };

  const eliminarActividad = async () => {
    if (!actividad) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/actividades/${actividad.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al eliminar la actividad");
      }

      router.push("/actividades");
    } catch (error) {
      console.error("Error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Error al eliminar la actividad"
      );
    } finally {
      setIsDeleting(false);
      setDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4">Cargando actividad...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (error || !actividad) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Error</h3>
              <p className="text-muted-foreground">
                {error || "Actividad no encontrada"}
              </p>
              <Button
                className="mt-4"
                onClick={() => router.push("/actividades")}
              >
                Volver a Actividades
              </Button>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

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
                  <BreadcrumbLink href="/actividades">
                    Actividades
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{actividad.nombre}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="px-4">
            <ModeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={compartirActividad}>
                <Share2 className="mr-2 h-4 w-4" />
                Compartir
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  router.push(`/actividades/${actividad.id}/editar`)
                }
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
              <Button variant="destructive" onClick={() => setDialogOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            </div>
          </div>

          {/* Banner de la actividad */}
          {actividad.banner && (
            <Card className="overflow-hidden p-0">
              <div className="relative w-full h-64 md:h-80">
                <Image
                  src={actividad.banner}
                  alt={`Banner de ${actividad.nombre}`}
                  fill
                  className="object-cover"
                />
              </div>
            </Card>
          )}

          {/* Información Principal */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getEstadoBadgeColor(actividad.estado)}>
                      {actividad.estado}
                    </Badge>
                    <Badge
                      className={getTipoBadgeColor(
                        actividad.tipoActividad.tipo
                      )}
                    >
                      {actividad.tipoActividad.nombre}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl mb-2">
                    {actividad.nombre}
                  </CardTitle>
                  {actividad.descripcion && (
                    <p className="text-muted-foreground">
                      {actividad.descripcion}
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Fecha</p>
                      <p className="text-sm text-muted-foreground">
                        {formatearFecha(actividad.fecha)}
                      </p>
                    </div>
                  </div>
                  {(actividad.horaInicio || actividad.horaFin) && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Horario</p>
                        <p className="text-sm text-muted-foreground">
                          {actividad.horaInicio &&
                            formatearHora(actividad.horaInicio)}
                          {actividad.horaInicio && actividad.horaFin && " - "}
                          {actividad.horaFin &&
                            formatearHora(actividad.horaFin)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {actividad.ubicacion && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Ubicación</p>
                        <p className="text-sm text-muted-foreground">
                          {actividad.ubicacion}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Asistentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Asistentes ({actividad.historialVisitas.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {actividad.historialVisitas.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay asistentes registrados para esta actividad
                </p>
              ) : (
                <div className="space-y-3">
                  {actividad.historialVisitas.map((historial) => (
                    <div
                      key={historial.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/80 transition-colors cursor-pointer"
                      onClick={() =>
                        router.push(`/visitas/${historial.visita.id}`)
                      }
                    >
                      <div className="flex items-center gap-3">
                        <MiembroAvatar
                          foto={historial.visita.foto}
                          nombre={`${historial.visita.nombres} ${historial.visita.apellidos}`}
                          size="sm"
                        />
                        <div>
                          <p className="font-medium">
                            {historial.visita.nombres}{" "}
                            {historial.visita.apellidos}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>
                              {new Date(historial.fecha).toLocaleDateString()}
                            </span>
                            {historial.invitadoPor && (
                              <>
                                <span>•</span>
                                <span>
                                  Invitado por: {historial.invitadoPor.nombres}{" "}
                                  {historial.invitadoPor.apellidos}
                                </span>
                              </>
                            )}
                          </div>
                          {historial.observaciones && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {historial.observaciones}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información Adicional */}
          <Card>
            <CardHeader>
              <CardTitle>Información Adicional</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Creada:</span>
                  <span>
                    {new Date(actividad.createdAt).toLocaleDateString("es-ES")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Última actualización:
                  </span>
                  <span>
                    {new Date(actividad.updatedAt).toLocaleDateString("es-ES")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Tipo de actividad:
                  </span>
                  <span>
                    {actividad.tipoActividad.nombre} (
                    {actividad.tipoActividad.tipo})
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dialog de confirmación de eliminación */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar la actividad{" "}
                <strong>{actividad.nombre}</strong>?
                <br />
                Esta acción no se puede deshacer.
                {actividad.historialVisitas.length > 0 && (
                  <>
                    <br />
                    <span className="text-red-600">
                      Esta actividad tiene {actividad.historialVisitas.length}{" "}
                      asistente
                      {actividad.historialVisitas.length !== 1 ? "s" : ""}{" "}
                      registrado
                      {actividad.historialVisitas.length !== 1 ? "s" : ""}.
                    </span>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={eliminarActividad}
                disabled={isDeleting}
              >
                {isDeleting ? "Eliminando..." : "Eliminar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
