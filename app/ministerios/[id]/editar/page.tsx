"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Textarea } from "@/components/ui/textarea";
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
import { ArrowLeft, Save, Users, AlertTriangle } from "lucide-react";
import { ModeToggle } from "../../../../components/mode-toggle";
import {
  ministerioSchema,
  type MinisterioFormValues,
} from "../../../../src/lib/validations/ministerio";

interface MinisterioDetalle {
  id: number;
  nombre: string;
  descripcion?: string;
}

export default function EditarMinisterioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [ministerio, setMinisterio] = useState<MinisterioDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<MinisterioFormValues>({
    resolver: zodResolver(ministerioSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
    },
  });

  useEffect(() => {
    if (id) {
      fetchMinisterio();
    }
  }, [id]);

  const fetchMinisterio = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ministerios/${id}`);

      if (!response.ok) {
        throw new Error("Error al cargar el ministerio");
      }

      const data = await response.json();
      setMinisterio(data);

      // Actualizar el formulario con los datos
      form.reset({
        nombre: data.nombre,
        descripcion: data.descripcion || "",
      });
    } catch (error) {
      console.error("Error:", error);
      setError("Error al cargar los detalles del ministerio");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: MinisterioFormValues) => {
    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/ministerios/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al actualizar el ministerio");
      }

      // Redirigir a la página de detalles
      router.push(`/ministerios/${id}`);
    } catch (error) {
      console.error("Error:", error);

      // Mostrar error específico
      if (error instanceof Error) {
        if (error.message.includes("Ya existe")) {
          form.setError("nombre", {
            type: "manual",
            message: error.message,
          });
        } else {
          form.setError("root", {
            type: "manual",
            message: error.message,
          });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <div className="flex items-center justify-between flex-1">
                <h1 className="text-lg font-semibold">Cargando...</h1>
                <ModeToggle />
              </div>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-center py-20">
              <p>Cargando ministerio...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (error || !ministerio) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <div className="flex items-center justify-between flex-1">
                <h1 className="text-lg font-semibold">Error</h1>
                <ModeToggle />
              </div>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-500 mb-4">
                  {error || "Ministerio no encontrado"}
                </p>
                <Button onClick={() => router.push("/ministerios")}>
                  Volver a Ministerios
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
                  <BreadcrumbLink href="/ministerios">
                    Ministerios
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/ministerios/${id}`}>
                    {ministerio.nombre}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Editar</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="ml-auto">
              <ModeToggle />
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </div>

          <Card className="max-w-2xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <div>
                  <CardTitle>Editar Ministerio</CardTitle>
                  <CardDescription>
                    Actualiza la información del ministerio {ministerio.nombre}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {form.formState.errors.root && (
                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-3 rounded-lg">
                      {form.formState.errors.root.message}
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Nombre del Ministerio
                          <span className="text-red-500 ml-1">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ej: Alabanza y Adoración, Ministerio de Jóvenes..."
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormDescription>
                          Nombre único que identificará este ministerio
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="descripcion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe el propósito y actividades de este ministerio..."
                            className="min-h-[100px]"
                            {...field}
                            value={field.value || ""}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormDescription>
                          Descripción opcional del ministerio y sus objetivos
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3 pt-6">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Información adicional */}
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="text-base">
                ℹ️ Información importante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-muted-foreground">
                <p>• Los cambios se aplicarán inmediatamente</p>
                <p>• El nombre debe ser único entre todos los ministerios</p>
                <p>
                  • Los miembros y actividades del ministerio no se verán
                  afectados
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
