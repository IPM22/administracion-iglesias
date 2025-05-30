import { prisma } from "../../../lib/db";
import { NextRequest, NextResponse } from "next/server";

// Helper function para parsing seguro
function parseString(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

export async function GET() {
  try {
    const actividades = await prisma.actividad.findMany({
      include: {
        tipoActividad: true,
        ministerio: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
          },
        },
        historialVisitas: {
          include: {
            visita: {
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
    });

    return NextResponse.json(actividades);
  } catch (error) {
    console.error("Error al obtener actividades:", error);
    return NextResponse.json(
      { error: "Error al obtener las actividades" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nombre,
      descripcion,
      fecha,
      horaInicio,
      horaFin,
      ubicacion,
      latitud,
      longitud,
      tipoActividadId,
      ministerioId,
      responsable,
      estado = "Programada",
      banner,
    } = body;

    // Validaciones básicas
    if (!nombre) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      );
    }

    if (!fecha) {
      return NextResponse.json(
        { error: "La fecha es requerida" },
        { status: 400 }
      );
    }

    if (!tipoActividadId) {
      return NextResponse.json(
        { error: "El tipo de actividad es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el tipo de actividad existe
    const tipoActividad = await prisma.tipoActividad.findUnique({
      where: { id: parseInt(tipoActividadId) },
    });

    if (!tipoActividad) {
      return NextResponse.json(
        { error: "Tipo de actividad no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el ministerio existe (si se proporciona)
    if (ministerioId) {
      const ministerio = await prisma.ministerio.findUnique({
        where: { id: parseInt(ministerioId) },
      });

      if (!ministerio) {
        return NextResponse.json(
          { error: "Ministerio no encontrado" },
          { status: 404 }
        );
      }
    }

    const nuevaActividad = await prisma.actividad.create({
      data: {
        nombre,
        descripcion: parseString(descripcion),
        fecha: new Date(fecha),
        horaInicio: parseString(horaInicio),
        horaFin: parseString(horaFin),
        ubicacion: parseString(ubicacion),
        latitud: parseNumber(latitud),
        longitud: parseNumber(longitud),
        tipoActividadId: parseInt(tipoActividadId),
        ministerioId: ministerioId ? parseInt(ministerioId) : null,
        responsable: parseString(responsable),
        estado,
        banner: parseString(banner),
      },
      include: {
        tipoActividad: true,
        ministerio: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
          },
        },
        historialVisitas: {
          include: {
            visita: {
              select: {
                id: true,
                nombres: true,
                apellidos: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(nuevaActividad, { status: 201 });
  } catch (error) {
    console.error("Error al crear actividad:", error);
    return NextResponse.json(
      { error: "Error al crear la actividad" },
      { status: 500 }
    );
  }
}
