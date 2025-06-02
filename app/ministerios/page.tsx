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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Plus,
  Search,
  Filter,
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

interface MinisterioMiembro {
  id: number;
  miembro: {
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
  miembros: MinisterioMiembro[];
  actividades: MinisterioActividad[];
  _count: {
    miembros: number;
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
        `¿Estás seguro de que quieres eliminar el ministerio &quot;${nombre}&quot;?`
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

  const getLider = (miembros: MinisterioMiembro[]) => {
    // Buscar líder por rol o tomar el primer miembro activo
    const lider =
      miembros.find(
        (m) =>
          m.estado === "Activo" &&
          (m.rol?.toLowerCase().includes("líder") ||
            m.rol?.toLowerCase().includes("pastor"))
      ) || miembros.find((m) => m.estado === "Activo");

    return lider
      ? {
          nombre: `${lider.miembro.nombres} ${lider.miembro.apellidos}`,
          avatar: lider.miembro.foto,
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
          <div className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <div className="flex items-center justify-between flex-1">
                <h1 className="text-lg font-semibold">Ministerios</h1>
                <ModeToggle />
              </div>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-500">{error}</p>
                <Button onClick={fetchMinisterios} className="mt-4">
                  Intentar de nuevo
                </Button>
              </div>
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
                  <BreadcrumbPage>Ministerios</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="ml-auto">
              <ModeToggle />
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gestión de Ministerios</CardTitle>
                  <CardDescription>
                    Administra los ministerios y equipos de trabajo de la
                    iglesia
                  </CardDescription>
                </div>
                <Button onClick={() => router.push("/ministerios/nuevo")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Ministerio
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar ministerios..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros
                </Button>
              </div>

              {ministeriosFiltrados.length === 0 ? (
                <div className="text-center py-20">
                  {searchTerm ? (
                    <p className="text-muted-foreground">
                      No se encontraron ministerios que coincidan con &quot;
                      {searchTerm}&quot;
                    </p>
                  ) : (
                    <div>
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        No hay ministerios registrados
                      </p>
                      <Button onClick={() => router.push("/ministerios/nuevo")}>
                        <Plus className="mr-2 h-4 w-4" />
                        Crear primer ministerio
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {ministeriosFiltrados.map((ministerio) => {
                    const lider = getLider(ministerio.miembros);

                    return (
                      <Card key={ministerio.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-lg">
                                {ministerio.nombre}
                              </CardTitle>
                              <CardDescription>
                                {ministerio.descripcion || "Sin descripción"}
                              </CardDescription>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(`/ministerios/${ministerio.id}`)
                                  }
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver Detalles
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(
                                      `/ministerios/${ministerio.id}/miembros`
                                    )
                                  }
                                >
                                  <UserPlus className="mr-2 h-4 w-4" />
                                  Gestionar Miembros
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(
                                      `/ministerios/${ministerio.id}/editar`
                                    )
                                  }
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() =>
                                    handleEliminarMinisterio(
                                      ministerio.id,
                                      ministerio.nombre
                                    )
                                  }
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {lider ? (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage
                                      src={lider.avatar || "/placeholder.svg"}
                                    />
                                    <AvatarFallback>
                                      {lider.nombre
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-sm font-medium">Líder</p>
                                    <p className="text-sm text-muted-foreground">
                                      {lider.nombre}
                                    </p>
                                  </div>
                                </div>
                                <Badge variant="secondary">Activo</Badge>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                  Sin líder asignado
                                </div>
                                <Badge variant="outline">Sin líder</Badge>
                              </div>
                            )}

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">
                                  Miembros Activos
                                </p>
                                <div className="flex items-center space-x-1">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">
                                    {ministerio._count.miembros}
                                  </span>
                                </div>
                              </div>

                              {ministerio.miembros.length > 0 && (
                                <div className="space-y-1">
                                  {ministerio.miembros
                                    .filter((m) => m.estado === "Activo")
                                    .slice(0, 3)
                                    .map((miembro) => (
                                      <div
                                        key={miembro.id}
                                        className="flex items-center justify-between text-sm"
                                      >
                                        <span>{`${miembro.miembro.nombres} ${miembro.miembro.apellidos}`}</span>
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {miembro.rol || "Miembro"}
                                        </Badge>
                                      </div>
                                    ))}
                                  {ministerio._count.miembros > 3 && (
                                    <p className="text-xs text-muted-foreground">
                                      +{ministerio._count.miembros - 3} miembros
                                      más
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="pt-2 border-t">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <p className="text-sm text-muted-foreground">
                                    {ministerio._count.actividades} actividades
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    router.push(`/ministerios/${ministerio.id}`)
                                  }
                                >
                                  Ver Más
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
