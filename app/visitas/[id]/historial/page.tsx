"use client";

import { use, useEffect, useState } from "react";
import { AppSidebar } from "../../../../components/app-sidebar";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Calendar, User, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { ModeToggle } from "../../../../components/mode-toggle";

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
}

export default function HistorialVisitaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [historial, setHistorial] = useState<HistorialVisita[]>([]);
  const [visita, setVisita] = useState<Visita | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener información básica de la visita
        const visitaResponse = await fetch(`/api/visitas/${id}`);
        if (!visitaResponse.ok) {
          throw new Error("Error al obtener los datos de la visita");
        }
        const visitaData = await visitaResponse.json();
        setVisita({
          id: visitaData.id,
          nombres: visitaData.nombres,
          apellidos: visitaData.apellidos,
        });

        // Obtener historial completo
        const historialResponse = await fetch(`/api/visitas/${id}/historial`);
        if (!historialResponse.ok) {
          throw new Error("Error al obtener el historial de visitas");
        }
        const historialData = await historialResponse.json();
        setHistorial(historialData);
      } catch (error) {
        console.error("Error:", error);
        setError("Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getNombreCompleto = () => {
    if (!visita) return "Cargando...";
    return `${visita.nombres} ${visita.apellidos}`;
  };

  const getBadgeVariant = (tipo?: string) => {
    switch (tipo) {
      case "Regular":
        return "default";
      case "Especial":
        return "secondary";
      default:
        return "outline";
    }
  };

  // Filtrar historial según búsqueda y filtros
  const historialFiltrado = historial.filter((item) => {
    const coincideBusqueda =
      searchTerm === "" ||
      (item.tipoActividad?.nombre || item.actividad?.nombre || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (item.invitadoPor?.nombres || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (item.invitadoPor?.apellidos || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (item.observaciones || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const coincideTipo =
      filtroTipo === "todos" ||
      (filtroTipo === "regular" && item.tipoActividad?.tipo === "Regular") ||
      (filtroTipo === "especial" &&
        (item.tipoActividad?.tipo === "Especial" || item.actividad));

    return coincideBusqueda && coincideTipo;
  });

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4">Cargando historial...</p>
            </div>
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
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <p className="text-destructive text-lg">{error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push("/visitas")}
              >
                Volver a Visitas
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
                  <BreadcrumbLink href="/visitas">Visitas</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/visitas/${id}`}>
                    {getNombreCompleto()}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Historial</BreadcrumbPage>
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
            <Button
              onClick={() => router.push(`/visitas/${id}/historial/nueva`)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nueva Visita
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Historial de Visitas - {getNombreCompleto()}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Total de visitas registradas: {historial.length}
                  </p>
                </div>
              </div>

              {/* Barra de búsqueda y filtros */}
              <div className="flex gap-4 mt-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por actividad, invitador u observaciones..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={filtroTipo === "todos" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFiltroTipo("todos")}
                  >
                    Todas
                  </Button>
                  <Button
                    variant={filtroTipo === "regular" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFiltroTipo("regular")}
                  >
                    Regulares
                  </Button>
                  <Button
                    variant={filtroTipo === "especial" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFiltroTipo("especial")}
                  >
                    Especiales
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {historialFiltrado.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {historial.length === 0
                      ? "No hay registros de visitas para mostrar"
                      : "No se encontraron visitas que coincidan con los filtros"}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() =>
                      router.push(`/visitas/${id}/historial/nueva`)
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Registrar Primera Visita
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {historialFiltrado.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between p-4 bg-muted/50 rounded-lg border border-border hover:bg-muted/80 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium text-sm">
                              {historial.length - index}
                            </div>
                            <div>
                              <h4 className="font-medium">
                                {item.tipoActividad?.nombre ||
                                  item.actividad?.nombre ||
                                  "Actividad no especificada"}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(item.fecha)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="ml-11 space-y-2">
                          {item.invitadoPor && (
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                Invitado por:
                              </span>
                              <span className="font-medium">
                                {item.invitadoPor.nombres}{" "}
                                {item.invitadoPor.apellidos}
                              </span>
                            </div>
                          )}

                          {item.observaciones && (
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium">
                                Observaciones:
                              </span>{" "}
                              {item.observaciones}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Badge
                          variant={getBadgeVariant(item.tipoActividad?.tipo)}
                        >
                          {item.tipoActividad?.tipo || "Especial"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDateShort(item.fecha)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estadísticas */}
          {historial.length > 0 && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {historial.length}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Total de visitas
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {
                        historial.filter(
                          (h) => h.tipoActividad?.tipo === "Regular"
                        ).length
                      }
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Actividades regulares
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {
                        historial.filter(
                          (h) =>
                            h.tipoActividad?.tipo === "Especial" || h.actividad
                        ).length
                      }
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Actividades especiales
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
