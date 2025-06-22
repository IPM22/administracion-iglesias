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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  UserCheck,
  AlertTriangle,
  Info,
  Calendar,
  Mail,
  Phone,
  MapPin,
  UserPlus,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ModeToggle } from "../../../../components/mode-toggle";
import { MiembroAvatar } from "../../../../components/MiembroAvatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/date-utils";

interface PersonaDetalle {
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
  familia?: {
    id: number;
    apellido: string;
    nombre?: string;
  };
  estado?: string;
  foto?: string;
  notas?: string;
  rol: "MIEMBRO" | "VISITA" | "INVITADO";
  fechaPrimeraVisita?: string;
  historialVisitas?: Array<{
    id: number;
    fecha: string;
  }>;
  personaConvertida?: {
    id: number;
    nombres: string;
    apellidos: string;
  };
}

export default function ConvertirPersonaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [persona, setPersona] = useState<PersonaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchPersona = async () => {
      try {
        const response = await fetch(`/api/personas/${id}`);
        if (!response.ok) {
          throw new Error("Error al obtener los datos de la persona");
        }
        const data = await response.json();
        setPersona(data.persona);
      } catch (error) {
        console.error("Error:", error);
        setError("Error al cargar los datos de la persona");
      } finally {
        setLoading(false);
      }
    };

    fetchPersona();
  }, [id]);

  const handleConvertir = async () => {
    if (!persona) return;

    setIsConverting(true);
    try {
      const response = await fetch(`/api/personas/${id}/convertir`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al convertir la visita");
      }

      const data = await response.json();

      // Redirigir al perfil del nuevo miembro en la vista de comunidad
      router.push(`/comunidad/${data.miembro.id}?converted=true`);
    } catch (error) {
      console.error("Error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Error al convertir la visita en miembro"
      );
    } finally {
      setIsConverting(false);
      setDialogOpen(false);
    }
  };

  const getNombreCompleto = () => {
    if (!persona) return "Cargando...";
    return `${persona.nombres} ${persona.apellidos}`;
  };

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando información de la persona...</span>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (error || !persona) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <p className="text-destructive text-lg">
                {error || "Persona no encontrada"}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push("/comunidad")}
              >
                Volver a Comunidad
              </Button>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Verificar que sea una visita
  if (persona.rol !== "VISITA") {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <p className="text-destructive text-lg">
                Esta persona no es una visita
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push(`/comunidad/${id}`)}
              >
                Volver al Perfil
              </Button>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Si ya es miembro, mostrar mensaje
  if (persona.personaConvertida) {
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
                    <BreadcrumbLink href="/comunidad">Comunidad</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href={`/comunidad/${id}`}>
                      {getNombreCompleto()}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Convertir a Miembro</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="ml-auto px-3">
              <ModeToggle />
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-center h-full">
              <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                    <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle className="text-xl">Ya es Miembro</CardTitle>
                  <CardDescription>
                    Esta persona ya ha sido convertida en miembro de la iglesia
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-medium">
                      {persona.personaConvertida.nombres}{" "}
                      {persona.personaConvertida.apellidos}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Miembro ID: {persona.personaConvertida.id}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => router.push(`/comunidad/${id}`)}
                    >
                      Ver Perfil Original
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() =>
                        router.push(
                          `/comunidad/${persona.personaConvertida!.id}`
                        )
                      }
                    >
                      Ver Miembro
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
                  <BreadcrumbLink href="/comunidad">Comunidad</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href={`/comunidad/${id}`}>
                    {getNombreCompleto()}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Convertir a Miembro</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto px-3">
            <ModeToggle />
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Botón de volver */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/comunidad/${id}`)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Perfil
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Información de la persona */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Convertir Visita a Miembro
                </CardTitle>
                <CardDescription>
                  Revisar información antes de convertir a{" "}
                  <strong>{getNombreCompleto()}</strong> en miembro de la
                  iglesia
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Avatar y nombre */}
                <div className="flex items-center gap-3">
                  <MiembroAvatar
                    foto={persona.foto}
                    nombre={getNombreCompleto()}
                    size="lg"
                  />
                  <div>
                    <h3 className="font-semibold text-lg">
                      {getNombreCompleto()}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {persona.rol}
                    </Badge>
                  </div>
                </div>

                {/* Información básica */}
                <div className="space-y-3">
                  {persona.correo && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{persona.correo}</span>
                    </div>
                  )}
                  {(persona.telefono || persona.celular) && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {persona.celular || persona.telefono}
                      </span>
                    </div>
                  )}
                  {persona.direccion && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{persona.direccion}</span>
                    </div>
                  )}
                  {persona.fechaPrimeraVisita && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Primera visita: {formatDate(persona.fechaPrimeraVisita)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Información adicional */}
                {persona.familia && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Familia
                    </h4>
                    <p className="text-sm">{persona.familia.apellido}</p>
                    {persona.familia.nombre && (
                      <p className="text-xs text-muted-foreground">
                        {persona.familia.nombre}
                      </p>
                    )}
                  </div>
                )}

                {persona.notas && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Notas
                    </h4>
                    <p className="text-sm">{persona.notas}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Acción de conversión */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Proceso de Conversión
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">
                        ¿Qué sucederá?
                      </h4>
                      <ul className="text-sm text-blue-800 dark:text-blue-200 mt-1 space-y-1">
                        <li>• Se creará un nuevo registro como miembro</li>
                        <li>• Se mantendrá el historial de visitas</li>
                        <li>• Se preservará la información familiar</li>
                        <li>
                          • La persona original quedará marcada como convertida
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-900 dark:text-amber-100">
                        Importante
                      </h4>
                      <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                        Esta acción no se puede deshacer. Una vez convertida, la
                        persona será considerada miembro oficial de la iglesia.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={() => setDialogOpen(true)}
                    className="w-full"
                    size="lg"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Convertir a Miembro
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dialog de confirmación */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Conversión</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas convertir a{" "}
                <strong>{getNombreCompleto()}</strong> en miembro de la iglesia?
                Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isConverting}
              >
                Cancelar
              </Button>
              <Button onClick={handleConvertir} disabled={isConverting}>
                {isConverting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Convirtiendo...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Confirmar Conversión
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
