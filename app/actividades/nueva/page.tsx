"use client";

import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { ArrowLeft, Calendar, Clock, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ModeToggle } from "../../../components/mode-toggle";
import { CloudinaryUploader } from "../../../components/CloudinaryUploader";
import MinisterioSelector from "../../../components/MinisterioSelector";
import { GoogleMapsEmbed } from "@/components/GoogleMapsEmbed";
import { UseIglesiaLocationButton } from "@/components/ActividadFormHelpers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

const formSchema = z
  .object({
    nombre: z.string().min(1, "El nombre es requerido"),
    descripcion: z.string().optional(),
    fecha: z.string().optional(),
    fechaInicio: z.string().optional(),
    fechaFin: z.string().optional(),
    esRangoFechas: z.boolean().default(false),
    horaInicio: z.string().optional(),
    horaFin: z.string().optional(),
    ubicacion: z.string().optional(),
    googleMapsEmbed: z.string().optional(),
    responsable: z.string().optional(),
    tipoActividadId: z.string().min(1, "Selecciona un tipo de actividad"),
    ministerioId: z.number().optional(),
    estado: z.string().min(1, "El estado es requerido"),
    banner: z.string().optional(),
  })
  .refine(
    (data) => {
      // Si es rango de fechas, debe tener fechaInicio y fechaFin
      if (data.esRangoFechas) {
        return data.fechaInicio && data.fechaFin;
      }
      // Si no es rango de fechas, debe tener fecha
      return data.fecha;
    },
    {
      message: "Debe proporcionar una fecha o un rango de fechas válido",
      path: ["fecha"],
    },
  )
  .refine(
    (data) => {
      // Si es rango de fechas, fechaFin debe ser posterior a fechaInicio
      if (data.esRangoFechas && data.fechaInicio && data.fechaFin) {
        return new Date(data.fechaFin) >= new Date(data.fechaInicio);
      }
      return true;
    },
    {
      message:
        "La fecha de fin debe ser posterior o igual a la fecha de inicio",
      path: ["fechaFin"],
    },
  );

type FormValues = z.infer<typeof formSchema>;

export default function NuevaActividadPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tiposActividad, setTiposActividad] = useState<TipoActividad[]>([]);
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [ministerioSeleccionado, setMinisterioSeleccionado] =
    useState<Ministerio | null>(null);

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
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
        console.log("🔄 Iniciando carga de datos del formulario...");

        // Cargar tipos de actividad
        console.log("📋 Cargando tipos de actividad...");
        const tiposResponse = await fetch("/api/tipos-actividad");
        console.log(
          "📋 Respuesta tipos de actividad:",
          tiposResponse.status,
          tiposResponse.statusText,
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
          ministeriosResponse.statusText,
        );

        if (!ministeriosResponse.ok) {
          const errorText = await ministeriosResponse.text();
          console.error("❌ Error en respuesta ministerios:", errorText);
          throw new Error("Error al obtener los ministerios");
        }
        const ministeriosData = await ministeriosResponse.json();
        console.log("✅ Ministerios cargados:", ministeriosData);
        setMinisterios(ministeriosData);
      } catch (error) {
        console.error("💥 Error general:", error);
        setError("Error al cargar los datos del formulario");
      } finally {
        console.log("🏁 Finalizando carga de datos");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

    try {
      const response = await fetch("/api/actividades", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          tipoActividadId: parseInt(values.tipoActividadId),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear la actividad");
      }

      router.push("/actividades");
    } catch (error) {
      console.error("Error:", error);
      setError(
        error instanceof Error ? error.message : "Error al crear la actividad",
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
                  <BreadcrumbLink href="/actividades">
                    Actividades
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Nueva Actividad</BreadcrumbPage>
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

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Tabs defaultValue="basico">
                <TabsList className="mb-4 w-full">
                  <TabsTrigger value="basico" className="flex-1">
                    <Calendar className="mr-2 h-4 w-4" />
                    Lo básico
                  </TabsTrigger>
                  <TabsTrigger value="detalles" className="flex-1">
                    <Clock className="mr-2 h-4 w-4" />
                    Detalles opcionales
                  </TabsTrigger>
                </TabsList>

                {/* ── TAB 1: BÁSICO ── */}
                <TabsContent value="basico">
                  <Card>
                    <CardHeader>
                      <CardTitle>Información básica</CardTitle>
                      <CardDescription>
                        Con estos campos ya puedes guardar la actividad.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
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

                      {/* Fecha y hora */}
                      <div className="grid gap-4 md:grid-cols-3">
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

                      {/* Estado */}
                      <div className="grid gap-4 md:grid-cols-2">
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
                                  <SelectItem value="En curso">
                                    En curso
                                  </SelectItem>
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
                    </CardContent>
                    <CardFooter className="flex justify-end gap-3">
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => router.back()}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={saving}>
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creando...
                          </>
                        ) : (
                          "Crear Actividad"
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>

                {/* ── TAB 2: DETALLES ── */}
                <TabsContent value="detalles">
                  <Card>
                    <CardHeader>
                      <CardTitle>Detalles opcionales</CardTitle>
                      <CardDescription>
                        Complementa la actividad con descripción, imagen y
                        ubicación.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
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
                              Describe brevemente la actividad
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
                              Imagen promocional de la actividad
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Ubicación con Google Maps Embed */}
                      <FormField
                        control={form.control}
                        name="ubicacion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ubicación y Google Maps</FormLabel>
                            <FormControl>
                              <div className="space-y-4">
                                <UseIglesiaLocationButton
                                  onLocationSet={(data) => {
                                    field.onChange(data.direccion);
                                    form.setValue(
                                      "googleMapsEmbed",
                                      data.googleMapsEmbed,
                                    );
                                  }}
                                />
                                <GoogleMapsEmbed
                                  onLocationChange={(location: {
                                    direccion: string;
                                    googleMapsEmbed?: string;
                                  }) => {
                                    field.onChange(location.direccion);
                                    form.setValue(
                                      "googleMapsEmbed",
                                      location.googleMapsEmbed,
                                    );
                                  }}
                                  direccion={field.value || ""}
                                  googleMapsEmbed={form.getValues(
                                    "googleMapsEmbed",
                                  )}
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Dirección física del evento con embed de Google
                              Maps
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                    <CardFooter className="flex justify-end gap-3">
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => router.back()}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={saving}>
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creando...
                          </>
                        ) : (
                          "Crear Actividad"
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </Tabs>
            </form>
          </Form>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
