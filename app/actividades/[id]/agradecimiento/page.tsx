"use client";

import { use, useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MiembroAvatar } from "../../../../components/MiembroAvatar";
import { ArrowLeft, Users, Sparkles, Heart, Star } from "lucide-react";

// Interfaces
interface TipoActividad {
  id: number;
  nombre: string;
  tipo: string;
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
    personaInvita?: {
      id: number;
      nombres: string;
      apellidos: string;
    };
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
  const mockParam = searchParams.get("mock");

  const [actividad, setActividad] = useState<ActividadDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [asistentesActuales, setAsistentesActuales] = useState<
    HistorialVisita[]
  >([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Estados para paginación automática
  const [paginaActual, setPaginaActual] = useState(0);
  const [pausarAutoScroll, setPausarAutoScroll] = useState(false);

  // Configuración del carrusel
  const PERSONAS_POR_PAGINA = 6; // Reducido para proyector - mejor legibilidad
  const TIEMPO_ENTRE_PAGINAS = 6000; // 6 segundos entre cambios

  // Función para generar datos mock
  const generarDatosMock = (): HistorialVisita[] => {
    const nombres = [
      "María",
      "José",
      "Ana",
      "Carlos",
      "Laura",
      "Miguel",
      "Carmen",
      "David",
      "Patricia",
      "Roberto",
      "Isabel",
      "Francisco",
      "Rosa",
      "Manuel",
      "Elena",
      "Antonio",
      "Sofía",
      "Pedro",
      "Lucía",
      "Rafael",
      "Valeria",
      "Andrés",
      "Mónica",
      "Gabriel",
      "Natalia",
      "Fernando",
      "Cristina",
      "Eduardo",
      "Alejandra",
      "Joaquín",
    ];

    const apellidos = [
      "García",
      "Rodríguez",
      "González",
      "Fernández",
      "López",
      "Martínez",
      "Sánchez",
      "Pérez",
      "Martín",
      "Gómez",
      "Ruiz",
      "Díaz",
      "Hernández",
      "Muñoz",
      "Álvarez",
      "Jiménez",
      "Moreno",
      "Romero",
      "Navarro",
      "Gutiérrez",
      "Torres",
      "Domínguez",
      "Vázquez",
      "Ramos",
      "Gil",
      "Ramírez",
      "Serrano",
      "Blanco",
      "Molina",
      "Morales",
    ];

    const invitadores = [
      { id: 1, nombres: "Samuel", apellidos: "Peralta Mateo" },
      { id: 2, nombres: "María", apellidos: "González Ruiz" },
      { id: 3, nombres: "Carlos", apellidos: "Martínez López" },
      { id: 4, nombres: "Ana", apellidos: "Fernández García" },
      { id: 5, nombres: "Pedro", apellidos: "Sánchez Díaz" },
    ];

    return Array.from({ length: 30 }, (_, index) => ({
      id: index + 1,
      fecha: new Date().toISOString(),
      horarioId: 2,
      persona: {
        id: index + 100,
        nombres: nombres[index % nombres.length],
        apellidos: apellidos[index % apellidos.length],
        foto: undefined,
        personaInvita:
          Math.random() > 0.3
            ? invitadores[index % invitadores.length]
            : undefined,
      },
      observaciones:
        Math.random() > 0.8 ? "Primera vez en la iglesia" : undefined,
    }));
  };

  useEffect(() => {
    const fetchActividad = async () => {
      try {
        // Si está el parámetro mock=true, usar datos simulados
        if (mockParam === "true") {
          const datosMock = generarDatosMock();
          const actividadMock: ActividadDetalle = {
            id: parseInt(id),
            nombre: "Lo que Jesús puede hacer por ti - SIMULACIÓN",
            descripcion: "Actividad de prueba con 30 asistentes simulados",
            fecha: new Date().toISOString(),
            fechaInicio: undefined,
            fechaFin: undefined,
            esRangoFechas: false,
            horaInicio: "09:00",
            horaFin: "11:30",
            ubicacion: "Iglesia Central",
            responsable: "Pastor Samuel",
            estado: "Completada",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tipoActividad: {
              id: 1,
              nombre: "Culto Regular",
              tipo: "Regular",
            },
            historialVisitas: datosMock,
            horarios: [
              {
                id: 2,
                fecha: new Date().toISOString(),
                horaInicio: "09:00",
                horaFin: "11:30",
                notas: "Horario principal",
              },
            ],
          };

          setActividad(actividadMock);
          setAsistentesActuales(datosMock);
          setLoading(false);
          return;
        }

        // Comportamiento normal - cargar datos reales
        const response = await fetch(`/api/actividades/${id}/public`);
        if (!response.ok) {
          throw new Error("Error al obtener los datos de la actividad");
        }
        const data = await response.json();
        setActividad(data);

        // Filtrar asistentes según el horario seleccionado
        if (horarioParam && horarioParam !== "general") {
          const horarioId = parseInt(horarioParam);

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
  }, [id, horarioParam, mockParam]);

  // Actualizar hora cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-scroll para el carrusel de personas
  useEffect(() => {
    if (asistentesActuales.length <= PERSONAS_POR_PAGINA || pausarAutoScroll) {
      return;
    }

    const totalPaginas = Math.ceil(
      asistentesActuales.length / PERSONAS_POR_PAGINA
    );

    const interval = setInterval(() => {
      setPaginaActual((prev) => (prev + 1) % totalPaginas);
    }, TIEMPO_ENTRE_PAGINAS);

    return () => clearInterval(interval);
  }, [
    asistentesActuales.length,
    pausarAutoScroll,
    PERSONAS_POR_PAGINA,
    TIEMPO_ENTRE_PAGINAS,
  ]);

  // Funciones para la paginación
  const totalPaginas = Math.ceil(
    asistentesActuales.length / PERSONAS_POR_PAGINA
  );
  const asistentesEnPaginaActual = asistentesActuales.slice(
    paginaActual * PERSONAS_POR_PAGINA,
    (paginaActual + 1) * PERSONAS_POR_PAGINA
  );

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
          <Star className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-300 opacity-60" />
        </div>
        <div className="absolute top-20 right-20 animate-pulse delay-1000">
          <Sparkles className="h-4 w-4 sm:h-6 sm:w-6 text-pink-300 opacity-60" />
        </div>
        <div className="absolute bottom-20 left-20 animate-pulse delay-2000">
          <Heart className="h-8 w-8 sm:h-10 sm:w-10 text-red-300 opacity-60" />
        </div>
        <div className="absolute bottom-10 right-10 animate-pulse delay-500">
          <Star className="h-4 w-4 sm:h-6 sm:w-6 text-blue-300 opacity-60" />
        </div>
      </div>

      {/* Botones de control - Optimizado para móviles */}
      <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10 flex gap-1 sm:gap-2">
        <Button
          onClick={salirVistaCompleta}
          variant="outline"
          size="sm"
          className="bg-black/20 border-white/20 text-white hover:bg-black/40 text-xs sm:text-sm px-2 sm:px-3"
        >
          <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          Salir
        </Button>
        <Button
          onClick={entrarVistaCompleta}
          variant="outline"
          size="sm"
          className="bg-black/20 border-white/20 text-white hover:bg-black/40 text-xs sm:text-sm px-2 sm:px-3 hidden sm:flex"
        >
          Pantalla Completa
        </Button>
      </div>

      {/* Hora actual - Optimizado para móviles */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 bg-black/20 rounded-lg px-2 py-1 sm:px-4 sm:py-2">
        <p className="text-sm sm:text-lg font-mono">
          {currentTime.toLocaleTimeString("es-ES", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })}
        </p>
      </div>

      {/* Contenido principal - Optimizado para móviles */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 h-screen flex flex-col">
        {/* Banner de simulación */}
        {mockParam === "true" && (
          <div className="mb-3 sm:mb-4 bg-orange-500/20 border border-orange-400/30 rounded-lg p-2 sm:p-3 text-center">
            <p className="text-orange-200 font-semibold text-sm sm:text-base">
              🧪 MODO SIMULACIÓN - Mostrando 30 visitas de prueba
            </p>
            <p className="text-orange-300 text-xs sm:text-sm">
              Para ver datos reales, remueve ?mock=true de la URL
            </p>
          </div>
        )}

        {/* Encabezado - Optimizado para móviles */}
        <div className="text-center mb-4 sm:mb-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2 sm:mb-4 bg-gradient-to-r from-yellow-400 via-pink-300 to-blue-300 bg-clip-text text-transparent">
            ¡Gracias por Acompañarnos!
          </h1>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold mb-3 sm:mb-4">
            {actividad.nombre}
          </h2>

          {/* Contador de asistentes - Optimizado para móviles */}
          <div className="flex items-center justify-center gap-2 text-lg sm:text-xl lg:text-2xl font-semibold">
            <Users className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8" />
            <span className="text-sm sm:text-lg lg:text-xl">
              {asistentesActuales.length} persona
              {asistentesActuales.length !== 1 ? "s" : ""} nos{" "}
              {asistentesActuales.length === 1 ? "acompañó" : "acompañaron"}
            </span>
          </div>
        </div>

        {/* Lista de asistentes - Optimizado para móviles */}
        <div className="flex-1 overflow-hidden">
          {asistentesActuales.length === 0 ? (
            <div className="text-center py-10 sm:py-20">
              <div className="text-4xl sm:text-6xl mb-4">🎉</div>
              <p className="text-lg sm:text-xl lg:text-2xl opacity-80">
                ¡Fue un placer tenerlos con nosotros!
              </p>
            </div>
          ) : (
            <div className="h-full overflow-y-auto">
              {/* Diseño optimizado para móviles */}
              <div className="max-w-5xl mx-auto">
                {/* Indicadores de página y controles si hay múltiples páginas */}
                {totalPaginas > 1 && (
                  <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                    <div className="flex items-center gap-2">
                      <span className="text-white/60 text-xs sm:text-sm">
                        Página
                      </span>
                      <span className="text-white font-semibold text-sm sm:text-base">
                        {paginaActual + 1} de {totalPaginas}
                      </span>
                    </div>
                    <div className="flex gap-1 sm:gap-2">
                      {Array.from({ length: totalPaginas }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setPaginaActual(i);
                            setPausarAutoScroll(true);
                            // Reanudar auto-scroll después de 10 segundos
                            setTimeout(() => setPausarAutoScroll(false), 10000);
                          }}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            i === paginaActual
                              ? "bg-yellow-400 scale-125"
                              : "bg-white/30 hover:bg-white/50"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div
                  className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 transition-all duration-500 ease-in-out"
                  onMouseEnter={() => setPausarAutoScroll(true)}
                  onMouseLeave={() => setPausarAutoScroll(false)}
                >
                  {asistentesEnPaginaActual.map((asistente, index) => (
                    <Card
                      key={asistente.id}
                      className="bg-white/15 backdrop-blur-sm border-white/30 hover:bg-white/25 transition-all duration-300 group animate-in fade-in slide-in-from-bottom-4"
                      style={{
                        animationDelay: `${index * 150}ms`,
                        animationDuration: "700ms",
                      }}
                    >
                      <CardContent className="p-3 sm:p-4 lg:p-6">
                        <div className="flex items-center gap-3 sm:gap-4">
                          {/* Avatar y número - Optimizado para móviles */}
                          <div className="flex-shrink-0 relative">
                            <MiembroAvatar
                              foto={asistente.persona.foto}
                              nombre={`${asistente.persona.nombres} ${asistente.persona.apellidos}`}
                              size="lg"
                            />
                            <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-yellow-400 text-black rounded-full w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 flex items-center justify-center text-xs sm:text-sm font-bold">
                              {paginaActual * PERSONAS_POR_PAGINA + index + 1}
                            </div>
                          </div>

                          {/* Información principal - Optimizado para móviles */}
                          <div className="flex-1 min-w-0">
                            {/* Nombre completo destacado */}
                            <h3 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white truncate leading-tight">
                              {asistente.persona.nombres}{" "}
                              {asistente.persona.apellidos}
                            </h3>

                            {/* Información de quien invitó */}
                            {asistente.persona.personaInvita ? (
                              <p className="text-yellow-300 font-semibold text-sm sm:text-base lg:text-lg mt-1 sm:mt-2">
                                ✨ Invitado por:{" "}
                                {asistente.persona.personaInvita.nombres}{" "}
                                {asistente.persona.personaInvita.apellidos}
                              </p>
                            ) : (
                              <p className="text-blue-300 font-semibold text-sm sm:text-base lg:text-lg mt-1 sm:mt-2">
                                👋 Llegó por su cuenta
                              </p>
                            )}

                            {/* Observaciones si existen */}
                            {asistente.observaciones && (
                              <p className="text-white/80 text-xs sm:text-sm lg:text-base mt-1 sm:mt-2 truncate">
                                📝 {asistente.observaciones}
                              </p>
                            )}
                          </div>

                          {/* Icono decorativo - Oculto en móviles muy pequeños */}
                          <div className="flex-shrink-0 hidden sm:block">
                            <Heart className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-pink-300 opacity-70 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mensaje final - Optimizado para móviles */}
        <div className="text-center mt-4 sm:mt-6 lg:mt-8">
          <div className="text-2xl sm:text-3xl lg:text-4xl mb-2">💕</div>
          <p className="text-lg sm:text-xl opacity-80">
            ¡Esperamos verlos nuevamente pronto!
          </p>
          {actividad.responsable && (
            <p className="text-sm sm:text-base lg:text-lg opacity-60 mt-2">
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
