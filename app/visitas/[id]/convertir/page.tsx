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
  Save,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ModeToggle } from "../../../../components/mode-toggle";
import { MiembroAvatar } from "../../../../components/MiembroAvatar";

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

  const handleConvertir = () => {
    if (!visita) return;

    // Construir parámetros de query con los datos de la visita
    const params = new URLSearchParams();
    if (visita.nombres) params.set("nombres", visita.nombres);
    if (visita.apellidos) params.set("apellidos", visita.apellidos);
    if (visita.correo) params.set("correo", visita.correo);
    if (visita.telefono) params.set("telefono", visita.telefono);
    if (visita.celular) params.set("celular", visita.celular);
    if (visita.direccion) params.set("direccion", visita.direccion);
    if (visita.fechaNacimiento)
      params.set("fechaNacimiento", visita.fechaNacimiento);
    if (visita.sexo) params.set("sexo", visita.sexo);
    if (visita.estadoCivil) params.set("estadoCivil", visita.estadoCivil);
    if (visita.ocupacion) params.set("ocupacion", visita.ocupacion);
    if (visita.familia) params.set("familia", visita.familia);
    if (visita.foto) params.set("foto", visita.foto);
    if (visita.notasAdicionales)
      params.set("notasAdicionales", visita.notasAdicionales);

    // Agregar parámetro especial para indicar que viene de conversión
    params.set("fromVisita", id);

    // Redirigir al formulario de nuevo miembro con datos pre-poblados
    router.push(`/miembros/nuevo?${params.toString()}`);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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
                    <BreadcrumbPage>Convertir</BreadcrumbPage>
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

            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                    <UserCheck className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold mb-2">
                      {getNombreCompleto()} ya es miembro
                    </h2>
                    <p className="text-muted-foreground">
                      Esta visita ya ha sido convertida en miembro de la
                      iglesia.
                    </p>
                    <div className="mt-4">
                      <Badge variant="secondary" className="text-sm">
                        Miembro: {visita.miembroConvertido.nombres}{" "}
                        {visita.miembroConvertido.apellidos}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      onClick={() =>
                        router.push(`/miembros/${visita.miembroConvertido?.id}`)
                      }
                    >
                      Ver Miembro
                    </Button>
                    <Button onClick={() => router.push(`/visitas/${id}`)}>
                      Ver Visita
                    </Button>
                  </div>
                </div>
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

          <div className="grid gap-6 md:grid-cols-3">
            {/* Información de la visita */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Convertir Visita a Miembro
                  </CardTitle>
                  <CardDescription>
                    Convierte a {getNombreCompleto()} de visita a miembro activo
                    de la iglesia
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Información importante */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                          ¿Qué sucederá al convertir esta visita?
                        </h4>
                        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                          <li>
                            • Se creará un nuevo registro de miembro con la
                            información existente
                          </li>
                          <li>
                            • La visita mantendrá su historial de asistencias
                          </li>
                          <li>
                            • Podrás completar información adicional como fecha
                            de bautismo
                          </li>
                          <li>
                            • El estado de la visita cambiará a
                            &ldquo;Convertido&rdquo;
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Requisitos */}
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
                          Requisitos para ser miembro
                        </h4>
                        <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                          <li>• Debe estar bautizado/a</li>
                          <li>• Debe haber asistido regularmente</li>
                          <li>
                            • Debe haber expresado su deseo de ser miembro
                          </li>
                          <li>
                            • Debe estar de acuerdo con la doctrina de la
                            iglesia
                          </li>
                        </ul>
                        <p className="text-xs mt-2 text-amber-700 dark:text-amber-300">
                          Asegúrate de que estos requisitos se cumplan antes de
                          proceder.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Resumen de datos */}
                  <div>
                    <h4 className="font-medium mb-3">
                      Datos que se transferirán:
                    </h4>
                    <div className="grid gap-3 md:grid-cols-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Nombre completo:
                        </span>
                        <span className="font-medium">
                          {getNombreCompleto()}
                        </span>
                      </div>
                      {visita.correo && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Correo:</span>
                          <span>{visita.correo}</span>
                        </div>
                      )}
                      {visita.celular && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Celular:
                          </span>
                          <span>{visita.celular}</span>
                        </div>
                      )}
                      {visita.fechaNacimiento && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Fecha de nacimiento:
                          </span>
                          <span>{formatDate(visita.fechaNacimiento)}</span>
                        </div>
                      )}
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
                          <span>{formatDate(visita.fechaPrimeraVisita)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Botón de acción */}
                  <div className="flex justify-end space-x-4 pt-4 border-t">
                    <Button variant="outline" onClick={() => router.back()}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleConvertir}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <UserCheck className="mr-2 h-4 w-4" />
                      Convertir a Miembro
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Panel lateral con información de la visita */}
            <div className="space-y-6">
              {/* Foto y resumen */}
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
                      <h3 className="font-bold text-lg">
                        {getNombreCompleto()}
                      </h3>
                      <Badge variant="outline" className="mt-2">
                        {visita.estado || "Activa"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Información de contacto */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    Información de Contacto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {visita.correo && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{visita.correo}</span>
                    </div>
                  )}
                  {visita.celular && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{visita.celular}</span>
                    </div>
                  )}
                  {visita.direccion && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs">{visita.direccion}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Estadísticas de visitas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Historial de Visitas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Total de visitas:
                    </span>
                    <span className="font-medium text-primary text-lg">
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
                  {visita.historialVisitas.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Última visita:
                      </span>
                      <span className="font-medium">
                        {formatDate(visita.historialVisitas[0]?.fecha)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
