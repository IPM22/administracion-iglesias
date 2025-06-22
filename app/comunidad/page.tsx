"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  Suspense,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  UserPlus,
  Search,
  Baby,
  Heart,
  Phone,
  Mail,
  Edit,
  Eye,
  Filter,
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import {
  TIPOS_PERSONA,
  ESTADOS_PERSONA,
  type FiltrosPersona,
} from "@/src/lib/validations/persona";

interface Persona {
  id: number;
  nombres: string;
  apellidos: string;
  correo?: string;
  telefono?: string;
  celular?: string;
  direccion?: string;
  fechaNacimiento?: string;
  sexo?: string;
  foto?: string;
  tipo:
    | "NINO"
    | "ADOLESCENTE"
    | "JOVEN"
    | "ADULTO"
    | "ADULTO_MAYOR"
    | "ENVEJECIENTE";
  rol: "MIEMBRO" | "VISITA" | "INVITADO";
  estado: "ACTIVA" | "INACTIVA" | "RECURRENTE" | "NUEVA";
  fechaIngreso?: string;
  fechaBautismo?: string;
  fechaPrimeraVisita?: string;
  familia?: {
    id: number;
    apellido: string;
    nombre?: string;
  };
  ministerios?: {
    id: number;
    ministerio: {
      nombre: string;
      colorHex?: string;
    };
    cargo?: string;
    esLider: boolean;
  }[];
  createdAt: string;
  _count?: {
    historialVisitas: number;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// Componente de filtros optimizado para búsqueda dinámica
interface FiltrosSectionProps {
  busqueda: string;
  setBusqueda: (value: string) => void;
  filtros: FiltrosPersona;
  setFiltros: (filtros: FiltrosPersona) => void;
  seccionActual: string;
  onLimpiar: () => void;
}

const FiltrosSection = React.memo(
  ({
    busqueda,
    setBusqueda,
    filtros,
    setFiltros,
    seccionActual,
    onLimpiar,
  }: FiltrosSectionProps) => {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros de Búsqueda
              </CardTitle>
              <CardDescription>
                Busca y filtra personas por nombre, tipo, estado y más
              </CardDescription>
            </div>
            {(busqueda ||
              Object.keys(filtros).some(
                (key) => filtros[key as keyof FiltrosPersona]
              )) && (
              <Button
                variant="outline"
                size="sm"
                onClick={onLimpiar}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Limpiar filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre, correo o teléfono..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Solo mostrar filtro de tipo si no estamos en sección específica */}
            {seccionActual === "todos" && (
              <Select
                value={filtros.tipo || "todos"}
                onValueChange={(value) =>
                  setFiltros({
                    ...filtros,
                    tipo:
                      value === "todos"
                        ? undefined
                        : (value as typeof filtros.tipo),
                  })
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  {TIPOS_PERSONA.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select
              value={filtros.estado || "todos"}
              onValueChange={(value) =>
                setFiltros({
                  ...filtros,
                  estado:
                    value === "todos"
                      ? undefined
                      : (value as typeof filtros.estado),
                })
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {ESTADOS_PERSONA.map((estado) => (
                  <SelectItem key={estado.value} value={estado.value}>
                    {estado.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    );
  }
);

FiltrosSection.displayName = "FiltrosSection";

function ComunidadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [todasLasPersonas, setTodasLasPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtros, setFiltros] = useState<FiltrosPersona>({});
  const [seccionActual, setSeccionActual] = useState("miembros");
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 100,
    total: 0,
    pages: 0,
  });
  const [dialogAbierto, setDialogAbierto] = useState(false);

  // Establecer sección inicial basada en parámetros URL
  useEffect(() => {
    const seccionParam = searchParams.get("seccion") || searchParams.get("tab");
    if (
      seccionParam &&
      ["miembros", "visitas", "ninos", "todos"].includes(seccionParam)
    ) {
      setSeccionActual(seccionParam);
    }
  }, [searchParams]);

  // Cargar todas las personas al inicio
  useEffect(() => {
    cargarTodasLasPersonas();
  }, []);

  // Filtrar personas - SIMPLE, como los otros componentes
  const personasFiltradas = useMemo(() => {
    let resultado = [...todasLasPersonas];

    // Filtrar por sección
    if (seccionActual === "miembros") {
      resultado = resultado.filter((p) => p.rol === "MIEMBRO");
    } else if (seccionActual === "visitas") {
      resultado = resultado.filter((p) => p.rol === "VISITA");
    } else if (seccionActual === "ninos") {
      resultado = resultado.filter(
        (p) => p.tipo === "NINO" || p.tipo === "ADOLESCENTE"
      );
    }

    // Filtrar por búsqueda - USANDO busquedaAplicada
    if (busqueda.trim()) {
      const terminoBusqueda = busqueda.toLowerCase().trim();
      resultado = resultado.filter((persona) => {
        const nombreCompleto =
          `${persona.nombres} ${persona.apellidos}`.toLowerCase();
        const correo = persona.correo?.toLowerCase() || "";
        const telefono = persona.telefono || "";
        const celular = persona.celular || "";

        return (
          nombreCompleto.includes(terminoBusqueda) ||
          correo.includes(terminoBusqueda) ||
          telefono.includes(terminoBusqueda) ||
          celular.includes(terminoBusqueda)
        );
      });
    }

    // Filtrar por otros filtros
    if (filtros.tipo && filtros.tipo !== "todos") {
      resultado = resultado.filter((p) => p.tipo === filtros.tipo);
    }

    if (filtros.estado) {
      resultado = resultado.filter((p) => p.estado === filtros.estado);
    }

    return resultado;
  }, [todasLasPersonas, busqueda, filtros, seccionActual]);

  // Calcular estadísticas
  const estadisticasGlobales = useMemo(() => {
    return {
      miembros: todasLasPersonas.filter((p) => p.rol === "MIEMBRO").length,
      visitas: todasLasPersonas.filter((p) => p.rol === "VISITA").length,
      ninos: todasLasPersonas.filter(
        (p) => p.tipo === "NINO" || p.tipo === "ADOLESCENTE"
      ).length,
      total: todasLasPersonas.length,
    };
  }, [todasLasPersonas]);

  // Función simple para cargar personas
  const cargarTodasLasPersonas = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/personas?limit=10000");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al cargar las personas");
      }

      const data = await response.json();
      setTodasLasPersonas(data.personas || []);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error al cargar personas";
      setError(errorMessage);
      setTodasLasPersonas([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para limpiar búsqueda y filtros
  const limpiarFiltros = useCallback(() => {
    setBusqueda("");
    setFiltros({});
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Obtener personas paginadas
  const obtenerPersonasPaginadas = () => {
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    return personasFiltradas.slice(startIndex, endIndex);
  };

  // Calcular información de paginación
  const totalPages = Math.ceil(personasFiltradas.length / pagination.limit);
  const paginationInfo = {
    ...pagination,
    total: personasFiltradas.length,
    pages: totalPages,
  };

  const calcularEdad = (fechaNacimiento?: string): number | null => {
    if (!fechaNacimiento) return null;
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const obtenerColorEstado = (estado: string) => {
    switch (estado) {
      case "ACTIVA":
        return "default";
      case "NUEVA":
        return "secondary";
      case "RECURRENTE":
        return "outline";
      case "INACTIVA":
        return "destructive";
      default:
        return "default";
    }
  };

  // Obtener información de la sección actual
  const obtenerInfoSeccion = () => {
    switch (seccionActual) {
      case "miembros":
        return {
          titulo: "Miembros de la Iglesia",
          descripcion: "Lista completa de todos los miembros registrados",
          icono: <Users className="h-5 w-5 text-blue-600" />,
          color: "blue",
        };
      case "visitas":
        return {
          titulo: "Registro de Visitas",
          descripcion: "Personas que han visitado la iglesia y su seguimiento",
          icono: <UserPlus className="h-5 w-5 text-green-600" />,
          color: "green",
        };
      case "ninos":
        return {
          titulo: "Niños y Adolescentes",
          descripcion: "Registro de menores de edad en la congregación",
          icono: <Baby className="h-5 w-5 text-purple-600" />,
          color: "purple",
        };
      case "todos":
        return {
          titulo: "Toda la Comunidad",
          descripcion: "Vista completa de todas las personas registradas",
          icono: <Users className="h-5 w-5 text-gray-600" />,
          color: "gray",
        };
      default:
        return {
          titulo: "Comunidad",
          descripcion: "Gestión de personas",
          icono: <Users className="h-5 w-5" />,
          color: "gray",
        };
    }
  };

  const obtenerInfoBoton = () => {
    switch (seccionActual) {
      case "miembros":
        return {
          texto: "Nuevo Miembro",
          icono: Heart,
          onClick: () => router.push("/comunidad/nueva?tipo=miembro"),
        };
      case "visitas":
        return {
          texto: "Nueva Visita",
          icono: UserPlus,
          onClick: () => router.push("/comunidad/nueva?tipo=visita"),
        };
      case "ninos":
        return {
          texto: "Nuevo Niño",
          icono: Baby,
          onClick: () => router.push("/comunidad/nueva?tipo=nino"),
        };
      default:
        return {
          texto: "Nueva Persona",
          icono: Plus,
          onClick: () => setDialogAbierto(true),
        };
    }
  };

  const DialogSeleccionTipo = () => (
    <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Qué tipo de persona deseas crear?</DialogTitle>
          <DialogDescription>
            Selecciona el tipo de persona que quieres registrar en el sistema.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button
            variant="outline"
            className="h-20 flex flex-col gap-2 text-left justify-center"
            onClick={() => {
              setDialogAbierto(false);
              router.push("/comunidad/nueva?tipo=miembro");
            }}
          >
            <div className="flex items-center gap-3">
              <Heart className="h-6 w-6 text-blue-600" />
              <div>
                <div className="font-semibold text-blue-600">Nuevo Miembro</div>
                <div className="text-sm text-gray-600">
                  Persona bautizada y comprometida con la iglesia
                </div>
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-20 flex flex-col gap-2 text-left justify-center"
            onClick={() => {
              setDialogAbierto(false);
              router.push("/comunidad/nueva?tipo=visita");
            }}
          >
            <div className="flex items-center gap-3">
              <UserPlus className="h-6 w-6 text-green-600" />
              <div>
                <div className="font-semibold text-green-600">Nueva Visita</div>
                <div className="text-sm text-gray-600">
                  Persona que visita la iglesia por primera vez
                </div>
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-20 flex flex-col gap-2 text-left justify-center"
            onClick={() => {
              setDialogAbierto(false);
              router.push("/comunidad/nueva?tipo=nino");
            }}
          >
            <div className="flex items-center gap-3">
              <Baby className="h-6 w-6 text-purple-600" />
              <div>
                <div className="font-semibold text-purple-600">Nuevo Niño</div>
                <div className="text-sm text-gray-600">
                  Menor de edad que participa en actividades infantiles
                </div>
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  const PaginationControls = () => (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-muted-foreground">
        Mostrando {(paginationInfo.page - 1) * paginationInfo.limit + 1} -{" "}
        {Math.min(
          paginationInfo.page * paginationInfo.limit,
          paginationInfo.total
        )}{" "}
        de {paginationInfo.total} personas
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setPagination((prev) => ({
              ...prev,
              page: paginationInfo.page - 1,
            }))
          }
          disabled={paginationInfo.page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>

        <div className="flex items-center gap-1">
          {paginationInfo.pages <= 7 ? (
            Array.from({ length: paginationInfo.pages }, (_, i) => (
              <Button
                key={i + 1}
                variant={paginationInfo.page === i + 1 ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: i + 1 }))
                }
                className="w-8 h-8 p-0"
              >
                {i + 1}
              </Button>
            ))
          ) : (
            <>
              <Button
                variant={paginationInfo.page === 1 ? "default" : "outline"}
                size="sm"
                onClick={() => setPagination((prev) => ({ ...prev, page: 1 }))}
                className="w-8 h-8 p-0"
              >
                1
              </Button>
              {paginationInfo.page > 3 && <span className="px-2">...</span>}
              {Array.from({ length: 3 }, (_, i) => {
                const pageNum = paginationInfo.page - 1 + i;
                if (pageNum > 1 && pageNum < paginationInfo.pages) {
                  return (
                    <Button
                      key={pageNum}
                      variant={
                        paginationInfo.page === pageNum ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        setPagination((prev) => ({ ...prev, page: pageNum }))
                      }
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                }
                return null;
              })}
              {paginationInfo.page < paginationInfo.pages - 2 && (
                <span className="px-2">...</span>
              )}
              <Button
                variant={
                  paginationInfo.page === paginationInfo.pages
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: paginationInfo.pages,
                  }))
                }
                className="w-8 h-8 p-0"
              >
                {paginationInfo.pages}
              </Button>
            </>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setPagination((prev) => ({
              ...prev,
              page: paginationInfo.page + 1,
            }))
          }
          disabled={paginationInfo.page >= paginationInfo.pages}
        >
          Siguiente
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const TablaPersonas = () => {
    const seccionInfo = obtenerInfoSeccion();
    const botonInfo = obtenerInfoBoton();
    const IconoBoton = botonInfo.icono;

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {React.cloneElement(seccionInfo.icono, {
                className: `h-6 w-6 ${seccionInfo.color}`,
              })}
              <div>
                <CardTitle className="text-xl">{seccionInfo.titulo}</CardTitle>
                <CardDescription>{seccionInfo.descripcion}</CardDescription>
              </div>
              <Badge variant="secondary" className="ml-2">
                {paginationInfo.total}{" "}
                {paginationInfo.total === 1 ? "persona" : "personas"}
              </Badge>
              <Button onClick={botonInfo.onClick}>
                <IconoBoton className="h-4 w-4 mr-2" />
                {botonInfo.texto}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-lg font-medium">Cargando personas...</p>
              <p className="text-sm text-muted-foreground">
                Por favor espera mientras cargamos la información
              </p>
            </div>
          ) : personasFiltradas.length === 0 ? (
            <div className="text-center py-8">
              <div className="mb-4">
                {React.cloneElement(seccionInfo.icono, {
                  className: "h-12 w-12 mx-auto text-muted-foreground",
                })}
              </div>
              <h3 className="text-lg font-medium mb-2">
                No se encontraron personas
              </h3>
              <p className="text-muted-foreground mb-4">
                {busqueda ||
                Object.keys(filtros).some(
                  (key) => filtros[key as keyof FiltrosPersona]
                )
                  ? "No hay personas que coincidan con los criterios de búsqueda"
                  : `No hay ${
                      seccionActual === "miembros"
                        ? "miembros"
                        : seccionActual === "visitas"
                        ? "visitas"
                        : seccionActual === "ninos"
                        ? "niños"
                        : "personas"
                    } registrados`}
              </p>
              {(busqueda ||
                Object.keys(filtros).some(
                  (key) => filtros[key as keyof FiltrosPersona]
                )) && (
                <Button variant="outline" onClick={limpiarFiltros}>
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Persona</TableHead>
                      <TableHead>Edad</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Familia</TableHead>
                      {seccionActual === "miembros" && (
                        <TableHead>Bautismo</TableHead>
                      )}
                      {seccionActual === "visitas" && (
                        <TableHead>Primera Visita</TableHead>
                      )}
                      <TableHead>Ministerios</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {obtenerPersonasPaginadas().map((persona) => {
                      const edad = calcularEdad(persona.fechaNacimiento);

                      return (
                        <TableRow
                          key={persona.id}
                          className="hover:bg-muted/50"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={persona.foto} />
                                <AvatarFallback>
                                  {persona.nombres.charAt(0)}
                                  {persona.apellidos.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {persona.nombres} {persona.apellidos}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {
                                    TIPOS_PERSONA.find(
                                      (t) => t.value === persona.tipo
                                    )?.label
                                  }
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{edad ? `${edad} años` : "N/A"}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {persona.correo && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Mail className="h-3 w-3" />
                                  <span className="truncate max-w-32">
                                    {persona.correo}
                                  </span>
                                </div>
                              )}
                              {(persona.telefono || persona.celular) && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Phone className="h-3 w-3" />
                                  <span>
                                    {persona.celular || persona.telefono}
                                  </span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={obtenerColorEstado(persona.estado)}>
                              {
                                ESTADOS_PERSONA.find(
                                  (e) => e.value === persona.estado
                                )?.label
                              }
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {persona.familia ? (
                              <span className="text-sm">
                                Familia {persona.familia.apellido}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                -
                              </span>
                            )}
                          </TableCell>
                          {seccionActual === "miembros" && (
                            <TableCell>
                              {persona.fechaBautismo ? (
                                <div className="flex items-center gap-1">
                                  <Heart className="h-3 w-3 text-red-500" />
                                  <span className="text-sm">
                                    {new Date(
                                      persona.fechaBautismo
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  No bautizado
                                </span>
                              )}
                            </TableCell>
                          )}
                          {seccionActual === "visitas" && (
                            <TableCell>
                              {persona.fechaPrimeraVisita ? (
                                <span className="text-sm">
                                  {new Date(
                                    persona.fechaPrimeraVisita
                                  ).toLocaleDateString()}
                                </span>
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  -
                                </span>
                              )}
                            </TableCell>
                          )}
                          <TableCell>
                            {persona.ministerios &&
                            persona.ministerios.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {persona.ministerios
                                  .slice(0, 2)
                                  .map((ministerio) => (
                                    <Badge
                                      key={ministerio.id}
                                      variant="outline"
                                      className="text-xs"
                                      style={{
                                        backgroundColor: ministerio.ministerio
                                          .colorHex
                                          ? `${ministerio.ministerio.colorHex}20`
                                          : undefined,
                                        borderColor:
                                          ministerio.ministerio.colorHex,
                                      }}
                                    >
                                      {ministerio.ministerio.nombre}
                                      {ministerio.esLider && " (L)"}
                                    </Badge>
                                  ))}
                                {persona.ministerios.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{persona.ministerios.length - 2}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                -
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  router.push(`/comunidad/${persona.id}`)
                                }
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  router.push(`/comunidad/${persona.id}/editar`)
                                }
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {paginationInfo.pages > 1 && <PaginationControls />}
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  if (error) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <p className="text-red-600 text-lg mb-4">Error: {error}</p>
              <Button onClick={cargarTodasLasPersonas}>Reintentar</Button>
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
        <header className="flex h-16 shrink-0 items-center gap-2">
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
                  <BreadcrumbPage>Comunidad</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto px-3">
            <ModeToggle />
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Comunidad</h1>
              <p className="text-muted-foreground">
                Gestión unificada de miembros, visitas y niños
              </p>
            </div>
          </div>

          {/* Cards de navegación interactivas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                seccionActual === "todos"
                  ? "ring-2 ring-gray-500 bg-gray-50 dark:bg-gray-950"
                  : "hover:bg-muted/50"
              }`}
              onClick={() => setSeccionActual("todos")}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Personas
                </CardTitle>
                <Users
                  className={`h-4 w-4 ${
                    seccionActual === "todos"
                      ? "text-gray-600"
                      : "text-muted-foreground"
                  }`}
                />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    seccionActual === "todos" ? "text-gray-600" : ""
                  }`}
                >
                  {estadisticasGlobales.total}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {seccionActual === "todos"
                    ? "Vista activa"
                    : "Haz clic para ver todos"}
                </p>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                seccionActual === "miembros"
                  ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20"
                  : "hover:bg-muted/50"
              }`}
              onClick={() => setSeccionActual("miembros")}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Miembros</CardTitle>
                <Heart className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {estadisticasGlobales.miembros}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {seccionActual === "miembros"
                    ? "Vista activa"
                    : "Haz clic para ver miembros"}
                </p>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                seccionActual === "visitas"
                  ? "ring-2 ring-green-500 bg-green-50 dark:bg-green-950/20"
                  : "hover:bg-muted/50"
              }`}
              onClick={() => setSeccionActual("visitas")}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Visitas</CardTitle>
                <UserPlus className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {estadisticasGlobales.visitas}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {seccionActual === "visitas"
                    ? "Vista activa"
                    : "Haz clic para ver visitas"}
                </p>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                seccionActual === "ninos"
                  ? "ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-950/20"
                  : "hover:bg-muted/50"
              }`}
              onClick={() => setSeccionActual("ninos")}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Niños</CardTitle>
                <Baby className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {estadisticasGlobales.ninos}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {seccionActual === "ninos"
                    ? "Vista activa"
                    : "Haz clic para ver niños"}
                </p>
              </CardContent>
            </Card>
          </div>

          <FiltrosSection
            busqueda={busqueda}
            setBusqueda={setBusqueda}
            filtros={filtros}
            setFiltros={setFiltros}
            seccionActual={seccionActual}
            onLimpiar={limpiarFiltros}
          />
          <TablaPersonas />
          <DialogSeleccionTipo />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function ComunidadPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Cargando comunidad...</p>
          </div>
        </div>
      }
    >
      <ComunidadContent />
    </Suspense>
  );
}
