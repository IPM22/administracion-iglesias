"use client";

import { use, useEffect, useState } from "react";
import { AppSidebar } from "../../../../../components/app-sidebar";
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
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Calendar, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ModeToggle } from "../../../../../components/mode-toggle";
import PersonaSelector from "../../../../../components/PersonaSelector";
import { formatDateShort, formatTime12Hour } from "@/lib/date-utils";

interface TipoActividad {
  id: number;
  nombre: string;
  tipo: string;
}

interface Actividad {
  id: number;
  nombre: string;
  descripcion?: string;
  fecha: string;
  horaInicio?: string;
  horaFin?: string;
  ubicacion?: string;
  estado: string;
  tipoActividad: TipoActividad;
  horarios?: Array<{
    id: number;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    notas?: string;
  }>;
}

interface Persona {
  id: number;
  nombres: string;
  apellidos: string;
  foto?: string;
  correo?: string;
  telefono?: string;
  celular?: string;
  estado: string;
  tipo: "miembro" | "visita" | "nino";
  rol: "MIEMBRO" | "VISITA" | "INVITADO";
}

interface PersonaResponse {
  id: number;
  nombres: string;
  apellidos: string;
  rol: "MIEMBRO" | "VISITA" | "INVITADO";
  estado: string;
}

const formSchema = z
  .object({
    fecha: z.string().optional(),
    tipoActividadId: z.string().optional(),
    actividadId: z.string().optional(),
    horarioId: z.string().optional(),
    invitadoPorId: z.string().optional(),
    observaciones: z.string().optional(),
  })
  .refine((data) => data.tipoActividadId || data.actividadId, {
    message: "Debe seleccionar un tipo de actividad o una actividad específica",
    path: ["tipoActividadId"],
  })
  .refine(
    (data) => {
      // Si hay una actividad específica seleccionada, no necesita fecha manual
      if (data.actividadId) return true;
      // Si es tipo regular o no hay tipo, necesita fecha
      return data.fecha && data.fecha.trim() !== "";
    },
    {
      message: "La fecha es requerida para actividades regulares",
      path: ["fecha"],
    }
  );

type FormValues = z.infer<typeof formSchema>;

export default function NuevaEntradaHistorialPersonaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tiposActividad, setTiposActividad] = useState<TipoActividad[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [personaSeleccionada, setPersonaSeleccionada] =
    useState<Persona | null>(null);
  const [persona, setPersona] = useState<{
    id: number;
    nombres: string;
    apellidos: string;
    rol: "MIEMBRO" | "VISITA" | "INVITADO";
  } | null>(null);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string>("");
  const [actividadSeleccionada, setActividadSeleccionada] =
    useState<Actividad | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fecha: undefined,
      tipoActividadId: "",
      actividadId: "",
      horarioId: undefined,
      invitadoPorId: undefined,
      observaciones: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener información de la persona
        const personaResponse = await fetch(`/api/personas/${id}`);
        if (!personaResponse.ok) {
          throw new Error("Error al obtener los datos de la persona");
        }
        const personaData = await personaResponse.json();
        setPersona({
          id: personaData.persona.id,
          nombres: personaData.persona.nombres,
          apellidos: personaData.persona.apellidos,
          rol: personaData.persona.rol,
        });

        // Obtener tipos de actividad
        const tiposResponse = await fetch("/api/tipos-actividad");
        if (!tiposResponse.ok) {
          throw new Error("Error al obtener los tipos de actividad");
        }
        const tiposData = await tiposResponse.json();
        setTiposActividad(tiposData);

        // Obtener lista de personas para el campo "invitado por"
        const personasResponse = await fetch("/api/personas?limit=10000");
        if (!personasResponse.ok) {
          throw new Error("Error al obtener la lista de personas");
        }
        const personasData = await personasResponse.json();

        // Filtrar para excluir la persona actual y mapear a formato correcto
        const personasFiltradas = personasData.personas
          .filter((p: PersonaResponse) => p.id !== parseInt(id))
          .map((p: PersonaResponse) => ({
            id: p.id,
            nombres: p.nombres,
            apellidos: p.apellidos,
            tipo: (p.rol === "MIEMBRO" ? "miembro" : "visita") as
              | "miembro"
              | "visita"
              | "nino",
            estado: p.estado,
          }));

        setPersonas(personasFiltradas);
      } catch (error) {
        console.error("Error:", error);
        setError(error instanceof Error ? error.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    if (tipoSeleccionado) {
      cargarActividades();
    } else {
      setActividades([]);
      setActividadSeleccionada(null);
      form.setValue("actividadId", "");
    }
  }, [tipoSeleccionado]);

  const cargarActividades = async () => {
    try {
      const response = await fetch(
        `/api/actividades?tipoId=${tipoSeleccionado}&estado=activa`
      );
      if (!response.ok) {
        throw new Error("Error al obtener las actividades");
      }
      const data = await response.json();
      setActividades(data);
    } catch (error) {
      console.error("Error cargando actividades:", error);
    }
  };

  const handleTipoChange = (tipoId: string) => {
    setTipoSeleccionado(tipoId);
    form.setValue("tipoActividadId", tipoId);
    form.setValue("actividadId", "");
    setActividadSeleccionada(null);
  };

  const handleActividadChange = (actividadId: string) => {
    const actividad = actividades.find((a) => a.id === parseInt(actividadId));
    setActividadSeleccionada(actividad || null);
    form.setValue("actividadId", actividadId);
    form.setValue("horarioId", "");
  };

  const deberMostrarCampoFecha = () => {
    return !actividadSeleccionada;
  };

  const deberMostrarCampoHorario = () => {
    return (
      actividadSeleccionada &&
      actividadSeleccionada.horarios &&
      actividadSeleccionada.horarios.length > 0
    );
  };

  const obtenerFechaParaRegistro = (values: FormValues) => {
    if (actividadSeleccionada) {
      if (values.horarioId && actividadSeleccionada.horarios) {
        const horario = actividadSeleccionada.horarios.find(
          (h) => h.id === parseInt(values.horarioId!)
        );
        if (horario) {
          return horario.fecha;
        }
      }
      return actividadSeleccionada.fecha;
    }
    return values.fecha;
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!persona) return;

    setSaving(true);
    try {
      const fechaFinal = obtenerFechaParaRegistro(values);

      const response = await fetch(`/api/personas/${id}/historial-visitas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fecha: fechaFinal,
          tipoActividadId: values.tipoActividadId
            ? parseInt(values.tipoActividadId)
            : null,
          actividadId: values.actividadId ? parseInt(values.actividadId) : null,
          horarioId: values.horarioId ? parseInt(values.horarioId) : null,
          invitadoPorId: values.invitadoPorId
            ? parseInt(values.invitadoPorId)
            : null,
          observaciones: values.observaciones || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al registrar la visita");
      }

      router.push(`/comunidad/${id}`);
    } catch (error) {
      console.error("Error:", error);
      setError(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  }

  const getNombreCompleto = () => {
    if (!persona) return "";
    return `${persona.nombres} ${persona.apellidos}`;
  };

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (error) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center min-h-screen">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-destructive">Error</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{error}</p>
                <Button
                  onClick={() => router.back()}
                  variant="outline"
                  className="mt-4"
                >
                  Volver
                </Button>
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
          <div className="flex items-center gap-2 px-4">
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
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href={`/comunidad/${id}`}>
                    {getNombreCompleto()}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Nueva Visita</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto px-3">
            <ModeToggle />
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Registrar Nueva Visita
              </h1>
              <p className="text-muted-foreground">
                Registra una nueva entrada en el historial de{" "}
                <span className="font-medium">{getNombreCompleto()}</span>
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Información de la Visita
                </CardTitle>
                <CardDescription>
                  Complete los detalles de la nueva entrada en el historial
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="tipoActividadId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Actividad</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                handleTipoChange(value);
                              }}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona un tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {tiposActividad.map((tipo) => (
                                  <SelectItem
                                    key={tipo.id}
                                    value={tipo.id.toString()}
                                  >
                                    {tipo.nombre}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Selecciona el tipo de actividad donde asistió
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {actividades.length > 0 && (
                        <FormField
                          control={form.control}
                          name="actividadId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Actividad Específica</FormLabel>
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  handleActividadChange(value);
                                }}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona una actividad" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {actividades.map((actividad) => (
                                    <SelectItem
                                      key={actividad.id}
                                      value={actividad.id.toString()}
                                    >
                                      {actividad.nombre}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Opcional: Selecciona una actividad específica
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {deberMostrarCampoFecha() && (
                        <FormField
                          control={form.control}
                          name="fecha"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fecha de la Visita</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormDescription>
                                Fecha en que asistió a la actividad
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {deberMostrarCampoHorario() && (
                        <FormField
                          control={form.control}
                          name="horarioId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Horario de la Visita</FormLabel>
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                }}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un horario" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {actividadSeleccionada?.horarios?.map(
                                    (horario) => (
                                      <SelectItem
                                        key={horario.id}
                                        value={horario.id.toString()}
                                      >
                                        {formatDateShort(horario.fecha)} -{" "}
                                        {formatTime12Hour(horario.horaInicio)} a{" "}
                                        {formatTime12Hour(horario.horaFin)}
                                      </SelectItem>
                                    )
                                  )}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Opcional: Selecciona un horario específico
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={form.control}
                        name="invitadoPorId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Invitado Por (Opcional)</FormLabel>
                            <PersonaSelector
                              personas={personas.map((p) => ({
                                ...p,
                                rol:
                                  p.tipo === "miembro" ? "MIEMBRO" : "VISITA",
                              }))}
                              personaSeleccionada={personaSeleccionada}
                              onSeleccionar={(persona) => {
                                setPersonaSeleccionada(persona);
                                field.onChange(
                                  persona ? persona.id.toString() : ""
                                );
                              }}
                              placeholder="Buscar quien invitó..."
                            />
                            <FormDescription>
                              Persona que invitó a esta actividad
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="observaciones"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observaciones (Opcional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Agrega cualquier observación adicional..."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Cualquier información adicional sobre la visita
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={saving}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={saving}>
                        {saving && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Registrar Visita
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
