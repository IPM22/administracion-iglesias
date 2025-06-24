"use client";

import { AppSidebar } from "../../components/app-sidebar";
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
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Share2,
  MapPin,
  CalendarIcon,
  Clock,
  Users,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ModeToggle } from "../../components/mode-toggle";

// Interfaces
interface TipoActividad {
  id: number;
  nombre: string;
  tipo: string;
}

interface HistorialVisita {
  id: number;
  persona: {
    id: number;
    nombres: string;
    apellidos: string;
  };
}

interface Actividad {
  id: number;
  nombre: string;
  descripcion?: string;
  fecha: string;
  horaInicio?: string;
  horaFin?: string;
  ubicacion?: string;
  googleMapsEmbed?: string;
  responsable?: string;
  estado: string;
  createdAt: string;
  updatedAt: string;
  tipoActividad: TipoActividad;
  historialVisitas: HistorialVisita[];
  banner?: string;
  ministerio?: {
    id: number;
    nombre: string;
  };
}

export default function ActividadesPage() {
  const router = useRouter();
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [actividadesFiltradas, setActividadesFiltradas] = useState<Actividad[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Estados para eliminación
  const [actividadAEliminar, setActividadAEliminar] =
    useState<Actividad | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Estados para filtros
  const [showFilters, setShowFilters] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [vistaActual, setVistaActual] = useState<"proximas" | "historico">(
    "proximas"
  );

  useEffect(() => {
    const fetchActividades = async () => {
      try {
        console.log("🔄 Iniciando carga de actividades...");

        const response = await fetch("/api/actividades");
        console.log(
          "📡 Respuesta del servidor:",
          response.status,
          response.statusText
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ Error del servidor:", response.status, errorText);
          throw new Error(`Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log("✅ Actividades recibidas:", data);
        console.log(
          "📊 Cantidad de actividades:",
          Array.isArray(data) ? data.length : "No es array"
        );

        // Verificar que data es un array válido
        if (!Array.isArray(data)) {
          console.error(
            "❌ Los datos recibidos no son un array:",
            typeof data,
            data
          );
          throw new Error("Formato de datos inválido - se esperaba un array");
        }

        // Verificar que cada actividad tiene la estructura correcta
        const actividadesValidas = data.filter((actividad, index) => {
          const esValida =
            actividad &&
            typeof actividad.id === "number" &&
            typeof actividad.nombre === "string" &&
            typeof actividad.fecha === "string" &&
            actividad.tipoActividad &&
            typeof actividad.tipoActividad.nombre === "string";

          if (!esValida) {
            console.warn(
              `⚠️ Actividad ${index} tiene estructura inválida:`,
              actividad
            );
          }

          return esValida;
        });

        console.log(
          "✅ Actividades válidas:",
          actividadesValidas.length,
          "de",
          data.length
        );

        setActividades(actividadesValidas);
        setActividadesFiltradas(actividadesValidas);
      } catch (error) {
        console.error("💥 Error completo:", error);
        console.error(
          "🔍 Stack trace:",
          error instanceof Error ? error.stack : "No stack trace"
        );

        // Mostrar el error al usuario
        const mensajeError =
          error instanceof Error
            ? `Error al cargar actividades: ${error.message}`
            : "Error desconocido al cargar actividades";

        // Podrías mostrar esto en la UI si quisieras
        alert(mensajeError);
      } finally {
        console.log("🏁 Finalizando carga de actividades");
        setLoading(false);
      }
    };

    fetchActividades();
  }, []);

  useEffect(() => {
    const filtrarActividades = () => {
      let filtradas = [...actividades];
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      // Filtrar por vista (próximas o históricas)
      if (vistaActual === "proximas") {
        filtradas = filtradas.filter(
          (actividad) => new Date(actividad.fecha) >= hoy
        );
      } else {
        filtradas = filtradas.filter(
          (actividad) => new Date(actividad.fecha) < hoy
        );
      }

      // Aplicar filtro de búsqueda por texto
      if (searchTerm.trim()) {
        const termino = searchTerm.toLowerCase().trim();
        filtradas = filtradas.filter((actividad) => {
          const nombre = actividad.nombre.toLowerCase();
          const descripcion = actividad.descripcion?.toLowerCase() || "";
          const ubicacion = actividad.ubicacion?.toLowerCase() || "";
          const responsable = actividad.responsable?.toLowerCase() || "";
          const tipoActividad = actividad.tipoActividad.nombre.toLowerCase();

          return (
            nombre.includes(termino) ||
            descripcion.includes(termino) ||
            ubicacion.includes(termino) ||
            responsable.includes(termino) ||
            tipoActividad.includes(termino)
          );
        });
      }

      // Aplicar filtro por estado
      if (filtroEstado !== "todos") {
        filtradas = filtradas.filter(
          (actividad) => actividad.estado === filtroEstado
        );
      }

      // Aplicar filtro por tipo
      if (filtroTipo !== "todos") {
        filtradas = filtradas.filter(
          (actividad) => actividad.tipoActividad.tipo === filtroTipo
        );
      }

      // Ordenar por fecha
      filtradas.sort((a, b) => {
        if (vistaActual === "proximas") {
          return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
        } else {
          return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
        }
      });

      setActividadesFiltradas(filtradas);
      setCurrentPage(1);
    };

    filtrarActividades();
  }, [searchTerm, actividades, filtroEstado, filtroTipo, vistaActual]);

  // Función para mostrar dialog de confirmación
  const mostrarDialogEliminar = (actividad: Actividad) => {
    setActividadAEliminar(actividad);
    setDialogOpen(true);
  };

  // Función para eliminar actividad
  const confirmarEliminacion = async () => {
    if (!actividadAEliminar) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/actividades/${actividadAEliminar.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al eliminar la actividad");
      }

      // Actualizar la lista de actividades
      const nuevasActividades = actividades.filter(
        (a) => a.id !== actividadAEliminar.id
      );
      setActividades(nuevasActividades);
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
      setActividadAEliminar(null);
    }
  };

  // Función para compartir actividad
  const compartirActividad = async (actividad: Actividad) => {
    const url = `${window.location.origin}/actividades/${actividad.id}/promocion`;
    const texto = `${actividad.nombre} - ${formatearFechaCompleta(
      actividad.fecha
    )}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: actividad.nombre,
          text: texto,
          url: url,
        });
      } catch {
        // Usuario canceló o error
        await navigator.clipboard.writeText(url);
        alert("Enlace copiado al portapapeles");
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert("Enlace copiado al portapapeles");
    }
  };

  // Funciones de utilidad
  const formatearFechaCompleta = (fecha: string) => {
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

  // Limpiar filtros
  const limpiarFiltros = () => {
    setSearchTerm("");
    setFiltroEstado("todos");
    setFiltroTipo("todos");
    setCurrentPage(1);
  };

  // Cálculos de paginación
  const totalPages = Math.ceil(actividadesFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const actividadesPaginadas = actividadesFiltradas.slice(startIndex, endIndex);

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando actividades...</span>
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
          <div className="flex items-center gap-2 px-4 w-full">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb className="hidden md:flex">
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Actividades</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center gap-2 ml-auto">
              <ModeToggle />
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-2 md:p-4 pt-0">
          {/* Header con título y botón crear - Responsivo */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Actividades
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Gestiona las actividades de la iglesia
              </p>
            </div>
            <Button
              onClick={() => router.push("/actividades/crear")}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Nueva Actividad</span>
              <span className="sm:hidden">Nueva</span>
            </Button>
          </div>

          {/* Pestañas de vista - Mejorado para móvil */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="flex bg-muted p-1 rounded-lg w-full sm:w-auto">
              <Button
                variant={vistaActual === "proximas" ? "default" : "ghost"}
                onClick={() => setVistaActual("proximas")}
                className="flex-1 sm:flex-none text-xs sm:text-sm"
              >
                Próximas
              </Button>
              <Button
                variant={vistaActual === "historico" ? "default" : "ghost"}
                onClick={() => setVistaActual("historico")}
                className="flex-1 sm:flex-none text-xs sm:text-sm"
              >
                Histórico
              </Button>
            </div>
          </div>

          {/* Controles de búsqueda y filtros - Optimizado para móvil */}
          <div className="flex flex-col gap-3">
            {/* Barra de búsqueda principal */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar actividades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="w-full sm:w-auto"
              >
                <Filter className="h-4 w-4 mr-2" />
                <span className="sm:hidden">Filtros</span>
                <span className="hidden sm:inline">
                  {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
                </span>
              </Button>
            </div>

            {/* Panel de filtros desplegable - Mejorado para móvil */}
            {showFilters && (
              <Card className="w-full">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Estado
                      </label>
                      <Select
                        value={filtroEstado}
                        onValueChange={setFiltroEstado}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Todos los estados" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          <SelectItem value="programada">Programada</SelectItem>
                          <SelectItem value="en_progreso">
                            En Progreso
                          </SelectItem>
                          <SelectItem value="completada">Completada</SelectItem>
                          <SelectItem value="cancelada">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Tipo
                      </label>
                      <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Todos los tipos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          <SelectItem value="culto">Culto</SelectItem>
                          <SelectItem value="reunion">Reunión</SelectItem>
                          <SelectItem value="evento">Evento</SelectItem>
                          <SelectItem value="capacitacion">
                            Capacitación
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="sm:col-span-2 lg:col-span-1">
                      <label className="text-sm font-medium mb-2 block">
                        Acciones
                      </label>
                      <Button
                        variant="outline"
                        onClick={limpiarFiltros}
                        className="w-full"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Limpiar filtros
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Cargando actividades...</span>
            </div>
          )}

          {/* Lista de actividades - Grid responsivo mejorado */}
          {!loading && (
            <>
              {actividadesFiltradas.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No hay actividades
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {vistaActual === "proximas"
                        ? "No hay actividades programadas."
                        : "No hay actividades en el historial."}
                    </p>
                    <Button onClick={() => router.push("/actividades/crear")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear primera actividad
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {actividadesPaginadas.map((actividad) => (
                    <Card
                      key={actividad.id}
                      className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-sm md:text-base font-semibold line-clamp-2">
                              {actividad.nombre}
                            </CardTitle>
                            <div className="flex flex-wrap gap-1 mt-2">
                              <Badge
                                variant="secondary"
                                className={`text-xs ${getEstadoBadgeColor(
                                  actividad.estado
                                )}`}
                              >
                                {actividad.estado}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={`text-xs ${getTipoBadgeColor(
                                  actividad.tipoActividad.tipo
                                )}`}
                              >
                                {actividad.tipoActividad.nombre}
                              </Badge>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(`/actividades/${actividad.id}`)
                                }
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Ver detalles
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    `/actividades/${actividad.id}/editar`
                                  )
                                }
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => compartirActividad(actividad)}
                              >
                                <Share2 className="h-4 w-4 mr-2" />
                                Compartir
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => mostrarDialogEliminar(actividad)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0 space-y-3">
                        {/* Fecha y hora */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">
                            {formatearFechaCompleta(actividad.fecha)}
                          </span>
                        </div>

                        {(actividad.horaInicio || actividad.horaFin) && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">
                              {formatearHora(actividad.horaInicio)}
                              {actividad.horaFin &&
                                ` - ${formatearHora(actividad.horaFin)}`}
                            </span>
                          </div>
                        )}

                        {/* Ubicación */}
                        {actividad.ubicacion && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">
                              {actividad.ubicacion}
                            </span>
                          </div>
                        )}

                        {/* Asistentes */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4 flex-shrink-0" />
                          <span>
                            {actividad.historialVisitas?.length || 0} asistentes
                          </span>
                        </div>

                        {/* Ministerio */}
                        {actividad.ministerio && (
                          <div className="pt-2 border-t">
                            <Badge variant="outline" className="text-xs">
                              {actividad.ministerio.nombre}
                            </Badge>
                          </div>
                        )}

                        {/* Descripción truncada */}
                        {actividad.descripcion && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                            {actividad.descripcion}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Paginación mejorada para móvil */}
              {totalPages > 1 && (
                <Card className="mt-6">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      {/* Info de paginación */}
                      <div className="text-sm text-muted-foreground order-2 sm:order-1">
                        Mostrando{" "}
                        <span className="font-medium">
                          {(currentPage - 1) * itemsPerPage + 1}
                        </span>{" "}
                        a{" "}
                        <span className="font-medium">
                          {Math.min(
                            currentPage * itemsPerPage,
                            actividadesFiltradas.length
                          )}
                        </span>{" "}
                        de{" "}
                        <span className="font-medium">
                          {actividadesFiltradas.length}
                        </span>{" "}
                        actividades
                      </div>

                      {/* Controles de paginación */}
                      <div className="flex items-center gap-2 order-1 sm:order-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage <= 1}
                          className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3 sm:py-2"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span className="hidden sm:inline ml-2">
                            Anterior
                          </span>
                        </Button>

                        {/* Números de página - Simplificado para móvil */}
                        <div className="flex items-center gap-1">
                          {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }

                            return (
                              <Button
                                key={pageNum}
                                variant={
                                  currentPage === pageNum
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className="h-8 w-8 p-0 text-xs sm:text-sm"
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage >= totalPages}
                          className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3 sm:py-2"
                        >
                          <ChevronRight className="h-4 w-4" />
                          <span className="hidden sm:inline ml-2">
                            Siguiente
                          </span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Dialog de eliminación - Sin cambios, ya es responsivo */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-md mx-4">
              <DialogHeader>
                <DialogTitle>¿Eliminar actividad?</DialogTitle>
                <DialogDescription>
                  Esta acción no se puede deshacer. Se eliminará permanentemente
                  la actividad &quot;{actividadAEliminar?.nombre}&quot; y todos
                  sus datos asociados.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={isDeleting}
                  className="w-full sm:w-auto order-2 sm:order-1"
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmarEliminacion}
                  disabled={isDeleting}
                  className="w-full sm:w-auto order-1 sm:order-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
