import { prisma } from "../../../lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getUserContext, requireAuth } from "../../../lib/auth-utils";

// Helper function para parsing seguro
function parseString(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

export async function GET(request: NextRequest) {
  try {
    // Obtener contexto del usuario autenticado
    const userContext = await getUserContext(request);
    const { iglesiaId } = requireAuth(userContext);

    const ministerios = await prisma.ministerio.findMany({
      where: { iglesiaId }, // ✅ Filtrar por iglesia del usuario
      include: {
        personas: {
          where: {
            estado: "Activo",
          },
          include: {
            persona: {
              select: {
                id: true,
                nombres: true,
                apellidos: true,
                foto: true,
              },
            },
          },
          orderBy: {
            fechaInicio: "desc",
          },
        },
        _count: {
          select: {
            personas: {
              where: {
                estado: "Activo",
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

    if (error instanceof Error && error.message === "Usuario no autenticado") {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Error al obtener los ministerios" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Obtener contexto del usuario autenticado
    const userContext = await getUserContext(request);
    const { iglesiaId } = requireAuth(userContext);

    const body = await request.json();
    const { nombre, descripcion } = body;

    // Validaciones básicas
    if (!nombre) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      );
    }

    // Verificar que no existe otro ministerio con el mismo nombre en esta iglesia
    const ministerioExistente = await prisma.ministerio.findFirst({
      where: {
        nombre: nombre.trim(),
        iglesiaId,
      },
    });

    if (ministerioExistente) {
      return NextResponse.json(
        { error: "Ya existe un ministerio con ese nombre" },
        { status: 409 }
      );
    }

    const nuevoMinisterio = await prisma.ministerio.create({
      data: {
        iglesiaId, // ✅ Asignar automáticamente la iglesia del usuario
        nombre: nombre.trim(),
        descripcion: parseString(descripcion),
      },
      include: {
        personas: {
          where: {
            estado: "Activo",
          },
          include: {
            persona: {
              select: {
                id: true,
                nombres: true,
                apellidos: true,
                foto: true,
              },
            },
          },
          orderBy: {
            fechaInicio: "desc",
          },
        },
        _count: {
          select: {
            personas: {
              where: {
                estado: "Activo",
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

    if (error instanceof Error && error.message === "Usuario no autenticado") {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Error al crear el ministerio" },
      { status: 500 }
    );
  }
}
