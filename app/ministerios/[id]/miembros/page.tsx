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
  Edit,
  Trash2,
  UserPlus,
  AlertTriangle,
} from "lucide-react";
import { ModeToggle } from "../../../../components/mode-toggle";
import MiembroSelector from "../../../../components/MiembroSelector";

const miembroFormSchema = z.object({
  miembroId: z.number().min(1, "Selecciona un miembro"),
  rol: z.string().optional(),
  fechaInicio: z.string().optional(),
  esLider: z.boolean(),
});

const editarRolSchema = z.object({
  rol: z.string().optional(),
  estado: z.string().min(1, "Selecciona un estado"),
  esLider: z.boolean(),
});

type MiembroFormValues = z.infer<typeof miembroFormSchema>;
type EditarRolValues = z.infer<typeof editarRolSchema>;

interface Miembro {
  id: number;
  nombres: string;
  apellidos: string;
  foto?: string;
  correo?: string;
  telefono?: string;
  celular?: string;
  estado: string;
}

interface MinisterioMiembro {
  id: number;
  miembro: Miembro;
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

export default function GestionMiembrosMinisterioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [ministerio, setMinisterio] = useState<MinisterioBasico | null>(null);
  const [miembrosMinisterio, setMiembrosMinisterio] = useState<
    MinisterioMiembro[]
  >([]);
  const [todosLosMiembros, setTodosLosMiembros] = useState<Miembro[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [dialogAgregar, setDialogAgregar] = useState(false);
  const [dialogEditar, setDialogEditar] = useState(false);
  const [miembroSeleccionado, setMiembroSeleccionado] =
    useState<MinisterioMiembro | null>(null);
  const [miembroParaAgregar, setMiembroParaAgregar] = useState<Miembro | null>(
    null
  );

  const formAgregar = useForm<MiembroFormValues>({
    resolver: zodResolver(miembroFormSchema),
    defaultValues: {
      miembroId: 0,
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

      // Obtener miembros del ministerio
      const miembrosResponse = await fetch(`/api/ministerios/${id}/miembros`);
      if (!miembrosResponse.ok)
        throw new Error("Error al cargar miembros del ministerio");
      const miembrosData = await miembrosResponse.json();
      setMiembrosMinisterio(miembrosData);

      // Obtener todos los miembros para el selector
      const todosResponse = await fetch("/api/miembros");
      if (!todosResponse.ok)
        throw new Error("Error al cargar la lista de miembros");
      const todosData = await todosResponse.json();
      setTodosLosMiembros(todosData);
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

  const onSubmitAgregar = async (data: MiembroFormValues) => {
    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/ministerios/${id}/miembros`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          miembroId: data.miembroId,
          rol: data.rol || null,
          fechaInicio: data.fechaInicio || null,
          estado: "Activo",
          esLider: data.esLider,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al agregar el miembro");
      }

      // Actualizar la lista
      setMiembrosMinisterio((prev) => [...prev, result]);
      setDialogAgregar(false);
      setMiembroParaAgregar(null);
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

  // Actualizar el form cuando se selecciona un miembro
  useEffect(() => {
    if (miembroParaAgregar) {
      formAgregar.setValue("miembroId", miembroParaAgregar.id);
    } else {
      formAgregar.setValue("miembroId", 0);
    }
  }, [miembroParaAgregar, formAgregar]);

  const onSubmitEditar = async (data: EditarRolValues) => {
    if (!miembroSeleccionado) return;

    try {
      setIsSubmitting(true);

      const response = await fetch(
        `/api/ministerios/${id}/miembros/${miembroSeleccionado.miembro.id}`,
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
        throw new Error(result.error || "Error al actualizar el miembro");
      }

      // Actualizar la lista
      setMiembrosMinisterio((prev) =>
        prev.map((m) => (m.id === result.id ? result : m))
      );
      setDialogEditar(false);
      setMiembroSeleccionado(null);
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

  const removerMiembro = async (miembro: MinisterioMiembro) => {
    if (
      !confirm(
        `¿Estás seguro de remover a ${miembro.miembro.nombres} ${miembro.miembro.apellidos} del ministerio?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/ministerios/${id}/miembros/${miembro.miembro.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al remover el miembro");
      }

      // Actualizar la lista (marcar como inactivo)
      setMiembrosMinisterio((prev) =>
        prev.map((m) =>
          m.id === miembro.id
            ? { ...m, estado: "Inactivo", fechaFin: new Date().toISOString() }
            : m
        )
      );
    } catch (error) {
      console.error("Error:", error);
      alert(
        error instanceof Error ? error.message : "Error al remover el miembro"
      );
    }
  };

  const editarMiembro = (miembro: MinisterioMiembro) => {
    setMiembroSeleccionado(miembro);
    formEditar.reset({
      rol: miembro.rol || "",
      estado: miembro.estado,
      esLider: miembro.esLider,
    });
    setDialogEditar(true);
  };

  // Filtrar miembros disponibles (que no estén ya en el ministerio activamente)
  const miembrosDisponibles = todosLosMiembros.filter(
    (miembro) =>
      !miembrosMinisterio.some(
        (mm) => mm.miembro.id === miembro.id && mm.estado === "Activo"
      )
  );

  // Filtrar miembros por búsqueda
  const miembrosFiltrados = miembrosMinisterio.filter(
    (miembro) =>
      miembro.miembro.nombres.toLowerCase().includes(busqueda.toLowerCase()) ||
      miembro.miembro.apellidos
        .toLowerCase()
        .includes(busqueda.toLowerCase()) ||
      (miembro.rol &&
        miembro.rol.toLowerCase().includes(busqueda.toLowerCase()))
  );

  // Obtener el líder actual
  const liderActual = miembrosMinisterio.find(
    (m) => m.esLider && m.estado === "Activo"
  );

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
              <p>Cargando gestión de miembros...</p>
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
                  <BreadcrumbPage>Gestión de Miembros</BreadcrumbPage>
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
                  Agregar Miembro
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Agregar Miembro al Ministerio</DialogTitle>
                  <DialogDescription>
                    Selecciona un miembro para agregar al ministerio{" "}
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
                      name="miembroId"
                      render={() => (
                        <FormItem>
                          <FormLabel>
                            Miembro
                            <span className="text-red-500 ml-1">*</span>
                          </FormLabel>
                          <FormControl>
                            <MiembroSelector
                              miembros={miembrosDisponibles}
                              onSeleccionar={setMiembroParaAgregar}
                              miembroSeleccionado={miembroParaAgregar}
                              placeholder="Buscar y seleccionar miembro..."
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
                                ? `Actualmente ${liderActual.miembro.nombres} ${liderActual.miembro.apellidos} es el líder`
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
                          setMiembroParaAgregar(null);
                        }}
                        disabled={isSubmitting}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting || !miembroParaAgregar}
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
                    Miembros de {ministerio?.nombre}
                  </CardTitle>
                  <CardDescription>
                    Gestiona los miembros y sus roles en el ministerio
                  </CardDescription>
                </div>
                <Badge variant="secondary">
                  {
                    miembrosMinisterio.filter((m) => m.estado === "Activo")
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
                    placeholder="Buscar miembros por nombre o rol..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              {/* Lista de miembros */}
              {miembrosFiltrados.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    {busqueda
                      ? "No se encontraron miembros"
                      : "No hay miembros en este ministerio"}
                  </p>
                  {!busqueda && (
                    <Button onClick={() => setDialogAgregar(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar primer miembro
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {miembrosFiltrados.map((miembro) => (
                    <div
                      key={miembro.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={miembro.miembro.foto || "/placeholder.svg"}
                          />
                          <AvatarFallback>
                            {`${miembro.miembro.nombres[0]}${miembro.miembro.apellidos[0]}`}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {miembro.miembro.nombres}{" "}
                            {miembro.miembro.apellidos}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{miembro.rol || "Miembro"}</span>
                            <span>•</span>
                            <span>Desde {formatDate(miembro.fechaInicio)}</span>
                            {miembro.fechaFin && (
                              <>
                                <span>•</span>
                                <span>
                                  Hasta {formatDate(miembro.fechaFin)}
                                </span>
                              </>
                            )}
                          </div>
                          {miembro.miembro.correo && (
                            <div className="text-xs text-muted-foreground">
                              {miembro.miembro.correo}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getEstadoBadge(miembro.estado)}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/miembros/${miembro.miembro.id}`)
                              }
                            >
                              Ver perfil
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => editarMiembro(miembro)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Editar rol
                            </DropdownMenuItem>
                            {miembro.estado === "Activo" && (
                              <DropdownMenuItem
                                onClick={() => removerMiembro(miembro)}
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
              <DialogTitle>Editar Miembro del Ministerio</DialogTitle>
              <DialogDescription>
                Actualiza el rol y estado de{" "}
                {miembroSeleccionado?.miembro.nombres}{" "}
                {miembroSeleccionado?.miembro.apellidos}
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
