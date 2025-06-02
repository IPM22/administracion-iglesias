"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "../../components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  UserPlus,
  Home,
  Heart,
  TrendingUp,
  TrendingDown,
  Calendar,
  PieChart,
  UserCheck,
  Loader2,
  RefreshCw,
  Zap,
  Clock,
  MapPin,
} from "lucide-react";

interface DashboardStats {
  totalMiembros: number;
  miembrosActivos: number;
  totalVisitas: number;
  totalFamilias: number;
  familiasActivas: number;
  visitasPorEstado: {
    nuevas: number;
    recurrentes: number;
    convertidas: number;
  };
  cambios: {
    miembros: number;
    visitas: number;
    familias: number;
  };
  nuevosUltimos30Dias: {
    miembros: number;
    visitas: number;
    familias: number;
  };
  distribucionEdades: {
    ninos: number;
    jovenes: number;
    adultos: number;
    adultosMayores: number;
  };
  proximasActividades: Array<{
    id: number;
    nombre: string;
    fecha: string;
    fechaCompleta: string;
    lugar: string;
    tipo: string;
    tipoCategoria: string;
    ministerio?: string;
    horaInicio?: string;
    horaFin?: string;
    descripcion?: string;
    estado: string;
    asistentesEsperados: number;
  }>;
  conversionesRecientes: Array<{
    nombres: string;
    apellidos: string;
    fechaConversion: string;
    fechaOriginal: string;
  }>;
  tasaConversion: number;
  promedioPersonasPorFamilia: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/dashboard/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        throw new Error("Error al cargar estadísticas");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("No se pudieron cargar las estadísticas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const formatearCambio = (porcentaje: number) => {
    const isPositive = porcentaje >= 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const color = isPositive ? "text-green-600" : "text-red-600";

    return (
      <div className={`flex items-center gap-1 ${color}`}>
        <Icon className="h-3 w-3" />
        <span className="text-xs font-medium">
          {isPositive ? "+" : ""}
          {porcentaje}%
        </span>
      </div>
    );
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-ES", {
      month: "short",
      day: "numeric",
    });
  };

  const obtenerColorTipo = (tipo: string) => {
    const tipoLower = tipo.toLowerCase();

    // Tipos específicos más comunes
    if (tipoLower.includes("culto") || tipoLower.includes("adoración")) {
      return "bg-blue-100 text-blue-700";
    }
    if (
      tipoLower.includes("estudio") ||
      tipoLower.includes("bíblico") ||
      tipoLower.includes("enseñanza")
    ) {
      return "bg-green-100 text-green-700";
    }
    if (tipoLower.includes("joven") || tipoLower.includes("juventud")) {
      return "bg-purple-100 text-purple-700";
    }
    if (tipoLower.includes("oración") || tipoLower.includes("intercesión")) {
      return "bg-yellow-100 text-yellow-700";
    }
    if (
      tipoLower.includes("célula") ||
      tipoLower.includes("hogar") ||
      tipoLower.includes("casa")
    ) {
      return "bg-orange-100 text-orange-700";
    }
    if (tipoLower.includes("evangelismo") || tipoLower.includes("misión")) {
      return "bg-red-100 text-red-700";
    }
    if (tipoLower.includes("niños") || tipoLower.includes("infantil")) {
      return "bg-pink-100 text-pink-700";
    }
    if (tipoLower.includes("matrimonio") || tipoLower.includes("familia")) {
      return "bg-indigo-100 text-indigo-700";
    }
    if (tipoLower.includes("bautismo") || tipoLower.includes("bautismal")) {
      return "bg-cyan-100 text-cyan-700";
    }
    if (
      tipoLower.includes("conferencia") ||
      tipoLower.includes("seminario") ||
      tipoLower.includes("taller")
    ) {
      return "bg-emerald-100 text-emerald-700";
    }

    // Default
    return "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando dashboard...</span>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (error || !stats) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={cargarEstadisticas}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reintentar
              </Button>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const statsCards = [
    {
      title: "Total Miembros",
      value: stats.totalMiembros,
      description: `${stats.miembrosActivos} activos`,
      change: stats.cambios.miembros,
      icon: Users,
      color: "text-blue-600",
      route: "/miembros",
    },
    {
      title: "Total Visitas",
      value: stats.totalVisitas,
      description: `${stats.visitasPorEstado.nuevas} nuevas`,
      change: stats.cambios.visitas,
      icon: UserPlus,
      color: "text-green-600",
      route: "/visitas",
    },
    {
      title: "Familias Activas",
      value: stats.familiasActivas,
      description: `${stats.promedioPersonasPorFamilia} personas promedio`,
      change: stats.cambios.familias,
      icon: Home,
      color: "text-purple-600",
      route: "/familias",
    },
    {
      title: "Tasa Conversión",
      value: `${stats.tasaConversion}%`,
      description: `${stats.visitasPorEstado.convertidas} convertidos`,
      change: stats.visitasPorEstado.convertidas > 0 ? 15 : 0,
      icon: Heart,
      color: "text-red-600",
      route: "/visitas?filter=Convertido",
    },
  ];

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
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="ml-auto">
              <Button variant="outline" size="sm" onClick={cargarEstadisticas}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
          {/* Tarjetas principales de estadísticas */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statsCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <Card
                  key={index}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => router.push(card.route)}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {card.title}
                    </CardTitle>
                    <Icon className={`h-4 w-4 ${card.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">{card.value}</div>
                      {formatearCambio(card.change)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Métricas adicionales */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-600" />
                  Nuevos Últimos 30 Días
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Miembros
                  </span>
                  <Badge variant="secondary">
                    +{stats.nuevosUltimos30Dias.miembros}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Visitas</span>
                  <Badge variant="secondary">
                    +{stats.nuevosUltimos30Dias.visitas}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Familias
                  </span>
                  <Badge variant="secondary">
                    +{stats.nuevosUltimos30Dias.familias}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-blue-600" />
                  Estados de Visitas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Nuevas</span>
                  <Badge variant="default">
                    {stats.visitasPorEstado.nuevas}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Recurrentes
                  </span>
                  <Badge variant="secondary">
                    {stats.visitasPorEstado.recurrentes}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Convertidas
                  </span>
                  <Badge variant="outline">
                    {stats.visitasPorEstado.convertidas}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-purple-600" />
                  Distribución por Edades
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Niños (0-12)
                  </span>
                  <Badge variant="secondary">
                    {stats.distribucionEdades.ninos}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Jóvenes (13-25)
                  </span>
                  <Badge variant="secondary">
                    {stats.distribucionEdades.jovenes}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Adultos (26-59)
                  </span>
                  <Badge variant="secondary">
                    {stats.distribucionEdades.adultos}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Mayores (60+)
                  </span>
                  <Badge variant="secondary">
                    {stats.distribucionEdades.adultosMayores}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Próximas actividades */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Próximas Actividades
                {stats.proximasActividades.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {stats.proximasActividades.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.proximasActividades.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay actividades programadas próximamente</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => router.push("/actividades/nueva")}
                  >
                    Programar Actividad
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {stats.proximasActividades.map((actividad) => (
                    <div
                      key={actividad.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() =>
                        router.push(`/actividades/${actividad.id}`)
                      }
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1">
                            {actividad.nombre}
                          </h4>

                          {actividad.descripcion && (
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                              {actividad.descripcion}
                            </p>
                          )}

                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {actividad.fecha}
                            </div>

                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {actividad.lugar}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <Badge
                            className={`text-xs ${obtenerColorTipo(
                              actividad.tipo
                            )}`}
                            variant="outline"
                          >
                            {actividad.tipo}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t">
                        {actividad.ministerio ? (
                          <div className="flex items-center gap-1 text-sm text-blue-600">
                            <Users className="h-4 w-4" />
                            <span className="font-medium">
                              {actividad.ministerio}
                            </span>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            Sin ministerio asignado
                          </div>
                        )}

                        <Badge
                          variant={
                            actividad.estado === "Programada"
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {actividad.estado}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {stats.proximasActividades.length > 0 && (
                <div className="flex justify-center mt-6">
                  <Button
                    variant="outline"
                    onClick={() => router.push("/actividades")}
                  >
                    Ver Todas las Actividades
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conversiones recientes */}
          {stats.conversionesRecientes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-600" />
                  Conversiones Recientes
                  <Badge variant="secondary" className="ml-2">
                    {stats.conversionesRecientes.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {stats.conversionesRecientes
                    .slice(0, 6)
                    .map((conversion, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
                          <UserCheck className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {conversion.nombres} {conversion.apellidos}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Convertido el{" "}
                            {formatearFecha(conversion.fechaConversion)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
