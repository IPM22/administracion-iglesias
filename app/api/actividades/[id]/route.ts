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
    const { id } = await params;
    const actividadId = parseInt(id);

    if (isNaN(actividadId)) {
      return NextResponse.json(
        { error: "ID de actividad inválido" },
        { status: 400 }
      );
    }

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

    // Verificar que la actividad existe y pertenece a la iglesia del usuario
    const actividadExistente = await prisma.actividad.findFirst({
      where: {
        id: actividadId,
        iglesiaId: usuarioIglesia.iglesiaId,
      },
    });

    if (!actividadExistente) {
      return NextResponse.json(
        { error: "Actividad no encontrada o no tienes permiso para editarla" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      nombre,
      descripcion,
      fecha,
      fechaInicio,
      fechaFin,
      esRangoFechas = false,
      horaInicio,
      horaFin,
      ubicacion,
      googleMapsEmbed,
      responsable,
      banner,
      tipoActividadId,
      ministerioId,
      estado = "Programada",
    } = body;

    // Validaciones básicas
    if (!nombre) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      );
    }

    // Validar fechas según el tipo de actividad
    if (esRangoFechas) {
      if (!fechaInicio || !fechaFin) {
        return NextResponse.json(
          {
            error:
              "Para actividades de múltiples días se requieren fecha de inicio y fin",
          },
          { status: 400 }
        );
      }

      if (new Date(fechaFin) < new Date(fechaInicio)) {
        return NextResponse.json(
          {
            error:
              "La fecha de fin debe ser posterior o igual a la fecha de inicio",
          },
          { status: 400 }
        );
      }
    } else {
      if (!fecha) {
        return NextResponse.json(
          { error: "La fecha es requerida" },
          { status: 400 }
        );
      }
    }

    if (!tipoActividadId) {
      return NextResponse.json(
        { error: "El tipo de actividad es requerido" },
        { status: 400 }
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

    // Preparar datos para la actualización
    const actividadData = {
      nombre,
      descripcion: parseString(descripcion),
      fecha: esRangoFechas
        ? fechaInicio
          ? new Date(fechaInicio)
          : new Date()
        : new Date(fecha),
      fechaInicio: esRangoFechas
        ? fechaInicio
          ? new Date(fechaInicio)
          : null
        : null,
      fechaFin: esRangoFechas ? (fechaFin ? new Date(fechaFin) : null) : null,
      esRangoFechas,
      horaInicio: parseString(horaInicio),
      horaFin: parseString(horaFin),
      ubicacion: parseString(ubicacion),
      tipoActividadId: parseInt(tipoActividadId),
      ministerioId: ministerioId ? parseInt(ministerioId) : null,
      estado,
    };

    // Actualizar la actividad con los campos básicos
    await prisma.actividad.update({
      where: { id: actividadId },
      data: actividadData,
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
