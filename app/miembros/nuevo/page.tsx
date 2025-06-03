"use client";

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
import { ArrowLeft, UserCheck, InfoIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, type ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import { CloudinaryUploader } from "../../../components/CloudinaryUploader";
import { PhoneInput } from "../../../components/PhoneInput";
import FamiliaSelector from "../../../components/FamiliaSelector";

interface Familia {
  id: number;
  apellido: string;
  nombre?: string;
  estado: string;
}

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
  familiaId: z.string().optional(),
  parentescoFamiliar: z.string().optional(),
  fechaIngreso: z.string().optional(),
  fechaBautismo: z.string().optional(),
  estado: z.enum(["Activo", "Inactivo"]).optional(),
  foto: z.string().optional(),
  notasAdicionales: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NuevoMiembroPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [familias, setFamilias] = useState<Familia[]>([]);
  const [familiaSeleccionada, setFamiliaSeleccionada] =
    useState<Familia | null>(null);
  const [esConversion, setEsConversion] = useState(false);
  const [visitaId, setVisitaId] = useState<string | null>(null);

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
      familiaId: undefined,
      parentescoFamiliar: "",
      fechaIngreso: "",
      fechaBautismo: "",
      estado: undefined,
      foto: "",
      notasAdicionales: "",
    },
  });

  // Cargar familias
  useEffect(() => {
    cargarFamilias();
  }, []);

  // Llenar formulario con datos de URL si viene de conversión
  useEffect(() => {
    const fromVisita = searchParams.get("fromVisita");
    if (fromVisita) {
      setEsConversion(true);
      setVisitaId(fromVisita);

      // Pre-llenar formulario con datos de la URL
      const nombres = searchParams.get("nombres");
      const apellidos = searchParams.get("apellidos");
      const correo = searchParams.get("correo");
      const telefono = searchParams.get("telefono");
      const celular = searchParams.get("celular");
      const direccion = searchParams.get("direccion");
      const fechaNacimiento = searchParams.get("fechaNacimiento");
      const sexo = searchParams.get("sexo");
      const estadoCivil = searchParams.get("estadoCivil");
      const ocupacion = searchParams.get("ocupacion");
      const familia = searchParams.get("familia");
      const foto = searchParams.get("foto");
      const notasAdicionales = searchParams.get("notasAdicionales");

      // Actualizar formulario con datos
      if (nombres) form.setValue("nombres", nombres);
      if (apellidos) form.setValue("apellidos", apellidos);
      if (correo) form.setValue("correo", correo);
      if (telefono) form.setValue("telefono", telefono);
      if (celular) form.setValue("celular", celular);
      if (direccion) form.setValue("direccion", direccion);
      if (fechaNacimiento) form.setValue("fechaNacimiento", fechaNacimiento);
      if (sexo && ["Masculino", "Femenino", "Otro"].includes(sexo)) {
        form.setValue("sexo", sexo as "Masculino" | "Femenino" | "Otro");
      }
      if (
        estadoCivil &&
        ["Soltero/a", "Casado/a", "Viudo/a", "Divorciado/a"].includes(
          estadoCivil
        )
      ) {
        form.setValue(
          "estadoCivil",
          estadoCivil as "Soltero/a" | "Casado/a" | "Viudo/a" | "Divorciado/a"
        );
      }
      if (ocupacion) form.setValue("ocupacion", ocupacion);
      if (familia) form.setValue("familia", familia);
      if (foto) form.setValue("foto", foto);
      if (notasAdicionales) form.setValue("notasAdicionales", notasAdicionales);

      // Establecer fecha de ingreso como hoy por defecto
      const hoy = new Date().toISOString().split("T")[0];
      form.setValue("fechaIngreso", hoy);

      // Estado activo por defecto
      form.setValue("estado", "Activo");
    }
  }, [searchParams, form]);

  const cargarFamilias = async () => {
    try {
      const response = await fetch("/api/familias");
      if (response.ok) {
        const data = await response.json();
        setFamilias(data);
      }
    } catch (error) {
      console.error("Error al cargar familias:", error);
    }
  };

  // Actualizar familiaId cuando se selecciona una familia
  useEffect(() => {
    if (familiaSeleccionada) {
      form.setValue("familiaId", familiaSeleccionada.id.toString());
      // También actualizar el campo legacy para compatibilidad
      form.setValue(
        "familia",
        familiaSeleccionada.nombre || `Familia ${familiaSeleccionada.apellido}`
      );
    } else {
      form.setValue("familiaId", undefined);
      form.setValue("familia", "");
    }
  }, [familiaSeleccionada, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSaving(true);
    setError(null);
    try {
      // Agregar fromVisita si es una conversión
      const bodyData = visitaId ? { ...values, fromVisita: visitaId } : values;

      const response = await fetch("/api/miembros", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear el miembro");
      }

      // Si es conversión, mostrar mensaje especial y redirigir
      if (esConversion) {
        router.push("/miembros?converted=true");
      } else {
        router.push("/miembros");
      }
    } catch (error) {
      console.error("Error:", error);
      setError(
        error instanceof Error ? error.message : "Error al guardar el miembro"
      );
    } finally {
      setSaving(false);
    }
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
                  <BreadcrumbLink href="/miembros">Miembros</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Nuevo Miembro</BreadcrumbPage>
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

          {esConversion && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-start gap-3">
                <UserCheck className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">
                    Convirtiendo Visita a Miembro
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-blue-800">
                    <InfoIcon className="h-4 w-4" />
                    <span>
                      La información de la visita se ha pre-cargado. Completa
                      los datos de bautismo y otros campos necesarios.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Nuevo Miembro</CardTitle>
              <CardDescription>
                Ingresa la información del nuevo miembro de la iglesia
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
                                    <Input placeholder="Juan" {...field} />
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
                                    <Input placeholder="Pérez" {...field} />
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
                                    Foto del Miembro
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
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Selecciona un sexo" />
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
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Selecciona estado civil" />
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
                                    <Input placeholder="Ingeniero" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="familia"
                              render={() => (
                                <FormItem>
                                  <FormLabel>Familia</FormLabel>
                                  <FormControl>
                                    <FamiliaSelector
                                      familias={familias}
                                      familiaSeleccionada={familiaSeleccionada}
                                      onSeleccionar={setFamiliaSeleccionada}
                                    />
                                  </FormControl>
                                  <FormDescription>Opcional</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="parentescoFamiliar"
                              render={({
                                field,
                              }: {
                                field: ControllerRenderProps<FormValues>;
                              }) => (
                                <FormItem>
                                  <FormLabel>Parentesco Familiar</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={!familiaSeleccionada}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Selecciona parentesco" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Cabeza de Familia">
                                        Cabeza de Familia
                                      </SelectItem>
                                      <SelectItem value="Esposo/a">
                                        Esposo/a
                                      </SelectItem>
                                      <SelectItem value="Hijo/a">
                                        Hijo/a
                                      </SelectItem>
                                      <SelectItem value="Padre/Madre">
                                        Padre/Madre
                                      </SelectItem>
                                      <SelectItem value="Abuelo/a">
                                        Abuelo/a
                                      </SelectItem>
                                      <SelectItem value="Hermano/a">
                                        Hermano/a
                                      </SelectItem>
                                      <SelectItem value="Tío/a">
                                        Tío/a
                                      </SelectItem>
                                      <SelectItem value="Sobrino/a">
                                        Sobrino/a
                                      </SelectItem>
                                      <SelectItem value="Primo/a">
                                        Primo/a
                                      </SelectItem>
                                      <SelectItem value="Cuñado/a">
                                        Cuñado/a
                                      </SelectItem>
                                      <SelectItem value="Yerno/Nuera">
                                        Yerno/Nuera
                                      </SelectItem>
                                      <SelectItem value="Suegro/a">
                                        Suegro/a
                                      </SelectItem>
                                      <SelectItem value="Nieto/a">
                                        Nieto/a
                                      </SelectItem>
                                      <SelectItem value="Otro">Otro</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormDescription>
                                    {familiaSeleccionada
                                      ? "Define la relación con el cabeza de familia"
                                      : "Selecciona una familia primero"}
                                  </FormDescription>
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
                                placeholder="juan@ejemplo.com"
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

                  {/* Sección de Datos Ministeriales */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Datos Ministeriales</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="fechaIngreso"
                        render={({
                          field,
                        }: {
                          field: ControllerRenderProps<FormValues>;
                        }) => (
                          <FormItem>
                            <FormLabel>Fecha de Ingreso</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fechaBautismo"
                        render={({
                          field,
                        }: {
                          field: ControllerRenderProps<FormValues>;
                        }) => (
                          <FormItem>
                            <FormLabel>Fecha de Bautismo</FormLabel>
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
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona un estado" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Activo">Activo</SelectItem>
                                <SelectItem value="Inactivo">
                                  Inactivo
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
                              placeholder="Información adicional relevante..."
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
                      {saving ? "Guardando..." : "Guardar Miembro"}
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
