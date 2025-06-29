"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Share2,
  Trash2,
  FileText,
  FileSpreadsheet,
  Monitor,
  MessageCircle,
  Mail,
  ArrowLeft,
  Edit,
  Loader2,
} from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { MiembroAvatar } from "@/components/MiembroAvatar";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { MensajeMasivoModal } from "@/components/MensajeMasivoModal";
import { formatDate } from "@/lib/date-utils";

// Interfaces para tipado
interface TipoActividad {
  id: number;
  nombre: string;
  tipo: string;
}

interface HistorialVisita {
  id: number;
  fecha: string;
  horarioId?: number; // Nuevo campo para asociar con horario específico
  persona: {
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
  fechaInicio?: string;
  fechaFin?: string;
  esRangoFechas: boolean;
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
  horarios?: Array<{
    id: number;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    notas?: string;
  }>;
}

interface Horario {
  id: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  notas?: string;
}

export default function DetalleActividadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actividad, setActividad] = useState<ActividadDetalle | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMensajeOpen, setDialogMensajeOpen] = useState(false);
  const [horarioSeleccionado, setHorarioSeleccionado] =
    useState<Horario | null>(null);

  // Estados para el modal de mensajes masivos (nuevo modal)
  const [modalMensajesOpen, setModalMensajesOpen] = useState(false);
  const [personasParaMensajes, setPersonasParaMensajes] = useState<
    {
      id: number;
      nombres: string;
      apellidos: string;
      celular?: string;
      rol: string;
    }[]
  >([]);

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
    const resultado = formatDate(fecha, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return resultado;
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

  // Función para agrupar asistentes por horario
  const agruparAsistentesPorHorario = () => {
    console.log("Datos de actividad:", actividad);
    console.log("Historial visitas:", actividad?.historialVisitas);
    console.log("Horarios:", actividad?.horarios);

    // Si no hay historial de visitas, retornar array vacío
    if (
      !actividad?.historialVisitas ||
      actividad.historialVisitas.length === 0
    ) {
      console.log("No hay historial de visitas");
      return [];
    }

    if (!actividad?.horarios || actividad.horarios.length === 0) {
      // Si no hay horarios específicos, mostrar todos los asistentes en un grupo general
      console.log("No hay horarios, mostrando asistentes generales");
      return [
        {
          horario: null,
          asistentes: actividad.historialVisitas,
        },
      ];
    }

    const grupos: { horario: Horario | null; asistentes: HistorialVisita[] }[] =
      [];

    // Crear un grupo para cada horario
    actividad.horarios.forEach((horario) => {
      const asistentesHorario = actividad.historialVisitas.filter(
        (h) => h.horarioId === horario.id
      );
      console.log(
        `Horario ${horario.id} tiene ${asistentesHorario.length} asistentes`
      );
      grupos.push({
        horario,
        asistentes: asistentesHorario,
      });
    });

    // Agregar grupo para asistentes sin horario específico
    const asistentesSinHorario = actividad.historialVisitas.filter(
      (h) => !h.horarioId
    );

    console.log(
      `Asistentes sin horario específico: ${asistentesSinHorario.length}`
    );

    if (asistentesSinHorario.length > 0) {
      grupos.push({
        horario: null,
        asistentes: asistentesSinHorario,
      });
    }

    console.log("Grupos finales:", grupos);

    // Si después de todo no hay grupos con asistentes, crear un grupo general con todos
    const totalAsistentes = grupos.reduce(
      (total, grupo) => total + grupo.asistentes.length,
      0
    );
    if (totalAsistentes === 0 && actividad.historialVisitas.length > 0) {
      console.log("Creando grupo de emergencia con todos los asistentes");
      return [
        {
          horario: null,
          asistentes: actividad.historialVisitas,
        },
      ];
    }

    return grupos;
  };

  // Función para exportar a Excel
  const exportarExcel = (
    horario: Horario | null,
    asistentes: HistorialVisita[]
  ) => {
    if (!actividad) return;

    const datos = asistentes.map((asistente, index) => ({
      "#": index + 1,
      Nombre: `${asistente.persona.nombres} ${asistente.persona.apellidos}`,
      "Fecha de Visita": formatearFecha(asistente.fecha),
      "Invitado por": asistente.invitadoPor
        ? `${asistente.invitadoPor.nombres} ${asistente.invitadoPor.apellidos}`
        : "No especificado",
      Observaciones: asistente.observaciones || "Sin observaciones",
    }));

    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();

    const nombreHoja = horario
      ? `${formatearFecha(horario.fecha)} ${formatearHora(horario.horaInicio)}`
      : "Asistentes Generales";

    XLSX.utils.book_append_sheet(wb, ws, nombreHoja.substring(0, 31)); // Excel tiene límite de 31 caracteres

    const nombreArchivo = `${actividad.nombre}_${nombreHoja}_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);
  };

  // Función para exportar a PDF
  const exportarPDF = async (
    horario: Horario | null,
    asistentes: HistorialVisita[]
  ) => {
    if (!actividad) return;

    const pdf = new jsPDF();

    // Configurar fuente
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);

    // Título principal
    pdf.text(actividad.nombre, 20, 20);

    // Información del horario
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "normal");

    if (horario) {
      pdf.text(`Horario: ${formatearFecha(horario.fecha)}`, 20, 35);
      pdf.text(
        `${formatearHora(horario.horaInicio)} - ${formatearHora(
          horario.horaFin
        )}`,
        20,
        45
      );
      if (horario.notas) {
        pdf.text(`Notas: ${horario.notas}`, 20, 55);
      }
    } else {
      pdf.text("Asistentes Generales", 20, 35);
    }

    // Lista de asistentes
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("Lista de Asistentes:", 20, 70);

    let yPosition = 85;

    asistentes.forEach((asistente, index) => {
      if (yPosition > 270) {
        // Nueva página si es necesario
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFont("helvetica", "normal");
      pdf.text(
        `${index + 1}. ${asistente.persona.nombres} ${
          asistente.persona.apellidos
        }`,
        25,
        yPosition
      );

      if (asistente.invitadoPor) {
        yPosition += 7;
        pdf.setFontSize(10);
        pdf.text(
          `   Invitado por: ${asistente.invitadoPor.nombres} ${asistente.invitadoPor.apellidos}`,
          25,
          yPosition
        );
        pdf.setFontSize(12);
      }

      if (asistente.observaciones) {
        yPosition += 7;
        pdf.setFontSize(10);
        pdf.text(`   Observaciones: ${asistente.observaciones}`, 25, yPosition);
        pdf.setFontSize(12);
      }

      yPosition += 10;
    });

    // Footer
    pdf.setFontSize(8);
    pdf.text(
      `Total de asistentes: ${asistentes.length}`,
      20,
      pdf.internal.pageSize.height - 15
    );
    pdf.text(
      `Generado el: ${new Date().toLocaleDateString("es-ES")}`,
      20,
      pdf.internal.pageSize.height - 10
    );

    // Descargar
    const nombreHorario = horario
      ? `${formatearFecha(horario.fecha)}_${formatearHora(horario.horaInicio)}`
      : "Asistentes_Generales";

    pdf.save(
      `${actividad.nombre}_${nombreHorario}_${
        new Date().toISOString().split("T")[0]
      }.pdf`
    );
  };

  // Función para abrir vista de agradecimiento
  const abrirVistaAgradecimiento = (horario: Horario | null) => {
    if (!actividad) return;

    const horarioParam = horario ? horario.id : "general";
    const url = `/actividades/${actividad.id}/agradecimiento?horario=${horarioParam}`;
    window.open(url, "_blank", "fullscreen=yes,scrollbars=yes,resizable=yes");
  };

  // Función para abrir diálogo de mensajes masivos usando el nuevo modal
  const abrirMensajesMasivos = async (horario: Horario | null) => {
    if (!actividad) return;

    try {
      // Determinar asistentes según el horario
      const asistentes = horario
        ? actividad.historialVisitas.filter((h) => h.horarioId === horario.id)
        : actividad.historialVisitas.filter((h) => !h.horarioId);

      // Obtener datos completos de las personas
      const personasCompletas = await Promise.all(
        asistentes.map(async (asistente) => {
          const response = await fetch(`/api/personas/${asistente.persona.id}`);
          if (response.ok) {
            const data = await response.json();
            const persona = data.persona || data;
            return {
              id: persona.id,
              nombres: persona.nombres,
              apellidos: persona.apellidos,
              celular: persona.celular,
              rol: "VISITA", // Asumimos que son visitas en este contexto
            };
          }
          return null;
        })
      );

      // Filtrar personas válidas
      const personasValidas = personasCompletas.filter((p) => p !== null);

      setPersonasParaMensajes(personasValidas);
      setModalMensajesOpen(true);
    } catch (error) {
      console.error("Error preparando mensajes masivos:", error);
      toast.error("Error al preparar el envío de mensajes");
    }
  };

  // Función para generar correos electrónicos
  const generarCorreos = async (asistentes: HistorialVisita[]) => {
    if (!actividad) return;

    try {
      // Obtener datos completos de las personas
      const personasCompletas = await Promise.all(
        asistentes.map(async (asistente) => {
          const response = await fetch(`/api/personas/${asistente.persona.id}`);
          if (response.ok) {
            const data = await response.json();
            return data.persona || data;
          }
          return null;
        })
      );

      const personasConCorreo = personasCompletas.filter((persona) => {
        return persona && persona.correo && persona.correo.trim() !== "";
      });

      if (personasConCorreo.length === 0) {
        toast.error(
          "No se encontraron correos electrónicos para los asistentes"
        );
        return;
      }

      const correos = personasConCorreo.map((p) => p.correo).join(";");
      const asunto = `Gracias por participar en ${actividad.nombre}`;
      const url = `mailto:${correos}?subject=${encodeURIComponent(asunto)}`;

      window.open(url, "_blank");
      toast.success(
        `Se abrió el cliente de correo con ${personasConCorreo.length} destinatarios`
      );
    } catch (error) {
      console.error("Error al generar correos:", error);
      toast.error("Error al generar los correos electrónicos");
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando actividad...</span>
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
                  {/* Mostrar fechas y horarios múltiples si existen */}
                  {actividad.esRangoFechas &&
                  actividad.fechaInicio &&
                  actividad.fechaFin ? (
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-1" />
                      <div>
                        <p className="font-medium">Fechas del Evento</p>
                        <p className="text-sm text-muted-foreground">
                          Del {formatearFecha(actividad.fechaInicio)} al{" "}
                          {formatearFecha(actividad.fechaFin)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Fecha</p>
                        <p className="text-sm text-muted-foreground">
                          {formatearFecha(actividad.fecha)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Mostrar horarios múltiples si existen */}
                  {actividad.horarios && actividad.horarios.length > 0 ? (
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground mt-1" />
                      <div className="w-full">
                        <p className="font-medium mb-2">Horarios del Evento</p>
                        <div className="space-y-2">
                          {actividad.horarios.map((horario) => (
                            <div
                              key={horario.id}
                              className="bg-muted/30 p-3 rounded-lg"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm">
                                  {formatearFecha(horario.fecha)}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {formatearHora(horario.horaInicio)} -{" "}
                                  {formatearHora(horario.horaFin)}
                                </span>
                              </div>
                              {horario.notas && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {horario.notas}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Mostrar horario único si no hay horarios múltiples */
                    (actividad.horaInicio || actividad.horaFin) && (
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
                    )
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
                  {actividad.responsable && (
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Responsable</p>
                        <p className="text-sm text-muted-foreground">
                          {actividad.responsable}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Asistentes por Horario */}
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
                <Tabs defaultValue="0" className="w-full">
                  {/* Diseño para pantallas grandes */}
                  <div className="mb-4 hidden sm:block">
                    <TabsList className="grid w-full auto-cols-fr grid-flow-col overflow-hidden h-auto p-1">
                      {agruparAsistentesPorHorario().map((grupo, index) => (
                        <TabsTrigger
                          key={index}
                          value={index.toString()}
                          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs p-3 h-auto flex-col gap-1 min-w-0"
                        >
                          {grupo.horario ? (
                            <div className="text-center w-full">
                              <div className="font-medium text-xs leading-tight mb-1 truncate">
                                {new Date(
                                  grupo.horario.fecha
                                ).toLocaleDateString("es-ES", {
                                  day: "2-digit",
                                  month: "short",
                                })}
                              </div>
                              <div className="text-xs text-muted-foreground leading-tight mb-1 truncate">
                                {formatearHora(grupo.horario.horaInicio)} -{" "}
                                {formatearHora(grupo.horario.horaFin)}
                              </div>
                              <Badge
                                variant="secondary"
                                className="text-xs px-1 py-0 h-5 min-w-0"
                              >
                                {grupo.asistentes.length}
                              </Badge>
                            </div>
                          ) : (
                            <div className="text-center w-full">
                              <div className="font-medium text-xs mb-1">
                                General
                              </div>
                              <Badge
                                variant="secondary"
                                className="text-xs px-1 py-0 h-5"
                              >
                                {grupo.asistentes.length}
                              </Badge>
                            </div>
                          )}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  {/* Diseño para pantallas pequeñas */}
                  <div className="mb-4 sm:hidden">
                    <TabsList className="flex flex-col w-full h-auto p-1 space-y-1">
                      {agruparAsistentesPorHorario().map((grupo, index) => (
                        <TabsTrigger
                          key={index}
                          value={index.toString()}
                          className="w-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm p-3 h-auto justify-between"
                        >
                          {grupo.horario ? (
                            <div className="flex justify-between items-center w-full">
                              <div className="text-left">
                                <div className="font-medium">
                                  {formatearFecha(grupo.horario.fecha)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatearHora(grupo.horario.horaInicio)} -{" "}
                                  {formatearHora(grupo.horario.horaFin)}
                                </div>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {grupo.asistentes.length}
                              </Badge>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center w-full">
                              <div className="font-medium">General</div>
                              <Badge variant="secondary" className="text-xs">
                                {grupo.asistentes.length}
                              </Badge>
                            </div>
                          )}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  {agruparAsistentesPorHorario().map((grupo, index) => (
                    <TabsContent
                      key={index}
                      value={index.toString()}
                      className="mt-4"
                    >
                      {/* Botones de reporte para cada horario */}
                      <div className="flex gap-2 mb-4 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            exportarExcel(grupo.horario, grupo.asistentes)
                          }
                          className="flex items-center gap-2"
                        >
                          <FileSpreadsheet className="h-4 w-4" />
                          Excel
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            exportarPDF(grupo.horario, grupo.asistentes)
                          }
                          className="flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            abrirVistaAgradecimiento(grupo.horario)
                          }
                          className="flex items-center gap-2"
                        >
                          <Monitor className="h-4 w-4" />
                          Vista Agradecimiento
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setHorarioSeleccionado(grupo.horario);
                            setDialogMensajeOpen(true);
                          }}
                          className="flex items-center gap-2"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Mensajes Masivos
                        </Button>
                      </div>

                      {/* Lista de asistentes */}
                      {grupo.asistentes.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          No hay asistentes registrados para este horario
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {grupo.asistentes.map((historial) => (
                            <div
                              key={historial.id}
                              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/80 transition-colors cursor-pointer"
                              onClick={() =>
                                router.push(
                                  `/comunidad/${historial.persona.id}`
                                )
                              }
                            >
                              <div className="flex items-center gap-3">
                                <MiembroAvatar
                                  foto={historial.persona.foto}
                                  nombre={`${historial.persona.nombres} ${historial.persona.apellidos}`}
                                  size="sm"
                                />
                                <div>
                                  <p className="font-medium">
                                    {historial.persona.nombres}{" "}
                                    {historial.persona.apellidos}
                                  </p>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>
                                      {new Date(
                                        historial.fecha
                                      ).toLocaleDateString()}
                                    </span>
                                    {historial.invitadoPor && (
                                      <>
                                        <span>•</span>
                                        <span>
                                          Invitado por:{" "}
                                          {historial.invitadoPor.nombres}{" "}
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
                    </TabsContent>
                  ))}
                </Tabs>
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

        {/* Dialog de mensajes masivos */}
        <Dialog open={dialogMensajeOpen} onOpenChange={setDialogMensajeOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Mensajes Masivos</DialogTitle>
              <DialogDescription>
                Envía mensajes de agradecimiento a los asistentes de{" "}
                {horarioSeleccionado
                  ? `${formatearFecha(
                      horarioSeleccionado.fecha
                    )} (${formatearHora(
                      horarioSeleccionado.horaInicio
                    )} - ${formatearHora(horarioSeleccionado.horaFin)})`
                  : "esta actividad"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {(() => {
                const asistentesHorario = horarioSeleccionado
                  ? actividad.historialVisitas.filter(
                      (h) => h.horarioId === horarioSeleccionado.id
                    )
                  : actividad.historialVisitas.filter((h) => !h.horarioId);

                return (
                  <>
                    <div className="text-sm text-muted-foreground text-center">
                      {asistentesHorario.length} persona
                      {asistentesHorario.length !== 1 ? "s" : ""} recibirá
                      {asistentesHorario.length !== 1 ? "n" : ""} el mensaje
                    </div>

                    <div className="grid gap-3">
                      <Button
                        className="w-full h-auto py-4 flex flex-col gap-2"
                        onClick={() => {
                          abrirMensajesMasivos(horarioSeleccionado);
                          setDialogMensajeOpen(false);
                        }}
                      >
                        <MessageCircle className="h-6 w-6" />
                        <div className="text-center">
                          <div className="font-medium">WhatsApp Masivo</div>
                          <div className="text-xs opacity-80">
                            Envío masivo con Twilio
                          </div>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full h-auto py-4 flex flex-col gap-2 bg-blue-50 border-blue-200 hover:bg-blue-100"
                        onClick={() => {
                          abrirMensajesMasivos(horarioSeleccionado);
                          setDialogMensajeOpen(false);
                        }}
                      >
                        <div className="h-6 w-6 flex items-center justify-center">
                          💬
                        </div>
                        <div className="text-center">
                          <div className="font-medium">SMS Masivo</div>
                          <div className="text-xs opacity-80">
                            Mensaje de texto alternativo
                          </div>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full h-auto py-4 flex flex-col gap-2"
                        onClick={() => {
                          generarCorreos(asistentesHorario);
                          setDialogMensajeOpen(false);
                        }}
                      >
                        <Mail className="h-6 w-6" />
                        <div className="text-center">
                          <div className="font-medium">Correo</div>
                          <div className="text-xs opacity-80">
                            Enviar correos electrónicos
                          </div>
                        </div>
                      </Button>
                    </div>
                  </>
                );
              })()}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogMensajeOpen(false)}
              >
                Cancelar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Nuevo Modal de Mensajes Masivos Mejorado */}
        <MensajeMasivoModal
          open={modalMensajesOpen}
          onOpenChange={setModalMensajesOpen}
          personas={personasParaMensajes}
          seccionActual="visitas"
          eventoNombre={actividad?.nombre}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
