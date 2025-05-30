import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db";

// GET - Obtener miembros de una familia
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

    // Verificar que la familia existe
    const familia = await prisma.familia.findUnique({
      where: { id: familiaId },
    });

    if (!familia) {
      return NextResponse.json(
        { error: "Familia no encontrada" },
        { status: 404 }
      );
    }

    // Obtener miembros de la familia
    const miembros = await prisma.miembro.findMany({
      where: { familiaId: familiaId },
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
      },
      orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
    });

    return NextResponse.json(miembros);
  } catch (error) {
    console.error("Error al obtener miembros de familia:", error);
    return NextResponse.json(
      { error: "Error al obtener miembros de la familia" },
      { status: 500 }
    );
  }
}

// POST - Agregar miembro a familia
export async function POST(
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

    const body = await request.json();
    const { miembroId } = body;

    if (!miembroId) {
      return NextResponse.json(
        { error: "ID de miembro es requerido" },
        { status: 400 }
      );
    }

    // Verificar que la familia existe
    const familia = await prisma.familia.findUnique({
      where: { id: familiaId },
    });

    if (!familia) {
      return NextResponse.json(
        { error: "Familia no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que el miembro existe
    const miembro = await prisma.miembro.findUnique({
      where: { id: parseInt(miembroId) },
    });

    if (!miembro) {
      return NextResponse.json(
        { error: "Miembro no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si el miembro ya pertenece a otra familia
    if (miembro.familiaId && miembro.familiaId !== familiaId) {
      const familiaActual = await prisma.familia.findUnique({
        where: { id: miembro.familiaId },
        select: { apellido: true, nombre: true },
      });

      return NextResponse.json(
        {
          error: `El miembro ya pertenece a la familia ${
            familiaActual?.nombre || `Familia ${familiaActual?.apellido}`
          }`,
        },
        { status: 400 }
      );
    }

    // Agregar miembro a la familia
    const miembroActualizado = await prisma.miembro.update({
      where: { id: parseInt(miembroId) },
      data: {
        familiaId: familiaId,
        // Si es el cabeza de familia, establecer parentesco automáticamente
        parentescoFamiliar:
          familia.jefeFamiliaId === parseInt(miembroId)
            ? "Cabeza de Familia"
            : null,
      },
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
        parentescoFamiliar: true,
      },
    });

    return NextResponse.json(miembroActualizado, { status: 201 });
  } catch (error) {
    console.error("Error al agregar miembro a familia:", error);
    return NextResponse.json(
      { error: "Error al agregar miembro a la familia" },
      { status: 500 }
    );
  }
}
