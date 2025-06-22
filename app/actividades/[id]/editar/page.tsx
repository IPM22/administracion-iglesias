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
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Edit, Clock, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ModeToggle } from "../../../../components/mode-toggle";
import { CloudinaryUploader } from "../../../../components/CloudinaryUploader";
import MinisterioSelector from "../../../../components/MinisterioSelector";
import { GoogleMapsEmbed } from "@/components/GoogleMapsEmbed";
import { HorariosSelector } from "../../../../components/HorariosSelector";

interface TipoActividad {
  id: number;
  nombre: string;
  tipo: string;
}

interface Ministerio {
  id: number;
  nombre: string;
  descripcion?: string;
}

interface ActividadData {
  id: number;
  nombre: string;
  descripcion?: string;
  fecha: string;
  fechaInicio?: string;
  fechaFin?: string;
  esRangoFechas: boolean;
  horaInicio?: string;
  horaFin?: string;
  ubicacion?: string;
  googleMapsEmbed?: string;
  responsable?: string;
  estado: string;
  tipoActividadId: number;
  ministerioId?: number;
  tipoActividad: TipoActividad;
  ministerio?: Ministerio;
  banner?: string;
  horarios?: Array<{
    id: number;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    notas?: string;
  }>;
}

const formSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
  fecha: z.string().optional(),
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),
  esRangoFechas: z.boolean(),
  horaInicio: z.string().optional(),
  horaFin: z.string().optional(),
  ubicacion: z.string().optional(),
  googleMapsEmbed: z.string().optional(),
  responsable: z.string().optional(),
  tipoActividadId: z.string().min(1, "Selecciona un tipo de actividad"),
  ministerioId: z.number().optional(),
  estado: z.string().min(1, "El estado es requerido"),
  banner: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditarActividadPage({
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
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [actividad, setActividad] = useState<ActividadData | null>(null);
  const [ministerioSeleccionado, setMinisterioSeleccionado] =
    useState<Ministerio | null>(null);
  const [horariosMultiples, setHorariosMultiples] = useState<
    Array<{
      id?: number;
      fecha: string;
      horaInicio: string;
      horaFin: string;
      notas?: string;
    }>
  >([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      fecha: "",
      fechaInicio: "",
      fechaFin: "",
      esRangoFechas: false,
      horaInicio: "",
      horaFin: "",
      ubicacion: "",
      googleMapsEmbed: "",
      responsable: "",
      tipoActividadId: "",
      ministerioId: undefined,
      estado: "Programada",
      banner: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("🔄 Iniciando carga de datos para editar...");

        // Obtener tipos de actividad
        console.log("📋 Cargando tipos de actividad...");
        const tiposResponse = await fetch("/api/tipos-actividad");
        console.log(
          "📋 Respuesta tipos de actividad:",
          tiposResponse.status,
          tiposResponse.statusText
        );

        if (!tiposResponse.ok) {
          const errorText = await tiposResponse.text();
          console.error("❌ Error en respuesta tipos de actividad:", errorText);
          throw new Error("Error al obtener los tipos de actividad");
        }
        const tiposData = await tiposResponse.json();
        console.log("✅ Tipos de actividad cargados:", tiposData);
        setTiposActividad(tiposData);

        // Cargar ministerios
        console.log("⛪ Cargando ministerios...");
        const ministeriosResponse = await fetch("/api/ministerios");
        console.log(
          "⛪ Respuesta ministerios:",
          ministeriosResponse.status,
          ministeriosResponse.statusText
        );

        if (!ministeriosResponse.ok) {
          const errorText = await ministeriosResponse.text();
          console.error("❌ Error en respuesta ministerios:", errorText);
          throw new Error("Error al obtener los ministerios");
        }
        const ministeriosData = await ministeriosResponse.json();
        console.log("✅ Ministerios cargados:", ministeriosData);
        setMinisterios(ministeriosData);

        // Obtener actividad actual
        console.log("🎯 Cargando actividad actual...");
        const actividadResponse = await fetch(`/api/actividades/${id}`);
        console.log(
          "🎯 Respuesta actividad:",
          actividadResponse.status,
          actividadResponse.statusText
        );

        if (!actividadResponse.ok) {
          const errorText = await actividadResponse.text();
          console.error("❌ Error en respuesta actividad:", errorText);
          throw new Error("Error al obtener la actividad");
        }
        const actividadData = await actividadResponse.json();
        console.log("✅ Actividad cargada:", actividadData);
        setActividad(actividadData);

        // Configurar ministerio seleccionado si existe
        if (actividadData.ministerio) {
          setMinisterioSeleccionado(actividadData.ministerio);
        }

        // Formatear fecha para input date
        const fechaFormateada = new Date(actividadData.fecha)
          .toISOString()
          .split("T")[0];

        // Formatear fechas de inicio y fin si existen
        const fechaInicioFormateada = actividadData.fechaInicio
          ? new Date(actividadData.fechaInicio).toISOString().split("T")[0]
          : "";
        const fechaFinFormateada = actividadData.fechaFin
          ? new Date(actividadData.fechaFin).toISOString().split("T")[0]
          : "";

        // Cargar datos en el formulario
        form.reset({
          nombre: actividadData.nombre,
          descripcion: actividadData.descripcion || "",
          fecha: fechaFormateada,
          fechaInicio: fechaInicioFormateada,
          fechaFin: fechaFinFormateada,
          esRangoFechas: actividadData.esRangoFechas,
          horaInicio: actividadData.horaInicio || "",
          horaFin: actividadData.horaFin || "",
          ubicacion: actividadData.ubicacion || "",
          googleMapsEmbed: actividadData.googleMapsEmbed || "",
          responsable: actividadData.responsable || "",
          tipoActividadId: actividadData.tipoActividadId.toString(),
          ministerioId: actividadData.ministerioId,
          estado: actividadData.estado,
          banner: actividadData.banner || "",
        });

        // Cargar horarios existentes si los hay
        if (actividadData.horarios && actividadData.horarios.length > 0) {
          const horariosFormateados = actividadData.horarios.map(
            (h: {
              id: number;
              fecha: string;
              horaInicio: string;
              horaFin: string;
              notas?: string;
            }) => ({
              id: h.id,
              fecha: new Date(h.fecha).toISOString().split("T")[0],
              horaInicio: h.horaInicio || "",
              horaFin: h.horaFin || "",
              notas: h.notas || "",
            })
          );
          setHorariosMultiples(horariosFormateados);
        }
      } catch (error) {
        console.error("💥 Error general:", error);
        setError("Error al cargar los datos");
      } finally {
        console.log("🏁 Finalizando carga de datos para editar");
        setLoading(false);
      }
    };

    fetchData();
  }, [id, form]);

  // Actualizar el form cuando se selecciona un ministerio
  useEffect(() => {
    if (ministerioSeleccionado) {
      form.setValue("ministerioId", ministerioSeleccionado.id);
    } else {
      form.setValue("ministerioId", undefined);
    }
  }, [ministerioSeleccionado, form]);

  async function onSubmit(values: FormValues) {
    setSaving(true);
    setError(null);

    // Validar que se haya seleccionado un ministerio
    if (!ministerioSeleccionado || !values.ministerioId) {
      setError("Debes seleccionar un ministerio para la actividad");
      setSaving(false);
      return;
    }

    // Validaciones de fechas
    if (values.esRangoFechas) {
      if (!values.fechaInicio || !values.fechaFin) {
        setError(
          "Para actividades de múltiples días se requieren fecha de inicio y fin"
        );
        setSaving(false);
        return;
      }

      if (new Date(values.fechaFin) < new Date(values.fechaInicio)) {
        setError(
          "La fecha de fin debe ser posterior o igual a la fecha de inicio"
        );
        setSaving(false);
        return;
      }
    } else {
      if (!values.fecha) {
        setError("La fecha es requerida");
        setSaving(false);
        return;
      }
    }

    try {
      const response = await fetch(`/api/actividades/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          tipoActividadId: parseInt(values.tipoActividadId),
          horarios: horariosMultiples,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar la actividad");
      }

      router.push(`/actividades/${id}`);
    } catch (error) {
      console.error("Error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Error al actualizar la actividad"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando actividad...</span>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!actividad) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <p className="text-red-500 mb-4">
                  {error || "Actividad no encontrada"}
                </p>
                <Button onClick={() => router.push("/actividades")}>
                  Volver a Actividades
                </Button>
              </div>
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
                  <BreadcrumbLink href="/actividades">
                    Actividades
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/actividades/${id}`}>
                    {actividad.nombre}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Editar</BreadcrumbPage>
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
                <Edit className="h-5 w-5" />
                Editar Actividad
              </CardTitle>
              <CardDescription>
                Actualiza la información de la actividad
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Nombre */}
                    <FormField
                      control={form.control}
                      name="nombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre de la Actividad</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ej: Culto Dominical"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Tipo de Actividad */}
                    <FormField
                      control={form.control}
                      name="tipoActividadId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Actividad</FormLabel>
                          <Select
                            onValueChange={field.onChange}
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Ministerio Organizador */}
                  <FormField
                    control={form.control}
                    name="ministerioId"
                    render={() => (
                      <FormItem>
                        <FormLabel>
                          Ministerio Organizador{" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <MinisterioSelector
                            ministerios={ministerios}
                            onSeleccionar={setMinisterioSeleccionado}
                            ministerioSeleccionado={ministerioSeleccionado}
                            placeholder="Buscar y seleccionar ministerio organizador..."
                            disabled={saving}
                          />
                        </FormControl>
                        <FormDescription>
                          Ministerio responsable de organizar esta actividad
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Descripción */}
                  <FormField
                    control={form.control}
                    name="descripcion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descripción de la actividad..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Opcional - Describe brevemente la actividad
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Banner */}
                  <FormField
                    control={form.control}
                    name="banner"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Banner de la Actividad</FormLabel>
                        <FormControl>
                          <CloudinaryUploader
                            type="actividad"
                            value={field.value}
                            onChange={field.onChange}
                            onRemove={() => field.onChange("")}
                          />
                        </FormControl>
                        <FormDescription>
                          Opcional - Imagen promocional de la actividad
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-3">
                    {/* Control de Rango de Fechas */}
                    <div className="md:col-span-3">
                      <FormField
                        control={form.control}
                        name="esRangoFechas"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Actividad de múltiples días
                              </FormLabel>
                              <FormDescription>
                                Activa esta opción para campamentos, campañas
                                evangelísticas o eventos que duran varios días
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Fecha única o rango de fechas */}
                    {!form.watch("esRangoFechas") ? (
                      // Fecha única
                      <FormField
                        control={form.control}
                        name="fecha"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      // Rango de fechas
                      <>
                        <FormField
                          control={form.control}
                          name="fechaInicio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fecha de Inicio</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="fechaFin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fecha de Fin</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    {/* Hora Inicio */}
                    <FormField
                      control={form.control}
                      name="horaInicio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hora de Inicio</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormDescription>Opcional</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Hora Fin */}
                    <FormField
                      control={form.control}
                      name="horaFin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hora de Fin</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormDescription>Opcional</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Horarios Múltiples */}
                  <HorariosSelector
                    horarios={horariosMultiples}
                    onHorariosChange={setHorariosMultiples}
                    fechaInicio={form.watch("fechaInicio")}
                    fechaFin={form.watch("fechaFin")}
                    esRangoFechas={form.watch("esRangoFechas")}
                  />

                  {/* Ubicación con Google Maps Embed */}
                  <FormField
                    control={form.control}
                    name="ubicacion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ubicación y Google Maps</FormLabel>
                        <FormControl>
                          <GoogleMapsEmbed
                            onLocationChange={(location: {
                              direccion: string;
                              googleMapsEmbed?: string;
                            }) => {
                              field.onChange(location.direccion);
                              form.setValue(
                                "googleMapsEmbed",
                                location.googleMapsEmbed
                              );
                            }}
                            direccion={field.value || ""}
                            googleMapsEmbed={form.getValues("googleMapsEmbed")}
                          />
                        </FormControl>
                        <FormDescription>
                          Opcional - Dirección física del evento con embed de
                          Google Maps
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Estado */}
                    <FormField
                      control={form.control}
                      name="estado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Programada">
                                Programada
                              </SelectItem>
                              <SelectItem value="En curso">En curso</SelectItem>
                              <SelectItem value="Finalizada">
                                Finalizada
                              </SelectItem>
                              <SelectItem value="Cancelada">
                                Cancelada
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => router.back()}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? "Guardando..." : "Guardar Cambios"}
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
                <Clock className="h-5 w-5" />
                Información sobre los Cambios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">Ministerio organizador:</span>
                  <p className="text-muted-foreground">
                    Es requerido seleccionar un ministerio organizador. Los
                    cambios afectarán la asignación de responsabilidades.
                  </p>
                </div>
                <div>
                  <span className="font-medium">Google Maps:</span>
                  <p className="text-muted-foreground">
                    Puedes actualizar el embed de Google Maps manualmente.
                    También puedes obtener un nuevo embed haciendo clic derecho
                    en el punto deseado.
                  </p>
                </div>
                <div>
                  <span className="font-medium">Estado de la actividad:</span>
                  <p className="text-muted-foreground">
                    Cambiar el estado puede afectar la visibilidad y las
                    acciones disponibles para esta actividad.
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
