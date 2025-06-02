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
} from "lucide-react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

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
  latitud?: number;
  longitud?: number;
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
        const response = await fetch(`/api/actividades/${actividadId}`);
        if (!response.ok) {
          throw new Error("Error al obtener los datos de la actividad");
        }
        const data = await response.json();
        setActividad(data);
      } catch (error) {
        console.error("Error:", error);
        setError("Error al cargar la actividad");
      } finally {
        setLoading(false);
      }
    };

    if (actividadId) {
      fetchActividad();
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

  const generateQRCode = () => {
    if (!actividad || !actividad.latitud || !actividad.longitud) return "";
    const googleMapsUrl = `https://www.google.com/maps?q=${actividad.latitud},${actividad.longitud}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      googleMapsUrl
    )}`;
  };

  const getGoogleMapsUrl = () => {
    if (!actividad || !actividad.latitud || !actividad.longitud) return "";
    return `https://www.google.com/maps?q=${actividad.latitud},${actividad.longitud}`;
  };

  const getWazeUrl = () => {
    if (!actividad || !actividad.latitud || !actividad.longitud) return "";
    return `https://waze.com/ul?ll=${actividad.latitud},${actividad.longitud}&navigate=yes`;
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
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando evento...</span>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (error || !actividad) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Error</h3>
          <p className="text-muted-foreground">
            {error || "Evento no encontrado"}
          </p>
        </div>
      </div>
    );
  }

  const estadoBadge = getEstadoBadge(actividad.estado);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Banner Principal */}
          <Card className="overflow-hidden mb-8 p-0">
            <div className="relative">
              {actividad.banner ? (
                <>
                  <div className="relative w-full h-64 md:h-80">
                    <Image
                      src={actividad.banner}
                      alt={actividad.nombre}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end">
                    <div className="p-6 text-white">
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl md:text-4xl font-bold drop-shadow-lg">
                          {actividad.nombre}
                        </h1>
                        <Badge variant={estadoBadge.variant}>
                          {estadoBadge.text}
                        </Badge>
                      </div>
                      <p className="text-lg opacity-90 drop-shadow">
                        {actividad.ministerio?.nombre || "Iglesia Central"}
                      </p>
                      <p className="text-sm opacity-75 drop-shadow">
                        {actividad.tipoActividad.nombre} •{" "}
                        {actividad.tipoActividad.tipo}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-64 md:h-80 bg-gradient-to-r from-blue-500 to-purple-600">
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
                    <div className="p-6 text-white">
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl md:text-4xl font-bold">
                          {actividad.nombre}
                        </h1>
                        <Badge variant={estadoBadge.variant}>
                          {estadoBadge.text}
                        </Badge>
                      </div>
                      <p className="text-lg opacity-90">
                        {actividad.ministerio?.nombre || "Iglesia Central"}
                      </p>
                      <p className="text-sm opacity-75">
                        {actividad.tipoActividad.nombre} •{" "}
                        {actividad.tipoActividad.tipo}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Información Principal */}
            <div className="md:col-span-2 space-y-6">
              {actividad.descripcion && (
                <Card>
                  <CardHeader>
                    <h2 className="text-2xl font-semibold">Sobre el Evento</h2>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {actividad.descripcion}
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <h2 className="text-2xl font-semibold">
                    Detalles del Evento
                  </h2>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Fecha</p>
                      <p className="text-muted-foreground">
                        {formatearFecha(actividad.fecha)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Horario</p>
                      <p className="text-muted-foreground">
                        {getHorarioCompleto()}
                      </p>
                    </div>
                  </div>

                  {actividad.ubicacion && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="font-medium">Ubicación</p>
                        <p className="text-muted-foreground">
                          {actividad.ubicacion}
                        </p>
                        {actividad.latitud && actividad.longitud && (
                          <div className="flex gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                window.open(getGoogleMapsUrl(), "_blank")
                              }
                            >
                              <ExternalLink className="mr-1 h-3 w-3" />
                              Google Maps
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                window.open(getWazeUrl(), "_blank")
                              }
                            >
                              <ExternalLink className="mr-1 h-3 w-3" />
                              Waze
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Organizador</p>
                      <p className="text-muted-foreground">
                        {actividad.ministerio?.nombre || "Iglesia Central"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Panel Lateral */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Información Rápida</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      ENTRADA
                    </p>
                    <Badge variant="secondary" className="mt-1">
                      Gratuita
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      TIPO DE EVENTO
                    </p>
                    <p className="text-sm">{actividad.tipoActividad.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {actividad.tipoActividad.tipo}
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <Button onClick={shareActivity} className="w-full mb-3">
                      <Share2 className="mr-2 h-4 w-4" />
                      Compartir Evento
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {actividad.latitud && actividad.longitud && (
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Ubicación</h3>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="mb-4">
                      <img
                        src={generateQRCode()}
                        alt="QR Code para ubicación"
                        className="mx-auto rounded-lg"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Escanea el código QR para abrir la ubicación en Google
                      Maps
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(getGoogleMapsUrl(), "_blank")}
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      Ver en Maps
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">¿Vienes?</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    ¡Nos encantaría verte ahí! Te esperamos.
                  </p>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                      Para más información contacta a la iglesia
                    </p>
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
