"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { WelcomeWizard } from "@/components/onboarding/welcome-wizard";
import { SelectorIglesias } from "@/components/auth/SelectorIglesias";
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
  // Estadísticas principales por rol
  totalMiembros: number;
  miembrosActivos: number;
  totalVisitas: number;
  totalFamilias: number;
  familiasActivas: number;

  // Nueva: Estadísticas por tipo de persona (basadas en edad)
  porTipoPersona: {
    ninos: number; // 0-9 años
    adolescentes: number; // 10-14 años
    jovenes: number; // 15-24 años
    adultos: number; // 25-35 años
    adultosMayores: number; // 36-59 años
    envejecientes: number; // 60+ años
  };

  // Estadísticas específicas por rol y tipo
  miembrosPorTipo: {
    ninos: number;
    adolescentes: number;
    jovenes: number;
    adultos: number;
    adultosMayores: number;
    envejecientes: number;
  };

  visitasPorEstado: {
    nuevas: number;
    recurrentes: number;
    convertidas: number;
    inactivas: number;
  };

  // Métricas de crecimiento
  cambios: {
    miembros: number;
    visitas: number;
    familias: number;
    conversiones: number; // Nueva métrica
  };

  nuevosUltimos30Dias: {
    miembros: number;
    visitas: number;
    familias: number;
  };

  // Distribución por edades (mantenida para compatibilidad)
  distribucionEdades: {
    ninos: number;
    jovenes: number;
    adultos: number;
    adultosMayores: number;
  };

  // Estadísticas de ministerio y vida eclesiástica
  estadisticasEclesiasticas: {
    bautizados: number;
    confirmados: number;
    enMinisterios: number;
    adolescentesSinBautismo: number; // Métrica importante para seguimiento
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
    tipoPersona: string; // Nuevo: incluir el tipo de persona convertida
  }>;

  tasaConversion: number;
  promedioPersonasPorFamilia: number;

  // Nuevas métricas
  tasaBautismo: number; // % de miembros bautizados
  tasaRetencion: number; // % de visitas que se vuelven recurrentes
}

export default function DashboardPage() {
  const router = useRouter();
  const {
    user,
    usuarioCompleto,
    iglesiaActiva,
    loading: authLoading,
    initializing,
    mostrarSelectorIglesias,
    seleccionarIglesia,
  } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Referencias para evitar cargas múltiples
  const estadisticasCargadas = useRef<number | null>(null);
  const cargandoEstadisticas = useRef(false);

  const cargarEstadisticas = useCallback(async () => {
    if (!iglesiaActiva || cargandoEstadisticas.current) return;

    // Si ya cargamos las estadísticas para esta iglesia, no volver a cargar
    if (estadisticasCargadas.current === iglesiaActiva.id) return;

    cargandoEstadisticas.current = true;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/dashboard/stats?iglesiaId=${iglesiaActiva.id}`,
        {
          // Agregar cache headers para evitar cargas innecesarias
          headers: {
            "Cache-Control": "max-age=30", // Cache por 30 segundos
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error cargando estadísticas");
      }

      const data = await response.json();
      setStats(data);
      estadisticasCargadas.current = iglesiaActiva.id;
    } catch (error) {
      console.error("Error:", error);
      setError("No se pudieron cargar las estadísticas");
    } finally {
      setLoading(false);
      cargandoEstadisticas.current = false;
    }
  }, [iglesiaActiva?.id]); // Solo depende del ID de la iglesia

  useEffect(() => {
    if (
      iglesiaActiva &&
      !initializing &&
      !loading &&
      !cargandoEstadisticas.current
    ) {
      cargarEstadisticas();
    }
  }, [cargarEstadisticas, iglesiaActiva, initializing]);

  // Limpiar caché cuando cambia la iglesia
  useEffect(() => {
    if (iglesiaActiva && estadisticasCargadas.current !== iglesiaActiva.id) {
      estadisticasCargadas.current = null;
      setStats(null);
    }
  }, [iglesiaActiva?.id]);

  // Mostrar spinner mientras se autentica o inicializa
  if (authLoading || initializing) {
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

  // Si no hay usuario, redirigir al login
  if (!user) {
    router.push("/login");
    return null;
  }

  // Mostrar wizard de bienvenida si es primer login
  if (usuarioCompleto?.primerLogin) {
    return (
      <WelcomeWizard
        usuario={{
          nombres: usuarioCompleto.nombres,
          apellidos: usuarioCompleto.apellidos,
          email: usuarioCompleto.email,
        }}
        onComplete={() => {
          // Recargar datos del usuario
          window.location.reload();
        }}
      />
    );
  }

  // Mostrar selector de iglesias si hay múltiples iglesias activas (ANTES que sin iglesia)
  if (mostrarSelectorIglesias && usuarioCompleto) {
    return (
      <SelectorIglesias
        iglesias={usuarioCompleto.iglesias}
        onSeleccionarIglesia={seleccionarIglesia}
        usuario={{
          nombres: usuarioCompleto.nombres,
          apellidos: usuarioCompleto.apellidos,
        }}
      />
    );
  }

  // Solo mostrar "Sin iglesia" si ya terminó de inicializar y no hay iglesia
  if (!iglesiaActiva && !initializing) {
    // Verificar si el usuario tiene solicitudes pendientes
    const tieneSolicitudesPendientes = usuarioCompleto?.iglesias?.some(
      (iglesia) => iglesia.estado === "PENDIENTE"
    );

    if (tieneSolicitudesPendientes) {
      // Si tiene solicitudes pendientes, redirigir al login con mensaje
      router.push("/login?mensaje=solicitud-pendiente");
      return null;
    }

    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sin Iglesia Asignada</h2>
            <p className="text-muted-foreground mb-4">
              No perteneces a ninguna iglesia o tu solicitud aún está pendiente.
            </p>
            <Button onClick={() => router.push("/onboarding/buscar-iglesia")}>
              Buscar Iglesia
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
      route: "/comunidad?tab=miembros",
    },
    {
      title: "Total Visitas",
      value: stats.totalVisitas,
      description: `${stats.visitasPorEstado.nuevas} nuevas`,
      change: stats.cambios.visitas,
      icon: UserPlus,
      color: "text-green-600",
      route: "/comunidad?tab=visitas",
    },
    {
      title: "Niños y Adolescentes",
      value:
        (stats.porTipoPersona?.ninos || 0) +
        (stats.porTipoPersona?.adolescentes || 0),
      description: `${stats.porTipoPersona?.adolescentes || 0} adolescentes`,
      change: 0, // Se puede calcular en la API si es necesario
      icon: Heart,
      color: "text-pink-600",
      route: "/comunidad?tab=ninos-adolescentes",
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
      change: stats.cambios.conversiones || 0,
      icon: Heart,
      color: "text-red-600",
      route: "/comunidad?tab=visitas&filter=convertidas",
    },
    {
      title: "Tasa Bautismo",
      value: `${stats.tasaBautismo || 0}%`,
      description: `${
        stats.estadisticasEclesiasticas?.bautizados || 0
      } bautizados`,
      change: 0,
      icon: UserCheck,
      color: "text-cyan-600",
      route: "/comunidad?filter=bautizados",
    },
  ];

  // Tarjetas adicionales para métricas específicas
  const additionalStatsCards = [
    {
      title: "Jóvenes Activos",
      value: stats.porTipoPersona?.jovenes || 0,
      description: "15-24 años",
      icon: Users,
      color: "text-indigo-600",
    },
    {
      title: "Adultos Mayores",
      value:
        (stats.porTipoPersona?.adultosMayores || 0) +
        (stats.porTipoPersona?.envejecientes || 0),
      description: "36+ años",
      icon: Users,
      color: "text-amber-600",
    },
    {
      title: "En Ministerios",
      value: stats.estadisticasEclesiasticas?.enMinisterios || 0,
      description: `${Math.round(
        ((stats.estadisticasEclesiasticas?.enMinisterios || 0) /
          stats.totalMiembros) *
          100
      )}% de miembros`,
      icon: UserCheck,
      color: "text-emerald-600",
    },
    {
      title: "Adolescentes sin Bautismo",
      value: stats.estadisticasEclesiasticas?.adolescentesSinBautismo || 0,
      description: "Requieren seguimiento",
      icon: UserPlus,
      color: "text-orange-600",
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
          {/* Información de la iglesia activa */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    {iglesiaActiva?.nombre}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Tu rol:{" "}
                    <Badge variant="secondary">{iglesiaActiva?.rol}</Badge>
                  </p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>
                    Usuario: {usuarioCompleto?.nombres}{" "}
                    {usuarioCompleto?.apellidos}
                  </p>
                  <p>{usuarioCompleto?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dashboard con filtro de iglesia e información clave */}
          <div className="flex flex-1 flex-col gap-3 md:gap-4 p-2 md:p-4 pt-0">
            {/* Header responsivo */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                  Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  {iglesiaActiva ? (
                    <>Panel de control de {iglesiaActiva.nombre}</>
                  ) : (
                    "Información general del sistema"
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cargarEstadisticas}
                  disabled={loading}
                  className="h-8 text-xs sm:h-9 sm:text-sm"
                >
                  {loading ? (
                    <Loader2 className="h-3 w-3 animate-spin sm:h-4 sm:w-4" />
                  ) : (
                    <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                  <span className="hidden sm:inline ml-2">Actualizar</span>
                </Button>
              </div>
            </div>

            {/* Tarjetas de estadísticas principales - Grid responsivo */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {/* Total de Miembros */}
                <Card className="relative overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">
                      Miembros
                    </CardTitle>
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg sm:text-2xl font-bold">
                      {stats.totalMiembros}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stats.miembrosActivos} activos
                    </p>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent" />
                  </CardContent>
                </Card>

                {/* Total de Visitas */}
                <Card className="relative overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">
                      Visitas
                    </CardTitle>
                    <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg sm:text-2xl font-bold">
                      {stats.totalVisitas}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stats.visitasPorEstado.nuevas} nuevas
                    </p>
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent" />
                  </CardContent>
                </Card>

                {/* Total de Familias */}
                <Card className="relative overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">
                      Familias
                    </CardTitle>
                    <Home className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg sm:text-2xl font-bold">
                      {stats.totalFamilias}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stats.familiasActivas} activas
                    </p>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent" />
                  </CardContent>
                </Card>

                {/* Tasa de Conversión */}
                <Card className="relative overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">
                      Conversiones
                    </CardTitle>
                    <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg sm:text-2xl font-bold">
                      {stats.tasaConversion.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stats.conversionesRecientes.length} recientes
                    </p>
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent" />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Distribución por edades - Mejorada para móvil */}
            {stats && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm md:text-base flex items-center gap-2">
                      <PieChart className="h-4 w-4" />
                      Distribución por Tipo de Persona
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(stats.porTipoPersona).map(
                        ([tipo, cantidad]) => (
                          <div
                            key={tipo}
                            className="flex items-center justify-between"
                          >
                            <span className="text-xs sm:text-sm capitalize">
                              {tipo.replace(/([A-Z])/g, " $1").toLowerCase()}
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-12 sm:w-16 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500"
                                  style={{
                                    width: `${
                                      stats.totalMiembros > 0
                                        ? (cantidad / stats.totalMiembros) * 100
                                        : 0
                                    }%`,
                                  }}
                                />
                              </div>
                              <span className="text-xs sm:text-sm font-medium w-6 text-right">
                                {cantidad}
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Estado de Visitas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm md:text-base flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      Estado de Visitas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(stats.visitasPorEstado).map(
                        ([estado, cantidad]) => (
                          <div
                            key={estado}
                            className="flex items-center justify-between"
                          >
                            <span className="text-xs sm:text-sm capitalize">
                              {estado}
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-12 sm:w-16 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-500"
                                  style={{
                                    width: `${
                                      stats.totalVisitas > 0
                                        ? (cantidad / stats.totalVisitas) * 100
                                        : 0
                                    }%`,
                                  }}
                                />
                              </div>
                              <span className="text-xs sm:text-sm font-medium w-6 text-right">
                                {cantidad}
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Actividades próximas y conversiones recientes - Layout responsivo */}
            {stats && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 md:gap-4">
                {/* Próximas actividades */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm md:text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Próximas Actividades
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.proximasActividades.length === 0 ? (
                      <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">
                        No hay actividades programadas
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {stats.proximasActividades
                          .slice(0, 5)
                          .map((actividad) => (
                            <div
                              key={actividad.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 rounded-lg border bg-card/50 gap-1 sm:gap-0"
                            >
                              <div className="min-w-0 flex-1">
                                <h4 className="text-xs sm:text-sm font-medium line-clamp-1">
                                  {actividad.nombre}
                                </h4>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    <span>{actividad.fecha}</span>
                                  </div>
                                  {actividad.lugar && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <MapPin className="h-3 w-3" />
                                      <span className="truncate max-w-24 sm:max-w-none">
                                        {actividad.lugar}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mt-1 sm:mt-0">
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${obtenerColorTipo(
                                    actividad.tipoCategoria
                                  )}`}
                                >
                                  {actividad.tipo}
                                </Badge>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Conversiones recientes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm md:text-base flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Conversiones Recientes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.conversionesRecientes.length === 0 ? (
                      <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">
                        No hay conversiones recientes
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {stats.conversionesRecientes
                          .slice(0, 5)
                          .map((conversion, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 sm:p-3 rounded-lg border bg-card/50"
                            >
                              <div className="min-w-0 flex-1">
                                <h4 className="text-xs sm:text-sm font-medium truncate">
                                  {conversion.nombres} {conversion.apellidos}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  {formatearFecha(conversion.fechaConversion)}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {conversion.tipoPersona}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Métricas adicionales - Grid compacto para móvil */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                <Card>
                  <CardContent className="p-3 md:p-6">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Tasa Bautismo
                        </p>
                        <p className="text-sm sm:text-lg font-bold">
                          {stats.tasaBautismo.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-3 md:p-6">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Retención
                        </p>
                        <p className="text-sm sm:text-lg font-bold">
                          {stats.tasaRetencion.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-3 md:p-6">
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Prom/Familia
                        </p>
                        <p className="text-sm sm:text-lg font-bold">
                          {stats.promedioPersonasPorFamilia.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-3 md:p-6">
                    <div className="flex items-center gap-2">
                      <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          En Ministerios
                        </p>
                        <p className="text-sm sm:text-lg font-bold">
                          {stats.estadisticasEclesiasticas.enMinisterios}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
