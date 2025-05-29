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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export default function MiembrosPage() {
  const router = useRouter();
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [miembrosFiltrados, setMiembrosFiltrados] = useState<Miembro[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const fetchMiembros = async () => {
      try {
        const response = await fetch("/api/miembros");
        if (!response.ok) {
          throw new Error("Error al cargar los miembros");
        }
        const data = await response.json();
        setMiembros(data);
        setMiembrosFiltrados(data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMiembros();
  }, []);

  useEffect(() => {
    const filtrarMiembros = () => {
      if (!searchTerm.trim()) {
        setMiembrosFiltrados(miembros);
        return;
      }

      const termino = searchTerm.toLowerCase().trim();
      const filtrados = miembros.filter((miembro) => {
        const nombreCompleto =
          `${miembro.nombres} ${miembro.apellidos}`.toLowerCase();
        const correo = miembro.correo?.toLowerCase() || "";
        const telefono = miembro.telefono || "";
        const celular = miembro.celular || "";
        const ocupacion = miembro.ocupacion?.toLowerCase() || "";
        const familia = miembro.familia?.toLowerCase() || "";

        return (
          nombreCompleto.includes(termino) ||
          correo.includes(termino) ||
          telefono.includes(termino) ||
          celular.includes(termino) ||
          ocupacion.includes(termino) ||
          familia.includes(termino)
        );
      });

      setMiembrosFiltrados(filtrados);
      setCurrentPage(1); // Resetear a la primera página cuando se filtra
    };

    filtrarMiembros();
  }, [searchTerm, miembros]);

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

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Miembros</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
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
                  <Button variant="outline">
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

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombres</TableHead>
                      <TableHead>Apellidos</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Ocupación</TableHead>
                      <TableHead>Familia</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Cargando miembros...
                        </TableCell>
                      </TableRow>
                    ) : miembrosFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          {searchTerm
                            ? `No se encontraron miembros que coincidan con "${searchTerm}"`
                            : "No hay miembros registrados"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentItems.map((miembro) => (
                        <TableRow key={miembro.id}>
                          <TableCell className="font-medium">
                            {miembro.nombres}
                          </TableCell>
                          <TableCell className="font-medium">
                            {miembro.apellidos}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{miembro.correo}</div>
                              <div className="text-muted-foreground">
                                {miembro.telefono}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{miembro.ocupacion}</TableCell>
                          <TableCell>{miembro.familia}</TableCell>
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
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
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
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Eliminar
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
                      {Math.min(endIndex, totalItems)} de {totalItems} miembros
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
      </SidebarInset>
    </SidebarProvider>
  );
}
