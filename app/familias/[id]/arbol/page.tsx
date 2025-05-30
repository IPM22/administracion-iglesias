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
  Users,
  HomeIcon,
  Crown,
  Calendar,
  Mail,
  Phone,
  Loader2,
  GitBranch,
  Heart,
  Baby,
  User,
  UserCheck,
} from "lucide-react";

interface FamiliaDetalle {
  id: number;
  apellido: string;
  nombre?: string;
  estado: string;
  jefeFamilia?: {
    id: number;
    nombres: string;
    apellidos: string;
    foto?: string;
    fechaNacimiento?: string;
  };
  miembros: MiembroFamilia[];
  visitas: VisitaFamilia[];
  vinculosOrigen: VinculoFamiliar[];
  vinculosRelacionados: VinculoFamiliar[];
}

interface MiembroFamilia {
  id: number;
  nombres: string;
  apellidos: string;
  fechaNacimiento?: string;
  estado: string;
  foto?: string;
  parentescoFamiliar?: string;
  correo?: string;
  telefono?: string;
}

interface VisitaFamilia {
  id: number;
  nombres: string;
  apellidos: string;
  fechaNacimiento?: string;
  estado: string;
  foto?: string;
  parentescoFamiliar?: string;
  correo?: string;
  telefono?: string;
}

interface VinculoFamiliar {
  id: number;
  tipoVinculo: string;
  descripcion?: string;
  familiaOrigen: {
    id: number;
    apellido: string;
    nombre?: string;
    estado: string;
  };
  familiaRelacionada: {
    id: number;
    apellido: string;
    nombre?: string;
    estado: string;
  };
  miembroVinculo?: {
    id: number;
    nombres: string;
    apellidos: string;
  };
}

interface PersonaArbol extends MiembroFamilia {
  tipo: "miembro" | "visita";
}

export default function ArbolFamiliarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [familia, setFamilia] = useState<FamiliaDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      cargarDatos();
    }
  }, [id]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError(null);

      const response = await fetch(`/api/familias/${id}`);
      if (response.ok) {
        const familiaData = await response.json();
        setFamilia(familiaData);
      } else {
        throw new Error("Error al cargar familia");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("No se pudieron cargar los datos");
    } finally {
      setCargando(false);
    }
  };

  const calcularEdad = (fechaNacimiento: string) => {
    const fecha = new Date(fechaNacimiento);
    const hoy = new Date();
    return hoy.getFullYear() - fecha.getFullYear();
  };

  const obtenerIconoParentesco = (parentesco?: string) => {
    if (!parentesco) return <User className="h-4 w-4" />;

    switch (parentesco.toLowerCase()) {
      case "cabeza de familia":
        return <Crown className="h-4 w-4" />;
      case "esposo/a":
      case "esposa":
      case "esposo":
        return <Heart className="h-4 w-4" />;
      case "hijo/a":
      case "hijo":
      case "hija":
        return <Baby className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const agruparMiembrosPorParentesco = (
    miembros: MiembroFamilia[],
    visitas: VisitaFamilia[]
  ) => {
    const grupos: { [key: string]: PersonaArbol[] } = {};

    // Combinar miembros y visitas
    const todasPersonas: PersonaArbol[] = [
      ...miembros.map((m) => ({ ...m, tipo: "miembro" as const })),
      ...visitas.map((v) => ({ ...v, tipo: "visita" as const })),
    ];

    todasPersonas.forEach((persona) => {
      const parentesco = persona.parentescoFamiliar || "Sin clasificar";
      if (!grupos[parentesco]) {
        grupos[parentesco] = [];
      }
      grupos[parentesco].push(persona);
    });

    return grupos;
  };

  if (cargando) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando árbol familiar...</span>
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

  const gruposParentesco = agruparMiembrosPorParentesco(
    familia.miembros,
    familia.visitas
  );
  const ordenParentesco = [
    "Cabeza de Familia",
    "Esposo/a",
    "Esposa",
    "Esposo",
    "Padre/Madre",
    "Hijo/a",
    "Hijo",
    "Hija",
    "Hermano/a",
    "Abuelo/a",
    "Nieto/a",
    "Tío/a",
    "Sobrino/a",
    "Primo/a",
    "Cuñado/a",
    "Yerno/Nuera",
    "Suegro/a",
    "Otro",
    "Sin clasificar",
  ];

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
                  <BreadcrumbLink href={`/familias/${id}`}>
                    {familia.nombre || `Familia ${familia.apellido}`}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Árbol Familiar</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Header */}
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
                Árbol Familiar:{" "}
                {familia.nombre || `Familia ${familia.apellido}`}
              </h1>
              <p className="text-muted-foreground">
                Estructura familiar y relaciones entre miembros
              </p>
            </div>
          </div>

          <div className="grid gap-6">
            {/* Estructura Familiar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Estructura Familiar
                </CardTitle>
                <CardDescription>
                  Miembros organizados por su relación con el cabeza de familia
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {ordenParentesco
                    .filter((parentesco) => gruposParentesco[parentesco])
                    .map((parentesco) => (
                      <div key={parentesco} className="space-y-3">
                        <div className="flex items-center gap-2 border-b pb-2">
                          {obtenerIconoParentesco(parentesco)}
                          <h3 className="font-semibold text-lg">
                            {parentesco}
                          </h3>
                          <Badge variant="outline">
                            {gruposParentesco[parentesco].length}
                          </Badge>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {gruposParentesco[parentesco].map((persona) => (
                            <div
                              key={persona.id}
                              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted/80 transition-colors cursor-pointer"
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
                                <p className="font-medium">
                                  {persona.nombres} {persona.apellidos}
                                </p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  {persona.fechaNacimiento && (
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {calcularEdad(
                                        persona.fechaNacimiento
                                      )}{" "}
                                      años
                                    </span>
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
                                    variant={
                                      persona.estado === "Activo"
                                        ? "default"
                                        : "secondary"
                                    }
                                    className="text-xs"
                                  >
                                    {persona.estado}
                                  </Badge>
                                </div>
                                {(persona.correo || persona.telefono) && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
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
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Vínculos Familiares */}
            {(familia.vinculosOrigen.length > 0 ||
              familia.vinculosRelacionados.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitBranch className="h-5 w-5" />
                    Vínculos con Otras Familias
                  </CardTitle>
                  <CardDescription>
                    Conexiones y relaciones con otras familias de la iglesia
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      ...familia.vinculosOrigen,
                      ...familia.vinculosRelacionados,
                    ].map((vinculo) => {
                      const familiaRelacionada =
                        vinculo.familiaOrigen.id === familia.id
                          ? vinculo.familiaRelacionada
                          : vinculo.familiaOrigen;

                      return (
                        <div
                          key={vinculo.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() =>
                            router.push(`/familias/${familiaRelacionada.id}`)
                          }
                        >
                          <div className="flex items-center gap-3">
                            <HomeIcon className="h-8 w-8 text-muted-foreground" />
                            <div>
                              <p className="font-medium">
                                {familiaRelacionada.nombre ||
                                  `Familia ${familiaRelacionada.apellido}`}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Relación: {vinculo.tipoVinculo}
                              </p>
                              {vinculo.descripcion && (
                                <p className="text-xs text-muted-foreground">
                                  {vinculo.descripcion}
                                </p>
                              )}
                              {vinculo.miembroVinculo && (
                                <p className="text-xs text-blue-600">
                                  Conectado por:{" "}
                                  {vinculo.miembroVinculo.nombres}{" "}
                                  {vinculo.miembroVinculo.apellidos}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                familiaRelacionada.estado === "Activa"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {familiaRelacionada.estado}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
