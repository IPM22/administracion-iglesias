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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  visita: {
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
  responsable?: string;
  estado: string;
  createdAt: string;
  updatedAt: string;
  tipoActividad: TipoActividad;
  historialVisitas: HistorialVisita[];
  banner?: string;
  latitud?: number;
  longitud?: number;
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
        const response = await fetch("/api/actividades");
        if (!response.ok) {
          throw new Error("Error al cargar las actividades");
        }
        const data = await response.json();
        setActividades(data);
        setActividadesFiltradas(data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
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

  // Agrupar actividades por mes
  const agruparPorMes = (actividades: Actividad[]) => {
    const grupos: { [key: string]: Actividad[] } = {};

    actividades.forEach((actividad) => {
      const fecha = new Date(actividad.fecha);
      const nombreMes = fecha.toLocaleDateString("es-ES", {
        month: "long",
        year: "numeric",
      });

      if (!grupos[nombreMes]) {
        grupos[nombreMes] = [];
      }
      grupos[nombreMes].push(actividad);
    });

    return grupos;
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setSearchTerm("");
    setFiltroEstado("todos");
    setFiltroTipo("todos");
    setCurrentPage(1);
  };

  // Cálculos de paginación
  const actividadesAgrupadas = agruparPorMes(actividadesFiltradas);
  const nombresGrupos = Object.keys(actividadesAgrupadas);
  const totalItems = nombresGrupos.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const gruposActuales = nombresGrupos.slice(startIndex, endIndex);

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
                  <BreadcrumbPage>Actividades</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="px-4">
            <ModeToggle />
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gestión de Actividades</CardTitle>
                  <CardDescription>
                    Administra y promociona las actividades de la iglesia
                  </CardDescription>
                </div>
                <Button onClick={() => router.push("/actividades/nueva")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Actividad
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Controles de vista */}
              <div className="flex items-center gap-2 mb-4">
                <Button
                  variant={vistaActual === "proximas" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setVistaActual("proximas")}
                >
                  Próximas
                </Button>
                <Button
                  variant={vistaActual === "historico" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setVistaActual("historico")}
                >
                  Historial
                </Button>
              </div>

              {/* Búsqueda y filtros */}
              <div className="flex items-center space-x-2 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar actividades..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros
                  {(filtroEstado !== "todos" || filtroTipo !== "todos") && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 p-0">
                      !
                    </Badge>
                  )}
                </Button>
              </div>

              {/* Panel de filtros */}
              {showFilters && (
                <div className="border rounded-lg p-4 mb-4 bg-muted">
                  <div className="flex flex-wrap items-end gap-4">
                    <div className="w-40 space-y-1">
                      <label className="text-sm font-medium">Estado</label>
                      <Select
                        value={filtroEstado}
                        onValueChange={setFiltroEstado}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          <SelectItem value="Programada">Programada</SelectItem>
                          <SelectItem value="En curso">En curso</SelectItem>
                          <SelectItem value="Finalizada">Finalizada</SelectItem>
                          <SelectItem value="Cancelada">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-40 space-y-1">
                      <label className="text-sm font-medium">Tipo</label>
                      <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          <SelectItem value="Regular">Regular</SelectItem>
                          <SelectItem value="Especial">Especial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={limpiarFiltros}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Limpiar
                    </Button>
                  </div>

                  <div className="mt-3">
                    <span className="text-sm text-muted-foreground">
                      Mostrando {actividadesFiltradas.length} de{" "}
                      {actividades.length} actividades
                    </span>
                  </div>
                </div>
              )}

              {/* Lista de actividades agrupadas por mes */}
              {gruposActuales.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold">
                    No hay actividades
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {vistaActual === "proximas"
                      ? "No hay actividades programadas próximamente."
                      : "No hay actividades en el historial."}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {gruposActuales.map((nombreMes) => (
                    <div key={nombreMes}>
                      <h3 className="font-semibold text-lg mb-4 text-primary capitalize">
                        {nombreMes}
                      </h3>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {actividadesAgrupadas[nombreMes].map((actividad) => (
                          <Card
                            key={actividad.id}
                            className="hover:shadow-md transition-shadow"
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge
                                      className={getEstadoBadgeColor(
                                        actividad.estado
                                      )}
                                    >
                                      {actividad.estado}
                                    </Badge>
                                    <Badge
                                      className={getTipoBadgeColor(
                                        actividad.tipoActividad.tipo
                                      )}
                                    >
                                      {actividad.tipoActividad.tipo}
                                    </Badge>
                                  </div>
                                  <CardTitle className="text-lg">
                                    {actividad.nombre}
                                  </CardTitle>
                                  {actividad.descripcion && (
                                    <CardDescription className="text-sm mt-1">
                                      {actividad.descripcion}
                                    </CardDescription>
                                  )}
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      className="h-8 w-8 p-0"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() =>
                                        router.push(
                                          `/actividades/${actividad.id}`
                                        )
                                      }
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      Ver detalles
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        router.push(
                                          `/actividades/${actividad.id}/editar`
                                        )
                                      }
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        mostrarDialogEliminar(actividad)
                                      }
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Eliminar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        compartirActividad(actividad)
                                      }
                                    >
                                      <Share2 className="mr-2 h-4 w-4" />
                                      Compartir
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="flex items-center gap-2 mb-2">
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {formatearFechaCompleta(actividad.fecha)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {actividad.horaInicio
                                    ? `${formatearHora(
                                        actividad.horaInicio
                                      )} - ${formatearHora(actividad.horaFin)}`
                                    : "Sin horario"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {actividad.ubicacion || "Sin ubicación"}
                                  {actividad.latitud && actividad.longitud && (
                                    <Badge
                                      variant="outline"
                                      className="ml-2 text-xs"
                                    >
                                      GPS
                                    </Badge>
                                  )}
                                </span>
                              </div>
                              {/* Ministerio Organizador */}
                              {actividad.ministerio && (
                                <div className="flex items-center gap-2 mb-2">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">
                                    Organiza: {actividad.ministerio.nombre}
                                  </span>
                                </div>
                              )}
                              {/* Si no hay ministerio asignado */}
                              {!actividad.ministerio && (
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">
                                    Sin ministerio asignado
                                  </span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2 py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
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
                <strong>{actividadAEliminar?.nombre}</strong>?
                <br />
                Esta acción no se puede deshacer.
                {actividadAEliminar &&
                  actividadAEliminar.historialVisitas &&
                  actividadAEliminar.historialVisitas.length > 0 && (
                    <>
                      <br />
                      <span className="text-red-600">
                        Esta actividad tiene{" "}
                        {actividadAEliminar.historialVisitas.length} asistente
                        {actividadAEliminar.historialVisitas.length !== 1
                          ? "s"
                          : ""}{" "}
                        registrado
                        {actividadAEliminar.historialVisitas.length !== 1
                          ? "s"
                          : ""}
                        .
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
                onClick={confirmarEliminacion}
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
