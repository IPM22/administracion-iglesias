"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  ArrowLeft,
  Heart,
  Save,
  Loader2,
  Users,
  Plus,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { Badge } from "@/components/ui/badge";
import PersonaSelector from "@/components/PersonaSelector";

interface Miembro {
  id: number;
  nombres: string;
  apellidos: string;
  foto?: string;
}

interface Persona {
  id: number;
  nombres: string;
  apellidos: string;
  foto?: string;
  correo?: string;
  telefono?: string;
  celular?: string;
  estado: string;
  tipo: "miembro" | "visita";
  fechaBautismo?: string;
}

interface Familia {
  id: number;
  apellido: string;
  nombre?: string;
  estado: string;
  totalPersonas: number;
  jefeFamilia?: {
    nombres: string;
    apellidos: string;
  };
}

interface SugerenciaFamilia {
  tipo: "crear" | "agregar";
  familia?: Familia;
  razon: string;
}

export default function AgregarFamiliarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [miembro, setMiembro] = useState<Miembro | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [personaSeleccionada, setPersonaSeleccionada] =
    useState<Persona | null>(null);
  const [formData, setFormData] = useState({
    tipoRelacion: "",
  });
  const [sugerenciaFamilia, setSugerenciaFamilia] =
    useState<SugerenciaFamilia | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [mensajeSincronizacion, setMensajeSincronizacion] =
    useState<string>("");
  const [error, setError] = useState<string>("");

  const tiposRelacion = [
    "Esposo/a",
    "Hijo/a",
    "Padre",
    "Madre",
    "Hermano/a",
    "Abuelo/a",
    "Nieto/a",
    "Tío/a",
    "Sobrino/a",
    "Primo/a",
    "Cuñado/a",
    "Suegro/a",
    "Yerno/Nuera",
    "Otro",
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener datos del miembro
        const miembroResponse = await fetch(`/api/miembros/${id}`);
        if (!miembroResponse.ok) {
          throw new Error("Error al obtener datos del miembro");
        }
        const miembroData = await miembroResponse.json();
        setMiembro(miembroData);

        // Obtener lista de personas (miembros y visitas)
        const personasResponse = await fetch("/api/personas");
        if (!personasResponse.ok) {
          throw new Error("Error al obtener personas");
        }
        const personasData = await personasResponse.json();
        // Filtrar para que no aparezca el mismo miembro
        const disponibles = personasData.filter(
          (p: Persona) => p.id !== parseInt(id)
        );
        setPersonas(disponibles);
      } catch (error) {
        console.error("Error:", error);
        alert("Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Analizar sugerencias de familia cuando se selecciona una persona
  useEffect(() => {
    if (personaSeleccionada && formData.tipoRelacion) {
      analizarSugerenciaFamilia();
    } else {
      setSugerenciaFamilia(null);
    }
  }, [personaSeleccionada, formData.tipoRelacion]);

  const analizarSugerenciaFamilia = async () => {
    if (!personaSeleccionada || !miembro) return;

    try {
      // Verificar si el miembro y la persona seleccionada ya tienen familias
      const [miembroResponse, personaResponse] = await Promise.all([
        fetch(`/api/miembros/${id}`),
        personaSeleccionada.tipo === "miembro"
          ? fetch(`/api/miembros/${personaSeleccionada.id}`)
          : fetch(`/api/visitas/${personaSeleccionada.id}`),
      ]);

      let miembroTieneFamilia = false;
      let personaTieneFamilia = false;
      let familiaExistente: Familia | null = null;

      if (miembroResponse.ok) {
        const miembroData = await miembroResponse.json();
        miembroTieneFamilia = !!miembroData.familiaId;
        if (miembroData.familiaId) {
          const familiaResponse = await fetch(
            `/api/familias/${miembroData.familiaId}`
          );
          if (familiaResponse.ok) {
            familiaExistente = await familiaResponse.json();
          }
        }
      }

      if (personaResponse.ok) {
        const personaData = await personaResponse.json();
        personaTieneFamilia = !!personaData.familiaId;
      }

      if (!miembroTieneFamilia && !personaTieneFamilia) {
        // Ninguno tiene familia - sugerir crear nueva
        setSugerenciaFamilia({
          tipo: "crear",
          razon: `Ni ${miembro.nombres} ni ${personaSeleccionada.nombres} pertenecen a una familia. Considera crear una nueva familia para organizarlos mejor.`,
        });
      } else if (
        miembroTieneFamilia &&
        !personaTieneFamilia &&
        familiaExistente
      ) {
        // El miembro tiene familia, la persona no - sugerir agregar a la familia existente
        setSugerenciaFamilia({
          tipo: "agregar",
          familia: familiaExistente,
          razon: `${
            personaSeleccionada.nombres
          } no pertenece a ninguna familia. Podrías agregarle a la familia ${
            familiaExistente.nombre || `Familia ${familiaExistente.apellido}`
          }.`,
        });
      } else if (!miembroTieneFamilia && personaTieneFamilia) {
        // La persona tiene familia, el miembro no - sugerir agregar miembro a esa familia
        setSugerenciaFamilia({
          tipo: "agregar",
          razon: `${miembro.nombres} no pertenece a ninguna familia. Podrías agregarle a la familia de ${personaSeleccionada.nombres}.`,
        });
      } else if (miembroTieneFamilia && personaTieneFamilia) {
        // Ambos tienen familia - informar que están en familias diferentes
        setSugerenciaFamilia({
          tipo: "agregar",
          razon: `Ambos ya pertenecen a familias. La relación se creará entre las familias existentes.`,
        });
      }
    } catch (error) {
      console.error("Error al analizar sugerencias de familia:", error);
      // En caso de error, mantener comportamiento básico
      setSugerenciaFamilia({
        tipo: "crear",
        razon: `Considera revisar las familias existentes después de crear esta relación.`,
      });
    }
  };

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!personaSeleccionada || !formData.tipoRelacion) {
      setError("Debe seleccionar una persona y un tipo de relación");
      return;
    }

    setGuardando(true);
    setError("");
    setMensajeSincronizacion("");

    try {
      const response = await fetch(`/api/miembros/${id}/familiares`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personaId: personaSeleccionada.id,
          tipoPersona: personaSeleccionada.tipo,
          tipoRelacion: formData.tipoRelacion,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al agregar familiar");
      }

      // Mostrar mensaje de sincronización si está disponible
      if (data.sincronizacion) {
        setMensajeSincronizacion(data.sincronizacion);
      }

      // Redirigir a la página de familia del miembro después de un breve retraso
      setTimeout(() => {
        router.push(`/miembros/${id}/familia`);
      }, 2000);
    } catch (error) {
      console.error("Error agregando familiar:", error);
      setError(
        error instanceof Error ? error.message : "Error al agregar familiar"
      );
    } finally {
      setGuardando(false);
    }
  };

  const manejarSugerenciaFamilia = () => {
    if (!sugerenciaFamilia) return;

    if (sugerenciaFamilia.tipo === "crear") {
      // Redirigir a crear nueva familia
      router.push("/familias/nueva");
    } else if (sugerenciaFamilia.familia) {
      // Redirigir a la familia existente
      router.push(`/familias/${sugerenciaFamilia.familia.id}`);
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando...</span>
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
                  <BreadcrumbLink href="/miembros">Miembros</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/miembros/${id}`}>
                    {miembro
                      ? `${miembro.nombres} ${miembro.apellidos}`
                      : "..."}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Agregar Familiar</BreadcrumbPage>
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

          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Agregar Familiar
              </CardTitle>
              <CardDescription>
                Agregar un familiar a{" "}
                {miembro ? `${miembro.nombres} ${miembro.apellidos}` : "..."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={manejarEnvio} className="space-y-6">
                <div className="space-y-2">
                  <Label>Seleccionar Persona *</Label>
                  <PersonaSelector
                    personas={personas}
                    onSeleccionar={setPersonaSeleccionada}
                    personaSeleccionada={personaSeleccionada}
                    placeholder="Buscar miembro o visita..."
                    disabled={guardando}
                    mostrarTipo={true}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipoRelacion">Tipo de Relación *</Label>
                  <Select
                    value={formData.tipoRelacion}
                    onValueChange={(value) =>
                      setFormData({ ...formData, tipoRelacion: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo de relación" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposRelacion.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Vista previa de la relación */}
                {personaSeleccionada && formData.tipoRelacion && (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg border-2 border-dashed border-primary/20">
                      <p className="text-sm font-medium text-center mb-3">
                        Relación que se creará:
                      </p>
                      <div className="flex items-center justify-center gap-3">
                        <div className="text-center">
                          <Badge variant="outline" className="mb-1">
                            {miembro?.nombres} {miembro?.apellidos}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            Miembro
                          </p>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-sm text-muted-foreground">
                            es
                          </span>
                          <Badge variant="default" className="font-medium">
                            {formData.tipoRelacion}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            de
                          </span>
                        </div>
                        <div className="text-center">
                          <Badge variant="outline" className="mb-1">
                            {personaSeleccionada.nombres}{" "}
                            {personaSeleccionada.apellidos}
                          </Badge>
                          <p className="text-xs text-muted-foreground capitalize">
                            {personaSeleccionada.tipo}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Sugerencia de familia */}
                    {sugerenciaFamilia && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950/20 dark:border-blue-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                            <span className="text-sm text-blue-800 dark:text-blue-200 flex-1">
                              {sugerenciaFamilia.razon}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={manejarSugerenciaFamilia}
                            className="ml-4 flex items-center gap-2"
                          >
                            {sugerenciaFamilia.tipo === "crear" ? (
                              <>
                                <Plus className="h-3 w-3" />
                                Crear Familia
                              </>
                            ) : (
                              <>
                                <Users className="h-3 w-3" />
                                Ver Familia
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {mensajeSincronizacion && (
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Sincronización Automática
                      </p>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      {mensajeSincronizacion}
                    </p>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button type="submit" disabled={guardando} className="flex-1">
                    {guardando ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Agregando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Agregar Familiar
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
