"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Share2,
  ExternalLink,
  Loader2,
  Phone,
  Mail,
  Heart,
  Star,
  CalendarPlus,
} from "lucide-react";
import { useParams } from "next/navigation";
import Image from "next/image";

interface TipoActividad {
  id: number;
  nombre: string;
  tipo: string;
}

interface Ministerio {
  id: number;
  nombre: string;
}

interface ActividadData {
  id: number;
  nombre: string;
  descripcion?: string;
  fecha: string;
  horaInicio?: string;
  horaFin?: string;
  ubicacion?: string;
  googleMapsEmbed?: string;
  estado: string;
  banner?: string;
  tipoActividad: TipoActividad;
  ministerio?: Ministerio;
  horarios?: Array<{
    id: number;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    notas?: string;
  }>;
}

export default function PromocionActividadClient() {
  const resolvedParams = useParams();
  const actividadId = resolvedParams.id as string;
  const [actividad, setActividad] = useState<ActividadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActividad = async () => {
      try {
        console.log("🔍 DEBUG: Intentando cargar actividad ID:", actividadId);
        console.log("🌐 DEBUG: URL completa:", window.location.href);

        const response = await fetch(`/api/actividades/${actividadId}/public`);
        console.log(
          "📡 DEBUG: Respuesta de la API:",
          response.status,
          response.statusText
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ DEBUG: Error de respuesta:", errorText);
          throw new Error(`Error ${response.status}: ${errorText}`);
        }
        const data = await response.json();
        console.log("✅ DEBUG: Datos recibidos:", data);
        setActividad(data);
      } catch (_error) {
        console.error("💥 DEBUG: Error completo:", _error);
        setError(
          `Error al cargar la actividad: ${
            _error instanceof Error ? _error.message : "Error desconocido"
          }`
        );
      } finally {
        setLoading(false);
      }
    };

    if (actividadId) {
      console.log("🚀 DEBUG: Iniciando fetch para actividad:", actividadId);
      fetchActividad();
    } else {
      console.warn("⚠️ DEBUG: No hay actividadId disponible");
      setError("ID de actividad no válido");
      setLoading(false);
    }
  }, [actividadId]);

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatearHora = (hora?: string) => {
    if (!hora) return "";
    try {
      const [hours, minutes] = hora.split(":");
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return hora;
    }
  };

  const getHorarioCompleto = () => {
    if (!actividad) return "";
    if (actividad.horaInicio && actividad.horaFin) {
      return `${formatearHora(actividad.horaInicio)} - ${formatearHora(
        actividad.horaFin
      )}`;
    } else if (actividad.horaInicio) {
      return formatearHora(actividad.horaInicio);
    }
    return "Por confirmar";
  };

  const shareActivity = () => {
    if (navigator.share) {
      navigator.share({
        title: actividad?.nombre || "Evento",
        text: actividad?.descripcion || "",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Enlace copiado al portapapeles");
    }
  };

  const abrirEnWaze = () => {
    if (actividad?.ubicacion) {
      const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(
        actividad.ubicacion
      )}`;
      window.open(wazeUrl, "_blank");
    }
  };

  // Función para agregar al calendario
  const agregarAlCalendario = () => {
    if (!actividad) return;

    const formatearFechaCalendario = (fecha: string, hora?: string) => {
      const fechaObj = new Date(fecha);
      if (hora) {
        const [hours, minutes] = hora.split(":");
        fechaObj.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }
      return fechaObj.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    const fechaInicio = formatearFechaCalendario(
      actividad.fecha,
      actividad.horaInicio
    );
    const fechaFin = formatearFechaCalendario(
      actividad.fecha,
      actividad.horaFin || actividad.horaInicio
    );

    const detalles = [
      actividad.descripcion || "",
      actividad.ubicacion ? `Ubicación: ${actividad.ubicacion}` : "",
      `Organizado por: ${actividad.ministerio?.nombre || "Iglesia Central"}`,
      `Más información: ${window.location.href}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      actividad.nombre
    )}&dates=${fechaInicio}/${fechaFin}&details=${encodeURIComponent(
      detalles
    )}&location=${encodeURIComponent(
      actividad.ubicacion || ""
    )}&sf=true&output=xml`;

    // Para dispositivos móviles, intentar abrir la app de calendario nativa
    if (
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    ) {
      try {
        // Crear evento ICS para descargar
        const icsContent = [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "PRODID:-//Sistema Iglesia//ES",
          "BEGIN:VEVENT",
          `UID:actividad-${actividad.id}@iglesia.com`,
          `DTSTART:${fechaInicio}`,
          `DTEND:${fechaFin}`,
          `SUMMARY:${actividad.nombre}`,
          `DESCRIPTION:${detalles.replace(/\n/g, "\\n")}`,
          actividad.ubicacion ? `LOCATION:${actividad.ubicacion}` : "",
          "END:VEVENT",
          "END:VCALENDAR",
        ]
          .filter(Boolean)
          .join("\r\n");

        const blob = new Blob([icsContent], {
          type: "text/calendar;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${actividad.nombre.replace(/[^a-z0-9]/gi, "-")}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch {
        // Si falla, usar Google Calendar como fallback
        window.open(googleCalendarUrl, "_blank");
      }
    } else {
      // En escritorio, abrir Google Calendar
      window.open(googleCalendarUrl, "_blank");
    }
  };

  const formatearHorarios = () => {
    if (!actividad) return [];

    // Si hay horarios múltiples, los devolvemos
    if (actividad.horarios && actividad.horarios.length > 0) {
      return actividad.horarios.map((horario) => ({
        fecha: formatearFecha(horario.fecha),
        hora: `${formatearHora(horario.horaInicio)} - ${formatearHora(
          horario.horaFin
        )}`,
        notas: horario.notas,
      }));
    }

    // Si no hay horarios múltiples, devolvemos el horario principal
    return [
      {
        fecha: formatearFecha(actividad.fecha),
        hora: getHorarioCompleto(),
        notas: null,
      },
    ];
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "Programada":
        return { variant: "default" as const, text: "Próximamente" };
      case "En curso":
        return { variant: "secondary" as const, text: "En curso" };
      case "Finalizada":
        return { variant: "outline" as const, text: "Finalizada" };
      case "Cancelada":
        return { variant: "destructive" as const, text: "Cancelada" };
      default:
        return { variant: "default" as const, text: estado };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-800">
              Cargando evento...
            </h3>
            <p className="text-gray-600">
              Preparando una experiencia increíble
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !actividad) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="h-12 w-12 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            ¡Ups! Algo salió mal
          </h3>
          <p className="text-gray-600 mb-4">
            {error || "No pudimos encontrar este evento"}
          </p>
          <div className="bg-gray-100 rounded-lg p-4 mb-4 text-left">
            <p className="text-sm text-gray-600 mb-2">
              <strong>ID de actividad:</strong> {actividadId}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <strong>URL actual:</strong>{" "}
              {typeof window !== "undefined"
                ? window.location.pathname
                : "No disponible"}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Detalles del error:</strong>{" "}
              {error || "Actividad no encontrada"}
            </p>
          </div>
          <div className="space-y-2">
            <Button
              onClick={() => window.history.back()}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full font-medium shadow-lg"
            >
              Volver atrás
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="w-full bg-white hover:bg-gray-100 border-gray-300 text-gray-800 hover:text-gray-900 font-medium shadow-lg"
            >
              Intentar de nuevo
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const estadoBadge = getEstadoBadge(actividad.estado);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header mejorado */}
      <div className="relative">
        {/* Banner Principal - Optimizado para móviles */}
        <div className="relative w-full h-[50vh] min-h-[400px] sm:h-[60vh] sm:min-h-[450px] lg:h-[70vh] lg:min-h-[500px] overflow-hidden">
          {actividad.banner ? (
            <>
              <Image
                src={actividad.banner}
                alt={actividad.nombre}
                fill
                className="object-cover"
                priority
                onError={(e) => {
                  console.error("Error cargando banner:", actividad.banner);
                  e.currentTarget.style.display = "none";
                }}
              />
              {/* Overlay mejorado - Menos opaco para ver mejor la imagen */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              {/* Sombra adicional solo en el área del texto para mejor legibilidad */}
              <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            </>
          ) : (
            <>
              {/* Fondo de gradiente mejorado cuando no hay banner */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              {/* Patrón decorativo */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-xl" />
                <div className="absolute bottom-20 right-20 w-48 h-48 bg-white rounded-full blur-2xl" />
                <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-white rounded-full blur-lg" />
              </div>
            </>
          )}

          {/* Contenido del header - Optimizado para móviles */}
          <div className="absolute inset-0 flex items-end">
            <div className="container mx-auto px-4 sm:px-6 pb-6 sm:pb-8 lg:pb-12">
              <div className="max-w-4xl">
                {/* Badge de estado prominente */}
                <div className="mb-3 sm:mb-4">
                  <Badge
                    variant={estadoBadge.variant}
                    className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 bg-white/90 text-gray-800 hover:bg-white font-semibold"
                  >
                    ✨ {estadoBadge.text}
                  </Badge>
                </div>

                {/* Título principal - Mejor responsivo */}
                <h1
                  className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl xl:text-7xl font-bold text-white mb-3 sm:mb-4 leading-tight drop-shadow-2xl"
                  style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.8)" }}
                >
                  {actividad.nombre}
                </h1>

                {/* Información organizador */}
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                  </div>
                  <div>
                    <p
                      className="text-sm sm:text-lg lg:text-xl text-white font-semibold drop-shadow-lg"
                      style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.8)" }}
                    >
                      {actividad.ministerio?.nombre || "Iglesia Central"}
                    </p>
                    <p
                      className="text-xs sm:text-sm lg:text-base text-white/90 drop-shadow"
                      style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}
                    >
                      {actividad.tipoActividad.nombre} •{" "}
                      {actividad.tipoActividad.tipo}
                    </p>
                  </div>
                </div>

                {/* Información clave del evento - Stack en móvil */}
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-6 text-white">
                  <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span
                      className="text-sm sm:text-base font-medium"
                      style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}
                    >
                      {formatearFecha(actividad.fecha)}
                    </span>
                  </div>
                  {/* Solo mostrar horario si NO hay horarios múltiples */}
                  {(!actividad.horarios || actividad.horarios.length === 0) && (
                    <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span
                        className="text-sm sm:text-base font-medium"
                        style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}
                      >
                        {getHorarioCompleto()}
                      </span>
                    </div>
                  )}
                  {/* Mostrar "Varios horarios" cuando hay horarios múltiples */}
                  {actividad.horarios && actividad.horarios.length > 0 && (
                    <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span
                        className="text-sm sm:text-base font-medium"
                        style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}
                      >
                        {actividad.horarios.length} horarios disponibles
                      </span>
                    </div>
                  )}
                  {actividad.ubicacion && (
                    <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2">
                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span
                        className="text-sm sm:text-base font-medium truncate"
                        style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}
                      >
                        {actividad.ubicacion}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal - Optimizado para móviles */}
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-6 lg:gap-8 lg:grid-cols-3">
            {/* Información Principal - Stack en móvil */}
            <div className="lg:col-span-2 space-y-6 sm:space-y-8">
              {actividad.descripcion && (
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-3 sm:pb-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Star className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      </div>
                      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">
                        Sobre el Evento
                      </h2>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed text-sm sm:text-base lg:text-lg">
                      {actividad.descripcion}
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3 sm:pb-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    </div>
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">
                      Detalles del Evento
                    </h2>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6">
                  <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 auto-fit">
                    <div className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 bg-blue-50 rounded-xl">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">
                          Fecha
                        </p>
                        <p className="text-gray-600 text-sm sm:text-base lg:text-lg">
                          {formatearFecha(actividad.fecha)}
                        </p>
                      </div>
                    </div>

                    {/* Solo mostrar horario si NO hay horarios múltiples */}
                    {(!actividad.horarios ||
                      actividad.horarios.length === 0) && (
                      <div className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 bg-green-50 rounded-xl">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">
                            Horario
                          </p>
                          <p className="text-gray-600 text-sm sm:text-base lg:text-lg">
                            {getHorarioCompleto()}
                          </p>
                        </div>
                      </div>
                    )}

                    {actividad.ubicacion && (
                      <div
                        className={`flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 bg-red-50 rounded-xl ${
                          !actividad.horarios || actividad.horarios.length === 0
                            ? "md:col-span-2"
                            : "md:col-span-1"
                        }`}
                      >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">
                            Ubicación
                          </p>
                          <p className="text-gray-600 text-sm sm:text-base lg:text-lg mb-2 sm:mb-3">
                            {actividad.ubicacion}
                          </p>
                          {actividad.googleMapsEmbed && (
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  window.open(
                                    actividad.googleMapsEmbed,
                                    "_blank"
                                  )
                                }
                                className="bg-white hover:bg-gray-100 border-gray-300 text-gray-800 hover:text-gray-900 text-xs sm:text-sm font-medium"
                              >
                                <ExternalLink className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                Google Maps
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={abrirEnWaze}
                                className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700 text-xs sm:text-sm font-medium"
                              >
                                🚗 Waze
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div
                      className={`flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 bg-purple-50 rounded-xl ${
                        actividad.ubicacion ? "md:col-span-1" : "md:col-span-2"
                      }`}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">
                          Organizador
                        </p>
                        <p className="text-gray-600 text-sm sm:text-base lg:text-lg">
                          {actividad.ministerio?.nombre || "Iglesia Central"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card de Horarios Múltiples */}
              {actividad.horarios && actividad.horarios.length > 0 && (
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-3 sm:pb-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                      </div>
                      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">
                        Horarios Disponibles
                      </h2>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 sm:space-y-4">
                      {formatearHorarios().map((horario, index) => (
                        <div
                          key={index}
                          className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 bg-indigo-50 rounded-xl border border-indigo-100"
                        >
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800 text-sm sm:text-base">
                              {horario.fecha}
                            </p>
                            <p className="text-indigo-700 font-medium text-sm sm:text-base lg:text-lg">
                              {horario.hora}
                            </p>
                            {horario.notas && (
                              <p className="text-gray-600 text-xs sm:text-sm mt-1">
                                📝 {horario.notas}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Card del Mapa Mejorado y más prominente */}
              {actividad.googleMapsEmbed && (
                <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                  <CardHeader className="pb-3 sm:pb-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                        📍 Ubicación del Evento
                      </h3>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mt-2">
                      Encuentra fácilmente donde se realizará el evento
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 sm:mb-6 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg border-2 border-gray-100">
                      <iframe
                        src={actividad.googleMapsEmbed}
                        width="100%"
                        height="300"
                        className="sm:h-[400px]"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Ubicación del evento"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Button
                        onClick={() =>
                          window.open(actividad.googleMapsEmbed, "_blank")
                        }
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm sm:text-base font-medium shadow-lg"
                      >
                        <MapPin className="mr-2 h-4 w-4" />
                        Abrir en Google Maps
                      </Button>
                      <Button
                        onClick={abrirEnWaze}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-medium shadow-lg"
                      >
                        🚗 Abrir en Waze
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (actividad.ubicacion) {
                            navigator.clipboard.writeText(actividad.ubicacion);
                            alert("Dirección copiada al portapapeles");
                          }
                        }}
                        className="bg-white hover:bg-gray-100 border-gray-300 text-gray-800 hover:text-gray-900 text-sm sm:text-base font-medium shadow-lg"
                      >
                        📋 Copiar Dirección
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Panel Lateral - Optimizado para móviles */}
            <div className="space-y-4 sm:space-y-6">
              {/* Card de Información Rápida */}
              <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                <CardHeader className="pb-3 sm:pb-4">
                  <h3 className="text-lg sm:text-xl font-bold">
                    Información Rápida
                  </h3>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="bg-white/20 p-3 sm:p-4 rounded-xl backdrop-blur-sm">
                    <p className="text-xs sm:text-sm font-medium text-white/80 mb-2">
                      ENTRADA
                    </p>
                    <Badge
                      variant="secondary"
                      className="bg-white text-gray-800 font-semibold px-2 sm:px-3 py-1 text-xs sm:text-sm"
                    >
                      🎫 Gratuita
                    </Badge>
                  </div>

                  <div className="bg-white/20 p-3 sm:p-4 rounded-xl backdrop-blur-sm">
                    <p className="text-xs sm:text-sm font-medium text-white/80 mb-2">
                      TIPO DE EVENTO
                    </p>
                    <p className="font-semibold text-sm sm:text-base">
                      {actividad.tipoActividad.nombre}
                    </p>
                    <p className="text-xs sm:text-sm text-white/75">
                      {actividad.tipoActividad.tipo}
                    </p>
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={shareActivity}
                      className="w-full bg-white text-blue-600 hover:bg-gray-100 hover:text-blue-700 font-semibold py-2 sm:py-3 text-sm sm:text-base shadow-lg border border-white mb-3"
                    >
                      <Share2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      Compartir Evento
                    </Button>

                    <Button
                      onClick={agregarAlCalendario}
                      className="w-full bg-green-600 text-white hover:bg-green-700 font-semibold py-2 sm:py-3 text-sm sm:text-base shadow-lg"
                    >
                      <CalendarPlus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      Agregar al Calendario
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Card de Invitación */}
              <Card className="shadow-lg border-0 bg-gradient-to-br from-green-400 to-blue-500 text-white">
                <CardHeader className="pb-3 sm:pb-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Heart className="h-5 w-5 sm:h-6 sm:w-6" />
                    <h3 className="text-base sm:text-lg font-bold">¿Vienes?</h3>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-white/90 mb-3 sm:mb-4 leading-relaxed text-sm sm:text-base">
                    ¡Nos encantaría verte ahí! Te esperamos con los brazos
                    abiertos para vivir juntos esta experiencia especial.
                  </p>
                  <div className="bg-white/20 p-3 sm:p-4 rounded-xl backdrop-blur-sm">
                    <p className="text-xs sm:text-sm text-white/80 text-center mb-2 sm:mb-3">
                      Para más información contacta a la iglesia
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-white hover:bg-gray-100 text-gray-800 hover:text-gray-900 border-white font-medium text-xs sm:text-sm shadow-lg"
                      >
                        <Phone className="mr-1 h-3 w-3" />
                        Llamar
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-white hover:bg-gray-100 text-gray-800 hover:text-gray-900 border-white font-medium text-xs sm:text-sm shadow-lg"
                      >
                        <Mail className="mr-1 h-3 w-3" />
                        Email
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
