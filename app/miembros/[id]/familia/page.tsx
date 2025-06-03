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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Heart,
  Plus,
  ChevronRight,
  Loader2,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ModeToggle } from "../../../../components/mode-toggle";
import { MiembroAvatar } from "../../../../components/MiembroAvatar";

// Interfaces para tipado
interface FamiliarRelacion {
  id: number;
  familiar: {
    id: number;
    nombres: string;
    apellidos: string;
    foto?: string;
    fechaNacimiento?: string;
    estado?: string;
  };
  tipoRelacion: string;
}

interface MiembroFamilia {
  id: number;
  nombres: string;
  apellidos: string;
  familia?: string;
  familiares: FamiliarRelacion[];
}

export default function MiembroFamiliaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [miembro, setMiembro] = useState<MiembroFamilia | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogEliminar, setDialogEliminar] = useState(false);
  const [relacionAEliminar, setRelacionAEliminar] =
    useState<FamiliarRelacion | null>(null);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    const fetchMiembroFamilia = async () => {
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

    fetchMiembroFamilia();
  }, [id]);

  const getRelacionColor = (relacion: string) => {
    switch (relacion) {
      case "Esposo/a":
      case "Cónyuge":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400";
      case "Hijo/a":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "Padre":
      case "Madre":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "Hermano/a":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const calcularEdad = (fechaNacimiento?: string) => {
    if (!fechaNacimiento) return null;
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const agruparPorRelacion = (familiares: FamiliarRelacion[]) => {
    const grupos: { [key: string]: FamiliarRelacion[] } = {};
    familiares.forEach((familiar) => {
      if (!grupos[familiar.tipoRelacion]) {
        grupos[familiar.tipoRelacion] = [];
      }
      grupos[familiar.tipoRelacion].push(familiar);
    });
    return grupos;
  };

  const abrirDialogEliminar = (relacion: FamiliarRelacion) => {
    setRelacionAEliminar(relacion);
    setDialogEliminar(true);
  };

  const eliminarRelacion = async () => {
    if (!relacionAEliminar) return;

    setEliminando(true);
    try {
      const response = await fetch(
        `/api/miembros/${id}/familiares/${relacionAEliminar.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Error al eliminar la relación familiar"
        );
      }

      // Recargar los datos del miembro
      const miembroResponse = await fetch(`/api/miembros/${id}`);
      if (miembroResponse.ok) {
        const miembroData = await miembroResponse.json();
        setMiembro(miembroData);
      }

      setDialogEliminar(false);
      setRelacionAEliminar(null);
    } catch (error) {
      console.error("Error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Error al eliminar la relación familiar"
      );
    } finally {
      setEliminando(false);
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando familia...</span>
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

  const gruposFamilia = agruparPorRelacion(miembro.familiares);

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
                  <BreadcrumbPage>Familia</BreadcrumbPage>
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
              onClick={() => router.push(`/miembros/${id}/familia/agregar`)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar Familiar
            </Button>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Núcleo Familiar de {miembro.nombres} {miembro.apellidos}
                </CardTitle>
                {miembro.familia && (
                  <p className="text-sm text-muted-foreground">
                    Familia: {miembro.familia}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {miembro.familiares.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No hay familiares registrados
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() =>
                        router.push(`/miembros/${id}/familia/agregar`)
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Primer Familiar
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(gruposFamilia).map(
                      ([relacion, familiares]) => (
                        <div key={relacion}>
                          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <Badge
                              className={`${getRelacionColor(
                                relacion
                              )} font-medium`}
                            >
                              {relacion}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              ({familiares.length})
                            </span>
                          </h3>
                          <div className="grid gap-3 md:grid-cols-2">
                            {familiares.map((familiarRel) => (
                              <Card
                                key={familiarRel.id}
                                className="hover:shadow-md transition-shadow"
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div
                                      className="flex items-center gap-3 cursor-pointer flex-1"
                                      onClick={() =>
                                        router.push(
                                          `/miembros/${familiarRel.familiar.id}`
                                        )
                                      }
                                    >
                                      <MiembroAvatar
                                        foto={familiarRel.familiar.foto}
                                        nombre={`${familiarRel.familiar.nombres} ${familiarRel.familiar.apellidos}`}
                                        size="sm"
                                      />
                                      <div>
                                        <p className="font-medium">
                                          {familiarRel.familiar.nombres}{" "}
                                          {familiarRel.familiar.apellidos}
                                        </p>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                          {familiarRel.familiar
                                            .fechaNacimiento && (
                                            <span>
                                              {calcularEdad(
                                                familiarRel.familiar
                                                  .fechaNacimiento
                                              )}{" "}
                                              años
                                            </span>
                                          )}
                                          {familiarRel.familiar.estado && (
                                            <>
                                              <span>•</span>
                                              <Badge
                                                variant={
                                                  familiarRel.familiar
                                                    .estado === "Activo"
                                                    ? "default"
                                                    : "outline"
                                                }
                                                className="text-xs"
                                              >
                                                {familiarRel.familiar.estado}
                                              </Badge>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              abrirDialogEliminar(familiarRel);
                                            }}
                                            className="text-red-600"
                                          >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Quitar Relación
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dialog de confirmación para eliminar relación */}
        <Dialog open={dialogEliminar} onOpenChange={setDialogEliminar}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Eliminación de Relación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar la relación familiar con{" "}
                <strong>
                  {relacionAEliminar?.familiar.nombres}{" "}
                  {relacionAEliminar?.familiar.apellidos}
                </strong>
                ?
                <br />
                <br />
                Esta acción eliminará la relación de &quot;
                {relacionAEliminar?.tipoRelacion}&quot; pero no removerá a la
                persona del núcleo familiar. La acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogEliminar(false)}
                disabled={eliminando}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={eliminarRelacion}
                disabled={eliminando}
              >
                {eliminando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  "Eliminar Relación"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
