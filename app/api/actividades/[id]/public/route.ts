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

    if (isNaN(actividadId)) {
      console.log("❌ DEBUG API PUBLIC: ID inválido:", id);
      return NextResponse.json(
        { error: "ID de actividad inválido" },
        { status: 400 }
      );
    }

    console.log("📊 DEBUG API PUBLIC: Ejecutando consulta Prisma...");

    // Consulta simplificada solo con la información necesaria para páginas públicas
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
        // Para páginas públicas, limitamos el historial de visitas a estadísticas básicas
        _count: {
          select: {
            historialVisitas: true,
          },
        },
      },
    });

    console.log(
      "📊 DEBUG API PUBLIC: Resultado de consulta:",
      actividad ? "Encontrada" : "No encontrada"
    );

    if (!actividad) {
      console.log("❌ DEBUG API PUBLIC: Actividad no encontrada");
      return NextResponse.json(
        { error: "Actividad no encontrada" },
        { status: 404 }
      );
    }

    console.log("✅ DEBUG API PUBLIC: Actividad encontrada:", actividad.nombre);
    return NextResponse.json(actividad);
  } catch (error) {
    console.error("💥 DEBUG API PUBLIC: Error al obtener actividad:", error);
    return NextResponse.json(
      { error: "Error al obtener la actividad" },
      { status: 500 }
    );
  }
}
