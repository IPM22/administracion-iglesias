"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Users,
  HomeIcon,
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
import { calcularEdad } from "@/lib/date-utils";
import { ModeToggle } from "../../components/mode-toggle";

interface Familia {
  id: number;
  apellido: string;
  nombre?: string;
  estado: string;
  notas?: string;
  fechaRegistro: string;
  jefeFamilia?: {
    id: number;
    nombres: string;
    apellidos: string;
    foto?: string;
  };
  miembros: Array<{
    id: number;
    nombres: string;
    apellidos: string;
    foto?: string;
    fechaNacimiento?: string;
    estado: string;
    parentescoFamiliar?: string;
  }>;
  totalMiembros: number;
  miembrosActivos: number;
  edadPromedio?: number;
}

export default function FamiliasPage() {
  const router = useRouter();
  const [familias, setFamilias] = useState<Familia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState<string>("");

  // Estados para el dialog de eliminación
  const [dialogEliminar, setDialogEliminar] = useState(false);
  const [familiaAEliminar, setFamiliaAEliminar] = useState<Familia | null>(
    null
  );
  const [eliminando, setEliminando] = useState(false);

  const cargarFamilias = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/familias");
      if (response.ok) {
        const data = await response.json();
        setFamilias(data);
      } else {
        throw new Error("Error al cargar familias");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("No se pudieron cargar las familias");
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogEliminar = (familia: Familia) => {
    setFamiliaAEliminar(familia);
    setDialogEliminar(true);
  };

  const eliminarFamilia = async () => {
    if (!familiaAEliminar) return;

    setEliminando(true);
    try {
      // Primero, remover todos los miembros de la familia
      if (familiaAEliminar.miembros.length > 0) {
        for (const miembro of familiaAEliminar.miembros) {
          const miembroResponse = await fetch(`/api/miembros/${miembro.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              familiaId: null,
              parentescoFamiliar: null,
            }),
          });

          if (!miembroResponse.ok) {
            throw new Error(
              `Error al remover miembro ${miembro.nombres} ${miembro.apellidos}`
            );
          }
        }
      }

      // También verificar y remover visitas si las hay
      const visitasResponse = await fetch(
        `/api/familias/${familiaAEliminar.id}/visitas`
      );
      if (visitasResponse.ok) {
        const visitas = await visitasResponse.json();
        for (const visita of visitas) {
          const visitaUpdateResponse = await fetch(
            `/api/visitas/${visita.id}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                familiaId: null,
                parentescoFamiliar: null,
              }),
            }
          );

          if (!visitaUpdateResponse.ok) {
            console.warn(
              `Error al remover visita ${visita.nombres} ${visita.apellidos}`
            );
          }
        }
      }

      // Luego eliminar la familia
      const response = await fetch(`/api/familias/${familiaAEliminar.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al eliminar la familia");
      }

      // Recargar la lista de familias
      await cargarFamilias();

      setDialogEliminar(false);
      setFamiliaAEliminar(null);
    } catch (error) {
      console.error("Error:", error);
      setError(
        error instanceof Error ? error.message : "Error al eliminar la familia"
      );
    } finally {
      setEliminando(false);
    }
  };

  useEffect(() => {
    cargarFamilias();
  }, []);

  // Filtrar familias
  const familiasFiltradas = familias.filter(
    (familia) =>
      familia.apellido.toLowerCase().includes(busqueda.toLowerCase()) ||
      familia.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      familia.jefeFamilia?.nombres
        .toLowerCase()
        .includes(busqueda.toLowerCase()) ||
      familia.jefeFamilia?.apellidos
        .toLowerCase()
        .includes(busqueda.toLowerCase())
  );

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando familias...</span>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (error) {
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
                    <BreadcrumbPage>Familias</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <div className="flex items-center gap-2 ml-auto">
                <ModeToggle />
              </div>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-2 md:p-4 pt-0">
            <Card className="text-center py-12">
              <CardContent>
                <h3 className="text-lg font-semibold mb-2">Error</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={cargarFamilias}>Reintentar</Button>
              </CardContent>
            </Card>
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
                  <BreadcrumbPage>Familias</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center gap-2 ml-auto">
              <ModeToggle />
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-2 md:p-4 pt-0">
          {/* Header responsivo */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Familias
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Gestiona las familias de la iglesia
              </p>
            </div>
            <Button
              onClick={() => router.push("/familias/crear")}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Nueva Familia</span>
              <span className="sm:hidden">Nueva</span>
            </Button>
          </div>

          {/* Barra de búsqueda responsiva */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar familias..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Grid de familias responsivo */}
          {familiasFiltradas.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <HomeIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {busqueda ? "No se encontraron familias" : "No hay familias"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {busqueda
                    ? "Intenta con otros términos de búsqueda."
                    : "Comienza creando la primera familia de la iglesia."}
                </p>
                {!busqueda && (
                  <Button onClick={() => router.push("/familias/crear")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear primera familia
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {familiasFiltradas.map((familia) => (
                <Card
                  key={familia.id}
                  className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-orange-500"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-sm md:text-base font-semibold line-clamp-2">
                          Familia {familia.apellido}
                        </CardTitle>
                        {familia.nombre && (
                          <CardDescription className="text-xs md:text-sm mt-1 line-clamp-1">
                            {familia.nombre}
                          </CardDescription>
                        )}
                        <div className="flex items-center gap-1 mt-2">
                          <Badge
                            variant={
                              familia.estado === "Activa"
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {familia.estado}
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
                              router.push(`/familias/${familia.id}`)
                            }
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/familias/${familia.id}/editar`)
                            }
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => abrirDialogEliminar(familia)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 space-y-3">
                    {/* Jefe de familia */}
                    {familia.jefeFamilia ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={familia.jefeFamilia.foto} />
                          <AvatarFallback className="text-xs">
                            {familia.jefeFamilia.nombres.charAt(0)}
                            {familia.jefeFamilia.apellidos.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">
                            {familia.jefeFamilia.nombres}{" "}
                            {familia.jefeFamilia.apellidos}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Jefe de familia
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4 flex-shrink-0" />
                        <span className="text-xs">
                          Sin jefe de familia asignado
                        </span>
                      </div>
                    )}

                    {/* Estadísticas */}
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="h-3 w-3 text-blue-500" />
                          <span className="text-lg font-semibold">
                            {familia.totalMiembros}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {familia.totalMiembros === 1 ? "Miembro" : "Miembros"}
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="h-3 w-3 text-green-500" />
                          <span className="text-lg font-semibold">
                            {familia.miembrosActivos}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {familia.miembrosActivos === 1 ? "Activo" : "Activos"}
                        </p>
                      </div>
                    </div>

                    {/* Edad promedio si está disponible */}
                    {familia.edadPromedio && (
                      <div className="pt-2 border-t">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">
                            Edad promedio:{" "}
                            <span className="font-medium">
                              {familia.edadPromedio.toFixed(0)} años
                            </span>
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Miembros muestra (primeros 3) */}
                    {familia.miembros.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs font-medium mb-2">Miembros:</p>
                        <div className="space-y-1">
                          {familia.miembros.slice(0, 3).map((miembro) => (
                            <div
                              key={miembro.id}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <Avatar className="h-4 w-4">
                                  <AvatarImage src={miembro.foto} />
                                  <AvatarFallback className="text-xs">
                                    {miembro.nombres.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs truncate">
                                  {miembro.nombres} {miembro.apellidos}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                {miembro.fechaNacimiento && (
                                  <span className="text-xs text-muted-foreground">
                                    {calcularEdad(miembro.fechaNacimiento)}a
                                  </span>
                                )}
                                <Badge
                                  variant={
                                    miembro.estado === "Activo"
                                      ? "default"
                                      : "secondary"
                                  }
                                  className="text-xs px-1 py-0"
                                >
                                  {miembro.parentescoFamiliar || miembro.estado}
                                </Badge>
                              </div>
                            </div>
                          ))}
                          {familia.miembros.length > 3 && (
                            <p className="text-xs text-muted-foreground text-center">
                              +{familia.miembros.length - 3} miembros más
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Botones de acción */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/familias/${familia.id}`)}
                        className="flex-1 text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/familias/${familia.id}/editar`)
                        }
                        className="flex-1 text-xs"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Dialog de eliminación - Responsivo */}
          <Dialog open={dialogEliminar} onOpenChange={setDialogEliminar}>
            <DialogContent className="max-w-md mx-4">
              <DialogHeader>
                <DialogTitle>¿Eliminar familia?</DialogTitle>
                <DialogDescription>
                  Esta acción no se puede deshacer. Se eliminará permanentemente
                  la familia &quot;{familiaAEliminar?.apellido}&quot; y se
                  removerán todos sus miembros de la familia.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDialogEliminar(false)}
                  disabled={eliminando}
                  className="w-full sm:w-auto order-2 sm:order-1"
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={eliminarFamilia}
                  disabled={eliminando}
                  className="w-full sm:w-auto order-1 sm:order-2"
                >
                  {eliminando ? (
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
