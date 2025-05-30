"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Edit,
  Users,
  HomeIcon,
  Plus,
  Search,
  MoreHorizontal,
  UserMinus,
  Crown,
  Calendar,
  Mail,
  Phone,
  Loader2,
  GitBranch,
  UserCheck,
} from "lucide-react";
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
import PersonaSelector from "../../../components/PersonaSelector";

interface FamiliaDetalle {
  id: number;
  apellido: string;
  nombre?: string;
  estado: string;
  notas?: string;
  fechaRegistro: string;
  jefeFamilia?: {
    id: number;
    nombres: string;
    apellidos: string;
    foto?: string;
    fechaNacimiento?: string;
    correo?: string;
    telefono?: string;
  };
  miembros: MiembroFamilia[];
  visitas: VisitaFamilia[];
  totalMiembros: number;
  totalVisitas: number;
  totalPersonas: number;
  miembrosActivos: number;
  visitasActivas: number;
  personasActivas: number;
  edadPromedio?: number;
}

interface MiembroFamilia {
  id: number;
  nombres: string;
  apellidos: string;
  correo?: string;
  telefono?: string;
  celular?: string;
  fechaNacimiento?: string;
  sexo?: string;
  estado: string;
  foto?: string;
  fechaIngreso?: string;
  parentescoFamiliar?: string;
}

interface VisitaFamilia {
  id: number;
  nombres: string;
  apellidos: string;
  correo?: string;
  telefono?: string;
  celular?: string;
  fechaNacimiento?: string;
  sexo?: string;
  estado: string;
  foto?: string;
  fechaPrimeraVisita?: string;
  parentescoFamiliar?: string;
}

interface PersonaFamilia {
  id: number;
  nombres: string;
  apellidos: string;
  correo?: string;
  telefono?: string;
  celular?: string;
  fechaNacimiento?: string;
  sexo?: string;
  estado: string;
  foto?: string;
  parentescoFamiliar?: string;
  tipo: "miembro" | "visita";
  fechaIngreso?: string;
  fechaPrimeraVisita?: string;
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

export default function FamiliaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [familia, setFamilia] = useState<FamiliaDetalle | null>(null);
  const [personasDisponibles, setPersonasDisponibles] = useState<Persona[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para diálogos
  const [dialogAgregar, setDialogAgregar] = useState(false);
  const [dialogParentesco, setDialogParentesco] = useState(false);
  const [personaSeleccionada, setPersonaSeleccionada] =
    useState<Persona | null>(null);
  const [personaParentesco, setPersonaParentesco] =
    useState<PersonaFamilia | null>(null);
  const [parentescoSeleccionado, setParentescoSeleccionado] = useState("");
  const [agregandoPersona, setAgregandoPersona] = useState(false);
  const [actualizandoParentesco, setActualizandoParentesco] = useState(false);

  useEffect(() => {
    if (id) {
      cargarDatos();
    }
  }, [id]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError(null);

      // Cargar familia
      const [familiaResponse, personasResponse] = await Promise.all([
        fetch(`/api/familias/${id}`),
        fetch(`/api/familias/${id}/personas-disponibles`),
      ]);

      if (familiaResponse.ok) {
        const familiaData = await familiaResponse.json();
        setFamilia(familiaData);
      } else {
        throw new Error("Error al cargar familia");
      }

      if (personasResponse.ok) {
        const personasData = await personasResponse.json();
        setPersonasDisponibles(personasData);
      }
    } catch (error) {
      console.error("Error:", error);
      setError("No se pudieron cargar los datos");
    } finally {
      setCargando(false);
    }
  };

  const abrirDialogParentesco = (persona: PersonaFamilia) => {
    setPersonaParentesco(persona);
    setParentescoSeleccionado(persona.parentescoFamiliar || "");
    setDialogParentesco(true);
  };

  const actualizarParentesco = async () => {
    if (!personaParentesco || !parentescoSeleccionado) return;

    try {
      setActualizandoParentesco(true);

      // Determinar la ruta de la API según el tipo de persona
      const apiUrl =
        personaParentesco.tipo === "miembro"
          ? `/api/familias/${id}/miembros/${personaParentesco.id}`
          : `/api/familias/${id}/visitas/${personaParentesco.id}`;

      const response = await fetch(apiUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ parentescoFamiliar: parentescoSeleccionado }),
      });

      if (response.ok) {
        await cargarDatos(); // Recargar datos
        setDialogParentesco(false);
        setPersonaParentesco(null);
        setParentescoSeleccionado("");
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Error al actualizar parentesco");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al actualizar parentesco");
    } finally {
      setActualizandoParentesco(false);
    }
  };

  const tiposParentesco = [
    "Cabeza de Familia",
    "Esposo/a",
    "Hijo/a",
    "Padre/Madre",
    "Abuelo/a",
    "Hermano/a",
    "Tío/a",
    "Sobrino/a",
    "Primo/a",
    "Cuñado/a",
    "Yerno/Nuera",
    "Suegro/a",
    "Nieto/a",
    "Otro",
  ];

  const agregarPersona = async () => {
    if (!personaSeleccionada) return;

    try {
      setAgregandoPersona(true);
      const response = await fetch(`/api/familias/${id}/personas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personaId: personaSeleccionada.id,
          tipo: personaSeleccionada.tipo,
        }),
      });

      if (response.ok) {
        await cargarDatos(); // Recargar datos
        setDialogAgregar(false);
        setPersonaSeleccionada(null);
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Error al agregar persona");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al agregar persona");
    } finally {
      setAgregandoPersona(false);
    }
  };

  const removerPersona = async (persona: PersonaFamilia) => {
    if (
      !confirm(
        `¿Estás seguro de remover a ${persona.nombres} ${persona.apellidos} de la familia?`
      )
    ) {
      return;
    }

    try {
      // Determinar la ruta de la API según el tipo de persona
      const apiUrl =
        persona.tipo === "miembro"
          ? `/api/familias/${id}/miembros/${persona.id}`
          : `/api/familias/${id}/visitas/${persona.id}`;

      const response = await fetch(apiUrl, {
        method: "DELETE",
      });

      if (response.ok) {
        await cargarDatos(); // Recargar datos
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Error al remover persona");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al remover persona");
    }
  };

  const calcularEdad = (fechaNacimiento: string) => {
    const fecha = new Date(fechaNacimiento);
    const hoy = new Date();
    return hoy.getFullYear() - fecha.getFullYear();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Función para obtener el color del badge según el estado y tipo de persona
  const getBadgeVariant = (estado: string, tipo: "miembro" | "visita") => {
    if (tipo === "miembro") {
      // Para miembros: Verde para activo, amarillo para inactivo
      return estado === "Activo" ? "default" : "secondary";
    } else {
      // Para visitas: colores más positivos
      switch (estado) {
        case "Nuevo":
          return "default"; // Azul - nuevo es positivo
        case "Recurrente":
          return "secondary"; // Gris suave - es positivo, es una visita regular
        case "Convertido":
          return "outline"; // Verde suave - muy positivo, se convirtió
        default:
          return "secondary"; // Por defecto, gris suave
      }
    }
  };

  // Combinar miembros y visitas en una sola lista
  const todasLasPersonas = familia
    ? [
        ...familia.miembros.map((m) => ({ ...m, tipo: "miembro" as const })),
        ...familia.visitas.map((v) => ({ ...v, tipo: "visita" as const })),
      ]
    : [];

  const personasFiltradas = todasLasPersonas.filter(
    (persona) =>
      persona.nombres.toLowerCase().includes(busqueda.toLowerCase()) ||
      persona.apellidos.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (cargando) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando familia...</span>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (error || !familia) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <p className="text-red-600 mb-4">
                {error || "Familia no encontrada"}
              </p>
              <Button onClick={() => router.back()}>Volver</Button>
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
                  <BreadcrumbLink href="/familias">Familias</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {familia.nombre || `Familia ${familia.apellido}`}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Header con información de la familia */}
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
                <HomeIcon className="h-6 w-6" />
                {familia.nombre || `Familia ${familia.apellido}`}
              </h1>
              <p className="text-muted-foreground">
                {familia.totalPersonas} persona
                {familia.totalPersonas !== 1 ? "s" : ""} •{" "}
                {familia.totalMiembros} miembro
                {familia.totalMiembros !== 1 ? "s" : ""} •{" "}
                {familia.totalVisitas} visita
                {familia.totalVisitas !== 1 ? "s" : ""} •{" "}
                {familia.personasActivas} activa
                {familia.personasActivas !== 1 ? "s" : ""}
              </p>
            </div>
            <Button onClick={() => router.push(`/familias/${id}/editar`)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar Familia
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/familias/${id}/arbol`)}
            >
              <GitBranch className="mr-2 h-4 w-4" />
              Ver Árbol Familiar
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Información General */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HomeIcon className="h-5 w-5" />
                  Información General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-sm font-medium">Estado:</span>
                  <Badge
                    variant={
                      familia.estado === "Activa" ? "default" : "secondary"
                    }
                    className="ml-2"
                  >
                    {familia.estado}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm font-medium">Registro:</span>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(familia.fechaRegistro)}
                  </p>
                </div>
                {familia.edadPromedio && (
                  <div>
                    <span className="text-sm font-medium">Edad promedio:</span>
                    <p className="text-sm text-muted-foreground">
                      {Math.round(familia.edadPromedio)} años
                    </p>
                  </div>
                )}
                {familia.notas && (
                  <div>
                    <span className="text-sm font-medium">Notas:</span>
                    <p className="text-sm text-muted-foreground">
                      {familia.notas}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cabeza de Familia */}
            {familia.jefeFamilia && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5" />
                    Cabeza de Familia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted/80 transition-colors cursor-pointer"
                    onClick={() =>
                      router.push(`/miembros/${familia.jefeFamilia?.id}`)
                    }
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={familia.jefeFamilia.foto || "/placeholder.svg"}
                      />
                      <AvatarFallback>
                        {familia.jefeFamilia.nombres[0]}
                        {familia.jefeFamilia.apellidos[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">
                        {familia.jefeFamilia.nombres}{" "}
                        {familia.jefeFamilia.apellidos}
                      </p>
                      {familia.jefeFamilia.fechaNacimiento && (
                        <p className="text-xs text-muted-foreground">
                          {calcularEdad(familia.jefeFamilia.fechaNacimiento)}{" "}
                          años
                        </p>
                      )}
                      {familia.jefeFamilia.correo && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {familia.jefeFamilia.correo}
                        </p>
                      )}
                      {familia.jefeFamilia.telefono && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {familia.jefeFamilia.telefono}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Estadísticas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Estadísticas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      {familia.totalPersonas}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total Personas
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {familia.personasActivas}
                    </p>
                    <p className="text-xs text-muted-foreground">Activas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {familia.totalMiembros}
                    </p>
                    <p className="text-xs text-muted-foreground">Miembros</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {familia.totalVisitas}
                    </p>
                    <p className="text-xs text-muted-foreground">Visitas</p>
                  </div>
                </div>
                {familia.edadPromedio && (
                  <div className="text-center pt-2 border-t">
                    <p className="text-2xl font-bold">
                      {Math.round(familia.edadPromedio)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Edad Promedio
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Lista de Miembros */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Miembros de la Familia
                  </CardTitle>
                  <CardDescription>
                    Gestiona los miembros que pertenecen a esta familia
                  </CardDescription>
                </div>
                <Button onClick={() => setDialogAgregar(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Miembro
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Búsqueda */}
              <div className="flex items-center gap-2 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar miembros..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              {/* Lista */}
              {personasFiltradas.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    {busqueda
                      ? "No se encontraron miembros"
                      : "No hay miembros en esta familia"}
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
                  {personasFiltradas.map((persona) => (
                    <div
                      key={persona.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                        onClick={() => {
                          const ruta =
                            persona.tipo === "miembro"
                              ? `/miembros/${persona.id}`
                              : `/visitas/${persona.id}`;
                          router.push(ruta);
                        }}
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={persona.foto || "/placeholder.svg"}
                          />
                          <AvatarFallback>
                            {persona.nombres[0]}
                            {persona.apellidos[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {persona.nombres} {persona.apellidos}
                            </p>
                            {familia.jefeFamilia?.id === persona.id && (
                              <Badge variant="outline" className="text-xs">
                                <Crown className="h-3 w-3 mr-1" />
                                Cabeza
                              </Badge>
                            )}
                            {persona.parentescoFamiliar && (
                              <Badge variant="secondary" className="text-xs">
                                {persona.parentescoFamiliar}
                              </Badge>
                            )}
                            <Badge
                              variant={
                                persona.tipo === "miembro"
                                  ? "default"
                                  : "outline"
                              }
                              className="text-xs flex items-center gap-1"
                            >
                              {persona.tipo === "miembro" ? (
                                <UserCheck className="h-3 w-3" />
                              ) : (
                                <Users className="h-3 w-3" />
                              )}
                              {persona.tipo === "miembro"
                                ? "Miembro"
                                : "Visita"}
                            </Badge>
                            <Badge
                              variant={getBadgeVariant(
                                persona.estado,
                                persona.tipo
                              )}
                              className="text-xs"
                            >
                              {persona.estado}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {persona.fechaNacimiento && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {calcularEdad(persona.fechaNacimiento)} años
                              </span>
                            )}
                            {persona.correo && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {persona.correo}
                              </span>
                            )}
                            {persona.telefono && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {persona.telefono}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                const ruta =
                                  persona.tipo === "miembro"
                                    ? `/miembros/${persona.id}`
                                    : `/visitas/${persona.id}`;
                                router.push(ruta);
                              }}
                            >
                              Ver Perfil
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                const rutaEditar =
                                  persona.tipo === "miembro"
                                    ? `/miembros/${persona.id}/editar`
                                    : `/visitas/${persona.id}/editar`;
                                router.push(rutaEditar);
                              }}
                            >
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                abrirDialogParentesco(persona as PersonaFamilia)
                              }
                            >
                              Asignar Parentesco
                            </DropdownMenuItem>
                            {familia.jefeFamilia?.id !== persona.id && (
                              <DropdownMenuItem
                                onClick={() =>
                                  removerPersona(persona as PersonaFamilia)
                                }
                                className="text-red-600"
                              >
                                <UserMinus className="mr-2 h-4 w-4" />
                                Remover de Familia
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

          {/* Dialog para Agregar Miembro */}
          <Dialog open={dialogAgregar} onOpenChange={setDialogAgregar}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Miembro a la Familia</DialogTitle>
                <DialogDescription>
                  Selecciona un miembro para agregarlo a la familia{" "}
                  {familia.nombre || `Familia ${familia.apellido}`}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <PersonaSelector
                  personas={personasDisponibles}
                  onSeleccionar={setPersonaSeleccionada}
                  personaSeleccionada={personaSeleccionada}
                  placeholder="Buscar persona disponible..."
                  disabled={agregandoPersona}
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogAgregar(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={agregarPersona}
                  disabled={!personaSeleccionada || agregandoPersona}
                >
                  {agregandoPersona && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Agregar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog para Editar Parentesco */}
          <Dialog open={dialogParentesco} onOpenChange={setDialogParentesco}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Asignar Parentesco Familiar</DialogTitle>
                <DialogDescription>
                  Define la relación de {personaParentesco?.nombres}{" "}
                  {personaParentesco?.apellidos} con el cabeza de familia
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Parentesco Familiar
                  </label>
                  <Select
                    value={parentescoSeleccionado}
                    onValueChange={setParentescoSeleccionado}
                    disabled={actualizandoParentesco}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el parentesco..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposParentesco.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogParentesco(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={actualizarParentesco}
                  disabled={!parentescoSeleccionado || actualizandoParentesco}
                >
                  {actualizandoParentesco && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Actualizar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
