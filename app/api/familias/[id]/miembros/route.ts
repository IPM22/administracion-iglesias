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

    // Obtener personas de la familia
    const personas = await prisma.persona.findMany({
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
        relacionFamiliar: true,
        rol: true,
      },
      orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
    });

    return NextResponse.json(personas);
  } catch (error) {
    console.error("Error al obtener miembros de familia:", error);
    return NextResponse.json(
      { error: "Error al obtener miembros de la familia" },
      { status: 500 }
    );
  }
}

// POST - Agregar persona a familia
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
    const { personaId, parentescoFamiliar } = body;

    if (!personaId) {
      return NextResponse.json(
        { error: "ID de persona es requerido" },
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

    // Verificar que la persona existe
    const persona = await prisma.persona.findUnique({
      where: { id: parseInt(personaId) },
    });

    if (!persona) {
      return NextResponse.json(
        { error: "Persona no encontrada" },
        { status: 404 }
      );
    }

    // Verificar si la persona ya pertenece a otra familia
    if (persona.familiaId && persona.familiaId !== familiaId) {
      const familiaActual = await prisma.familia.findUnique({
        where: { id: persona.familiaId },
        select: { apellido: true, nombre: true },
      });

      return NextResponse.json(
        {
          error: `La persona ya pertenece a la familia ${
            familiaActual?.nombre || `Familia ${familiaActual?.apellido}`
          }`,
        },
        { status: 400 }
      );
    }

    // Agregar persona a la familia
    const personaActualizada = await prisma.persona.update({
      where: { id: parseInt(personaId) },
      data: {
        familiaId: familiaId,
        relacionFamiliar: parentescoFamiliar || null,
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
        relacionFamiliar: true,
        rol: true,
      },
    });

    return NextResponse.json(
      {
        persona: personaActualizada,
        mensaje: "Persona agregada a la familia exitosamente",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al agregar persona a familia:", error);
    return NextResponse.json(
      { error: "Error al agregar persona a la familia" },
      { status: 500 }
    );
  }
}
