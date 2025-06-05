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
import { Miembro } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MiembroAvatar } from "../../components/MiembroAvatar";
import { ModeToggle } from "../../components/mode-toggle";
import { useApiConIglesia } from "../../hooks/useApiConIglesia";

// Función para formatear teléfonos para mostrar
const formatPhoneForDisplay = (phone: string | null | undefined): string => {
  if (!phone) return "";

  // Remover todo lo que no sea número
  const numbers = phone.replace(/\D/g, "");

  // Si no tiene números, retornar vacío
  if (numbers.length === 0) return "";

  // Aplicar formato XXX-XXX-XXXX
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 6) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  } else {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(
      6,
      10
    )}`;
  }
};

export default function MiembrosPage() {
  const router = useRouter();
  const { fetchConIglesia, tieneIglesia, iglesiaActiva } = useApiConIglesia();
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [miembrosFiltrados, setMiembrosFiltrados] = useState<Miembro[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Estados para eliminación
  const [miembroAEliminar, setMiembroAEliminar] = useState<Miembro | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Estados para filtros
  const [showFilters, setShowFilters] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [filtroSexo, setFiltroSexo] = useState<string>("todos");
  const [filtroFamilia, setFiltroFamilia] = useState<string>("todos");

  useEffect(() => {
    const fetchMiembros = async () => {
      if (!tieneIglesia) {
        setLoading(false);
        return;
      }

      try {
        console.log(
          `🔄 Cargando miembros para iglesia: ${iglesiaActiva?.nombre} (ID: ${iglesiaActiva?.id})`
        );
        const data = await fetchConIglesia("/api/miembros");
        setMiembros(data);
        setMiembrosFiltrados(data);
        console.log(`✅ Cargados ${data.length} miembros`);
      } catch (error) {
        console.error("Error:", error);
        setMiembros([]);
        setMiembrosFiltrados([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMiembros();
  }, [tieneIglesia, iglesiaActiva?.id, fetchConIglesia]);

  useEffect(() => {
    const filtrarMiembros = () => {
      let filtrados = [...miembros];

      // Aplicar filtro de búsqueda por texto
      if (searchTerm.trim()) {
        const termino = searchTerm.toLowerCase().trim();
        filtrados = filtrados.filter((miembro) => {
          const nombreCompleto =
            `${miembro.nombres} ${miembro.apellidos}`.toLowerCase();
          const correo = miembro.correo?.toLowerCase() || "";
          const telefono = miembro.telefono || "";
          const celular = miembro.celular || "";
          const ocupacion = miembro.ocupacion?.toLowerCase() || "";

          return (
            nombreCompleto.includes(termino) ||
            correo.includes(termino) ||
            telefono.includes(termino) ||
            celular.includes(termino) ||
            ocupacion.includes(termino)
          );
        });
      }

      // Aplicar filtro por estado
      if (filtroEstado !== "todos") {
        filtrados = filtrados.filter(
          (miembro) => miembro.estado === filtroEstado
        );
      }

      // Aplicar filtro por sexo
      if (filtroSexo !== "todos") {
        filtrados = filtrados.filter((miembro) => miembro.sexo === filtroSexo);
      }

      setMiembrosFiltrados(filtrados);
      setCurrentPage(1); // Resetear a la primera página
    };

    filtrarMiembros();
  }, [searchTerm, miembros, filtroEstado, filtroSexo, filtroFamilia]);

  // Función para mostrar dialog de confirmación
  const mostrarDialogEliminar = (miembro: Miembro) => {
    setMiembroAEliminar(miembro);
    setDialogOpen(true);
  };

  // Función para eliminar miembro
  const confirmarEliminacion = async () => {
    if (!miembroAEliminar) return;

    setIsDeleting(true);
    try {
      await fetchConIglesia(`/api/miembros/${miembroAEliminar.id}`, {
        method: "DELETE",
      });

      // Actualizar la lista de miembros
      const nuevosmiembros = miembros.filter(
        (m) => m.id !== miembroAEliminar.id
      );
      setMiembros(nuevosmiembros);
      setMiembrosFiltrados(
        nuevosmiembros.filter((m) => {
          if (!searchTerm.trim()) return true;
          const termino = searchTerm.toLowerCase().trim();
          const nombreCompleto = `${m.nombres} ${m.apellidos}`.toLowerCase();
          return nombreCompleto.includes(termino);
        })
      );

      setDialogOpen(false);
      setMiembroAEliminar(null);
      console.log("Miembro eliminado correctamente");
    } catch (error) {
      console.error("Error al eliminar miembro:", error);
      alert("Error al eliminar el miembro. Por favor, intenta de nuevo.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Función para cancelar eliminación
  const cancelarEliminacion = () => {
    setDialogOpen(false);
    setMiembroAEliminar(null);
  };

  // Función para limpiar filtros
  const limpiarFiltros = () => {
    setFiltroEstado("todos");
    setFiltroSexo("todos");
    setFiltroFamilia("todos");
    setSearchTerm("");
  };

  // Obtener opciones únicas para filtros (remover filtro familia por ahora)
  const getOpcionesFamilias = (): string[] => {
    return []; // Temporalmente vacío hasta implementar relación con familias
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Calcular datos de paginación
  const totalItems = miembrosFiltrados.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = miembrosFiltrados.slice(startIndex, endIndex);

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

  // Si no hay iglesia seleccionada, mostrar mensaje
  if (!tieneIglesia) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">
                Sin Iglesia Seleccionada
              </h2>
              <p className="text-muted-foreground">
                Selecciona una iglesia para ver los miembros.
              </p>
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
        {loading ? (
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando miembros...</span>
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
                      <BreadcrumbPage>Miembros</BreadcrumbPage>
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
                      <CardTitle>Gestión de Miembros</CardTitle>
                      <CardDescription>
                        Administra la información de los miembros de la iglesia
                      </CardDescription>
                    </div>
                    <Button onClick={() => router.push("/miembros/nuevo")}>
                      <Plus className="mr-2 h-4 w-4" />
                      Nuevo Miembro
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2 flex-1">
                      <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar miembros..."
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
                        {miembrosFiltrados.length} resultado
                        {miembrosFiltrados.length !== 1 ? "s" : ""} encontrado
                        {miembrosFiltrados.length !== 1 ? "s" : ""}
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
                              <SelectItem value="Activo">Activo</SelectItem>
                              <SelectItem value="Inactivo">Inactivo</SelectItem>
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
                          Mostrando {miembrosFiltrados.length} de{" "}
                          {miembros.length} miembros
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
                          <TableHead>Ocupación</TableHead>
                          <TableHead>Familia</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {miembrosFiltrados.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">
                              {searchTerm
                                ? `No se encontraron miembros que coincidan con "${searchTerm}"`
                                : "No hay miembros registrados"}
                            </TableCell>
                          </TableRow>
                        ) : (
                          currentItems.map((miembro) => (
                            <TableRow
                              key={miembro.id}
                              className="cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() =>
                                router.push(`/miembros/${miembro.id}`)
                              }
                            >
                              <TableCell>
                                <MiembroAvatar
                                  foto={miembro.foto}
                                  nombre={`${miembro.nombres} ${miembro.apellidos}`}
                                  size="sm"
                                />
                              </TableCell>
                              <TableCell className="font-medium">
                                <div>
                                  <div>
                                    {miembro.nombres} {miembro.apellidos}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div>{miembro.correo}</div>
                                  <div className="text-muted-foreground">
                                    {formatPhoneForDisplay(miembro.telefono)}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{miembro.ocupacion}</TableCell>
                              <TableCell>
                                {miembro.familiaId || "N/A"}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    miembro.estado === "Activo"
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {miembro.estado}
                                </Badge>
                              </TableCell>
                              <TableCell
                                className="text-right"
                                onClick={(e) => e.stopPropagation()}
                              >
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
                                        router.push(`/miembros/${miembro.id}`)
                                      }
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      Ver Detalles
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        router.push(
                                          `/miembros/${miembro.id}/editar`
                                        )
                                      }
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() =>
                                        mostrarDialogEliminar(miembro)
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
                          miembros
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

        {/* Dialog de confirmación para eliminar */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Estás seguro?</DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente
                el miembro{" "}
                <strong>
                  {miembroAEliminar?.nombres} {miembroAEliminar?.apellidos}
                </strong>{" "}
                y todos sus datos asociados.
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
      </SidebarInset>
    </SidebarProvider>
  );
}
