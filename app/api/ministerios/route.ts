import { prisma } from "../../../lib/db";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Helper function para parsing seguro
function parseString(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

export async function GET() {
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

    const ministerios = await prisma.ministerio.findMany({
      where: {
        iglesiaId: usuarioIglesia.iglesiaId, // FILTRAR POR IGLESIA
      },
      include: {
        miembros: {
          where: {
            activo: true,
          },
          include: {
            miembro: {
              select: {
                id: true,
                nombres: true,
                apellidos: true,
                foto: true,
              },
            },
          },
        },
        actividades: {
          select: {
            id: true,
            nombre: true,
            fecha: true,
            estado: true,
          },
        },
        _count: {
          select: {
            miembros: {
              where: {
                activo: true,
              },
            },
            actividades: true,
          },
        },
      },
      orderBy: {
        nombre: "asc",
      },
    });

    return NextResponse.json(ministerios);
  } catch (error) {
    console.error("Error al obtener ministerios:", error);
    return NextResponse.json(
      { error: "Error al obtener los ministerios" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { nombre, descripcion } = body;

    // Validaciones básicas
    if (!nombre) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      );
    }

    // Verificar que no existe un ministerio con el mismo nombre en la misma iglesia
    const ministerioExistente = await prisma.ministerio.findFirst({
      where: {
        nombre: nombre.trim(),
        iglesiaId: usuarioIglesia.iglesiaId,
      },
    });

    if (ministerioExistente) {
      return NextResponse.json(
        { error: "Ya existe un ministerio con ese nombre en tu iglesia" },
        { status: 409 }
      );
    }

    const nuevoMinisterio = await prisma.ministerio.create({
      data: {
        iglesiaId: usuarioIglesia.iglesiaId, // AGREGAR IGLESIA ID
        nombre: nombre.trim(),
        descripcion: parseString(descripcion),
      },
      include: {
        miembros: {
          where: {
            activo: true,
          },
          include: {
            miembro: {
              select: {
                id: true,
                nombres: true,
                apellidos: true,
                foto: true,
              },
            },
          },
        },
        _count: {
          select: {
            miembros: {
              where: {
                activo: true,
              },
            },
            actividades: true,
          },
        },
      },
    });

    return NextResponse.json(nuevoMinisterio, { status: 201 });
  } catch (error) {
    console.error("Error al crear ministerio:", error);
    return NextResponse.json(
      { error: "Error al crear el ministerio" },
      { status: 500 }
    );
  }
}
