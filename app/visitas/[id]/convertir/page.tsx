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

interface VisitaDetalle {
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
  estado?: string;
  foto?: string;
  notasAdicionales?: string;
  fechaPrimeraVisita?: string;
  historialVisitas: Array<{
    id: number;
    fecha: string;
  }>;
  miembroConvertido?: {
    id: number;
    nombres: string;
    apellidos: string;
  };
}

export default function ConvertirVisitaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [visita, setVisita] = useState<VisitaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchVisita = async () => {
      try {
        const response = await fetch(`/api/visitas/${id}`);
        if (!response.ok) {
          throw new Error("Error al obtener los datos de la visita");
        }
        const data = await response.json();
        setVisita(data);
      } catch (error) {
        console.error("Error:", error);
        setError("Error al cargar los datos de la visita");
      } finally {
        setLoading(false);
      }
    };

    fetchVisita();
  }, [id]);

  const handleConvertir = async () => {
    if (!visita) return;

    setIsConverting(true);
    try {
      const response = await fetch(`/api/visitas/${id}/convertir`, {
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

      // Redirigir al perfil del nuevo miembro
      router.push(`/miembros/${data.miembro.id}?converted=true`);
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
    if (!visita) return "Cargando...";
    return `${visita.nombres} ${visita.apellidos}`;
  };

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando información de la visita...</span>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (error || !visita) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <p className="text-destructive text-lg">
                {error || "Visita no encontrada"}
              </p>
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

  // Si ya es miembro, mostrar mensaje
  if (visita.miembroConvertido) {
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
                    <BreadcrumbPage>Convertir a Miembro</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="px-4">
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
                    Esta visita ya ha sido convertida en miembro de la iglesia
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-medium">
                      {visita.miembroConvertido.nombres}{" "}
                      {visita.miembroConvertido.apellidos}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Miembro ID: {visita.miembroConvertido.id}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => router.push(`/visitas/${id}`)}
                    >
                      Ver Visita
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() =>
                        router.push(`/miembros/${visita.miembroConvertido!.id}`)
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
                  <BreadcrumbPage>Convertir a Miembro</BreadcrumbPage>
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
          </div>

          <div className="max-w-4xl mx-auto w-full space-y-6">
            {/* Información de Confirmación */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                    <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle>Convertir Visita a Miembro</CardTitle>
                    <CardDescription>
                      Revisa los datos antes de proceder con la conversión
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Información de la Visita */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Datos Personales */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Datos que se transferirán
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Nombres
                      </label>
                      <p className="font-medium">{visita.nombres}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Apellidos
                      </label>
                      <p className="font-medium">{visita.apellidos}</p>
                    </div>
                    {visita.correo && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Correo
                        </label>
                        <p className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {visita.correo}
                        </p>
                      </div>
                    )}
                    {visita.telefono && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Teléfono
                        </label>
                        <p className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {visita.telefono}
                        </p>
                      </div>
                    )}
                    {visita.celular && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Celular
                        </label>
                        <p className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {visita.celular}
                        </p>
                      </div>
                    )}
                    {visita.direccion && (
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          Dirección
                        </label>
                        <p className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {visita.direccion}
                        </p>
                      </div>
                    )}
                    {visita.fechaNacimiento && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Fecha de Nacimiento
                        </label>
                        <p className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {formatDate(visita.fechaNacimiento)}
                        </p>
                      </div>
                    )}
                    {visita.sexo && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Sexo
                        </label>
                        <p>{visita.sexo}</p>
                      </div>
                    )}
                    {visita.estadoCivil && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Estado Civil
                        </label>
                        <p>{visita.estadoCivil}</p>
                      </div>
                    )}
                    {visita.ocupacion && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Ocupación
                        </label>
                        <p>{visita.ocupacion}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Resumen */}
              <div className="space-y-6">
                {/* Foto y Estado */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      <MiembroAvatar
                        foto={visita.foto}
                        nombre={getNombreCompleto()}
                        size="xl"
                        className="mx-auto"
                      />
                      <div>
                        <h3 className="font-semibold">{getNombreCompleto()}</h3>
                        <Badge variant="outline" className="mt-1">
                          {visita.estado || "Activa"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Estadísticas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Historial</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Total de visitas:
                      </span>
                      <span className="font-medium">
                        {visita.historialVisitas.length}
                      </span>
                    </div>
                    {visita.fechaPrimeraVisita && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Primera visita:
                        </span>
                        <span className="font-medium">
                          {formatDate(visita.fechaPrimeraVisita)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Información Importante */}
                <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
                      <AlertTriangle className="h-5 w-5" />
                      Información Importante
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-amber-700 dark:text-amber-300 space-y-2">
                    <p>
                      • Esta acción convertirá la visita en un miembro activo
                    </p>
                    <p>• Los datos se transferirán automáticamente</p>
                    <p>• Se establecerá el estado como &quot;Nuevo&quot;</p>
                    <p>• Esta acción no se puede deshacer</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Botón de Conversión */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/visitas/${id}`)}
                    disabled={isConverting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => setDialogOpen(true)}
                    disabled={isConverting}
                    className="min-w-[200px]"
                  >
                    {isConverting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Convirtiendo...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Convertir a Miembro
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dialog de Confirmación */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Conversión</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas convertir a{" "}
                <strong>{getNombreCompleto()}</strong> en miembro de la iglesia?
                <br />
                <br />
                Esta acción:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Creará un nuevo registro de miembro</li>
                  <li>Marcará la visita como &quot;Convertido&quot;</li>
                  <li>Transferirá todos los datos disponibles</li>
                  <li>No se puede deshacer</li>
                </ul>
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
                  "Confirmar Conversión"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
