import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { parseDateForAPI } from "@/lib/date-utils";
import { createClient } from "@/lib/supabase/server";

const prisma = new PrismaClient();

// Helper function para manejar strings vacios
function parseString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }
  return value as string;
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

    const visita = await prisma.visita.findUnique({
      where: {
        id: visitaId,
        iglesiaId: usuarioIglesia.iglesiaId, // FILTRAR POR IGLESIA
      },
      include: {
        historialVisitas: {
          include: {
            tipoActividad: true,
            actividad: true,
            miembro: {
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
        },
        miembroConvertido: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
          },
        },
      },
    });

    if (!visita) {
      return NextResponse.json(
        { error: "Visita no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(visita);
  } catch (error) {
    console.error("Error al obtener visita:", error);
    return NextResponse.json(
      { error: "Error al obtener la visita" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(
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
    const visitaExistente = await prisma.visita.findUnique({
      where: {
        id: visitaId,
        iglesiaId: usuarioIglesia.iglesiaId, // FILTRAR POR IGLESIA
      },
    });

    if (!visitaExistente) {
      return NextResponse.json(
        { error: "Visita no encontrada" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      nombres,
      apellidos,
      correo,
      telefono,
      celular,
      direccion,
      fechaNacimiento,
      sexo,
      estadoCivil,
      ocupacion,
      familia,
      estado,
      foto,
      notasAdicionales,
      fechaPrimeraVisita,
    } = body;

    // Validaciones básicas
    if (!nombres || !apellidos) {
      return NextResponse.json(
        { error: "Nombres y apellidos son requeridos" },
        { status: 400 }
      );
    }

    const visitaActualizada = await prisma.visita.update({
      where: { id: visitaId },
      data: {
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        correo: parseString(correo),
        telefono: parseString(telefono),
        celular: parseString(celular),
        direccion: parseString(direccion),
        fechaNacimiento: parseDateForAPI(fechaNacimiento as string),
        sexo: parseString(sexo),
        estadoCivil: parseString(estadoCivil),
        ocupacion: parseString(ocupacion),
        familia: parseString(familia),
        estado: parseString(estado),
        foto: parseString(foto),
        notas: parseString(notasAdicionales),
        fechaPrimeraVisita: parseDateForAPI(fechaPrimeraVisita as string),
      },
    });

    return NextResponse.json(visitaActualizada);
  } catch (error: unknown) {
    console.error("Error al actualizar visita:", error);

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ya existe una visita con ese correo electrónico" },
        { status: 400 }
      );
    }

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Visita no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Error al actualizar la visita" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
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

    // Verificar que la visita existe y pertenece a la iglesia del usuario
    const visitaExistente = await prisma.visita.findUnique({
      where: {
        id: visitaId,
        iglesiaId: usuarioIglesia.iglesiaId, // FILTRAR POR IGLESIA
      },
    });

    if (!visitaExistente) {
      return NextResponse.json(
        { error: "Visita no encontrada" },
        { status: 404 }
      );
    }

    // Eliminar primero el historial de visitas relacionado
    await prisma.historialVisita.deleteMany({
      where: { visitaId: visitaId },
    });

    // Luego eliminar la visita
    await prisma.visita.delete({
      where: { id: visitaId },
    });

    return NextResponse.json({
      message: "Visita eliminada correctamente",
    });
  } catch (error: unknown) {
    console.error("Error al eliminar visita:", error);

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Visita no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Error al eliminar la visita" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PATCH(
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
    const visitaExistente = await prisma.visita.findUnique({
      where: {
        id: visitaId,
        iglesiaId: usuarioIglesia.iglesiaId, // FILTRAR POR IGLESIA
      },
    });

    if (!visitaExistente) {
      return NextResponse.json(
        { error: "Visita no encontrada" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case "convertir":
        // Crear miembro a partir de la visita
        const nuevoMiembro = await prisma.miembro.create({
          data: {
            nombres: visitaExistente.nombres,
            apellidos: visitaExistente.apellidos,
            correo: visitaExistente.correo,
            telefono: visitaExistente.telefono,
            celular: visitaExistente.celular,
            direccion: visitaExistente.direccion,
            fechaNacimiento: visitaExistente.fechaNacimiento,
            sexo: visitaExistente.sexo,
            estadoCivil: visitaExistente.estadoCivil,
            ocupacion: visitaExistente.ocupacion,
            foto: visitaExistente.foto,
            fechaBautismo: data.fechaBautismo
              ? parseDateForAPI(data.fechaBautismo)
              : null,
            iglesiaId: usuarioIglesia.iglesiaId,
          },
        });

        // Actualizar la visita para marcarla como convertida
        const visitaConvertida = await prisma.visita.update({
          where: { id: visitaId },
          data: {
            estado: "Convertido",
            miembroConvertidoId: nuevoMiembro.id,
          },
        });

        return NextResponse.json({
          visita: visitaConvertida,
          miembro: nuevoMiembro,
          message: "Visita convertida a miembro exitosamente",
        });

      default:
        return NextResponse.json(
          { error: "Acción no válida" },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    console.error("Error en operación PATCH:", error);

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ya existe un miembro con ese correo electrónico" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error en la operación" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
