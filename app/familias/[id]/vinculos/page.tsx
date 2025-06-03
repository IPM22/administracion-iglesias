"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  HomeIcon,
  Loader2,
  Link as LinkIcon,
  GitBranch,
} from "lucide-react";
import { ModeToggle } from "../../../../components/mode-toggle";
import FamiliaSelector from "../../../../components/FamiliaSelector";

interface Familia {
  id: number;
  apellido: string;
  nombre?: string;
  estado: string;
  jefeFamilia?: {
    id: number;
    nombres: string;
    apellidos: string;
    foto?: string;
  };
}

interface Miembro {
  id: number;
  nombres: string;
  apellidos: string;
  foto?: string;
}

interface VinculoFamiliar {
  id: number;
  tipoVinculo: string;
  descripcion?: string;
  familiaOrigen: Familia;
  familiaRelacionada: Familia;
  miembroVinculo?: Miembro;
}

const tiposVinculo = [
  "Familia extendida",
  "Familia política",
  "Familia adoptiva",
  "Familia afín",
  "Familia consanguínea",
  "Otros",
];

export default function VinculosFamiliaresPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [familia, setFamilia] = useState<Familia | null>(null);
  const [vinculos, setVinculos] = useState<VinculoFamiliar[]>([]);
  const [familias, setFamilias] = useState<Familia[]>([]);
  const [miembrosFamiliaActual, setMiembrosFamiliaActual] = useState<Miembro[]>(
    []
  );
  const [miembrosFamiliaSeleccionada, setMiembrosFamiliaSeleccionada] =
    useState<Miembro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados del diálogo
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [editando, setEditando] = useState<VinculoFamiliar | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Estados del formulario
  const [familiaSeleccionada, setFamiliaSeleccionada] =
    useState<Familia | null>(null);
  const [tipoVinculo, setTipoVinculo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [miembroVinculoId, setMiembroVinculoId] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      cargarDatos();
    }
  }, [id]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);

      const [familiaResponse, vinculosResponse, familiasResponse] =
        await Promise.all([
          fetch(`/api/familias/${id}`),
          fetch(`/api/familias/${id}/vinculos`),
          fetch(`/api/familias`),
        ]);

      if (familiaResponse.ok) {
        const familiaData = await familiaResponse.json();
        setFamilia(familiaData);

        // Cargar miembros de la familia actual
        const miembrosFamiliaActualData = familiaData.miembros || [];
        setMiembrosFamiliaActual(miembrosFamiliaActualData);
      }

      if (vinculosResponse.ok) {
        const vinculosData = await vinculosResponse.json();
        setVinculos(vinculosData);
      }

      if (familiasResponse.ok) {
        const familiasData = await familiasResponse.json();
        // Filtrar la familia actual
        setFamilias(familiasData.filter((f: Familia) => f.id !== parseInt(id)));
      }
    } catch (error) {
      console.error("Error:", error);
      setError("No se pudieron cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar miembros de la familia seleccionada
  const cargarMiembrosFamiliaSeleccionada = async (familiaId: number) => {
    try {
      const response = await fetch(`/api/familias/${familiaId}`);
      if (response.ok) {
        const familiaData = await response.json();
        setMiembrosFamiliaSeleccionada(familiaData.miembros || []);
      }
    } catch (error) {
      console.error("Error cargando miembros de familia seleccionada:", error);
      setMiembrosFamiliaSeleccionada([]);
    }
  };

  // Efecto para cargar miembros cuando se selecciona una familia
  useEffect(() => {
    if (familiaSeleccionada) {
      cargarMiembrosFamiliaSeleccionada(familiaSeleccionada.id);
    } else {
      setMiembrosFamiliaSeleccionada([]);
    }
  }, [familiaSeleccionada]);

  const abrirDialogCrear = () => {
    setEditando(null);
    setFamiliaSeleccionada(null);
    setTipoVinculo("");
    setDescripcion("");
    setMiembroVinculoId(null);
    setMiembrosFamiliaSeleccionada([]);
    setDialogAbierto(true);
  };

  const abrirDialogEditar = (vinculo: VinculoFamiliar) => {
    setEditando(vinculo);
    // Determinar cuál familia es la "otra" (no la actual)
    const otraFamilia =
      vinculo.familiaOrigen.id === parseInt(id)
        ? vinculo.familiaRelacionada
        : vinculo.familiaOrigen;
    setFamiliaSeleccionada(otraFamilia);
    setTipoVinculo(vinculo.tipoVinculo);
    setDescripcion(vinculo.descripcion || "");
    setMiembroVinculoId(vinculo.miembroVinculo?.id || null);
    setDialogAbierto(true);
  };

  const guardarVinculo = async () => {
    if (!familiaSeleccionada || !tipoVinculo) {
      setError("Familia y tipo de vínculo son requeridos");
      return;
    }

    setGuardando(true);
    try {
      const url = editando
        ? `/api/familias/${id}/vinculos/${editando.id}`
        : `/api/familias/${id}/vinculos`;

      const method = editando ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familiaRelacionadaId: familiaSeleccionada.id,
          tipoVinculo,
          descripcion: descripcion || null,
          miembroVinculoId,
        }),
      });

      if (response.ok) {
        await cargarDatos();
        setDialogAbierto(false);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Error al guardar el vínculo");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Error al guardar el vínculo");
    } finally {
      setGuardando(false);
    }
  };

  const eliminarVinculo = async (vinculo: VinculoFamiliar) => {
    if (
      !confirm("¿Estás seguro de que deseas eliminar este vínculo familiar?")
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/familias/${id}/vinculos/${vinculo.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        await cargarDatos();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Error al eliminar el vínculo");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Error al eliminar el vínculo");
    }
  };

  const obtenerFamiliaRelacionada = (vinculo: VinculoFamiliar) => {
    return vinculo.familiaOrigen.id === parseInt(id)
      ? vinculo.familiaRelacionada
      : vinculo.familiaOrigen;
  };

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando vínculos familiares...</span>
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
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/familias">Familias</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href={`/familias/${id}`}>
                    {familia?.nombre || `Familia ${familia?.apellido}`}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Vínculos Familiares</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="px-4">
            <ModeToggle />
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <GitBranch className="h-6 w-6" />
                Vínculos Familiares
              </h1>
              <p className="text-muted-foreground">
                {familia?.nombre || `Familia ${familia?.apellido}`}
              </p>
            </div>
            <Button onClick={abrirDialogCrear}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Vínculo
            </Button>
          </div>

          {error && (
            <div className="p-4 text-red-600 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Vínculos Familiares ({vinculos.length})
              </CardTitle>
              <CardDescription>
                Relaciones establecidas con otras familias de la congregación
              </CardDescription>
            </CardHeader>
            <CardContent>
              {vinculos.length === 0 ? (
                <div className="text-center py-8">
                  <GitBranch className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No hay vínculos familiares establecidos
                  </p>
                  <Button onClick={abrirDialogCrear} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Crear primer vínculo
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {vinculos.map((vinculo) => {
                    const familiaRelacionada =
                      obtenerFamiliaRelacionada(vinculo);
                    return (
                      <Card
                        key={vinculo.id}
                        className="border border-border/50"
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-lg flex items-center gap-2">
                                <HomeIcon className="h-5 w-5" />
                                {familiaRelacionada.nombre ||
                                  `Familia ${familiaRelacionada.apellido}`}
                              </CardTitle>
                              <Badge variant="secondary">
                                {vinculo.tipoVinculo}
                              </Badge>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(
                                      `/familias/${familiaRelacionada.id}`
                                    )
                                  }
                                >
                                  <HomeIcon className="mr-2 h-4 w-4" />
                                  Ver Familia
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => abrirDialogEditar(vinculo)}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar Vínculo
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => eliminarVinculo(vinculo)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Eliminar Vínculo
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {familiaRelacionada.jefeFamilia && (
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage
                                    src={
                                      familiaRelacionada.jefeFamilia.foto ||
                                      "/placeholder.svg"
                                    }
                                  />
                                  <AvatarFallback>
                                    {familiaRelacionada.jefeFamilia.nombres
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                    {familiaRelacionada.jefeFamilia.apellidos
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">
                                    Cabeza de Familia
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {familiaRelacionada.jefeFamilia.nombres}{" "}
                                    {familiaRelacionada.jefeFamilia.apellidos}
                                  </p>
                                </div>
                              </div>
                            )}

                            {vinculo.descripcion && (
                              <div>
                                <p className="text-sm font-medium mb-1">
                                  Descripción:
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {vinculo.descripcion}
                                </p>
                              </div>
                            )}

                            {vinculo.miembroVinculo && (
                              <div>
                                <p className="text-sm font-medium mb-1">
                                  Miembro conector:
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {vinculo.miembroVinculo.nombres}{" "}
                                  {vinculo.miembroVinculo.apellidos}
                                </p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dialog para crear/editar vínculo */}
        <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editando
                  ? "Editar Vínculo Familiar"
                  : "Nuevo Vínculo Familiar"}
              </DialogTitle>
              <DialogDescription>
                {editando
                  ? "Modifica la información del vínculo familiar"
                  : "Crea una relación entre esta familia y otra de la congregación"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Familia a vincular
                </label>
                <FamiliaSelector
                  familias={familias}
                  onSeleccionar={setFamiliaSeleccionada}
                  familiaSeleccionada={familiaSeleccionada}
                  placeholder="Seleccionar familia..."
                  disabled={guardando}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de vínculo</label>
                <Select
                  value={tipoVinculo}
                  onValueChange={setTipoVinculo}
                  disabled={guardando}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo de vínculo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposVinculo.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Miembro conector (opcional)
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  {familiaSeleccionada
                    ? "Selecciona un miembro que pertenezca a alguna de las familias a vincular"
                    : "Primero selecciona la familia a vincular"}
                </p>
                <Select
                  value={miembroVinculoId?.toString() || "ninguno"}
                  onValueChange={(value) =>
                    setMiembroVinculoId(
                      value === "ninguno" ? null : parseInt(value)
                    )
                  }
                  disabled={guardando || !familiaSeleccionada}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        familiaSeleccionada
                          ? "Seleccionar miembro conector..."
                          : "Selecciona primero una familia"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ninguno">Ninguno</SelectItem>
                    {familiaSeleccionada && (
                      <>
                        <SelectItem disabled value="header-actual">
                          <span className="font-semibold text-primary">
                            — {familia?.apellido || "Familia actual"} —
                          </span>
                        </SelectItem>
                        {miembrosFamiliaActual.map((miembro) => (
                          <SelectItem
                            key={`actual-${miembro.id}`}
                            value={miembro.id.toString()}
                          >
                            {miembro.nombres} {miembro.apellidos}
                          </SelectItem>
                        ))}

                        {miembrosFamiliaSeleccionada.length > 0 && (
                          <>
                            <SelectItem disabled value="header-relacionada">
                              <span className="font-semibold text-primary">
                                — {familiaSeleccionada.apellido} —
                              </span>
                            </SelectItem>
                            {miembrosFamiliaSeleccionada.map((miembro) => (
                              <SelectItem
                                key={`relacionada-${miembro.id}`}
                                value={miembro.id.toString()}
                              >
                                {miembro.nombres} {miembro.apellidos}
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Descripción (opcional)
                </label>
                <Textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Describe la relación entre las familias..."
                  rows={3}
                  disabled={guardando}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogAbierto(false)}
                disabled={guardando}
              >
                Cancelar
              </Button>
              <Button onClick={guardarVinculo} disabled={guardando}>
                {guardando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : editando ? (
                  "Actualizar"
                ) : (
                  "Crear Vínculo"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
