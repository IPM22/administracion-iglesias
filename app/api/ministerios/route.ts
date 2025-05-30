import { prisma } from "../../../lib/db";
import { NextRequest, NextResponse } from "next/server";

// Helper function para parsing seguro
function parseString(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

export async function GET() {
  try {
    const ministerios = await prisma.ministerio.findMany({
      include: {
        miembros: {
          where: {
            estado: "Activo",
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
    return NextResponse.json(
      { error: "Error al obtener los ministerios" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, descripcion } = body;

    // Validaciones básicas
    if (!nombre) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      );
    }

    // Verificar que no existe un ministerio con el mismo nombre
    const ministerioExistente = await prisma.ministerio.findUnique({
      where: { nombre: nombre.trim() },
    });

    if (ministerioExistente) {
      return NextResponse.json(
        { error: "Ya existe un ministerio con ese nombre" },
        { status: 409 }
      );
    }

    const nuevoMinisterio = await prisma.ministerio.create({
      data: {
        nombre: nombre.trim(),
        descripcion: parseString(descripcion),
      },
      include: {
        miembros: {
          where: {
            estado: "Activo",
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
    return NextResponse.json(
      { error: "Error al crear el ministerio" },
      { status: 500 }
    );
  }
}
