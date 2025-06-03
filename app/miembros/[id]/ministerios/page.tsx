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
import { ArrowLeft, Users, Calendar, Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ModeToggle } from "../../../../components/mode-toggle";

// Interfaces para tipado
interface Ministerio {
  id: number;
  ministerio: {
    id: number;
    nombre: string;
    descripcion?: string;
  };
  rol?: string;
  fechaInicio?: string;
  fechaFin?: string;
  estado?: string;
}

interface MiembroMinisterios {
  id: number;
  nombres: string;
  apellidos: string;
  ministerios: Ministerio[];
}

export default function MiembroMinisteriosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [miembro, setMiembro] = useState<MiembroMinisterios | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMiembroMinisterios = async () => {
      try {
        const response = await fetch(`/api/miembros/${id}`);
        if (!response.ok) {
          throw new Error("Error al obtener los datos del miembro");
        }
        const data = await response.json();
        setMiembro(data);
      } catch (error) {
        console.error("Error:", error);
        setError("Error al cargar los ministerios del miembro");
      } finally {
        setLoading(false);
      }
    };

    fetchMiembroMinisterios();
  }, [id]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getEstadoBadge = (ministerio: Ministerio) => {
    if (ministerio.fechaFin) {
      return (
        <Badge variant="outline" className="text-gray-600">
          Finalizado
        </Badge>
      );
    }
    return (
      <Badge
        variant="default"
        className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      >
        Activo
      </Badge>
    );
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

  if (error || !miembro) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Error</h3>
              <p className="text-muted-foreground">
                {error || "Miembro no encontrado"}
              </p>
              <Button className="mt-4" onClick={() => router.push("/miembros")}>
                Volver a Miembros
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
                  <BreadcrumbLink href="/miembros">Miembros</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/miembros/${id}`}>
                    {miembro.nombres} {miembro.apellidos}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Ministerios</BreadcrumbPage>
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
              onClick={() => router.push(`/miembros/${id}/ministerios/nuevo`)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Asignar Ministerio
            </Button>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Ministerios de {miembro.nombres} {miembro.apellidos}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {miembro.ministerios.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No participa en ministerios actualmente
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() =>
                        router.push(`/miembros/${id}/ministerios/nuevo`)
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Asignar Primer Ministerio
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {miembro.ministerios.map((ministerioRel) => (
                      <Card key={ministerioRel.id} className="relative">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg">
                              {ministerioRel.ministerio.nombre}
                            </CardTitle>
                            {getEstadoBadge(ministerioRel)}
                          </div>
                          {ministerioRel.rol && (
                            <p className="text-sm text-muted-foreground">
                              {ministerioRel.rol}
                            </p>
                          )}
                        </CardHeader>
                        <CardContent>
                          {ministerioRel.ministerio.descripcion && (
                            <p className="text-sm text-muted-foreground mb-3">
                              {ministerioRel.ministerio.descripcion}
                            </p>
                          )}
                          <div className="space-y-2 text-sm">
                            {ministerioRel.fechaInicio && (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  Inicio:
                                </span>
                                <span>
                                  {formatDate(ministerioRel.fechaInicio)}
                                </span>
                              </div>
                            )}
                            {ministerioRel.fechaFin && (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  Fin:
                                </span>
                                <span>
                                  {formatDate(ministerioRel.fechaFin)}
                                </span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
