import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";

const prisma = new PrismaClient();

// Helper function para manejar strings vacios
function parseString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }
  return value as string;
}

// Helper function para manejar números
function parseNumber(value: unknown): number | undefined {
  if (!value || value === "") return undefined;
  const num = parseInt(value as string);
  return isNaN(num) ? undefined : num;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const visitaId = parseInt(id);

    if (isNaN(visitaId)) {
      return NextResponse.json(
        { error: "ID de visita inválido" },
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

    // Verificar que la visita existe y pertenece a la iglesia del usuario
    const visitaExiste = await prisma.persona.findUnique({
      where: {
        id: visitaId,
        iglesiaId: usuarioIglesia.iglesiaId, // FILTRAR POR IGLESIA
        rol: "VISITA",
      },
    });

    if (!visitaExiste) {
      return NextResponse.json(
        { error: "Visita no encontrada" },
        { status: 404 }
      );
    }

    const historial = await prisma.historialVisita.findMany({
      where: { personaId: visitaId },
      include: {
        tipoActividad: true,
        actividad: {
          include: {
            ministerio: {
              select: {
                id: true,
                nombre: true,
                descripcion: true,
              },
            },
          },
        },
        persona: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
          },
        },
      },
      orderBy: {
        fecha: "desc",
      },
    });

    return NextResponse.json(historial);
  } catch (error) {
    console.error("Error al obtener historial de visitas:", error);
    return NextResponse.json(
      { error: "Error al obtener el historial de visitas" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const visitaId = parseInt(id);

    if (isNaN(visitaId)) {
      return NextResponse.json(
        { error: "ID de visita inválido" },
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

    const body = await request.json();
    const {
      fecha,
      fechaEspecifica,
      tipoActividadId,
      actividadId,
      observaciones,
    } = body;

    // Validaciones básicas
    if (!fecha) {
      return NextResponse.json(
        { error: "La fecha es requerida" },
        { status: 400 }
      );
    }

    if (!tipoActividadId && !actividadId) {
      return NextResponse.json(
        {
          error:
            "Debe especificar un tipo de actividad o una actividad específica",
        },
        { status: 400 }
      );
    }

    // Verificar que la persona existe y pertenece a la iglesia del usuario
    const personaExiste = await prisma.persona.findUnique({
      where: {
        id: visitaId,
        iglesiaId: usuarioIglesia.iglesiaId, // FILTRAR POR IGLESIA
      },
    });

    if (!personaExiste) {
      return NextResponse.json(
        { error: "Persona no encontrada" },
        { status: 404 }
      );
    }

    const nuevoHistorial = await prisma.historialVisita.create({
      data: {
        personaId: visitaId,
        fecha: new Date(fecha),
        fechaEspecifica: fechaEspecifica ? new Date(fechaEspecifica) : null,
        tipoActividadId: parseNumber(tipoActividadId),
        actividadId: parseNumber(actividadId),
        notas: parseString(observaciones),
      },
      include: {
        tipoActividad: true,
        actividad: {
          include: {
            ministerio: {
              select: {
                id: true,
                nombre: true,
                descripcion: true,
              },
            },
          },
        },
        persona: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
          },
        },
      },
    });

    // Verificar si la visita debe cambiar de estado a RECURRENTE
    // Contar el total de visitas (incluyendo la que acabamos de crear)
    const totalVisitas = await prisma.historialVisita.count({
      where: {
        personaId: visitaId,
      },
    });

    // Si tiene más de 2 visitas y su estado actual es NUEVA, cambiar a RECURRENTE
    if (totalVisitas > 2 && personaExiste.estado === "NUEVA") {
      await prisma.persona.update({
        where: { id: visitaId },
        data: { estado: "RECURRENTE" },
      });
    }

    return NextResponse.json(nuevoHistorial, { status: 201 });
  } catch (error: unknown) {
    console.error("Error al crear registro de historial:", error);
    return NextResponse.json(
      { error: "Error al crear el registro de historial" },
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
    const visitaId = parseInt(id);

    if (isNaN(visitaId)) {
      return NextResponse.json(
        { error: "ID de visita inválido" },
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

    // Obtener el ID del registro de historial desde la query string
    const url = new URL(request.url);
    const historialId = url.searchParams.get("historialId");

    if (!historialId) {
      return NextResponse.json(
        { error: "ID de registro de historial requerido" },
        { status: 400 }
      );
    }

    const historialIdNum = parseInt(historialId);
    if (isNaN(historialIdNum)) {
      return NextResponse.json(
        { error: "ID de registro de historial inválido" },
        { status: 400 }
      );
    }

    // Verificar que la visita existe y pertenece a la iglesia del usuario
    const visitaExiste = await prisma.persona.findUnique({
      where: {
        id: visitaId,
        iglesiaId: usuarioIglesia.iglesiaId, // FILTRAR POR IGLESIA
        rol: "VISITA",
      },
    });

    if (!visitaExiste) {
      return NextResponse.json(
        { error: "Visita no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que el registro existe y pertenece a la visita correcta
    const registroExistente = await prisma.historialVisita.findFirst({
      where: {
        id: historialIdNum,
        personaId: visitaId,
      },
    });

    if (!registroExistente) {
      return NextResponse.json(
        { error: "Registro de historial no encontrado" },
        { status: 404 }
      );
    }

    // Eliminar el registro
    await prisma.historialVisita.delete({
      where: { id: historialIdNum },
    });

    // Verificar si la visita debe cambiar de estado de RECURRENTE a NUEVA
    // Contar el total de visitas restantes después de la eliminación
    const totalVisitasRestantes = await prisma.historialVisita.count({
      where: {
        personaId: visitaId,
      },
    });

    // Si tiene 2 o menos visitas y su estado actual es RECURRENTE, cambiar a NUEVA
    if (totalVisitasRestantes <= 2 && visitaExiste.estado === "RECURRENTE") {
      await prisma.persona.update({
        where: { id: visitaId },
        data: { estado: "NUEVA" },
      });
    }

    return NextResponse.json(
      { message: "Registro eliminado exitosamente" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error al eliminar registro de historial:", error);
    return NextResponse.json(
      { error: "Error al eliminar el registro de historial" },
      { status: 500 }
    );
  }
}
