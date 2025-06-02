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
import { ArrowLeft, Calendar, User, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, type ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ModeToggle } from "../../../../../components/mode-toggle";
import PersonaSelector from "../../../../../components/PersonaSelector";

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
}

interface Miembro {
  id: number;
  nombres: string;
  apellidos: string;
  correo?: string;
  estado: string;
}

interface Visita {
  id: number;
  nombres: string;
  apellidos: string;
  correo?: string;
  estado?: string;
}

interface Persona {
  id: number;
  nombres: string;
  apellidos: string;
  foto?: string;
  correo?: string;
  telefono?: string;
  celular?: string;
  tipo: "miembro" | "visita";
  estado?: string;
}

const formSchema = z
  .object({
    fecha: z.string().optional(),
    tipoActividadId: z.string().optional(),
    actividadId: z.string().optional(),
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

export default function NuevaEntradaHistorialPage({
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
  const [visita, setVisita] = useState<Visita | null>(null);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string>("");
  const [actividadSeleccionada, setActividadSeleccionada] =
    useState<Actividad | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fecha: undefined,
      tipoActividadId: "",
      actividadId: "",
      invitadoPorId: undefined,
      observaciones: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener información de la visita
        const visitaResponse = await fetch(`/api/visitas/${id}`);
        if (!visitaResponse.ok) {
          throw new Error("Error al obtener los datos de la visita");
        }
        const visitaData = await visitaResponse.json();
        setVisita({
          id: visitaData.id,
          nombres: visitaData.nombres,
          apellidos: visitaData.apellidos,
        });

        // Obtener tipos de actividad
        const tiposResponse = await fetch("/api/tipos-actividad");
        if (!tiposResponse.ok) {
          throw new Error("Error al obtener los tipos de actividad");
        }
        const tiposData = await tiposResponse.json();
        setTiposActividad(tiposData);

        // Obtener lista de miembros para el campo "invitado por"
        const miembrosResponse = await fetch("/api/miembros/lista");
        if (!miembrosResponse.ok) {
          throw new Error("Error al obtener la lista de miembros");
        }
        const miembrosData = await miembrosResponse.json();

        // Obtener lista de visitas para el campo "invitado por"
        const visitasResponse = await fetch("/api/visitas");
        if (!visitasResponse.ok) {
          throw new Error("Error al obtener la lista de visitas");
        }
        const visitasData = await visitasResponse.json();
        // Filtrar para excluir la visita actual
        const visitasFiltradas = visitasData.filter(
          (v: Visita) => v.id !== parseInt(id)
        );

        // Crear lista combinada de invitados por
        const miembrosConTipo: Persona[] = miembrosData.map(
          (miembro: Miembro) => ({
            ...miembro,
            tipo: "miembro" as const,
          })
        );

        const visitasConTipo: Persona[] = visitasFiltradas.map(
          (visita: Visita) => ({
            ...visita,
            tipo: "visita" as const,
          })
        );

        setPersonas([...miembrosConTipo, ...visitasConTipo]);
      } catch (error) {
        console.error("Error:", error);
        setError("Error al cargar los datos necesarios");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Cargar actividades cuando se selecciona un tipo especial
  useEffect(() => {
    const cargarActividades = async () => {
      if (!tipoSeleccionado) {
        setActividades([]);
        return;
      }

      const tipoActividad = tiposActividad.find(
        (tipo) => tipo.id.toString() === tipoSeleccionado
      );

      if (tipoActividad?.tipo === "Especial") {
        try {
          const response = await fetch("/api/actividades");
          if (response.ok) {
            const data = await response.json();
            // Filtrar solo actividades del tipo seleccionado (incluyendo pasadas y futuras)
            const actividadesFiltradas = data.filter(
              (act: Actividad) =>
                act.tipoActividad.id.toString() === tipoSeleccionado
            );
            // Ordenar por fecha, más recientes primero
            actividadesFiltradas.sort(
              (a: Actividad, b: Actividad) =>
                new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
            );
            setActividades(actividadesFiltradas);
          }
        } catch (error) {
          console.error("Error al cargar actividades:", error);
        }
      } else {
        setActividades([]);
        // Si cambia a tipo regular, restaurar la fecha actual
        if (tipoActividad?.tipo === "Regular") {
          form.setValue("fecha", new Date().toISOString().split("T")[0]);
        }
      }
    };

    cargarActividades();
  }, [tipoSeleccionado, tiposActividad, form]);

  // Actualizar la fecha automáticamente cuando se selecciona una actividad específica
  useEffect(() => {
    const actividadIdSeleccionada = form.watch("actividadId");

    if (actividadIdSeleccionada && actividades.length > 0) {
      const actividadSeleccionada = actividades.find(
        (act) => act.id.toString() === actividadIdSeleccionada
      );

      if (actividadSeleccionada) {
        setActividadSeleccionada(actividadSeleccionada);
        // Usar la fecha de la actividad específica
        const fechaActividad = new Date(actividadSeleccionada.fecha)
          .toISOString()
          .split("T")[0];
        form.setValue("fecha", fechaActividad);
      }
    } else {
      setActividadSeleccionada(null);
    }
  }, [form.watch("actividadId"), actividades, form]);

  // Función para determinar si se debe mostrar el campo de fecha
  const deberMostrarCampoFecha = () => {
    const tipoActividad = tiposActividad.find(
      (tipo) => tipo.id.toString() === tipoSeleccionado
    );
    // Solo mostrar para actividades específicamente regulares
    return tipoActividad?.tipo === "Regular";
  };

  // Función para obtener la fecha que se usará en el registro
  const obtenerFechaParaRegistro = (values: FormValues) => {
    if (actividadSeleccionada) {
      return actividadSeleccionada.fecha;
    }
    return values.fecha || new Date().toISOString().split("T")[0];
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/visitas/${id}/historial`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fecha: obtenerFechaParaRegistro(values),
          tipoActividadId: values.tipoActividadId || null,
          actividadId: values.actividadId || null,
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

      router.push(`/visitas/${id}/historial`);
    } catch (error) {
      console.error("Error:", error);
      setError(
        error instanceof Error ? error.message : "Error al guardar la visita"
      );
    } finally {
      setSaving(false);
    }
  }

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
            <span className="ml-2">Cargando formulario...</span>
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
                  <BreadcrumbLink href={`/visitas/${id}/historial`}>
                    Historial
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Nueva Visita</BreadcrumbPage>
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

          {error && (
            <div className="bg-destructive/15 border border-destructive/20 rounded-md p-4">
              <p className="text-destructive">{error}</p>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Registrar Nueva Visita - {getNombreCompleto()}
              </CardTitle>
              <CardDescription>
                Registra una nueva entrada en el historial de visitas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {/* Actividad: Tipo y campos relacionados */}
                  <div className="space-y-4">
                    {/* Tipo de Actividad */}
                    <FormField
                      control={form.control}
                      name="tipoActividadId"
                      render={({
                        field,
                      }: {
                        field: ControllerRenderProps<FormValues>;
                      }) => (
                        <FormItem>
                          <FormLabel>Tipo de Actividad</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              setTipoSeleccionado(value);
                              // Limpiar selección de actividad específica
                              form.setValue("actividadId", "");
                              setActividadSeleccionada(null);

                              // Si es actividad regular, establecer fecha actual
                              const tipoActividad = tiposActividad.find(
                                (tipo) => tipo.id.toString() === value
                              );
                              if (tipoActividad?.tipo === "Regular") {
                                form.setValue(
                                  "fecha",
                                  new Date().toISOString().split("T")[0]
                                );
                              } else {
                                form.setValue("fecha", undefined);
                              }
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona el tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {tiposActividad.map((tipo) => (
                                <SelectItem
                                  key={tipo.id}
                                  value={tipo.id.toString()}
                                >
                                  {tipo.nombre} ({tipo.tipo})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Regular (culto, estudio) o especial
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Fecha de la visita - Solo para actividades regulares */}
                    {deberMostrarCampoFecha() ? (
                      <FormField
                        control={form.control}
                        name="fecha"
                        render={({
                          field,
                        }: {
                          field: ControllerRenderProps<FormValues>;
                        }) => (
                          <FormItem>
                            <FormLabel>Fecha de la Visita</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormDescription>
                              Fecha en que {getNombreCompleto()} asistió
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : null}

                    {/* Actividad Específica - Solo para actividades especiales */}
                    <FormField
                      control={form.control}
                      name="actividadId"
                      render={({
                        field,
                      }: {
                        field: ControllerRenderProps<FormValues>;
                      }) => (
                        <FormItem>
                          <FormLabel>Actividad Específica</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              // Buscar y establecer la actividad seleccionada
                              if (value && actividades.length > 0) {
                                const actividad = actividades.find(
                                  (act) => act.id.toString() === value
                                );
                                if (actividad) {
                                  setActividadSeleccionada(actividad);
                                  const fechaActividad = new Date(
                                    actividad.fecha
                                  )
                                    .toISOString()
                                    .split("T")[0];
                                  form.setValue("fecha", fechaActividad);
                                }
                              } else {
                                setActividadSeleccionada(null);
                              }
                            }}
                            value={field.value}
                            disabled={
                              !tipoSeleccionado ||
                              tiposActividad.find(
                                (t) => t.id.toString() === tipoSeleccionado
                              )?.tipo !== "Especial"
                            }
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    !tipoSeleccionado
                                      ? "Primero selecciona el tipo"
                                      : tiposActividad.find(
                                          (t) =>
                                            t.id.toString() === tipoSeleccionado
                                        )?.tipo !== "Especial"
                                      ? "Solo para actividades especiales"
                                      : "Selecciona la actividad"
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {actividades.map((actividad) => (
                                <SelectItem
                                  key={actividad.id}
                                  value={actividad.id.toString()}
                                >
                                  <div className="flex flex-col">
                                    <span>{actividad.nombre}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(
                                        actividad.fecha
                                      ).toLocaleDateString()}
                                      {actividad.horaInicio &&
                                        ` - ${actividad.horaInicio}`}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Opcional - Solo para eventos especiales
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Información de fecha automática para actividades especiales */}
                    {actividadSeleccionada && (
                      <div className="rounded-lg border p-4 bg-muted/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span className="font-medium">
                            Fecha de la Actividad
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          La fecha se tomará automáticamente de la actividad
                          específica:
                        </p>
                        <p className="font-medium mt-1">
                          {new Date(
                            actividadSeleccionada.fecha
                          ).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                          {actividadSeleccionada.horaInicio && (
                            <span className="text-muted-foreground">
                              {" "}
                              a las {actividadSeleccionada.horaInicio}
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Invitado por con PersonaSelector */}
                  <FormField
                    control={form.control}
                    name="invitadoPorId"
                    render={({
                      field,
                    }: {
                      field: ControllerRenderProps<FormValues>;
                    }) => (
                      <FormItem>
                        <FormLabel>Invitado por (Opcional)</FormLabel>
                        <FormControl>
                          <PersonaSelector
                            personas={personas}
                            onSeleccionar={(persona: Persona | null) => {
                              if (persona) {
                                field.onChange(persona.id.toString());
                                setPersonaSeleccionada(persona);
                              } else {
                                field.onChange(undefined);
                                setPersonaSeleccionada(null);
                              }
                            }}
                            personaSeleccionada={personaSeleccionada}
                            placeholder="Buscar miembro o visita que invitó..."
                          />
                        </FormControl>
                        <FormDescription>
                          Busca y selecciona el miembro o visita que invitó a
                          esta persona
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Observaciones */}
                  <FormField
                    control={form.control}
                    name="observaciones"
                    render={({
                      field,
                    }: {
                      field: ControllerRenderProps<FormValues>;
                    }) => (
                      <FormItem>
                        <FormLabel>Observaciones</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Notas adicionales sobre esta visita, cómo se sintió, si mostró interés, etc..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Opcional - Cualquier información adicional relevante
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-4">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => router.back()}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? "Guardando..." : "Registrar Visita"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Información adicional */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información de la Visita
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Persona:</span>
                  <span className="font-medium">{getNombreCompleto()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Propósito:</span>
                  <span>Registrar nueva asistencia</span>
                </div>
                <div className="text-xs text-muted-foreground border-t pt-3">
                  <p>
                    <strong>Recordatorio:</strong> Este registro se agregará al
                    historial de visitas. Asegúrate de que la información sea
                    correcta antes de guardar.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
