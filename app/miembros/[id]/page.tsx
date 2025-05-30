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
import {
  ArrowLeft,
  Edit,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Users,
  Heart,
  UserPlus,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { MiembroAvatar } from "../../../components/MiembroAvatar";
import { ModeToggle } from "../../../components/mode-toggle";

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
}

interface FamiliarRelacion {
  id: number;
  familiar: {
    id: number;
    nombres: string;
    apellidos: string;
    foto?: string;
  };
  tipoRelacion: string;
}

interface VisitaInvitada {
  id: number;
  nombres: string;
  apellidos: string;
  foto?: string;
  fechaPrimeraVisita?: string;
  estado?: string;
  totalVisitas: number;
}

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
  createdAt: string;
  updatedAt: string;
  ministerios: Ministerio[];
  familiares: FamiliarRelacion[];
  visitasInvitadas: VisitaInvitada[];
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

  const getNombreCompleto = () => {
    if (!miembro) return "Cargando...";
    return `${miembro.nombres} ${miembro.apellidos}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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

  const calcularAnosEnIglesia = (fechaIngreso?: string) => {
    if (!fechaIngreso) return null;
    const hoy = new Date();
    const ingreso = new Date(fechaIngreso);
    let anos = hoy.getFullYear() - ingreso.getFullYear();
    const mes = hoy.getMonth() - ingreso.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < ingreso.getDate())) {
      anos--;
    }
    return anos;
  };

  const getBadgeVariant = (estado?: string) => {
    switch (estado) {
      case "Activo":
        return "default";
      case "Inactivo":
        return "outline";
      case "Transferido":
        return "secondary";
      default:
        return "default";
    }
  };

  const getRelacionColor = (relacion: string) => {
    switch (relacion.toLowerCase()) {
      case "esposo/a":
      case "cónyuge":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      case "hijo/a":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "padre":
      case "madre":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "hermano/a":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando información del miembro...</span>
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
              <p className="text-destructive text-lg">
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
                  <BreadcrumbPage>{getNombreCompleto()}</BreadcrumbPage>
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/miembros/${id}/ministerios`)}
              >
                <Users className="mr-2 h-4 w-4" />
                Ministerios
              </Button>
              <Button onClick={() => router.push(`/miembros/${id}/editar`)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Columna principal - Información personal */}
            <div className="md:col-span-2 space-y-6">
              {/* Información Personal */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Información Personal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Nombres
                      </label>
                      <p className="text-lg font-medium">{miembro.nombres}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Apellidos
                      </label>
                      <p className="text-lg font-medium">{miembro.apellidos}</p>
                    </div>
                    {miembro.fechaNacimiento && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Fecha de Nacimiento
                        </label>
                        <p>
                          {formatDate(miembro.fechaNacimiento)}
                          {calcularEdad(miembro.fechaNacimiento) && (
                            <span className="text-muted-foreground ml-2">
                              ({calcularEdad(miembro.fechaNacimiento)} años)
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                    {miembro.sexo && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Sexo
                        </label>
                        <p>{miembro.sexo}</p>
                      </div>
                    )}
                    {miembro.estadoCivil && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Estado Civil
                        </label>
                        <p>{miembro.estadoCivil}</p>
                      </div>
                    )}
                    {miembro.ocupacion && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Ocupación
                        </label>
                        <p className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          {miembro.ocupacion}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Información de Contacto */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Información de Contacto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {miembro.correo && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Correo Electrónico
                        </label>
                        <p className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {miembro.correo}
                        </p>
                      </div>
                    )}
                    {miembro.telefono && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Teléfono
                        </label>
                        <p className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {miembro.telefono}
                        </p>
                      </div>
                    )}
                    {miembro.celular && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Celular
                        </label>
                        <p className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {miembro.celular}
                        </p>
                      </div>
                    )}
                    {miembro.direccion && (
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          Dirección
                        </label>
                        <p className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {miembro.direccion}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Ministerios y Roles */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Ministerios Activos
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/miembros/${id}/ministerios`)}
                    >
                      Ver Todos
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {miembro.ministerios && miembro.ministerios.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No participa en ministerios actualmente
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {miembro.ministerios?.slice(0, 3).map((ministerioRel) => (
                        <div
                          key={ministerioRel.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">
                              {ministerioRel.ministerio.nombre}
                            </p>
                            {ministerioRel.rol && (
                              <p className="text-sm text-muted-foreground">
                                {ministerioRel.rol}
                              </p>
                            )}
                            {ministerioRel.fechaInicio && (
                              <p className="text-xs text-muted-foreground">
                                Desde: {formatDate(ministerioRel.fechaInicio)}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline">Activo</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Núcleo Familiar */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5" />
                      Núcleo Familiar
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/miembros/${id}/familia`)}
                    >
                      Gestionar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {miembro.familiares && miembro.familiares.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No hay familiares registrados
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {miembro.familiares?.slice(0, 4).map((familiarRel) => (
                        <div
                          key={familiarRel.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/80 transition-colors cursor-pointer"
                          onClick={() =>
                            router.push(`/miembros/${familiarRel.familiar.id}`)
                          }
                        >
                          <div className="flex items-center gap-3">
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
                              <span
                                className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getRelacionColor(
                                  familiarRel.tipoRelacion
                                )}`}
                              >
                                {familiarRel.tipoRelacion}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Visitas Invitadas */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5" />
                      Visitas Invitadas
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/visitas?invitadoPor=${id}`)}
                    >
                      Ver Todas
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {miembro.visitasInvitadas &&
                  miembro.visitasInvitadas.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No ha invitado visitas registradas
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {miembro.visitasInvitadas?.slice(0, 4).map((visita) => (
                        <div
                          key={visita.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/80 transition-colors cursor-pointer"
                          onClick={() => router.push(`/visitas/${visita.id}`)}
                        >
                          <div className="flex items-center gap-3">
                            <MiembroAvatar
                              foto={visita.foto}
                              nombre={`${visita.nombres} ${visita.apellidos}`}
                              size="sm"
                            />
                            <div>
                              <p className="font-medium">
                                {visita.nombres} {visita.apellidos}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {visita.totalVisitas} visita
                                {visita.totalVisitas !== 1 ? "s" : ""}
                                {visita.fechaPrimeraVisita &&
                                  ` • Desde ${formatDate(
                                    visita.fechaPrimeraVisita
                                  )}`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant={
                                visita.estado === "Activa"
                                  ? "default"
                                  : "outline"
                              }
                            >
                              {visita.estado || "Activa"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notas Adicionales */}
              {miembro.notasAdicionales && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notas Adicionales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {miembro.notasAdicionales}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Columna lateral - Resumen y acciones */}
            <div className="space-y-6">
              {/* Foto y Estado */}
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <MiembroAvatar
                      foto={miembro.foto}
                      nombre={getNombreCompleto()}
                      size="xl"
                      className="mx-auto"
                    />
                    <div>
                      <h2 className="text-xl font-bold">
                        {getNombreCompleto()}
                      </h2>
                      <Badge
                        variant={getBadgeVariant(miembro.estado)}
                        className="mt-2"
                      >
                        {miembro.estado || "Activo"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Información de Familia */}
              {miembro.familia && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Familia
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{miembro.familia}</p>
                  </CardContent>
                </Card>
              )}

              {/* Fechas Importantes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Fechas Importantes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {miembro.fechaIngreso && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ingreso:</span>
                      <div className="text-right">
                        <span className="font-medium">
                          {formatDate(miembro.fechaIngreso)}
                        </span>
                        {calcularAnosEnIglesia(miembro.fechaIngreso) !==
                          null && (
                          <p className="text-xs text-muted-foreground">
                            {calcularAnosEnIglesia(miembro.fechaIngreso)} año
                            {calcularAnosEnIglesia(miembro.fechaIngreso) !== 1
                              ? "s"
                              : ""}{" "}
                            en la iglesia
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {miembro.fechaBautismo && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bautismo:</span>
                      <span className="font-medium">
                        {formatDate(miembro.fechaBautismo)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Registrado:</span>
                    <span className="font-medium">
                      {formatDate(miembro.createdAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Estadísticas */}
              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Ministerios activos:
                    </span>
                    <span className="font-medium">
                      {miembro.ministerios?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Familiares:</span>
                    <span className="font-medium">
                      {miembro.familiares?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Visitas invitadas:
                    </span>
                    <span className="font-medium">
                      {miembro.visitasInvitadas?.length || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Acciones Rápidas */}
              <Card>
                <CardHeader>
                  <CardTitle>Acciones Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() =>
                      router.push(`/miembros/${id}/ministerios/nuevo`)
                    }
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Asignar Ministerio
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() =>
                      router.push(`/miembros/${id}/familia/agregar`)
                    }
                  >
                    <Heart className="mr-2 h-4 w-4" />
                    Agregar Familiar
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() =>
                      router.push(`/visitas/nueva?invitadoPor=${id}`)
                    }
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Registrar Visita
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
