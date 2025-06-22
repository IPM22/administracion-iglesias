"use client";

import { use, useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MiembroAvatar } from "../../../../components/MiembroAvatar";
import {
  ArrowLeft,
  Users,
  Calendar,
  Clock,
  Sparkles,
  Heart,
  Star,
} from "lucide-react";

// Interfaces
interface TipoActividad {
  id: number;
  nombre: string;
  tipo: string;
}

interface Horario {
  id: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  notas?: string;
}

interface HistorialVisita {
  id: number;
  fecha: string;
  horarioId?: number;
  persona: {
    id: number;
    nombres: string;
    apellidos: string;
    foto?: string;
  };
  invitadoPor?: {
    id: number;
    nombres: string;
    apellidos: string;
  };
  observaciones?: string;
}

interface ActividadDetalle {
  id: number;
  nombre: string;
  descripcion?: string;
  fecha: string;
  fechaInicio?: string;
  fechaFin?: string;
  esRangoFechas: boolean;
  horaInicio?: string;
  horaFin?: string;
  ubicacion?: string;
  responsable?: string;
  estado: string;
  createdAt: string;
  updatedAt: string;
  tipoActividad: TipoActividad;
  historialVisitas: HistorialVisita[];
  banner?: string;
  horarios?: Array<{
    id: number;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    notas?: string;
  }>;
}

function AgradecimientoContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id } = use(params);
  const horarioParam = searchParams.get("horario");

  const [actividad, setActividad] = useState<ActividadDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [asistentesActuales, setAsistentesActuales] = useState<
    HistorialVisita[]
  >([]);
  const [horarioActual, setHorarioActual] = useState<Horario | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const fetchActividad = async () => {
      try {
        const response = await fetch(`/api/actividades/${id}`);
        if (!response.ok) {
          throw new Error("Error al obtener los datos de la actividad");
        }
        const data = await response.json();
        setActividad(data);

        // Filtrar asistentes según el horario seleccionado
        if (horarioParam && horarioParam !== "general") {
          const horarioId = parseInt(horarioParam);
          const horario = data.horarios?.find(
            (h: Horario) => h.id === horarioId
          );
          setHorarioActual(horario);

          const asistentesHorario = data.historialVisitas.filter(
            (h: HistorialVisita) => h.horarioId === horarioId
          );
          setAsistentesActuales(asistentesHorario);
        } else {
          // Mostrar todos los asistentes o asistentes sin horario específico
          const asistentesSinHorario = data.historialVisitas.filter(
            (h: HistorialVisita) => !h.horarioId
          );
          setAsistentesActuales(
            horarioParam === "general"
              ? data.historialVisitas
              : asistentesSinHorario
          );
        }
      } catch (error) {
        console.error("Error:", error);
        setError("Error al cargar la actividad");
      } finally {
        setLoading(false);
      }
    };

    fetchActividad();
  }, [id, horarioParam]);

  // Actualizar hora cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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

  const salirVistaCompleta = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    router.back();
  };

  const entrarVistaCompleta = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Cargando vista de agradecimiento...</p>
        </div>
      </div>
    );
  }

  if (error || !actividad) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p className="mb-4">{error || "Actividad no encontrada"}</p>
          <Button onClick={salirVistaCompleta} variant="outline">
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 text-white relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 animate-pulse">
          <Star className="h-8 w-8 text-yellow-300 opacity-60" />
        </div>
        <div className="absolute top-20 right-20 animate-pulse delay-1000">
          <Sparkles className="h-6 w-6 text-pink-300 opacity-60" />
        </div>
        <div className="absolute bottom-20 left-20 animate-pulse delay-2000">
          <Heart className="h-10 w-10 text-red-300 opacity-60" />
        </div>
        <div className="absolute bottom-10 right-10 animate-pulse delay-500">
          <Star className="h-6 w-6 text-blue-300 opacity-60" />
        </div>
      </div>

      {/* Botones de control */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Button
          onClick={salirVistaCompleta}
          variant="outline"
          size="sm"
          className="bg-black/20 border-white/20 text-white hover:bg-black/40"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Salir
        </Button>
        <Button
          onClick={entrarVistaCompleta}
          variant="outline"
          size="sm"
          className="bg-black/20 border-white/20 text-white hover:bg-black/40"
        >
          Pantalla Completa
        </Button>
      </div>

      {/* Hora actual */}
      <div className="absolute top-4 right-4 z-10 bg-black/20 rounded-lg px-4 py-2">
        <p className="text-lg font-mono">
          {currentTime.toLocaleTimeString("es-ES")}
        </p>
      </div>

      {/* Contenido principal */}
      <div className="container mx-auto px-8 py-12 h-screen flex flex-col">
        {/* Encabezado */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-pink-300 to-blue-300 bg-clip-text text-transparent">
            ¡Gracias por Acompañarnos!
          </h1>
          <h2 className="text-4xl font-semibold mb-2">{actividad.nombre}</h2>

          {/* Información del horario */}
          <div className="flex items-center justify-center gap-6 text-xl opacity-90 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              {horarioActual ? (
                <span>{formatearFecha(horarioActual.fecha)}</span>
              ) : (
                <span>{formatearFecha(actividad.fecha)}</span>
              )}
            </div>
            {(horarioActual || actividad.horaInicio) && (
              <div className="flex items-center gap-2">
                <Clock className="h-6 w-6" />
                <span>
                  {horarioActual
                    ? `${formatearHora(
                        horarioActual.horaInicio
                      )} - ${formatearHora(horarioActual.horaFin)}`
                    : `${formatearHora(actividad.horaInicio)} - ${formatearHora(
                        actividad.horaFin
                      )}`}
                </span>
              </div>
            )}
          </div>

          {/* Contador de asistentes */}
          <div className="flex items-center justify-center gap-2 text-2xl font-semibold">
            <Users className="h-8 w-8" />
            <span>
              {asistentesActuales.length} persona
              {asistentesActuales.length !== 1 ? "s" : ""} nos acompañó
              {asistentesActuales.length !== 1 ? "ron" : ""}
            </span>
          </div>
        </div>

        {/* Lista de asistentes */}
        <div className="flex-1 overflow-hidden">
          {asistentesActuales.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🎉</div>
              <p className="text-2xl opacity-80">
                ¡Fue un placer tenerlos con nosotros!
              </p>
            </div>
          ) : (
            <div className="h-full overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max">
                {asistentesActuales.map((asistente, index) => (
                  <Card
                    key={asistente.id}
                    className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 group"
                  >
                    <CardContent className="p-6 text-center">
                      <div className="mb-4 relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-pink-400 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                        <MiembroAvatar
                          foto={asistente.persona.foto}
                          nombre={`${asistente.persona.nombres} ${asistente.persona.apellidos}`}
                          size="lg"
                          className="relative z-10"
                        />
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-center">
                        {asistente.persona.nombres}
                      </h3>
                      <h4 className="text-lg text-white/80 mb-3 text-center">
                        {asistente.persona.apellidos}
                      </h4>

                      {asistente.invitadoPor && (
                        <p className="text-sm text-white/60 text-center">
                          Invitado por:
                          <br />
                          <span className="font-medium">
                            {asistente.invitadoPor.nombres}{" "}
                            {asistente.invitadoPor.apellidos}
                          </span>
                        </p>
                      )}

                      {/* Número de asistente */}
                      <div className="absolute top-2 right-2 bg-white/20 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mensaje final */}
        <div className="text-center mt-8">
          <div className="text-4xl mb-2">💕</div>
          <p className="text-xl opacity-80">
            ¡Esperamos verlos nuevamente pronto!
          </p>
          {actividad.responsable && (
            <p className="text-lg opacity-60 mt-2">
              Con cariño, {actividad.responsable}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AgradecimientoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-xl">Cargando...</p>
          </div>
        </div>
      }
    >
      <AgradecimientoContent params={params} />
    </Suspense>
  );
}
