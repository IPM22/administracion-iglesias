import type { Metadata } from "next";
import PromocionActividadClient from "./client";

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
  tipoActividad: {
    id: number;
    nombre: string;
    tipo: string;
  };
  ministerio?: {
    id: number;
    nombre: string;
  };
  horarios?: Array<{
    id: number;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    notas?: string;
  }>;
}

async function getActividadData(id: string): Promise<ActividadData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    console.log("🔍 METADATA: Intentando obtener datos para actividad ID:", id);
    console.log("🌐 METADATA: URL base:", baseUrl);

    const response = await fetch(`${baseUrl}/api/actividades/${id}/public`, {
      cache: "no-store", // Siempre obtener datos frescos para metadata
    });

    console.log("📡 METADATA: Status de respuesta:", response.status);

    if (!response.ok) {
      console.error(
        "❌ METADATA: Error en respuesta:",
        response.status,
        response.statusText
      );
      return null;
    }

    const data = await response.json();
    console.log("✅ METADATA: Datos obtenidos:", data?.nombre || "Sin nombre");
    console.log("🖼️ METADATA: Banner URL:", data?.banner || "Sin banner");

    return data;
  } catch (error) {
    console.error("💥 METADATA: Error fetching activity data:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  console.log("🚀 METADATA: Generando metadata para actividad ID:", id);

  const actividad = await getActividadData(id);

  if (!actividad) {
    console.warn(
      "⚠️ METADATA: No se encontró la actividad, usando metadata de fallback"
    );
    return {
      title: "Evento no encontrado | Iglesia Central",
      description:
        "El evento que buscas no está disponible actualmente. Verifica el enlace o contacta con la iglesia para más información.",
      openGraph: {
        title: "Evento no encontrado",
        description: "El evento que buscas no está disponible actualmente.",
        type: "website",
        locale: "es_ES",
        siteName: "Sistema de Administración de Iglesias",
      },
      twitter: {
        card: "summary",
        title: "Evento no encontrado",
        description: "El evento que buscas no está disponible actualmente.",
      },
    };
  }

  console.log("📝 METADATA: Generando metadata para:", actividad.nombre);

  const formatearFecha = (fecha: string) => {
    // Agregar +1 día para compensar problemas de zona horaria
    const fechaCorregida = new Date(fecha);
    fechaCorregida.setDate(fechaCorregida.getDate() + 1);
    
    return fechaCorregida.toLocaleDateString("es-ES", {
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
    if (actividad.horaInicio && actividad.horaFin) {
      return `${formatearHora(actividad.horaInicio)} - ${formatearHora(
        actividad.horaFin
      )}`;
    } else if (actividad.horaInicio) {
      return formatearHora(actividad.horaInicio);
    }
    return "Por confirmar";
  };

  // Crear descripción enriquecida para metadata
  const fechaFormateada = formatearFecha(actividad.fecha);
  const horario = getHorarioCompleto();
  const organizador = actividad.ministerio?.nombre || "Iglesia Central";
  const ubicacion = actividad.ubicacion || "";

  let descripcionCompleta = `📅 ${fechaFormateada}`;
  if (horario !== "Por confirmar") {
    descripcionCompleta += ` • ⏰ ${horario}`;
  }
  if (ubicacion) {
    descripcionCompleta += ` • 📍 ${ubicacion}`;
  }
  descripcionCompleta += ` • Organizado por ${organizador}`;

  if (actividad.descripcion) {
    descripcionCompleta += `\n\n${actividad.descripcion}`;
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const pageUrl = `${baseUrl}/actividades/${id}/promocion`;

  // Validar URL del banner
  const bannerUrl =
    actividad.banner && actividad.banner.trim() !== ""
      ? actividad.banner
      : null;
  console.log("🖼️ METADATA: Banner URL final:", bannerUrl || "No hay banner");

  const metadata: Metadata = {
    title: `${actividad.nombre} | Evento Iglesia Central`,
    description: descripcionCompleta,
    keywords: [
      actividad.nombre,
      actividad.tipoActividad.nombre,
      actividad.tipoActividad.tipo,
      organizador,
      "iglesia",
      "evento",
      "actividad",
      ubicacion,
    ].filter(Boolean),

    // Open Graph metadata para redes sociales
    openGraph: {
      title: actividad.nombre,
      description: descripcionCompleta,
      url: pageUrl,
      siteName: "Sistema de Administración de Iglesias",
      type: "website",
      locale: "es_ES",
      ...(bannerUrl && {
        images: [
          {
            url: bannerUrl,
            width: 1200,
            height: 630,
            alt: `Banner del evento: ${actividad.nombre}`,
          },
        ],
      }),
    },

    // Twitter Card metadata
    twitter: {
      card: bannerUrl ? "summary_large_image" : "summary",
      title: actividad.nombre,
      description: descripcionCompleta,
      ...(bannerUrl && {
        images: [bannerUrl],
      }),
    },

    // Metadata adicional para WhatsApp y otras plataformas
    other: {
      "og:image:width": "1200",
      "og:image:height": "630",
      "og:image:alt": `Banner del evento: ${actividad.nombre}`,
      "og:locale": "es_ES",
      "og:site_name": "Sistema de Administración de Iglesias",

      // Para WhatsApp específicamente
      "whatsapp:title": actividad.nombre,
      "whatsapp:description": descripcionCompleta,
      ...(bannerUrl && {
        "whatsapp:image": bannerUrl,
      }),

      // Schema.org structured data como JSON-LD
      "application-ld+json": JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Event",
        name: actividad.nombre,
        description: actividad.descripcion || descripcionCompleta,
        startDate: actividad.fecha,
        ...(actividad.horaInicio && {
          startTime: actividad.horaInicio,
        }),
        ...(actividad.horaFin && {
          endTime: actividad.horaFin,
        }),
        location: {
          "@type": "Place",
          name: ubicacion || "Iglesia Central",
          ...(ubicacion && { address: ubicacion }),
        },
        organizer: {
          "@type": "Organization",
          name: organizador,
        },
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        ...(bannerUrl && {
          image: bannerUrl,
        }),
      }),
    },
  };

  console.log("✅ METADATA: Metadata generada exitosamente");
  return metadata;
}

export default function PromocionActividadPage() {
  return <PromocionActividadClient />;
}
