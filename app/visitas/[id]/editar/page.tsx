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
import { ModeToggle } from "../../../../components/mode-toggle";
import { formatDateForInput } from "@/lib/date-utils";

const formSchema = z.object({
  nombres: z.string().min(2, "Los nombres deben tener al menos 2 caracteres"),
  apellidos: z
    .string()
    .min(2, "Los apellidos deben tener al menos 2 caracteres"),
  correo: z
    .union([z.string().email("Correo inválido"), z.literal("")])
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
  familia: z.string().optional(),
  fechaPrimeraVisita: z.string().optional(),
  estado: z.enum(["Nueva", "Recurrente"]).optional(),
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
  familia?: string;
  estado?: string;
  foto?: string;
  notasAdicionales?: string;
  fechaPrimeraVisita?: string;
}

export default function EditarVisitaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      familia: "",
      fechaPrimeraVisita: "",
      estado: undefined,
      foto: "",
      notasAdicionales: "",
    },
  });

  useEffect(() => {
    const fetchVisita = async () => {
      try {
        const response = await fetch(`/api/visitas/${id}`);
        if (!response.ok) {
          throw new Error("Error al obtener los datos de la visita");
        }
        const data: VisitaData = await response.json();

        // Llenar el formulario con los datos existentes
        form.reset({
          nombres: data.nombres || "",
          apellidos: data.apellidos || "",
          correo: data.correo || "",
          telefono: data.telefono || "",
          celular: data.celular || "",
          direccion: data.direccion || "",
          fechaNacimiento: formatDateForInput(data.fechaNacimiento),
          sexo: data.sexo as "Masculino" | "Femenino" | "Otro" | undefined,
          estadoCivil: data.estadoCivil as
            | "Soltero/a"
            | "Casado/a"
            | "Viudo/a"
            | "Divorciado/a"
            | undefined,
          ocupacion: data.ocupacion || "",
          familia: data.familia || "",
          fechaPrimeraVisita: formatDateForInput(data.fechaPrimeraVisita),
          estado: data.estado as "Nueva" | "Recurrente" | undefined,
          foto: data.foto || "",
          notasAdicionales: data.notasAdicionales || "",
        });
      } catch (error) {
        console.error("Error:", error);
        setError("Error al cargar los datos de la visita");
      } finally {
        setLoading(false);
      }
    };

    fetchVisita();
  }, [id, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/visitas/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar la visita");
      }

      router.push(`/visitas/${id}`);
    } catch (error) {
      console.error("Error:", error);
      setError(
        error instanceof Error ? error.message : "Error al guardar la visita"
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
            <span className="ml-2">Cargando datos de la visita...</span>
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
                    Detalle
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
                  {/* Sección de Datos Personales con Foto */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">
                        Datos Personales
                      </h3>
                      <div className="grid gap-6 md:grid-cols-3 md:grid-rows-3">
                        {/* Primera fila - Nombres y Apellidos */}
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
                                    <Input placeholder="María" {...field} />
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
                                    <Input placeholder="González" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {/* Columna derecha - Foto (ocupa las 3 filas desde el inicio) */}
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
                                  <FormDescription className="text-xs text-center text-muted-foreground mt-2">
                                    Opcional - Máximo 5MB
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {/* Segunda fila - Fecha de nacimiento, Sexo y Estado Civil */}
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
                                  <FormDescription>Opcional</FormDescription>
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
                                        <SelectValue placeholder="Selecciona" />
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
                                  <FormDescription>Opcional</FormDescription>
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
                                        <SelectValue placeholder="Selecciona" />
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
                                  <FormDescription>Opcional</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {/* Tercera fila - Ocupación y Familia */}
                        <div className="md:col-span-2">
                          <div className="grid gap-4 md:grid-cols-2">
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
                                    <Input placeholder="Doctora" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="familia"
                              render={({
                                field,
                              }: {
                                field: ControllerRenderProps<FormValues>;
                              }) => (
                                <FormItem>
                                  <FormLabel>Familia</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Familia González"
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
                    </div>
                  </div>

                  {/* Sección de Datos de Contacto */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Datos de Contacto</h3>
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
                            <FormLabel>Correo</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="maria@ejemplo.com"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>Opcional</FormDescription>
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
                            <FormLabel>Teléfono</FormLabel>
                            <FormControl>
                              <PhoneInput
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="809-699-7909"
                              />
                            </FormControl>
                            <FormDescription>Opcional</FormDescription>
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
                            <FormLabel>Celular</FormLabel>
                            <FormControl>
                              <PhoneInput
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="809-699-7909"
                              />
                            </FormControl>
                            <FormDescription>Opcional</FormDescription>
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
                          <FormItem>
                            <FormLabel>Dirección</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Calle Principal 123, Ciudad"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Sección de Información de Visita */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">
                      Información de Visita
                    </h3>
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
                            <FormDescription>Opcional</FormDescription>
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
                                  <SelectValue placeholder="Selecciona un estado" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Nueva">Nueva</SelectItem>
                                <SelectItem value="Recurrente">
                                  Recurrente
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Sección de Notas Adicionales */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">
                      Información Adicional
                    </h3>
                    <FormField
                      control={form.control}
                      name="notasAdicionales"
                      render={({
                        field,
                      }: {
                        field: ControllerRenderProps<FormValues>;
                      }) => (
                        <FormItem>
                          <FormLabel>Notas Adicionales</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Información adicional sobre la visita, cómo conoció la iglesia, etc..."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Opcional</FormDescription>
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
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
