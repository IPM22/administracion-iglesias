"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Plus,
  Search,
  Users,
  MoreHorizontal,
  UserPlus,
  Edit,
  Trash2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { ModeToggle } from "../../../../components/mode-toggle";
import MiembroSelector from "../../../../components/MiembroSelector";

const personaFormSchema = z.object({
  personaId: z.number().min(1, "Selecciona una persona"),
  rol: z.string().optional(),
  fechaInicio: z.string().optional(),
  esLider: z.boolean(),
});

const editarRolSchema = z.object({
  rol: z.string().optional(),
  estado: z.string().min(1, "Selecciona un estado"),
  esLider: z.boolean(),
});

type PersonaFormValues = z.infer<typeof personaFormSchema>;
type EditarRolValues = z.infer<typeof editarRolSchema>;

interface Persona {
  id: number;
  nombres: string;
  apellidos: string;
  foto?: string;
  correo?: string;
  telefono?: string;
  celular?: string;
  estado: string;
  tipo: string;
  rol: string;
  fechaBautismo?: string;
}

interface MinisterioPersona {
  id: number;
  persona: Persona;
  rol?: string;
  esLider: boolean;
  fechaInicio: string;
  fechaFin?: string;
  estado: string;
}

interface MinisterioBasico {
  id: number;
  nombre: string;
  descripcion?: string;
}

export default function GestionPersonasMinisterioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [ministerio, setMinisterio] = useState<MinisterioBasico | null>(null);
  const [personasMinisterio, setPersonasMinisterio] = useState<
    MinisterioPersona[]
  >([]);
  const [todasLasPersonas, setTodasLasPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [dialogAgregar, setDialogAgregar] = useState(false);
  const [dialogEditar, setDialogEditar] = useState(false);
  const [personaSeleccionada, setPersonaSeleccionada] =
    useState<MinisterioPersona | null>(null);
  const [personaParaAgregar, setPersonaParaAgregar] = useState<Persona | null>(
    null
  );

  const formAgregar = useForm<PersonaFormValues>({
    resolver: zodResolver(personaFormSchema),
    defaultValues: {
      personaId: 0,
      rol: "",
      fechaInicio: new Date().toISOString().split("T")[0],
      esLider: false,
    },
  });

  const formEditar = useForm<EditarRolValues>({
    resolver: zodResolver(editarRolSchema),
    defaultValues: {
      rol: "",
      estado: "Activo",
      esLider: false,
    },
  });

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Obtener información del ministerio
      const ministerioResponse = await fetch(`/api/ministerios/${id}`);
      if (!ministerioResponse.ok)
        throw new Error("Error al cargar el ministerio");
      const ministerioData = await ministerioResponse.json();
      setMinisterio(ministerioData);

      // Obtener personas del ministerio
      const personasResponse = await fetch(`/api/ministerios/${id}/miembros`);
      if (!personasResponse.ok)
        throw new Error("Error al cargar personas del ministerio");
      const personasData = await personasResponse.json();
      setPersonasMinisterio(personasData);

      // Obtener todas las personas con rol de miembro para el selector
      const todasResponse = await fetch("/api/miembros");
      if (!todasResponse.ok)
        throw new Error("Error al cargar la lista de personas");
      const todasData = await todasResponse.json();
      setTodasLasPersonas(todasData);
    } catch (error) {
      console.error("Error:", error);
      setError("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "Activo":
        return <Badge variant="default">Activo</Badge>;
      case "Inactivo":
        return <Badge variant="secondary">Inactivo</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const onSubmitAgregar = async (data: PersonaFormValues) => {
    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/ministerios/${id}/miembros`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personaId: data.personaId,
          rol: data.rol || null,
          fechaInicio: data.fechaInicio || null,
          estado: "Activo",
          esLider: data.esLider,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al agregar la persona");
      }

      // Actualizar la lista
      setPersonasMinisterio((prev) => [...prev, result]);
      setDialogAgregar(false);
      setPersonaParaAgregar(null);
      formAgregar.reset();
    } catch (error) {
      console.error("Error:", error);
      if (error instanceof Error) {
        formAgregar.setError("root", {
          type: "manual",
          message: error.message,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Actualizar el form cuando se selecciona una persona
  useEffect(() => {
    if (personaParaAgregar) {
      formAgregar.setValue("personaId", personaParaAgregar.id);
    } else {
      formAgregar.setValue("personaId", 0);
    }
  }, [personaParaAgregar, formAgregar]);

  const onSubmitEditar = async (data: EditarRolValues) => {
    if (!personaSeleccionada) return;

    try {
      setIsSubmitting(true);

      const response = await fetch(
        `/api/ministerios/${id}/miembros/${personaSeleccionada.persona.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al actualizar la persona");
      }

      // Actualizar la lista
      setPersonasMinisterio((prev) =>
        prev.map((p) => (p.id === result.id ? result : p))
      );
      setDialogEditar(false);
      setPersonaSeleccionada(null);
      formEditar.reset();
    } catch (error) {
      console.error("Error:", error);
      if (error instanceof Error) {
        formEditar.setError("root", {
          type: "manual",
          message: error.message,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const removerPersona = async (persona: MinisterioPersona) => {
    if (
      !confirm(
        `¿Estás seguro de remover a ${persona.persona.nombres} ${persona.persona.apellidos} del ministerio?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/ministerios/${id}/miembros/${persona.persona.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al remover la persona");
      }

      // Actualizar la lista (marcar como inactivo)
      setPersonasMinisterio((prev) =>
        prev.map((p) =>
          p.id === persona.id
            ? { ...p, estado: "Inactivo", fechaFin: new Date().toISOString() }
            : p
        )
      );
    } catch (error) {
      console.error("Error:", error);
      alert(
        error instanceof Error ? error.message : "Error al remover la persona"
      );
    }
  };

  const editarPersona = (persona: MinisterioPersona) => {
    setPersonaSeleccionada(persona);
    formEditar.reset({
      rol: persona.rol || "",
      estado: persona.estado,
      esLider: persona.esLider,
    });
    setDialogEditar(true);
  };

  // Filtrar personas disponibles (que no estén ya en el ministerio activamente)
  const personasDisponibles = todasLasPersonas.filter(
    (persona) =>
      !personasMinisterio.some(
        (pm) => pm.persona.id === persona.id && pm.estado === "Activo"
      )
  );

  // Filtrar personas por búsqueda
  const personasFiltradas = personasMinisterio.filter(
    (persona) =>
      persona.persona.nombres.toLowerCase().includes(busqueda.toLowerCase()) ||
      persona.persona.apellidos
        .toLowerCase()
        .includes(busqueda.toLowerCase()) ||
      (persona.rol &&
        persona.rol.toLowerCase().includes(busqueda.toLowerCase()))
  );

  // Obtener el líder actual
  const liderActual = personasMinisterio.find(
    (p) => p.esLider && p.estado === "Activo"
  );

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando gestión de personas...</span>
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
                  <BreadcrumbPage>Gestión de Personas</BreadcrumbPage>
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
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <Dialog open={dialogAgregar} onOpenChange={setDialogAgregar}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Agregar Persona
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Agregar Persona al Ministerio</DialogTitle>
                  <DialogDescription>
                    Selecciona una persona para agregar al ministerio{" "}
                    {ministerio?.nombre}
                  </DialogDescription>
                </DialogHeader>
                <Form {...formAgregar}>
                  <form
                    onSubmit={formAgregar.handleSubmit(onSubmitAgregar)}
                    className="space-y-4"
                  >
                    {formAgregar.formState.errors.root && (
                      <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-3 rounded-lg">
                        {formAgregar.formState.errors.root.message}
                      </div>
                    )}

                    <FormField
                      control={formAgregar.control}
                      name="personaId"
                      render={() => (
                        <FormItem>
                          <FormLabel>
                            Persona
                            <span className="text-red-500 ml-1">*</span>
                          </FormLabel>
                          <FormControl>
                            <MiembroSelector
                              miembros={personasDisponibles}
                              onSeleccionar={setPersonaParaAgregar}
                              miembroSeleccionado={personaParaAgregar}
                              placeholder="Buscar y seleccionar persona..."
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormDescription>
                            Busca por nombre, apellido o correo electrónico
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={formAgregar.control}
                      name="rol"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rol (Opcional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ej: Líder, Colaborador, Músico..."
                              {...field}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormDescription>
                            Especifica el rol o función específica en el
                            ministerio
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={formAgregar.control}
                      name="fechaInicio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha de Inicio</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={formAgregar.control}
                      name="esLider"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 rounded-lg border p-4">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                              disabled={isSubmitting}
                              className="h-4 w-4"
                            />
                          </FormControl>
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Designar como Líder del Ministerio
                            </FormLabel>
                            <FormDescription>
                              {liderActual
                                ? `Actualmente ${liderActual.persona.nombres} ${liderActual.persona.apellidos} es el líder`
                                : "Este ministerio no tiene líder asignado"}
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setDialogAgregar(false);
                          setPersonaParaAgregar(null);
                        }}
                        disabled={isSubmitting}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting || !personaParaAgregar}
                      >
                        {isSubmitting ? "Agregando..." : "Agregar"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Personas de {ministerio?.nombre}
                  </CardTitle>
                  <CardDescription>
                    Gestiona las personas y sus roles en el ministerio
                  </CardDescription>
                </div>
                <Badge variant="secondary">
                  {
                    personasMinisterio.filter((p) => p.estado === "Activo")
                      .length
                  }{" "}
                  activos
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Búsqueda */}
              <div className="flex items-center gap-2 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar personas por nombre o rol..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              {/* Lista de personas */}
              {personasFiltradas.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    {busqueda
                      ? "No se encontraron personas"
                      : "No hay personas en este ministerio"}
                  </p>
                  {!busqueda && (
                    <Button onClick={() => setDialogAgregar(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar primer persona
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {personasFiltradas.map((persona) => (
                    <div
                      key={persona.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={persona.persona.foto || "/placeholder.svg"}
                          />
                          <AvatarFallback>
                            {`${persona.persona.nombres[0]}${persona.persona.apellidos[0]}`}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {persona.persona.nombres}{" "}
                            {persona.persona.apellidos}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{persona.rol || "Persona"}</span>
                            <span>•</span>
                            <span>Desde {formatDate(persona.fechaInicio)}</span>
                            {persona.fechaFin && (
                              <>
                                <span>•</span>
                                <span>
                                  Hasta {formatDate(persona.fechaFin)}
                                </span>
                              </>
                            )}
                          </div>
                          {persona.persona.correo && (
                            <div className="text-xs text-muted-foreground">
                              {persona.persona.correo}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getEstadoBadge(persona.estado)}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/personas/${persona.persona.id}`)
                              }
                            >
                              Ver perfil
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => editarPersona(persona)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Editar rol
                            </DropdownMenuItem>
                            {persona.estado === "Activo" && (
                              <DropdownMenuItem
                                onClick={() => removerPersona(persona)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remover
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dialog para editar */}
        <Dialog open={dialogEditar} onOpenChange={setDialogEditar}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Persona del Ministerio</DialogTitle>
              <DialogDescription>
                Actualiza el rol y estado de{" "}
                {personaSeleccionada?.persona.nombres}{" "}
                {personaSeleccionada?.persona.apellidos}
              </DialogDescription>
            </DialogHeader>
            <Form {...formEditar}>
              <form
                onSubmit={formEditar.handleSubmit(onSubmitEditar)}
                className="space-y-4"
              >
                {formEditar.formState.errors.root && (
                  <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-3 rounded-lg">
                    {formEditar.formState.errors.root.message}
                  </div>
                )}

                <FormField
                  control={formEditar.control}
                  name="rol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rol</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: Líder, Colaborador, Músico..."
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={formEditar.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Estado
                        <span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Activo">Activo</SelectItem>
                          <SelectItem value="Inactivo">Inactivo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={formEditar.control}
                  name="esLider"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 rounded-lg border p-4">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          disabled={isSubmitting}
                          className="h-4 w-4"
                        />
                      </FormControl>
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Es Líder del Ministerio
                        </FormLabel>
                        <FormDescription>
                          Cambiar el liderazgo del ministerio
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogEditar(false)}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
