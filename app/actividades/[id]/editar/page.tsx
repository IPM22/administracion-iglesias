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
import { ArrowLeft, Edit, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ModeToggle } from "../../../../components/mode-toggle";
import { CloudinaryUploader } from "../../../../components/CloudinaryUploader";
import MinisterioSelector from "../../../../components/MinisterioSelector";
import { LocationPicker } from "../../../../components/LocationPicker";

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
  horaInicio?: string;
  horaFin?: string;
  ubicacion?: string;
  latitud?: number;
  longitud?: number;
  responsable?: string;
  estado: string;
  tipoActividadId: number;
  ministerioId?: number;
  tipoActividad: TipoActividad;
  ministerio?: Ministerio;
  banner?: string;
}

const formSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
  fecha: z.string().min(1, "La fecha es requerida"),
  horaInicio: z.string().optional(),
  horaFin: z.string().optional(),
  ubicacion: z.string().optional(),
  latitud: z.number().optional(),
  longitud: z.number().optional(),
  tipoActividadId: z.string().min(1, "El tipo de actividad es requerido"),
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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      fecha: "",
      horaInicio: "",
      horaFin: "",
      ubicacion: "",
      latitud: undefined,
      longitud: undefined,
      tipoActividadId: "",
      ministerioId: undefined,
      estado: "Programada",
      banner: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener tipos de actividad
        const tiposResponse = await fetch("/api/tipos-actividad");
        if (!tiposResponse.ok) {
          throw new Error("Error al obtener los tipos de actividad");
        }
        const tiposData = await tiposResponse.json();
        setTiposActividad(tiposData);

        // Cargar ministerios
        const ministeriosResponse = await fetch("/api/ministerios");
        if (!ministeriosResponse.ok) {
          throw new Error("Error al obtener los ministerios");
        }
        const ministeriosData = await ministeriosResponse.json();
        setMinisterios(ministeriosData);

        // Obtener actividad actual
        const actividadResponse = await fetch(`/api/actividades/${id}`);
        if (!actividadResponse.ok) {
          throw new Error("Error al obtener la actividad");
        }
        const actividadData = await actividadResponse.json();
        setActividad(actividadData);

        // Configurar ministerio seleccionado si existe
        if (actividadData.ministerio) {
          setMinisterioSeleccionado(actividadData.ministerio);
        }

        // Formatear fecha para input date
        const fechaFormateada = new Date(actividadData.fecha)
          .toISOString()
          .split("T")[0];

        // Cargar datos en el formulario
        form.reset({
          nombre: actividadData.nombre || "",
          descripcion: actividadData.descripcion || "",
          fecha: fechaFormateada,
          horaInicio: actividadData.horaInicio || "",
          horaFin: actividadData.horaFin || "",
          ubicacion: actividadData.ubicacion || "",
          latitud: actividadData.latitud,
          longitud: actividadData.longitud,
          tipoActividadId: actividadData.tipoActividadId.toString(),
          ministerioId: actividadData.ministerioId,
          estado: actividadData.estado,
          banner: actividadData.banner || "",
        });
      } catch (error) {
        console.error("Error:", error);
        setError("Error al cargar los datos");
      } finally {
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

    try {
      const response = await fetch(`/api/actividades/${id}`, {
        method: "PUT",
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
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4">Cargando actividad...</p>
            </div>
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
                    {/* Fecha */}
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

                  {/* Ubicación con Geolocalización */}
                  <FormField
                    control={form.control}
                    name="ubicacion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ubicación y Geolocalización</FormLabel>
                        <FormControl>
                          <LocationPicker
                            onLocationChange={(location: {
                              direccion: string;
                              latitud?: number;
                              longitud?: number;
                            }) => {
                              field.onChange(location.direccion);
                              form.setValue("latitud", location.latitud);
                              form.setValue("longitud", location.longitud);
                            }}
                            direccion={field.value || ""}
                            latitud={form.getValues("latitud")}
                            longitud={form.getValues("longitud")}
                          />
                        </FormControl>
                        <FormDescription>
                          Opcional - Dirección física del evento con coordenadas
                          GPS
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
                  <span className="font-medium">Geolocalización:</span>
                  <p className="text-muted-foreground">
                    Puedes actualizar las coordenadas GPS manualmente. También
                    puedes obtener coordenadas desde Google Maps haciendo clic
                    derecho en el punto deseado.
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
