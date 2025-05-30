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
import { ArrowLeft, Calendar, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, type ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ModeToggle } from "../../../../../components/mode-toggle";

const formSchema = z
  .object({
    fecha: z.string().min(1, "La fecha es requerida"),
    tipoActividadId: z.string().optional(),
    actividadId: z.string().optional(),
    invitadoPorId: z.string().optional(),
    observaciones: z.string().optional(),
  })
  .refine((data) => data.tipoActividadId || data.actividadId, {
    message: "Debe seleccionar un tipo de actividad o una actividad específica",
    path: ["tipoActividadId"],
  });

type FormValues = z.infer<typeof formSchema>;

interface TipoActividad {
  id: number;
  nombre: string;
  tipo: string;
}

interface Miembro {
  id: number;
  nombres: string;
  apellidos: string;
}

interface Visita {
  id: number;
  nombres: string;
  apellidos: string;
}

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
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [visita, setVisita] = useState<Visita | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fecha: new Date().toISOString().split("T")[0], // Fecha actual por defecto
      tipoActividadId: "",
      actividadId: "",
      invitadoPorId: "none",
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
        setMiembros(miembrosData);
      } catch (error) {
        console.error("Error:", error);
        setError("Error al cargar los datos necesarios");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

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
          fecha: values.fecha,
          tipoActividadId: values.tipoActividadId || null,
          actividadId: values.actividadId || null,
          invitadoPorId:
            values.invitadoPorId === "none"
              ? null
              : values.invitadoPorId || null,
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
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4">Cargando formulario...</p>
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
                  {/* Fecha de la visita */}
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
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona el tipo de actividad" />
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
                          Selecciona si fue una actividad regular (culto,
                          estudio) o especial
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Invitado por */}
                  <FormField
                    control={form.control}
                    name="invitadoPorId"
                    render={({
                      field,
                    }: {
                      field: ControllerRenderProps<FormValues>;
                    }) => (
                      <FormItem>
                        <FormLabel>Invitado por</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona quién lo invitó (opcional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">
                              Sin especificar
                            </SelectItem>
                            {miembros.map((miembro) => (
                              <SelectItem
                                key={miembro.id}
                                value={miembro.id.toString()}
                              >
                                {miembro.nombres} {miembro.apellidos}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Opcional - Indica qué miembro invitó a esta persona
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
