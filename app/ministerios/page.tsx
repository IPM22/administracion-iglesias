"use client";

import { useEffect, useState } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Users,
  UserPlus,
  Calendar,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { ModeToggle } from "../../components/mode-toggle";

interface MinisterioPersona {
  id: number;
  persona: {
    id: number;
    nombres: string;
    apellidos: string;
    foto?: string;
  };
  rol?: string;
  fechaInicio: string;
  estado: string;
}

interface MinisterioActividad {
  id: number;
  nombre: string;
  fecha: string;
  estado: string;
}

interface Ministerio {
  id: number;
  nombre: string;
  descripcion?: string;
  personas?: MinisterioPersona[];
  actividades?: MinisterioActividad[];
  _count: {
    personas: number;
    actividades: number;
  };
}

export default function MinisteriosPage() {
  const router = useRouter();
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMinisterios();
  }, []);

  const fetchMinisterios = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/ministerios");

      if (!response.ok) {
        throw new Error("Error al cargar ministerios");
      }

      const data = await response.json();
      setMinisterios(data);
    } catch (error) {
      console.error("Error:", error);
      setError("Error al cargar los ministerios");
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarMinisterio = async (id: number, nombre: string) => {
    if (
      !confirm(
        `¿Estás seguro de que quieres eliminar el ministerio "${nombre}"?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/ministerios/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al eliminar ministerio");
      }

      // Recargar la lista
      fetchMinisterios();
    } catch (error) {
      console.error("Error:", error);
      alert(
        error instanceof Error ? error.message : "Error al eliminar ministerio"
      );
    }
  };

  const ministeriosFiltrados = ministerios.filter(
    (ministerio) =>
      ministerio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ministerio.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLider = (personas: MinisterioPersona[] | undefined) => {
    // Validación defensiva: verificar que personas existe y es un array
    if (!personas || !Array.isArray(personas) || personas.length === 0) {
      return null;
    }

    // Buscar líder por rol o tomar la primera persona activa
    const lider =
      personas.find(
        (p) =>
          p.estado === "Activo" &&
          (p.rol?.toLowerCase().includes("líder") ||
            p.rol?.toLowerCase().includes("pastor"))
      ) || personas.find((p) => p.estado === "Activo");

    return lider
      ? {
          nombre: `${lider.persona.nombres} ${lider.persona.apellidos}`,
          avatar: lider.persona.foto,
          rol: lider.rol || "Miembro",
        }
      : null;
  };

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando ministerios...</span>
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
                    <BreadcrumbPage>Ministerios</BreadcrumbPage>
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
                <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
                <h3 className="text-lg font-semibold mb-2">Error</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={fetchMinisterios}>Reintentar</Button>
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
                  <BreadcrumbPage>Ministerios</BreadcrumbPage>
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
                Ministerios
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Gestiona los ministerios y equipos de la iglesia
              </p>
            </div>
            <Button
              onClick={() => router.push("/ministerios/crear")}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Nuevo Ministerio</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          </div>

          {/* Barra de búsqueda responsiva */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar ministerios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Grid de ministerios responsivo */}
          {ministeriosFiltrados.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm
                    ? "No se encontraron ministerios"
                    : "No hay ministerios"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm
                    ? "Intenta con otros términos de búsqueda."
                    : "Comienza creando el primer ministerio de la iglesia."}
                </p>
                {!searchTerm && (
                  <Button onClick={() => router.push("/ministerios/crear")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear primer ministerio
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {ministeriosFiltrados.map((ministerio) => {
                const lider = getLider(ministerio.personas);
                return (
                  <Card
                    key={ministerio.id}
                    className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-sm md:text-base font-semibold line-clamp-2">
                            {ministerio.nombre}
                          </CardTitle>
                          {ministerio.descripcion && (
                            <CardDescription className="text-xs md:text-sm mt-1 line-clamp-2">
                              {ministerio.descripcion}
                            </CardDescription>
                          )}
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
                                router.push(`/ministerios/${ministerio.id}`)
                              }
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/ministerios/${ministerio.id}/editar`
                                )
                              }
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/ministerios/${ministerio.id}/miembros`
                                )
                              }
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              Gestionar miembros
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() =>
                                handleEliminarMinisterio(
                                  ministerio.id,
                                  ministerio.nombre
                                )
                              }
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0 space-y-3">
                      {/* Líder del ministerio */}
                      {lider ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={lider.avatar} />
                            <AvatarFallback className="text-xs">
                              {lider.nombre
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate">
                              {lider.nombre}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {lider.rol}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4 flex-shrink-0" />
                          <span className="text-xs">Sin líder asignado</span>
                        </div>
                      )}

                      {/* Estadísticas */}
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Users className="h-3 w-3 text-blue-500" />
                            <span className="text-lg font-semibold">
                              {ministerio._count.personas}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {ministerio._count.personas === 1
                              ? "Miembro"
                              : "Miembros"}
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Calendar className="h-3 w-3 text-green-500" />
                            <span className="text-lg font-semibold">
                              {ministerio._count.actividades}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {ministerio._count.actividades === 1
                              ? "Actividad"
                              : "Actividades"}
                          </p>
                        </div>
                      </div>

                      {/* Botones de acción */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(`/ministerios/${ministerio.id}`)
                          }
                          className="flex-1 text-xs"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/ministerios/${ministerio.id}/miembros`
                            )
                          }
                          className="flex-1 text-xs"
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          Miembros
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
