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
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, type ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CloudinaryUploader } from "../../../../components/CloudinaryUploader";
import { PhoneInput } from "../../../../components/PhoneInput";
import { formatDateForInput } from "@/lib/date-utils";
import { useApiConIglesia } from "@/hooks/useApiConIglesia";

const formSchema = z.object({
  nombres: z.string().min(2, "Los nombres deben tener al menos 2 caracteres"),
  apellidos: z
    .string()
    .min(2, "Los apellidos deben tener al menos 2 caracteres"),
  correo: z
    .union([z.string().email("Email inválido"), z.literal("")])
    .optional(),
  telefono: z.string().optional(),
  celular: z.string().optional(),
  direccion: z.string().optional(),
  fechaNacimiento: z.string().optional(),
  sexo: z.enum(["Masculino", "Femenino", "Otro"]).optional(),
  estadoCivil: z
    .enum(["Soltero/a", "Casado/a", "Viudo/a", "Divorciado/a"])
    .optional(),
  ocupacion: z.string().optional(),
  fechaPrimeraVisita: z.string().optional(),
  estado: z.enum(["ACTIVA", "INACTIVA", "RECURRENTE", "NUEVA"]).optional(),
  foto: z.string().optional(),
  notasAdicionales: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface VisitaData {
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
  fechaPrimeraVisita?: string;
  estado?: string;
  foto?: string;
  notasAdicionales?: string;
  tipo?: string;
}

export default function EditarVisitaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const { iglesiaActiva } = useApiConIglesia();
  const [visita, setVisita] = useState<VisitaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombres: "",
      apellidos: "",
      correo: "",
      telefono: "",
      celular: "",
      direccion: "",
      fechaNacimiento: "",
      sexo: undefined,
      estadoCivil: undefined,
      ocupacion: "",
      fechaPrimeraVisita: "",
      estado: "ACTIVA",
      foto: "",
      notasAdicionales: "",
    },
  });

  useEffect(() => {
    const fetchVisita = async () => {
      if (!iglesiaActiva?.id) return;

      setLoading(true);
      try {
        const url = new URL(`/api/miembros/${id}`, window.location.origin);
        url.searchParams.set("iglesiaId", iglesiaActiva.id.toString());

        const response = await fetch(url.toString());

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setVisita(data);

        form.reset({
          nombres: data.nombres || "",
          apellidos: data.apellidos || "",
          correo: data.correo || "",
          telefono: data.telefono || "",
          celular: data.celular || "",
          direccion: data.direccion || "",
          fechaNacimiento: formatDateForInput(data.fechaNacimiento),
          sexo: data.sexo,
          estadoCivil: data.estadoCivil,
          ocupacion: data.ocupacion || "",
          fechaPrimeraVisita: formatDateForInput(data.fechaPrimeraVisita),
          estado: (data.estado as "ACTIVA" | "INACTIVA" | "RECURRENTE" | "NUEVA") || "ACTIVA",
          foto: data.foto || "",
          notasAdicionales: data.notas || data.notasAdicionales || "",
        });
      } catch (err) {
        console.error("Error:", err);
        setError("Error al cargar los datos de la visita");
      } finally {
        setLoading(false);
      }
    };

    fetchVisita();
  }, [id, form, iglesiaActiva?.id]);

  async function onSubmit(values: FormValues) {
    if (!iglesiaActiva?.id) {
      setError("No hay iglesia seleccionada");
      return;
    }

    setSaving(true);
    try {
      const url = new URL(`/api/miembros/${id}`, window.location.origin);
      url.searchParams.set("iglesiaId", iglesiaActiva.id.toString());

      const response = await fetch(url.toString(), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      router.push(`/comunidad/${id}`);
    } catch (err) {
      console.error("Error:", err);
      setError(
        err instanceof Error ? err.message : "Error al guardar los cambios"
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
            <span className="ml-2">Cargando información de la visita...</span>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (error && !visita) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <p className="text-red-500 text-lg">{error}</p>
              <Button
                variant="outline"
                className="mt-4"
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
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/comunidad">Comunidad</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/comunidad/${id}`}>
                    {getNombreCompleto()}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Editar</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
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
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Editar Visita</CardTitle>
              <CardDescription>
                Modifica la información de la visita
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-8"
                >
                  <div className="space-y-6">
                    {/* ── Datos Personales ── */}
                    <div>
                      <h2 className="text-lg font-semibold mb-4">
                        Datos Personales
                      </h2>
                      <div className="grid gap-6 md:grid-cols-3 md:grid-rows-3">
                        {/* Nombres y Apellidos */}
                        <div className="md:col-span-2">
                          <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                              control={form.control}
                              name="nombres"
                              render={({
                                field,
                              }: {
                                field: ControllerRenderProps<FormValues>;
                              }) => (
                                <FormItem>
                                  <FormLabel>Nombres</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Juan Carlos" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="apellidos"
                              render={({
                                field,
                              }: {
                                field: ControllerRenderProps<FormValues>;
                              }) => (
                                <FormItem>
                                  <FormLabel>Apellidos</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="García López"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {/* Foto */}
                        <div className="md:row-span-3 flex flex-col items-center justify-center">
                          <div className="w-full bg-muted border border-border rounded-lg p-4 h-full flex flex-col justify-center">
                            <FormField
                              control={form.control}
                              name="foto"
                              render={({ field }) => (
                                <FormItem className="w-full">
                                  <FormLabel className="text-sm font-medium text-center block mb-3">
                                    Foto de la Visita
                                  </FormLabel>
                                  <FormControl>
                                    <CloudinaryUploader
                                      value={field.value}
                                      onChange={field.onChange}
                                      onRemove={() => field.onChange("")}
                                    />
                                  </FormControl>
                                  <FormDescription className="text-xs text-center text-gray-500 mt-2">
                                    Opcional - Máximo 5MB
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {/* Fecha Nacimiento, Sexo y Estado Civil */}
                        <div className="md:col-span-2">
                          <div className="grid gap-4 md:grid-cols-4">
                            <FormField
                              control={form.control}
                              name="fechaNacimiento"
                              render={({
                                field,
                              }: {
                                field: ControllerRenderProps<FormValues>;
                              }) => (
                                <FormItem className="md:col-span-2">
                                  <FormLabel>Fecha de Nacimiento</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="sexo"
                              render={({
                                field,
                              }: {
                                field: ControllerRenderProps<FormValues>;
                              }) => (
                                <FormItem>
                                  <FormLabel>Sexo</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Sexo" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Masculino">
                                        Masculino
                                      </SelectItem>
                                      <SelectItem value="Femenino">
                                        Femenino
                                      </SelectItem>
                                      <SelectItem value="Otro">Otro</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="estadoCivil"
                              render={({
                                field,
                              }: {
                                field: ControllerRenderProps<FormValues>;
                              }) => (
                                <FormItem>
                                  <FormLabel>Estado Civil</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Estado civil" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Soltero/a">
                                        Soltero/a
                                      </SelectItem>
                                      <SelectItem value="Casado/a">
                                        Casado/a
                                      </SelectItem>
                                      <SelectItem value="Viudo/a">
                                        Viudo/a
                                      </SelectItem>
                                      <SelectItem value="Divorciado/a">
                                        Divorciado/a
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {/* Ocupación */}
                        <div className="md:col-span-2">
                          <FormField
                            control={form.control}
                            name="ocupacion"
                            render={({
                              field,
                            }: {
                              field: ControllerRenderProps<FormValues>;
                            }) => (
                              <FormItem>
                                <FormLabel>Ocupación</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Ingeniero, Enfermera, etc."
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    {/* ── Datos de Contacto ── */}
                    <div>
                      <h2 className="text-lg font-semibold mb-4">
                        Datos de Contacto
                      </h2>
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="correo"
                          render={({
                            field,
                          }: {
                            field: ControllerRenderProps<FormValues>;
                          }) => (
                            <FormItem>
                              <FormLabel>Correo Electrónico</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="correo@email.com"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="telefono"
                          render={({
                            field,
                          }: {
                            field: ControllerRenderProps<FormValues>;
                          }) => (
                            <FormItem>
                              <FormLabel>Teléfono Fijo</FormLabel>
                              <FormControl>
                                <PhoneInput
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="809-699-7909"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="celular"
                          render={({
                            field,
                          }: {
                            field: ControllerRenderProps<FormValues>;
                          }) => (
                            <FormItem>
                              <FormLabel>Teléfono Celular</FormLabel>
                              <FormControl>
                                <PhoneInput
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="829-555-1234"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="direccion"
                          render={({
                            field,
                          }: {
                            field: ControllerRenderProps<FormValues>;
                          }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Dirección</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Calle Principal 123, Colonia Centro"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* ── Datos de Visita ── */}
                    <div>
                      <h2 className="text-lg font-semibold mb-4">
                        Datos de Visita
                      </h2>
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="fechaPrimeraVisita"
                          render={({
                            field,
                          }: {
                            field: ControllerRenderProps<FormValues>;
                          }) => (
                            <FormItem>
                              <FormLabel>Fecha de Primera Visita</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="estado"
                          render={({
                            field,
                          }: {
                            field: ControllerRenderProps<FormValues>;
                          }) => (
                            <FormItem>
                              <FormLabel>Estado</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona estado" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="ACTIVA">Activa</SelectItem>
                                  <SelectItem value="INACTIVA">Inactiva</SelectItem>
                                  <SelectItem value="RECURRENTE">Recurrente</SelectItem>
                                  <SelectItem value="NUEVA">Nueva</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="notasAdicionales"
                          render={({
                            field,
                          }: {
                            field: ControllerRenderProps<FormValues>;
                          }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Notas Adicionales</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Información adicional sobre la visita..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {saving ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
