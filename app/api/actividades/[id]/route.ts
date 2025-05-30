import { prisma } from "../../../../lib/db";
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const actividadId = parseInt(id);

    if (isNaN(actividadId)) {
      return NextResponse.json(
        { error: "ID de actividad inválido" },
        { status: 400 }
      );
    }

    const actividad = await prisma.actividad.findUnique({
      where: { id: actividadId },
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
                correo: true,
                telefono: true,
                celular: true,
              },
            },
            invitadoPor: {
              select: {
                id: true,
                nombres: true,
                apellidos: true,
              },
            },
            tipoActividad: {
              select: {
                nombre: true,
              },
            },
          },
          orderBy: {
            fecha: "desc",
          },
        },
      },
    });

    if (!actividad) {
      return NextResponse.json(
        { error: "Actividad no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(actividad);
  } catch (error) {
    console.error("Error al obtener actividad:", error);
    return NextResponse.json(
      { error: "Error al obtener la actividad" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const actividadId = parseInt(id);

    if (isNaN(actividadId)) {
      return NextResponse.json(
        { error: "ID de actividad inválido" },
        { status: 400 }
      );
    }

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
      estado,
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

    // Verificar que la actividad existe
    const actividadExiste = await prisma.actividad.findUnique({
      where: { id: actividadId },
    });

    if (!actividadExiste) {
      return NextResponse.json(
        { error: "Actividad no encontrada" },
        { status: 404 }
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

    const actividadActualizada = await prisma.actividad.update({
      where: { id: actividadId },
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
        estado: estado || "Programada",
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

    return NextResponse.json(actividadActualizada);
  } catch (error) {
    console.error("Error al actualizar actividad:", error);
    return NextResponse.json(
      { error: "Error al actualizar la actividad" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const actividadId = parseInt(id);

    if (isNaN(actividadId)) {
      return NextResponse.json(
        { error: "ID de actividad inválido" },
        { status: 400 }
      );
    }

    // Verificar que la actividad existe
    const actividad = await prisma.actividad.findUnique({
      where: { id: actividadId },
      include: {
        historialVisitas: true,
      },
    });

    if (!actividad) {
      return NextResponse.json(
        { error: "Actividad no encontrada" },
        { status: 404 }
      );
    }

    // Eliminar historial de visitas asociadas
    await prisma.historialVisita.deleteMany({
      where: { actividadId },
    });

    // Eliminar la actividad
    await prisma.actividad.delete({
      where: { id: actividadId },
    });

    return NextResponse.json({ message: "Actividad eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar actividad:", error);
    return NextResponse.json(
      { error: "Error al eliminar la actividad" },
      { status: 500 }
    );
  }
}
