import { prisma } from "../../../../lib/db";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Helper function para parsing seguro
function parseString(value: unknown): string | null {
  return value && typeof value === "string" && value.trim() !== ""
    ? value
    : null;
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
    // Obtener el usuario autenticado
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    // Obtener la iglesia activa del usuario
    const usuarioIglesia = await prisma.usuarioIglesia.findFirst({
      where: {
        usuarioId: user.id,
        estado: "ACTIVO",
      },
      include: {
        iglesia: true,
      },
    });

    if (!usuarioIglesia) {
      return NextResponse.json(
        { error: "No tienes acceso a ninguna iglesia activa" },
        { status: 403 }
      );
    }

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
      googleMapsEmbed,
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

    // Verificar que la actividad existe y pertenece a la iglesia del usuario
    const actividadExiste = await prisma.actividad.findFirst({
      where: {
        id: actividadId,
        iglesiaId: usuarioIglesia.iglesiaId,
      },
    });

    if (!actividadExiste) {
      return NextResponse.json(
        { error: "Actividad no encontrada o no tienes acceso a ella" },
        { status: 404 }
      );
    }

    // Verificar que el tipo de actividad existe y pertenece a la misma iglesia
    const tipoActividad = await prisma.tipoActividad.findFirst({
      where: {
        id: parseInt(tipoActividadId),
        iglesiaId: usuarioIglesia.iglesiaId,
      },
    });

    if (!tipoActividad) {
      return NextResponse.json(
        {
          error: "Tipo de actividad no encontrado o no pertenece a tu iglesia",
        },
        { status: 404 }
      );
    }

    // Verificar que el ministerio existe y pertenece a la misma iglesia (si se proporciona)
    if (ministerioId) {
      const ministerio = await prisma.ministerio.findFirst({
        where: {
          id: parseInt(ministerioId),
          iglesiaId: usuarioIglesia.iglesiaId,
        },
      });

      if (!ministerio) {
        return NextResponse.json(
          { error: "Ministerio no encontrado o no pertenece a tu iglesia" },
          { status: 404 }
        );
      }
    }

    // Actualizar los campos conocidos
    await prisma.actividad.update({
      where: { id: actividadId },
      data: {
        nombre,
        descripcion: parseString(descripcion),
        fecha: new Date(fecha),
        horaInicio: parseString(horaInicio),
        horaFin: parseString(horaFin),
        ubicacion: parseString(ubicacion),
        tipoActividadId: parseInt(tipoActividadId),
        ministerioId: ministerioId ? parseInt(ministerioId) : null,
        estado: estado || "Programada",
      },
    });

    // Actualización raw para los campos nuevos (banner, googleMapsEmbed, responsable)
    await prisma.$executeRaw`
      UPDATE "actividades" 
      SET 
        "banner" = ${parseString(banner)},
        "googleMapsEmbed" = ${parseString(googleMapsEmbed)},
        "responsable" = ${parseString(responsable)}
      WHERE "id" = ${actividadId}
    `;

    // Obtener la actividad actualizada con todos los campos
    const actividadFinal = await prisma.actividad.findUnique({
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
              },
            },
          },
        },
      },
    });

    return NextResponse.json(actividadFinal);
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
