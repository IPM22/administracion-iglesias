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
  UserPlus,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { MiembroAvatar } from "../../../components/MiembroAvatar";
import { ModeToggle } from "../../../components/mode-toggle";
import { formatDate, calcularEdad } from "@/lib/date-utils";

// Función para formatear teléfonos para mostrar
const formatPhoneForDisplay = (phone: string | null | undefined): string => {
  if (!phone) return "";

  // Remover todo lo que no sea número
  const numbers = phone.replace(/\D/g, "");

  // Si no tiene números, retornar vacío
  if (numbers.length === 0) return "";

  // Aplicar formato XXX-XXX-XXXX
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 6) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  } else {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(
      6,
      10
    )}`;
  }
};

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
  createdAt: string;
  updatedAt: string;
  historialVisitas: HistorialVisita[];
  miembroConvertido?: {
    id: number;
    nombres: string;
    apellidos: string;
  };
}

export default function DetalleVisitaPage({
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

  const getNombreCompleto = () => {
    if (!visita) return "Cargando...";
    return `${visita.nombres} ${visita.apellidos}`;
  };

  const getBadgeVariant = (estado?: string) => {
    switch (estado) {
      case "Activa":
        return "default";
      case "Convertida":
        return "secondary";
      case "Inactiva":
        return "outline";
      default:
        return "default";
    }
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
                onClick={() => router.push(`/visitas/${id}/historial`)}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Historial
              </Button>
              <Button onClick={() => router.push(`/visitas/${id}/editar`)}>
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
                      <p className="text-lg font-medium">{visita.nombres}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Apellidos
                      </label>
                      <p className="text-lg font-medium">{visita.apellidos}</p>
                    </div>
                    {visita.fechaNacimiento && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Fecha de Nacimiento
                        </label>
                        <p>
                          {formatDate(visita.fechaNacimiento)}
                          {calcularEdad(visita.fechaNacimiento) && (
                            <span className="text-muted-foreground ml-2">
                              ({calcularEdad(visita.fechaNacimiento)} años)
                            </span>
                          )}
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
                        <p className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          {visita.ocupacion}
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
                    {visita.correo && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Correo Electrónico
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
                          {formatPhoneForDisplay(visita.telefono)}
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
                          {formatPhoneForDisplay(visita.celular)}
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
                  </div>
                </CardContent>
              </Card>

              {/* Historial de Visitas Reciente */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Historial de Visitas Reciente
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/visitas/${id}/historial`)}
                    >
                      Ver Todo
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {visita.historialVisitas.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No hay registros de visitas
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {visita.historialVisitas.slice(0, 5).map((historial) => (
                        <div
                          key={historial.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">
                              {historial.tipoActividad?.nombre ||
                                historial.actividad?.nombre ||
                                "Actividad no especificada"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(historial.fecha)}
                            </p>
                            {historial.invitadoPor && (
                              <p className="text-xs text-muted-foreground">
                                Invitado por: {historial.invitadoPor.nombres}{" "}
                                {historial.invitadoPor.apellidos}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline">
                            {historial.tipoActividad?.tipo || "Especial"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notas Adicionales */}
              {visita.notasAdicionales && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notas Adicionales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {visita.notasAdicionales}
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
                      foto={visita.foto}
                      nombre={getNombreCompleto()}
                      size="xl"
                      className="mx-auto"
                    />
                    <div>
                      <h2 className="text-xl font-bold">
                        {getNombreCompleto()}
                      </h2>
                      <Badge
                        variant={getBadgeVariant(visita.estado)}
                        className="mt-2"
                      >
                        {visita.estado || "Activa"}
                      </Badge>
                    </div>
                    {visita.miembroConvertido && (
                      <div className="p-3 bg-secondary/50 rounded-lg">
                        <div className="flex items-center gap-2 text-secondary-foreground">
                          <UserPlus className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            Convertido en miembro
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {visita.miembroConvertido.nombres}{" "}
                          {visita.miembroConvertido.apellidos}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Información de Familia */}
              {visita.familia && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Familia
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{visita.familia}</p>
                  </CardContent>
                </Card>
              )}

              {/* Estadísticas */}
              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas</CardTitle>
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
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Registrado:</span>
                    <span className="font-medium">
                      {formatDate(visita.createdAt)}
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
                      router.push(`/visitas/${id}/historial/nueva`)
                    }
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Registrar Nueva Visita
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push(`/visitas/${id}/convertir`)}
                    disabled={!!visita.miembroConvertido}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    {visita.miembroConvertido
                      ? "Ya es miembro"
                      : "Convertir a Miembro"}
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
