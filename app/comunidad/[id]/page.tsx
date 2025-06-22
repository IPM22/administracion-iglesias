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
  ArrowLeft,
  Edit,
  Calendar,
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

// Importar componentes modulares
import { InformacionPersonal } from "../../../components/persona-detalle/InformacionPersonal";
import { InformacionContacto } from "../../../components/persona-detalle/InformacionContacto";
import { FotoYEstado } from "../../../components/persona-detalle/FotoYEstado";
import { MinisteriosSection } from "../../../components/persona-detalle/MinisteriosSection";
import { HistorialVisitasSection } from "../../../components/persona-detalle/HistorialVisitasSection";
import { AccionesRapidas } from "../../../components/persona-detalle/AccionesRapidas";

// Función para formatear teléfonos para mostrar
const formatPhoneForDisplay = (phone: string | null | undefined): string => {
  if (!phone) return "";
  const numbers = phone.replace(/\D/g, "");
  if (numbers.length === 0) return "";
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

// Interfaces
interface Ministerio {
  id: number;
  ministerio: {
    id: number;
    nombre: string;
    descripcion?: string;
    colorHex?: string;
  };
  rol?: string;
  fechaInicio?: string;
  fechaFin?: string;
  esLider?: boolean;
}

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
  fechaIngreso?: string;
  fechaBautismo?: string;
  fechaPrimeraVisita?: string;
  estado?: string;
  rol: "MIEMBRO" | "VISITA" | "INVITADO";
  tipo?: string;
  foto?: string;
  notas?: string;
  createdAt: string;
  updatedAt: string;
  ministerios?: Ministerio[];
  historialVisitas?: HistorialVisita[];
  familiares?: FamiliarRelacion[];
  visitasInvitadas?: VisitaInvitada[];
  miembroConvertido?: {
    id: number;
    nombres: string;
    apellidos: string;
  };
  _count?: {
    historialVisitas: number;
    ministerios: number;
  };
}

export default function ComunidadDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id } = use(params);
  const { iglesiaActiva } = useApiConIglesia();
  const [persona, setPersona] = useState<PersonaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConvertedMessage, setShowConvertedMessage] = useState(false);

  // Verificar si fue convertido desde una visita
  useEffect(() => {
    if (searchParams.get("converted") === "true") {
      setShowConvertedMessage(true);
      setTimeout(() => {
        setShowConvertedMessage(false);
      }, 5000);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchPersona = async () => {
      if (!iglesiaActiva?.id) {
        console.log("🔍 DEBUG - No hay iglesia seleccionada");
        setLoading(false);
        return;
      }

      try {
        console.log(
          `🔄 Cargando detalles de la persona ${id} para iglesia: ${iglesiaActiva?.nombre} (ID: ${iglesiaActiva?.id})`
        );

        const response = await fetch(`/api/personas/${id}`, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Verificar que la persona pertenece a la iglesia actual
        if (data.persona?.iglesia?.id !== iglesiaActiva.id) {
          throw new Error("Persona no encontrada en esta iglesia");
        }

        // Si es miembro, obtener datos adicionales de la API de miembros
        if (data.persona.rol === "MIEMBRO") {
          const miembroResponse = await fetch(
            `/api/miembros/${id}?iglesiaId=${iglesiaActiva.id}`,
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (miembroResponse.ok) {
            const miembroData = await miembroResponse.json();
            // Combinar datos
            setPersona({
              ...data.persona,
              ministerios: miembroData.ministerios || [],
              familiares: miembroData.familiares || [],
              visitasInvitadas: miembroData.visitasInvitadas || [],
              notasAdicionales: miembroData.notasAdicionales,
            });
          } else {
            setPersona(data.persona);
          }
        }
        // Si es visita, obtener historial de visitas
        else if (data.persona.rol === "VISITA") {
          // Obtener historial de visitas desde la API correspondiente
          const historialResponse = await fetch(
            `/api/personas/${id}/historial-visitas`,
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          let historialVisitas = [];
          if (historialResponse.ok) {
            const historialData = await historialResponse.json();
            historialVisitas = historialData.historial || [];
          }

          setPersona({
            ...data.persona,
            historialVisitas,
          });
        } else {
          setPersona(data.persona);
        }
      } catch (error) {
        console.error("Error:", error);
        setError(
          error instanceof Error ? error.message : "Error al cargar los datos"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPersona();
  }, [id, iglesiaActiva]);

  const getNombreCompleto = () => {
    if (!persona) return "Cargando...";
    return `${persona.nombres} ${persona.apellidos}`;
  };

  const getBadgeVariant = (estado?: string) => {
    switch (estado) {
      case "ACTIVA":
      case "Activo":
        return "default";
      case "INACTIVA":
      case "Inactivo":
        return "outline";
      case "RECURRENTE":
        return "secondary";
      case "NUEVA":
        return "destructive";
      default:
        return "default";
    }
  };

  const getRolColor = (rol: string) => {
    switch (rol) {
      case "MIEMBRO":
        return "bg-blue-100 text-blue-800";
      case "VISITA":
        return "bg-green-100 text-green-800";
      case "INVITADO":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
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
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <span className="text-lg">
                Cargando información de la persona...
              </span>
            </div>
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
              <p className="text-destructive text-lg mb-4">
                {error || "Persona no encontrada"}
              </p>
              <Button
                variant="outline"
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
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/comunidad">Comunidad</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
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
          {/* Botones de navegación y acciones */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <div className="flex gap-2">
              {persona.rol === "VISITA" && (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/visitas/${id}/historial`)}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Historial
                </Button>
              )}
              <Button
                onClick={() => {
                  const editPath =
                    persona.rol === "MIEMBRO"
                      ? `/miembros/${persona.id}/editar`
                      : `/visitas/${persona.id}/editar`;
                  router.push(editPath);
                }}
              >
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
            {/* Columna principal - Información detallada */}
            <div className="md:col-span-2 space-y-6">
              {/* Información Personal */}
              <InformacionPersonal
                persona={persona}
                calcularEdad={(fecha: string) => calcularEdad(fecha) || 0}
                formatDate={formatDate}
              />

              {/* Información de Contacto */}
              <InformacionContacto
                persona={persona}
                formatPhoneForDisplay={formatPhoneForDisplay}
              />

              {/* Contenido específico según el rol */}
              {persona.rol === "MIEMBRO" && persona.ministerios && (
                <MinisteriosSection
                  ministerios={persona.ministerios}
                  personaId={persona.id}
                  formatDate={formatDate}
                />
              )}

              {/* Núcleo Familiar para Miembros */}
              {persona.rol === "MIEMBRO" &&
                persona.familiares &&
                persona.familiares.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Heart className="h-5 w-5" />
                          Núcleo Familiar
                          <Badge variant="secondary" className="ml-2">
                            {persona.familiares.length}
                          </Badge>
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
                      <div className="space-y-3">
                        {persona.familiares.slice(0, 4).map((familiarRel) => (
                          <div
                            key={familiarRel.id}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
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
                                <div className="flex items-center gap-2 mt-1">
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
                                        familiarRel.familiar.estado === "Activo"
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
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* Visitas Invitadas para Miembros */}
              {persona.rol === "MIEMBRO" &&
                persona.visitasInvitadas &&
                persona.visitasInvitadas.length > 0 && (
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
                          onClick={() =>
                            router.push(`/visitas?invitadoPor=${id}`)
                          }
                        >
                          Ver Todas
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {persona.visitasInvitadas.slice(0, 4).map((visita) => (
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
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* Historial de Visitas para Visitas */}
              {persona.rol === "VISITA" && persona.historialVisitas && (
                <HistorialVisitasSection
                  historialVisitas={persona.historialVisitas}
                  personaId={persona.id}
                  formatDate={formatDate}
                />
              )}

              {/* Notas Adicionales */}
              {persona.notas && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notas Adicionales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{persona.notas}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Columna lateral - Resumen y acciones */}
            <div className="space-y-6">
              {/* Foto y Estado */}
              <FotoYEstado
                persona={persona}
                getBadgeVariant={getBadgeVariant}
                getRolColor={getRolColor}
              />

              {/* Información de Familia */}
              {persona.familia && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Familia
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">
                      {typeof persona.familia === "string"
                        ? persona.familia
                        : persona.familia.nombre ||
                          `Familia ${persona.familia.apellido}`}
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
                  {persona.fechaNacimiento && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nacimiento:</span>
                      <div className="text-right">
                        <span className="font-medium">
                          {formatDate(persona.fechaNacimiento)}
                        </span>
                        {calcularEdad(persona.fechaNacimiento) && (
                          <p className="text-xs text-muted-foreground">
                            {calcularEdad(persona.fechaNacimiento)} años
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {persona.rol === "MIEMBRO" && persona.fechaIngreso && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ingreso:</span>
                      <div className="text-right">
                        <span className="font-medium">
                          {formatDate(persona.fechaIngreso)}
                        </span>
                        {calcularAniosTranscurridos(persona.fechaIngreso) !==
                          null && (
                          <p className="text-xs text-muted-foreground">
                            {calcularAniosTranscurridos(persona.fechaIngreso)}{" "}
                            año
                            {calcularAniosTranscurridos(
                              persona.fechaIngreso
                            ) !== 1
                              ? "s"
                              : ""}{" "}
                            en la iglesia
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {persona.rol === "MIEMBRO" && persona.fechaBautismo && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bautismo:</span>
                      <div className="text-right">
                        <span className="font-medium">
                          {formatDate(persona.fechaBautismo)}
                        </span>
                      </div>
                    </div>
                  )}

                  {persona.rol === "VISITA" && persona.fechaPrimeraVisita && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Primera visita:
                      </span>
                      <div className="text-right">
                        <span className="font-medium">
                          {formatDate(persona.fechaPrimeraVisita)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Registrado:</span>
                    <span className="font-medium">
                      {formatDate(persona.createdAt)}
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
                  {persona.rol === "MIEMBRO" && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Ministerios activos:
                        </span>
                        <span className="font-medium">
                          {persona.ministerios?.length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Familiares:
                        </span>
                        <span className="font-medium">
                          {persona.familiares?.length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Visitas invitadas:
                        </span>
                        <span className="font-medium">
                          {persona.visitasInvitadas?.length || 0}
                        </span>
                      </div>
                    </>
                  )}

                  {persona.rol === "VISITA" && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Total de visitas:
                      </span>
                      <span className="font-medium">
                        {persona._count?.historialVisitas ||
                          persona.historialVisitas?.length ||
                          0}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Acciones Rápidas */}
              <AccionesRapidas
                persona={persona}
                miembroConvertido={!!persona.miembroConvertido}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
