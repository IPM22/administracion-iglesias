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
}

export default function PromocionActividadPage() {
  const params = useParams();
  const actividadId = params.id as string;
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
      } catch (error) {
        console.error("💥 DEBUG: Error completo:", error);
        setError(
          `Error al cargar la actividad: ${
            error instanceof Error ? error.message : "Error desconocido"
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
              className="bg-blue-600 hover:bg-blue-700 w-full"
            >
              Volver atrás
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="w-full"
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
        {/* Banner Principal */}
        <div className="relative w-full h-[70vh] min-h-[500px] overflow-hidden">
          {actividad.banner ? (
            <>
              <Image
                src={actividad.banner}
                alt={actividad.nombre}
                fill
                className="object-cover"
                priority
              />
              {/* Overlay mejorado con gradiente más suave */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
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

          {/* Contenido del header */}
          <div className="absolute inset-0 flex items-end">
            <div className="container mx-auto px-6 pb-12">
              <div className="max-w-4xl">
                {/* Badge de estado prominente */}
                <div className="mb-4">
                  <Badge
                    variant={estadoBadge.variant}
                    className="text-sm px-4 py-2 bg-white/90 text-gray-800 hover:bg-white font-semibold"
                  >
                    ✨ {estadoBadge.text}
                  </Badge>
                </div>

                {/* Título principal */}
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 leading-tight drop-shadow-2xl">
                  {actividad.nombre}
                </h1>

                {/* Información organizador */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xl text-white/90 font-semibold drop-shadow-lg">
                      {actividad.ministerio?.nombre || "Iglesia Central"}
                    </p>
                    <p className="text-white/75 drop-shadow">
                      {actividad.tipoActividad.nombre} •{" "}
                      {actividad.tipoActividad.tipo}
                    </p>
                  </div>
                </div>

                {/* Información clave del evento */}
                <div className="flex flex-wrap gap-6 text-white/90">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    <span className="font-medium">
                      {formatearFecha(actividad.fecha)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <span className="font-medium">{getHorarioCompleto()}</span>
                  </div>
                  {actividad.ubicacion && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      <span className="font-medium">{actividad.ubicacion}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Información Principal */}
            <div className="lg:col-span-2 space-y-8">
              {actividad.descripcion && (
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Star className="h-5 w-5 text-blue-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800">
                        Sobre el Evento
                      </h2>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {actividad.descripcion}
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      Detalles del Evento
                    </h2>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-xl">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 mb-1">
                          Fecha
                        </p>
                        <p className="text-gray-600 text-lg">
                          {formatearFecha(actividad.fecha)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-xl">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Clock className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 mb-1">
                          Horario
                        </p>
                        <p className="text-gray-600 text-lg">
                          {getHorarioCompleto()}
                        </p>
                      </div>
                    </div>

                    {actividad.ubicacion && (
                      <div className="flex items-start space-x-4 p-4 bg-red-50 rounded-xl md:col-span-2">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800 mb-1">
                            Ubicación
                          </p>
                          <p className="text-gray-600 text-lg mb-3">
                            {actividad.ubicacion}
                          </p>
                          {actividad.googleMapsEmbed && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                window.open(actividad.googleMapsEmbed, "_blank")
                              }
                              className="bg-white hover:bg-gray-50"
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Ver en Google Maps
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-start space-x-4 p-4 bg-purple-50 rounded-xl">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 mb-1">
                          Organizador
                        </p>
                        <p className="text-gray-600 text-lg">
                          {actividad.ministerio?.nombre || "Iglesia Central"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card del Mapa Mejorado y más prominente */}
              {actividad.googleMapsEmbed && (
                <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-red-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">
                        📍 Ubicación del Evento
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Encuentra fácilmente donde se realizará el evento
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6 rounded-2xl overflow-hidden shadow-lg border-2 border-gray-100">
                      <iframe
                        src={actividad.googleMapsEmbed}
                        width="100%"
                        height="400"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Ubicación del evento"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() =>
                          window.open(actividad.googleMapsEmbed, "_blank")
                        }
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      >
                        <MapPin className="mr-2 h-4 w-4" />
                        Abrir en Google Maps
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (actividad.ubicacion) {
                            navigator.clipboard.writeText(actividad.ubicacion);
                            alert("Dirección copiada al portapapeles");
                          }
                        }}
                        className="bg-white hover:bg-gray-50"
                      >
                        📋 Copiar Dirección
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Panel Lateral Mejorado */}
            <div className="space-y-6">
              {/* Card de Información Rápida */}
              <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                <CardHeader>
                  <h3 className="text-xl font-bold">Información Rápida</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
                    <p className="text-sm font-medium text-white/80 mb-2">
                      ENTRADA
                    </p>
                    <Badge
                      variant="secondary"
                      className="bg-white text-gray-800 font-semibold px-3 py-1"
                    >
                      🎫 Gratuita
                    </Badge>
                  </div>

                  <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
                    <p className="text-sm font-medium text-white/80 mb-2">
                      TIPO DE EVENTO
                    </p>
                    <p className="font-semibold">
                      {actividad.tipoActividad.nombre}
                    </p>
                    <p className="text-sm text-white/75">
                      {actividad.tipoActividad.tipo}
                    </p>
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={shareActivity}
                      className="w-full bg-white text-blue-600 hover:bg-white/90 font-semibold py-3"
                    >
                      <Share2 className="mr-2 h-5 w-5" />
                      Compartir Evento
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Card de Invitación */}
              <Card className="shadow-lg border-0 bg-gradient-to-br from-green-400 to-blue-500 text-white">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Heart className="h-6 w-6" />
                    <h3 className="text-lg font-bold">¿Vienes?</h3>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-white/90 mb-4 leading-relaxed">
                    ¡Nos encantaría verte ahí! Te esperamos con los brazos
                    abiertos para vivir juntos esta experiencia especial.
                  </p>
                  <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
                    <p className="text-sm text-white/80 text-center">
                      Para más información contacta a la iglesia
                    </p>
                    <div className="flex gap-2 mt-3 justify-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                      >
                        <Phone className="mr-1 h-3 w-3" />
                        Llamar
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-white/20 hover:bg-white/30 text-white border-white/30"
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
