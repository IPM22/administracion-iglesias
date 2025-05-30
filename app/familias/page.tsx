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
  Filter,
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
  const [filtroTexto, setFiltroTexto] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar familias desde el API
  useEffect(() => {
    cargarFamilias();
  }, []);

  const cargarFamilias = async () => {
    try {
      setCargando(true);
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
      setCargando(false);
    }
  };

  const familiasFiltradas = familias.filter(
    (familia) =>
      familia.apellido.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      familia.nombre?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      familia.jefeFamilia?.nombres
        .toLowerCase()
        .includes(filtroTexto.toLowerCase()) ||
      familia.jefeFamilia?.apellidos
        .toLowerCase()
        .includes(filtroTexto.toLowerCase())
  );

  const calcularEdad = (fechaNacimiento: string) => {
    const fecha = new Date(fechaNacimiento);
    const hoy = new Date();
    return hoy.getFullYear() - fecha.getFullYear();
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
                  <BreadcrumbPage>Familias</BreadcrumbPage>
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
                  <CardTitle>Gestión de Familias</CardTitle>
                  <CardDescription>
                    Administra los núcleos familiares de la congregación
                  </CardDescription>
                </div>
                <Button onClick={() => router.push("/familias/nueva")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Familia
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar familias..."
                    className="pl-8"
                    value={filtroTexto}
                    onChange={(e) => setFiltroTexto(e.target.value)}
                  />
                </div>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros
                </Button>
              </div>

              {cargando ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Cargando familias...</span>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button onClick={cargarFamilias}>Reintentar</Button>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {familiasFiltradas.map((familia) => (
                    <Card key={familia.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg flex items-center">
                              <HomeIcon className="mr-2 h-5 w-5" />
                              {familia.nombre || `Familia ${familia.apellido}`}
                            </CardTitle>
                            <CardDescription>
                              {familia.estado === "Activa"
                                ? "Familia activa"
                                : "Familia inactiva"}
                            </CardDescription>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant={
                                familia.estado === "Activa"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {familia.estado}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(`/familias/${familia.id}`)
                                  }
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver Detalles
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(
                                      `/familias/${familia.id}/editar`
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
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {familia.jefeFamilia && (
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage
                                  src={
                                    familia.jefeFamilia.foto ||
                                    "/placeholder.svg"
                                  }
                                />
                                <AvatarFallback>
                                  {familia.jefeFamilia.nombres
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                  {familia.jefeFamilia.apellidos
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">
                                  Cabeza de Familia
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {familia.jefeFamilia.nombres}{" "}
                                  {familia.jefeFamilia.apellidos}
                                </p>
                              </div>
                            </div>
                          )}

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">
                                Miembros del Hogar
                              </p>
                              <div className="flex items-center space-x-1">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                  {familia.totalMiembros}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              {familia.miembros
                                .slice(0, 3)
                                .map((miembro, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between text-sm"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <span>
                                        {miembro.nombres} {miembro.apellidos}
                                      </span>
                                      {miembro.parentescoFamiliar && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {miembro.parentescoFamiliar}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      {miembro.fechaNacimiento && (
                                        <span className="text-xs text-muted-foreground">
                                          {calcularEdad(
                                            miembro.fechaNacimiento
                                          )}{" "}
                                          años
                                        </span>
                                      )}
                                      {miembro.estado === "Activo" && (
                                        <Badge
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          Miembro
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              {familia.miembros.length > 3 && (
                                <p className="text-xs text-muted-foreground">
                                  +{familia.totalMiembros - 3} miembros más
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="pt-2 border-t">
                            <div className="flex items-center justify-between">
                              <div className="text-sm">
                                <span className="text-muted-foreground">
                                  Miembros activos:{" "}
                                </span>
                                <span className="font-medium">
                                  {familia.miembrosActivos}/
                                  {familia.totalMiembros}
                                </span>
                              </div>
                              <Button size="sm" variant="outline">
                                Ver Árbol
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {!cargando && familiasFiltradas.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {filtroTexto
                      ? "No se encontraron familias que coincidan con tu búsqueda"
                      : "No hay familias registradas"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
