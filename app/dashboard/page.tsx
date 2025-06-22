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

          {/* Tarjetas principales de estadísticas */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

          {/* Métricas adicionales específicas del nuevo modelo */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {additionalStatsCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <Card
                  key={index}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {card.title}
                    </CardTitle>
                    <Icon className={`h-4 w-4 ${card.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{card.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Métricas detalladas por tipo de persona */}
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
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Inactivas
                  </span>
                  <Badge variant="destructive">
                    {stats.visitasPorEstado.inactivas || 0}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-purple-600" />
                  Comunidad por edad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Niños (0-9)
                  </span>
                  <Badge variant="secondary">
                    {stats.porTipoPersona?.ninos || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Adolescentes (10-14)
                  </span>
                  <Badge variant="secondary">
                    {stats.porTipoPersona?.adolescentes || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Jóvenes (15-24)
                  </span>
                  <Badge variant="secondary">
                    {stats.porTipoPersona?.jovenes || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Adultos (25-35)
                  </span>
                  <Badge variant="secondary">
                    {stats.porTipoPersona?.adultos || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Adultos Mayores (36-59)
                  </span>
                  <Badge variant="secondary">
                    {stats.porTipoPersona?.adultosMayores || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Envejecientes (60+)
                  </span>
                  <Badge variant="secondary">
                    {stats.porTipoPersona?.envejecientes || 0}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Nueva sección: Estadísticas Eclesiásticas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-blue-600" />
                Vida Eclesiástica
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.estadisticasEclesiasticas?.bautizados || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Bautizados
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stats.tasaBautismo || 0}% de miembros
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.estadisticasEclesiasticas?.confirmados || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Confirmados
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.estadisticasEclesiasticas?.enMinisterios || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    En Ministerios
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round(
                      ((stats.estadisticasEclesiasticas?.enMinisterios || 0) /
                        stats.totalMiembros) *
                        100
                    )}
                    % de miembros
                  </div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {stats.estadisticasEclesiasticas?.adolescentesSinBautismo ||
                      0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Adolescentes sin Bautismo
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Requieren seguimiento
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">
                              {conversion.nombres} {conversion.apellidos}
                            </p>
                            {conversion.tipoPersona && (
                              <Badge variant="outline" className="text-xs">
                                {conversion.tipoPersona}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Convertido el{" "}
                            {formatearFecha(conversion.fechaConversion)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
                {stats.conversionesRecientes.length > 6 && (
                  <div className="flex justify-center mt-4">
                    <Button
                      variant="outline"
                      onClick={() =>
                        router.push("/comunidad?tab=visitas&filter=convertidas")
                      }
                    >
                      Ver Todas las Conversiones
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
