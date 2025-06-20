"use client";

import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Loader2,
  CheckCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { MiembroAvatar } from "../../../components/MiembroAvatar";
import { ModeToggle } from "../../../components/mode-toggle";
import {
  formatDate,
  calcularEdad,
  calcularAniosTranscurridos,
} from "@/lib/date-utils";
import { useApiConIglesia } from "@/hooks/useApiConIglesia";

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
  esLider?: boolean;
}

interface FamiliarRelacion {
  id: string | number;
  familiar: {
    id: number;
    nombres: string;
    apellidos: string;
    foto?: string;
    estado?: string;
  };
  tipoRelacion: string;
  fuente?: "directa" | "inversa" | "familia";
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
  familia?:
    | string
    | {
        id: number;
        apellido: string;
        nombre?: string;
        direccion?: string;
        telefono?: string;
        correo?: string;
        notas?: string;
        estado?: string;
        createdAt?: string;
        updatedAt?: string;
      };
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
  const searchParams = useSearchParams();
  const { id } = use(params);
  const { iglesiaActiva } = useApiConIglesia();
  const [miembro, setMiembro] = useState<MiembroDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ministeriosDialogOpen, setMinisteriosDialogOpen] = useState(false);
  const [showConvertedMessage, setShowConvertedMessage] = useState(false);

  // Verificar si fue convertido desde una visita
  useEffect(() => {
    if (searchParams.get("converted") === "true") {
      setShowConvertedMessage(true);
      // Remover el parámetro después de 5 segundos
      setTimeout(() => {
        setShowConvertedMessage(false);
      }, 5000);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchMiembro = async () => {
      if (!iglesiaActiva?.id) {
        console.log("🔍 DEBUG - No hay iglesia seleccionada");
        setLoading(false);
        return;
      }

      try {
        console.log(
          `🔄 Cargando detalles del miembro ${id} para iglesia: ${iglesiaActiva?.nombre} (ID: ${iglesiaActiva?.id})`
        );

        // Llamar directamente a la API para evitar bucles infinitos
        const url = new URL(`/api/miembros/${id}`, window.location.origin);
        url.searchParams.set("iglesiaId", iglesiaActiva.id.toString());

        const response = await fetch(url.toString(), {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("✅ Detalles del miembro cargados correctamente");
        console.log("🔍 DEBUG - Datos completos del miembro:", data);
        console.log("🔍 DEBUG - Tipo de familiares:", typeof data.familiares);
        console.log("🔍 DEBUG - Familiares array:", data.familiares);
        if (data.familiares && data.familiares.length > 0) {
          console.log("🔍 DEBUG - Primer familiar:", data.familiares[0]);
          console.log(
            "🔍 DEBUG - Tipo del primer familiar:",
            typeof data.familiares[0]
          );
          console.log(
            "🔍 DEBUG - Keys del primer familiar:",
            Object.keys(data.familiares[0])
          );
        }
        setMiembro(data);
      } catch (error) {
        console.error("Error al cargar miembro:", error);

        // Mostrar mensaje de error más específico
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("Error inesperado al cargar los datos del miembro");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMiembro();
  }, [id, iglesiaActiva?.id, iglesiaActiva?.nombre]);

  const getNombreCompleto = () => {
    if (!miembro) return "Cargando...";
    return `${miembro.nombres} ${miembro.apellidos}`;
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
                onClick={() => setMinisteriosDialogOpen(true)}
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

          {/* Mensaje de conversión exitosa */}
          {showConvertedMessage && (
            <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-green-800 dark:text-green-200">
                      ¡Conversión Exitosa!
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      La visita ha sido convertida exitosamente en miembro de la
                      iglesia.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
                          {formatPhoneForDisplay(miembro.telefono)}
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
                          {formatPhoneForDisplay(miembro.celular)}
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
                      {miembro.ministerios &&
                        miembro.ministerios.length > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {miembro.ministerios.length}
                          </Badge>
                        )}
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
                    <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        No participa en ministerios actualmente
                      </p>
                      <Button
                        variant="outline"
                        onClick={() =>
                          router.push(`/miembros/${id}/ministerios/nuevo`)
                        }
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Asignar Primer Ministerio
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {miembro.ministerios?.slice(0, 3).map((ministerioRel) => (
                        <div
                          key={ministerioRel.id}
                          className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold text-lg text-blue-900 dark:text-blue-100">
                                  {ministerioRel.ministerio.nombre}
                                </h4>
                                {ministerioRel.esLider && (
                                  <Badge
                                    variant="default"
                                    className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
                                  >
                                    Líder
                                  </Badge>
                                )}
                              </div>
                              {ministerioRel.rol && (
                                <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                                  {ministerioRel.rol}
                                </p>
                              )}
                              {ministerioRel.ministerio.descripcion && (
                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                  {ministerioRel.ministerio.descripcion}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-sm">
                                {ministerioRel.fechaInicio && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                      Desde{" "}
                                      {formatDate(ministerioRel.fechaInicio)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <Badge
                              variant="default"
                              className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                            >
                              Activo
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {miembro.ministerios &&
                        miembro.ministerios.length > 3 && (
                          <div className="text-center pt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setMinisteriosDialogOpen(true)}
                              className="text-muted-foreground hover:text-primary"
                            >
                              Ver {miembro.ministerios.length - 3} ministerio
                              {miembro.ministerios.length - 3 !== 1
                                ? "s"
                                : ""}{" "}
                              más
                            </Button>
                          </div>
                        )}
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
                      {miembro.familiares && miembro.familiares.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {miembro.familiares.length}
                        </Badge>
                      )}
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
                    <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
                      <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        No hay familiares registrados
                      </p>
                      <Button
                        variant="outline"
                        onClick={() =>
                          router.push(`/miembros/${id}/familia/agregar`)
                        }
                      >
                        <Heart className="mr-2 h-4 w-4" />
                        Agregar Primer Familiar
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {miembro.familiares
                        ?.slice(0, 4)
                        .map((familiarRel) => {
                          // Validar que familiar.familiar existe y tiene las propiedades correctas
                          if (!familiarRel.familiar) {
                            console.error(
                              "❌ ERROR: familiarRel.familiar es null/undefined"
                            );
                            return null;
                          }

                          if (
                            typeof familiarRel.familiar === "object" &&
                            (!familiarRel.familiar.nombres ||
                              !familiarRel.familiar.apellidos)
                          ) {
                            console.error(
                              "❌ ERROR: familiarRel.familiar no tiene nombres/apellidos correctos:",
                              familiarRel.familiar
                            );
                            return null;
                          }

                          return (
                            <div
                              key={familiarRel.id}
                              className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer border"
                              onClick={() =>
                                router.push(
                                  `/miembros/${familiarRel.familiar.id}`
                                )
                              }
                            >
                              <div className="flex items-center gap-3">
                                <MiembroAvatar
                                  foto={familiarRel.familiar.foto}
                                  nombre={`${familiarRel.familiar.nombres} ${familiarRel.familiar.apellidos}`}
                                  size="sm"
                                />
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-gray-100">
                                    {familiarRel.familiar.nombres}{" "}
                                    {familiarRel.familiar.apellidos}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getRelacionColor(
                                        familiarRel.tipoRelacion
                                      )}`}
                                    >
                                      {familiarRel.tipoRelacion}
                                    </span>
                                    {familiarRel.familiar.estado && (
                                      <Badge
                                        variant={
                                          familiarRel.familiar.estado ===
                                          "Activo"
                                            ? "default"
                                            : "outline"
                                        }
                                        className="text-xs"
                                      >
                                        {familiarRel.familiar.estado}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {familiarRel.fuente && (
                                  <span className="text-xs text-muted-foreground px-2 py-1 bg-white/50 rounded">
                                    {familiarRel.fuente === "directa"
                                      ? "Directo"
                                      : familiarRel.fuente === "inversa"
                                      ? "Referencia"
                                      : "Familia"}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                        .filter(Boolean)}
                      {miembro.familiares && miembro.familiares.length > 4 && (
                        <div className="text-center pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(`/miembros/${id}/familia`)
                            }
                            className="text-muted-foreground hover:text-primary"
                          >
                            Ver {miembro.familiares.length - 4} familiar
                            {miembro.familiares.length - 4 !== 1
                              ? "es"
                              : ""}{" "}
                            más
                          </Button>
                        </div>
                      )}
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
                    <p className="font-medium">
                      {typeof miembro.familia === "string"
                        ? miembro.familia
                        : miembro.familia.nombre ||
                          `Familia ${miembro.familia.apellido}`}
                    </p>
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
                  {miembro.fechaNacimiento && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nacimiento:</span>
                      <div className="text-right">
                        <span className="font-medium">
                          {formatDate(miembro.fechaNacimiento)}
                        </span>
                        {calcularEdad(miembro.fechaNacimiento) && (
                          <p className="text-xs text-muted-foreground">
                            {calcularEdad(miembro.fechaNacimiento)} años
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {miembro.fechaIngreso && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {miembro.fechaBautismo &&
                        formatDate(miembro.fechaIngreso) ===
                          formatDate(miembro.fechaBautismo)
                          ? "Bautismo:"
                          : "Ingreso:"}
                      </span>
                      <div className="text-right">
                        <span className="font-medium">
                          {formatDate(miembro.fechaIngreso)}
                        </span>
                        {calcularAniosTranscurridos(miembro.fechaIngreso) !==
                          null && (
                          <p className="text-xs text-muted-foreground">
                            {calcularAniosTranscurridos(miembro.fechaIngreso)}{" "}
                            año
                            {calcularAniosTranscurridos(
                              miembro.fechaIngreso
                            ) !== 1
                              ? "s"
                              : ""}{" "}
                            {miembro.fechaBautismo &&
                            formatDate(miembro.fechaIngreso) ===
                              formatDate(miembro.fechaBautismo)
                              ? "desde el bautismo"
                              : "en la iglesia"}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {miembro.fechaBautismo &&
                    (!miembro.fechaIngreso ||
                      formatDate(miembro.fechaIngreso) !==
                        formatDate(miembro.fechaBautismo)) && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bautismo:</span>
                        <div className="text-right">
                          <span className="font-medium">
                            {formatDate(miembro.fechaBautismo)}
                          </span>
                          {calcularAniosTranscurridos(miembro.fechaBautismo) !==
                            null && (
                            <p className="text-xs text-muted-foreground">
                              {calcularAniosTranscurridos(
                                miembro.fechaBautismo
                              )}{" "}
                              año
                              {calcularAniosTranscurridos(
                                miembro.fechaBautismo
                              ) !== 1
                                ? "s"
                                : ""}{" "}
                              desde el bautismo
                            </p>
                          )}
                        </div>
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

        {/* Dialog de Ministerios */}
        <Dialog
          open={ministeriosDialogOpen}
          onOpenChange={setMinisteriosDialogOpen}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Ministerios de {miembro.nombres} {miembro.apellidos}
              </DialogTitle>
              <DialogDescription>
                Lista completa de ministerios en los que participa el miembro
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {miembro.ministerios && miembro.ministerios.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No participa en ministerios actualmente
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => {
                      setMinisteriosDialogOpen(false);
                      router.push(`/miembros/${id}/ministerios/nuevo`);
                    }}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Asignar Primer Ministerio
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3">
                  {miembro.ministerios?.map((ministerioRel) => (
                    <Card key={ministerioRel.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">
                              {ministerioRel.ministerio.nombre}
                            </h4>
                            {ministerioRel.rol && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {ministerioRel.rol}
                              </p>
                            )}
                            {ministerioRel.ministerio.descripcion && (
                              <p className="text-sm text-muted-foreground mb-3">
                                {ministerioRel.ministerio.descripcion}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-sm">
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
                          </div>
                          <Badge
                            variant={
                              ministerioRel.fechaFin ? "outline" : "default"
                            }
                            className={
                              ministerioRel.fechaFin
                                ? "text-gray-600"
                                : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                            }
                          >
                            {ministerioRel.fechaFin ? "Finalizado" : "Activo"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setMinisteriosDialogOpen(false)}
              >
                Cerrar
              </Button>
              <Button
                onClick={() => {
                  setMinisteriosDialogOpen(false);
                  router.push(`/miembros/${id}/ministerios`);
                }}
              >
                Ver Todos los Ministerios
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
