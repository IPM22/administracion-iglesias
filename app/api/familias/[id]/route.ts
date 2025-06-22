import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { createClient } from "@/lib/supabase/server";

// Helper function para manejar strings vacíos
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
    const familiaId = parseInt(id);

    if (isNaN(familiaId)) {
      return NextResponse.json(
        { error: "ID de familia inválido" },
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

    const familia = await prisma.familia.findUnique({
      where: {
        id: familiaId,
        iglesiaId: usuarioIglesia.iglesiaId, // FILTRAR POR IGLESIA
      },
      include: {
        personas: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            correo: true,
            telefono: true,
            celular: true,
            fechaNacimiento: true,
            sexo: true,
            estado: true,
            foto: true,
            fechaIngreso: true,
            relacionFamiliar: true,
            rol: true,
            fechaPrimeraVisita: true,
          },
          orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
        },
        _count: {
          select: {
            personas: true,
          },
        },
        vinculos: {
          include: {
            familiaRelacionada: {
              select: {
                id: true,
                apellido: true,
                nombre: true,
                estado: true,
              },
            },
          },
        },
        vinculosRelacionados: {
          include: {
            familiaOrigen: {
              select: {
                id: true,
                apellido: true,
                nombre: true,
                estado: true,
              },
            },
          },
        },
      },
    });

    if (!familia) {
      return NextResponse.json(
        { error: "Familia no encontrada" },
        { status: 404 }
      );
    }

    // Calcular estadísticas
    const todasPersonas = familia.personas;
    const totalPersonas = todasPersonas.length;

    // Contar por rol
    const miembros = todasPersonas.filter((p) => p.rol === "MIEMBRO");
    const visitas = todasPersonas.filter(
      (p) => p.rol === "VISITA" || p.rol === "INVITADO"
    );
    const ninos = todasPersonas.filter((p) => p.rol === "NINO");

    // Contar por estado
    const personasActivas = todasPersonas.filter(
      (p) => p.estado === "ACTIVA"
    ).length;

    // Encontrar el jefe de familia basado en la relación (cualquier persona puede ser jefe)
    const jefeFamilia =
      todasPersonas.find(
        (p) =>
          p.relacionFamiliar === "Cabeza de Familia" ||
          p.relacionFamiliar === "Jefe de Familia" ||
          p.relacionFamiliar === "Padre" ||
          p.relacionFamiliar === "Madre"
      ) || todasPersonas[0]; // Si no hay jefe explícito, tomar el primero

    const edadPromedio =
      todasPersonas.length > 0
        ? todasPersonas
            .filter((p) => p.fechaNacimiento)
            .reduce((acc, p) => {
              const edad =
                new Date().getFullYear() -
                new Date(p.fechaNacimiento!).getFullYear();
              return acc + edad;
            }, 0) / todasPersonas.filter((p) => p.fechaNacimiento).length
        : 0;

    const familiaConEstadisticas = {
      ...familia,
      jefeFamilia: jefeFamilia
        ? {
            id: jefeFamilia.id,
            nombres: jefeFamilia.nombres,
            apellidos: jefeFamilia.apellidos,
            foto: jefeFamilia.foto,
            fechaNacimiento: jefeFamilia.fechaNacimiento,
            correo: jefeFamilia.correo,
            telefono: jefeFamilia.telefono,
            rol: jefeFamilia.rol,
          }
        : null,
      // Estadísticas generales
      totalPersonas,
      personasActivas,
      edadPromedio,
      // Estadísticas por rol (para compatibilidad con frontend existente)
      totalMiembros: miembros.length,
      totalVisitas: visitas.length,
      totalNinos: ninos.length,
      // Vínculos
      vinculosOrigen: familia.vinculos || [],
      vinculosRelacionados: familia.vinculosRelacionados || [],
    };

    return NextResponse.json(familiaConEstadisticas);
  } catch (error) {
    console.error("Error al obtener familia:", error);
    return NextResponse.json(
      { error: "Error al obtener la familia" },
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
    const familiaId = parseInt(id);

    if (isNaN(familiaId)) {
      return NextResponse.json(
        { error: "ID de familia inválido" },
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
    const { apellido, nombre, direccion, telefono, correo, estado, notas } =
      body;

    // Validaciones básicas
    if (!apellido) {
      return NextResponse.json(
        { error: "El apellido familiar es requerido" },
        { status: 400 }
      );
    }

    // Verificar que la familia existe y pertenece a la iglesia del usuario
    const familiaExistente = await prisma.familia.findUnique({
      where: {
        id: familiaId,
        iglesiaId: usuarioIglesia.iglesiaId, // FILTRAR POR IGLESIA
      },
    });

    if (!familiaExistente) {
      return NextResponse.json(
        { error: "Familia no encontrada" },
        { status: 404 }
      );
    }

    // Nota: jefeFamiliaId ya no existe en el esquema de Familia
    // Si necesitas asignar un jefe de familia, debe hacerse a través de la relación del miembro

    const familiaActualizada = await prisma.familia.update({
      where: { id: familiaId },
      data: {
        apellido: apellido.trim(),
        nombre: parseString(nombre),
        direccion: parseString(direccion),
        telefono: parseString(telefono),
        correo: parseString(correo),
        estado: parseString(estado) || "Activa",
        notas: parseString(notas),
      },
      include: {
        personas: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            foto: true,
            estado: true,
          },
        },
        _count: {
          select: {
            personas: true,
          },
        },
      },
    });

    return NextResponse.json(familiaActualizada);
  } catch (error: unknown) {
    console.error("Error al actualizar familia:", error);
    return NextResponse.json(
      { error: "Error al actualizar la familia" },
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
    const familiaId = parseInt(id);

    if (isNaN(familiaId)) {
      return NextResponse.json(
        { error: "ID de familia inválido" },
        { status: 400 }
      );
    }

    // Verificar que la familia existe
    const familiaExistente = await prisma.familia.findUnique({
      where: { id: familiaId },
      include: {
        personas: true,
      },
    });

    if (!familiaExistente) {
      return NextResponse.json(
        { error: "Familia no encontrada" },
        { status: 404 }
      );
    }

    // Verificar si la familia tiene miembros asociados
    if (familiaExistente.personas.length > 0) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar la familia porque tiene miembros asociados. Primero desasocie los miembros.",
        },
        { status: 400 }
      );
    }

    await prisma.familia.delete({
      where: { id: familiaId },
    });

    return NextResponse.json(
      { message: "Familia eliminada exitosamente" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error al eliminar familia:", error);
    return NextResponse.json(
      { error: "Error al eliminar la familia" },
      { status: 500 }
    );
  }
}
