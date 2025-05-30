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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  X,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Calendar,
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
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MiembroAvatar } from "../../components/MiembroAvatar";
import { ModeToggle } from "../../components/mode-toggle";

// Interfaces para tipado
interface HistorialVisita {
  id: number;
  fecha: string;
  tipoActividad?: {
    id: number;
    nombre: string;
    tipo: string;
  };
  actividad?: {
    id: number;
    nombre: string;
  };
  invitadoPor?: {
    id: number;
    nombres: string;
    apellidos: string;
  };
  observaciones?: string;
}

interface Visita {
  id: number;
  nombres: string;
  apellidos: string;
  correo?: string;
  telefono?: string;
  celular?: string;
  direccion?: string;
  fechaNacimiento?: string;
  sexo?: string;
  estadoCivil?: string;
  ocupacion?: string;
  familia?: string;
  estado?: string;
  foto?: string;
  notasAdicionales?: string;
  fechaPrimeraVisita?: string;
  createdAt: string;
  updatedAt: string;
  historialVisitas: HistorialVisita[];
  miembroConvertido?: {
    id: number;
    nombres: string;
    apellidos: string;
  };
}

export default function VisitasPage() {
  const router = useRouter();
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [visitasFiltradas, setVisitasFiltradas] = useState<Visita[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Estados para eliminación
  const [visitaAEliminar, setVisitaAEliminar] = useState<Visita | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Estados para filtros
  const [showFilters, setShowFilters] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [filtroSexo, setFiltroSexo] = useState<string>("todos");
  const [filtroFamilia, setFiltroFamilia] = useState<string>("todos");

  useEffect(() => {
    const fetchVisitas = async () => {
      try {
        const response = await fetch("/api/visitas");
        if (!response.ok) {
          throw new Error("Error al cargar las visitas");
        }
        const data = await response.json();
        setVisitas(data);
        setVisitasFiltradas(data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVisitas();
  }, []);

  useEffect(() => {
    const filtrarVisitas = () => {
      let filtradas = [...visitas];

      // Aplicar filtro de búsqueda por texto
      if (searchTerm.trim()) {
        const termino = searchTerm.toLowerCase().trim();
        filtradas = filtradas.filter((visita) => {
          const nombreCompleto =
            `${visita.nombres} ${visita.apellidos}`.toLowerCase();
          const correo = visita.correo?.toLowerCase() || "";
          const telefono = visita.telefono || "";
          const celular = visita.celular || "";
          const ocupacion = visita.ocupacion?.toLowerCase() || "";
          const familia = visita.familia?.toLowerCase() || "";

          return (
            nombreCompleto.includes(termino) ||
            correo.includes(termino) ||
            telefono.includes(termino) ||
            celular.includes(termino) ||
            ocupacion.includes(termino) ||
            familia.includes(termino)
          );
        });
      }

      // Aplicar filtro por estado
      if (filtroEstado !== "todos") {
        filtradas = filtradas.filter(
          (visita) => visita.estado === filtroEstado
        );
      }

      // Aplicar filtro por sexo
      if (filtroSexo !== "todos") {
        filtradas = filtradas.filter((visita) => visita.sexo === filtroSexo);
      }

      // Aplicar filtro por familia
      if (filtroFamilia !== "todos") {
        filtradas = filtradas.filter(
          (visita) => (visita.familia || "") === filtroFamilia
        );
      }

      setVisitasFiltradas(filtradas);
      setCurrentPage(1); // Resetear a la primera página
    };

    filtrarVisitas();
  }, [searchTerm, visitas, filtroEstado, filtroSexo, filtroFamilia]);

  // Función para mostrar dialog de confirmación
  const mostrarDialogEliminar = (visita: Visita) => {
    setVisitaAEliminar(visita);
    setDialogOpen(true);
  };

  // Función para eliminar visita
  const confirmarEliminacion = async () => {
    if (!visitaAEliminar) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/visitas/${visitaAEliminar.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al eliminar la visita");
      }

      // Actualizar la lista de visitas
      const nuevasVisitas = visitas.filter((v) => v.id !== visitaAEliminar.id);
      setVisitas(nuevasVisitas);
      setVisitasFiltradas(
        nuevasVisitas.filter((v) => {
          if (!searchTerm.trim()) return true;
          const termino = searchTerm.toLowerCase().trim();
          const nombreCompleto = `${v.nombres} ${v.apellidos}`.toLowerCase();
          return nombreCompleto.includes(termino);
        })
      );

      setDialogOpen(false);
      setVisitaAEliminar(null);
      console.log("Visita eliminada correctamente");
    } catch (error) {
      console.error("Error al eliminar visita:", error);
      alert("Error al eliminar la visita. Por favor, intenta de nuevo.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Función para cancelar eliminación
  const cancelarEliminacion = () => {
    setDialogOpen(false);
    setVisitaAEliminar(null);
  };

  // Función para limpiar filtros
  const limpiarFiltros = () => {
    setFiltroEstado("todos");
    setFiltroSexo("todos");
    setFiltroFamilia("todos");
    setSearchTerm("");
  };

  // Obtener opciones únicas para filtros
  const getOpcionesFamilias = (): string[] => {
    const familias = visitas
      .map((v) => v.familia)
      .filter(
        (f): f is string => f !== null && f !== undefined && f.trim() !== ""
      )
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
    return familias;
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Calcular datos de paginación
  const totalItems = visitasFiltradas.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = visitasFiltradas.slice(startIndex, endIndex);

  // Funciones de paginación
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToPrevious = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const changeItemsPerPage = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Función para obtener el color del badge según el estado
  const getBadgeVariant = (estado?: string) => {
    switch (estado) {
      case "Nuevo":
        return "default";
      case "Convertido":
        return "secondary";
      case "Recurrente":
        return "outline";
      default:
        return "default";
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {loading ? (
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando visitas...</span>
          </div>
        ) : (
          <>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4 flex-1">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="/dashboard">
                        Dashboard
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Visitas</BreadcrumbPage>
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
                      <CardTitle>Gestión de Visitas</CardTitle>
                      <CardDescription>
                        Administra la información de las visitas de la iglesia
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => router.push("/visitas/historial")}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Historial
                      </Button>
                      <Button onClick={() => router.push("/visitas/nueva")}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Visita
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2 flex-1">
                      <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar visitas..."
                          className="pl-8 pr-8"
                          value={searchTerm}
                          onChange={handleSearchChange}
                        />
                        {searchTerm && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1 h-6 w-6 p-0"
                            onClick={() => setSearchTerm("")}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                      >
                        <Filter className="mr-2 h-4 w-4" />
                        Filtros
                      </Button>
                    </div>
                    {searchTerm && (
                      <div className="text-sm text-muted-foreground ml-4">
                        {visitasFiltradas.length} resultado
                        {visitasFiltradas.length !== 1 ? "s" : ""} encontrado
                        {visitasFiltradas.length !== 1 ? "s" : ""}
                        {totalPages > 1 && (
                          <span>
                            {" "}
                            • Página {currentPage} de {totalPages}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Panel de Filtros */}
                  {showFilters && (
                    <div className="border rounded-lg p-4 mb-4 bg-muted">
                      <div className="flex flex-wrap items-end">
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
                              <SelectItem value="Nuevo">Nuevo</SelectItem>
                              <SelectItem value="Recurrente">
                                Recurrente
                              </SelectItem>
                              <SelectItem value="Convertido">
                                Convertido
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="w-40 space-y-1">
                          <label className="text-sm font-medium">Sexo</label>
                          <Select
                            value={filtroSexo}
                            onValueChange={setFiltroSexo}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todos">Todos</SelectItem>
                              <SelectItem value="Masculino">
                                Masculino
                              </SelectItem>
                              <SelectItem value="Femenino">Femenino</SelectItem>
                              <SelectItem value="Otro">Otro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="w-40 space-y-1">
                          <label className="text-sm font-medium">Familia</label>
                          <Select
                            value={filtroFamilia}
                            onValueChange={setFiltroFamilia}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todos">Todas</SelectItem>
                              {getOpcionesFamilias().map((familia) => (
                                <SelectItem key={familia} value={familia}>
                                  {familia}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={limpiarFiltros}
                        >
                          Limpiar Filtros
                        </Button>
                      </div>

                      <div className="mt-3">
                        <span className="text-sm text-muted-foreground">
                          Mostrando {visitasFiltradas.length} de{" "}
                          {visitas.length} visitas
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Foto</TableHead>
                          <TableHead>Nombre Completo</TableHead>
                          <TableHead>Contacto</TableHead>
                          <TableHead>Familia</TableHead>
                          <TableHead>Visitas</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">
                              Cargando visitas...
                            </TableCell>
                          </TableRow>
                        ) : visitasFiltradas.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">
                              {searchTerm
                                ? `No se encontraron visitas que coincidan con "${searchTerm}"`
                                : "No hay visitas registradas"}
                            </TableCell>
                          </TableRow>
                        ) : (
                          currentItems.map((visita) => (
                            <TableRow key={visita.id}>
                              <TableCell>
                                <MiembroAvatar
                                  foto={visita.foto}
                                  nombre={`${visita.nombres} ${visita.apellidos}`}
                                  size="sm"
                                />
                              </TableCell>
                              <TableCell className="font-medium">
                                <div>
                                  <div>
                                    {visita.nombres} {visita.apellidos}
                                  </div>
                                  {visita.miembroConvertido && (
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                      <UserCheck className="h-3 w-3" />
                                      Convertido en miembro
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div>{visita.correo}</div>
                                  <div className="text-muted-foreground">
                                    {visita.telefono || visita.celular}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{visita.familia || "—"}</TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-medium">
                                    {visita.historialVisitas.length}{" "}
                                    {visita.historialVisitas.length === 1
                                      ? "visita"
                                      : "visitas"}
                                  </div>
                                  {visita.fechaPrimeraVisita && (
                                    <div className="text-muted-foreground text-xs">
                                      Primera:{" "}
                                      {new Date(
                                        visita.fechaPrimeraVisita
                                      ).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={getBadgeVariant(visita.estado)}>
                                  {visita.estado || "Recurrente"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
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
                                        router.push(`/visitas/${visita.id}`)
                                      }
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      Ver Detalles
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        router.push(
                                          `/visitas/${visita.id}/editar`
                                        )
                                      }
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        router.push(
                                          `/visitas/${visita.id}/historial`
                                        )
                                      }
                                    >
                                      <Calendar className="mr-2 h-4 w-4" />
                                      Historial
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() =>
                                        mostrarDialogEliminar(visita)
                                      }
                                      disabled={isDeleting}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      {isDeleting
                                        ? "Eliminando..."
                                        : "Eliminar"}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Componentes de paginación */}
                  {totalItems > 0 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">
                          Mostrando {startIndex + 1} a{" "}
                          {Math.min(endIndex, totalItems)} de {totalItems}{" "}
                          visitas
                        </span>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">
                            Elementos por página:
                          </span>
                          <Select
                            value={itemsPerPage.toString()}
                            onValueChange={(value) =>
                              changeItemsPerPage(parseInt(value))
                            }
                          >
                            <SelectTrigger className="w-16">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5</SelectItem>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="25">25</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                              <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={goToPrevious}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Anterior
                          </Button>

                          <div className="flex items-center space-x-1">
                            {Array.from(
                              { length: Math.min(5, totalPages) },
                              (_, i) => {
                                let pageNumber;
                                if (totalPages <= 5) {
                                  pageNumber = i + 1;
                                } else if (currentPage <= 3) {
                                  pageNumber = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                  pageNumber = totalPages - 4 + i;
                                } else {
                                  pageNumber = currentPage - 2 + i;
                                }

                                return (
                                  <Button
                                    key={pageNumber}
                                    variant={
                                      currentPage === pageNumber
                                        ? "default"
                                        : "outline"
                                    }
                                    size="sm"
                                    className="w-8 h-8 p-0"
                                    onClick={() => goToPage(pageNumber)}
                                  >
                                    {pageNumber}
                                  </Button>
                                );
                              }
                            )}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={goToNext}
                            disabled={currentPage === totalPages}
                          >
                            Siguiente
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </SidebarInset>
      <Dialog open={dialogOpen} onOpenChange={cancelarEliminacion}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Eliminar Visita</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar a{" "}
              <strong>
                {visitaAEliminar?.nombres} {visitaAEliminar?.apellidos}
              </strong>
              ? Esta acción no se puede deshacer y eliminará también todo el
              historial de visitas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={cancelarEliminacion}
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
    </SidebarProvider>
  );
}
