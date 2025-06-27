import { prisma } from "../../../../../lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const actividadId = parseInt(id);

    console.log("🔍 DEBUG API PUBLIC: Buscando actividad ID:", actividadId);
    console.log("🌐 DEBUG API PUBLIC: URL de request:", request.url);

    if (isNaN(actividadId)) {
      console.log("❌ DEBUG API PUBLIC: ID inválido:", id);
      return NextResponse.json(
        { error: "ID de actividad inválido" },
        { status: 400 }
      );
    }

    console.log("📊 DEBUG API PUBLIC: Ejecutando consulta Prisma...");

    // Consulta con la información necesaria para páginas públicas de agradecimiento
    const actividad = await prisma.actividad.findUnique({
      where: { id: actividadId },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        fecha: true,
        fechaInicio: true,
        fechaFin: true,
        esRangoFechas: true,
        horaInicio: true,
        horaFin: true,
        ubicacion: true,
        googleMapsEmbed: true,
        responsable: true,
        estado: true,
        banner: true,
        createdAt: true,
        updatedAt: true,
        tipoActividad: {
          select: {
            id: true,
            nombre: true,
            tipo: true,
          },
        },
        ministerio: {
          select: {
            id: true,
            nombre: true,
          },
        },
        horarios: {
          select: {
            id: true,
            fecha: true,
            horaInicio: true,
            horaFin: true,
            notas: true,
          },
          orderBy: {
            fecha: "asc",
          },
        },
        // Para la vista de agradecimiento, incluimos el historial de visitas
        // pero solo con información básica (nombres y quien invitó)
        historialVisitas: {
          select: {
            id: true,
            fecha: true,
            horarioId: true,
            notas: true,
            persona: {
              select: {
                id: true,
                nombres: true,
                apellidos: true,
                foto: true,
                // Información de quien invitó (para mostrar en agradecimiento)
                personaInvita: {
                  select: {
                    id: true,
                    nombres: true,
                    apellidos: true,
                  },
                },
              },
            },
          },
          orderBy: {
            fecha: "desc",
          },
        },
      },
    });

    console.log(
      "📊 DEBUG API PUBLIC: Resultado de consulta:",
      actividad ? "Encontrada" : "No encontrada"
    );

    if (!actividad) {
      console.log(
        "❌ DEBUG API PUBLIC: Actividad no encontrada para ID:",
        actividadId
      );
      return NextResponse.json(
        { error: "Actividad no encontrada" },
        { status: 404 }
      );
    }

    console.log("✅ DEBUG API PUBLIC: Actividad encontrada:", actividad.nombre);
    console.log(
      "🖼️ DEBUG API PUBLIC: Banner URL:",
      actividad.banner || "Sin banner"
    );
    console.log("📅 DEBUG API PUBLIC: Fecha:", actividad.fecha);
    console.log(
      "🏢 DEBUG API PUBLIC: Ministerio:",
      actividad.ministerio?.nombre || "Sin ministerio"
    );
    console.log(
      "👥 DEBUG API PUBLIC: Historial de visitas:",
      actividad.historialVisitas.length,
      "registros"
    );

    // Asegurar que devolvemos datos consistentes
    const response = {
      ...actividad,
      // Asegurar que el banner sea una string válida o null
      banner:
        actividad.banner && actividad.banner.trim() !== ""
          ? actividad.banner
          : null,
    };

    console.log("📤 DEBUG API PUBLIC: Respuesta final preparada");
    return NextResponse.json(response);
  } catch (error) {
    console.error("💥 DEBUG API PUBLIC: Error al obtener actividad:", error);
    console.error(
      "💥 DEBUG API PUBLIC: Stack trace:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    return NextResponse.json(
      { error: "Error interno del servidor al obtener la actividad" },
      { status: 500 }
    );
  }
}
