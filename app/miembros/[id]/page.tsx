"use client";

import { use, useEffect, useState } from "react";
import { AppSidebar } from "../../../components/app-sidebar";
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
import { Edit, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { MiembroAvatar } from "../../../components/MiembroAvatar";

interface MiembroDetalle {
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
  fechaIngreso?: string;
  fechaBautismo?: string;
  estado?: string;
  foto?: string;
  notasAdicionales?: string;
  ministerios: Array<{
    ministerio: {
      nombre: string;
    };
  }>;
}

export default function MiembroDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [miembro, setMiembro] = useState<MiembroDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMiembro = async () => {
      try {
        const response = await fetch(`/api/miembros/${id}`);
        if (!response.ok) {
          throw new Error("Error al obtener los datos del miembro");
        }
        const data = await response.json();
        setMiembro(data);
      } catch (error) {
        console.error("Error:", error);
        setError("Error al cargar los datos del miembro");
      } finally {
        setLoading(false);
      }
    };

    fetchMiembro();
  }, [id]);

  const formatFecha = (fecha?: string) => {
    if (!fecha) return "No especificada";
    return new Date(fecha).toLocaleDateString("es-ES");
  };

  const getNombreCompleto = (miembro: MiembroDetalle) => {
    return `${miembro.nombres} ${miembro.apellidos}`;
  };

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4">Cargando información del miembro...</p>
            </div>
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
              <p className="text-red-500 text-lg">
                {error || "Miembro no encontrado"}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push("/miembros")}
              >
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
                  <BreadcrumbLink href="/miembros">Miembros</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{getNombreCompleto(miembro)}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <Button
              onClick={() => router.push(`/miembros/${miembro.id}/editar`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar Miembro
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Datos Personales</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center text-center">
                <MiembroAvatar
                  foto={miembro.foto}
                  nombre={getNombreCompleto(miembro)}
                  size="xl"
                  className="mb-4"
                />
                <h2 className="text-2xl font-bold mb-2">
                  {getNombreCompleto(miembro)}
                </h2>
                <Badge
                  className="mb-4"
                  variant={
                    miembro.estado === "Activo" ? "default" : "secondary"
                  }
                >
                  {miembro.estado || "No especificado"}
                </Badge>
                <div className="grid grid-cols-2 gap-4 text-sm w-full">
                  <div className="text-right text-muted-foreground">
                    Fecha de Nacimiento:
                  </div>
                  <div className="text-left">
                    {formatFecha(miembro.fechaNacimiento)}
                  </div>
                  <div className="text-right text-muted-foreground">Sexo:</div>
                  <div className="text-left">
                    {miembro.sexo || "No especificado"}
                  </div>
                  <div className="text-right text-muted-foreground">
                    Estado Civil:
                  </div>
                  <div className="text-left">
                    {miembro.estadoCivil || "No especificado"}
                  </div>
                  <div className="text-right text-muted-foreground">
                    Ocupación:
                  </div>
                  <div className="text-left">
                    {miembro.ocupacion || "No especificada"}
                  </div>
                  <div className="text-right text-muted-foreground">
                    Familia:
                  </div>
                  <div className="text-left">
                    {miembro.familia || "No especificada"}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Datos de Contacto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Email
                    </h3>
                    <p>{miembro.correo || "No especificado"}</p>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Teléfono Fijo
                      </h3>
                      <p>{miembro.telefono || "No especificado"}</p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Teléfono Celular
                      </h3>
                      <p>{miembro.celular || "No especificado"}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Dirección
                    </h3>
                    <p>{miembro.direccion || "No especificada"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 lg:col-span-1">
              <CardHeader>
                <CardTitle>Datos Ministeriales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Ministerios Activos</h3>
                    <div className="flex flex-wrap gap-2">
                      {miembro.ministerios.length > 0 ? (
                        miembro.ministerios.map((rel, index) => (
                          <Badge key={index} variant="secondary">
                            {rel.ministerio.nombre}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No participa en ministerios actualmente
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Fechas Importantes</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-right text-muted-foreground">
                        Ingreso a la Iglesia:
                      </div>
                      <div className="text-left">
                        {formatFecha(miembro.fechaIngreso)}
                      </div>
                      <div className="text-right text-muted-foreground">
                        Fecha de Bautismo:
                      </div>
                      <div className="text-left">
                        {formatFecha(miembro.fechaBautismo)}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Notas Adicionales</h3>
                    <p className="text-sm text-muted-foreground">
                      {miembro.notasAdicionales || "Sin notas adicionales"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
