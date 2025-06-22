import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST - Agregar persona a familia
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const familiaId = parseInt(id);

    if (!familiaId || isNaN(familiaId)) {
      return NextResponse.json(
        { error: "ID de familia inválido" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { personaId, parentescoFamiliar } = body;

    // Validaciones
    if (!personaId) {
      return NextResponse.json(
        { error: "PersonaId es requerido" },
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
      where: { id: personaId },
    });

    if (!persona) {
      return NextResponse.json(
        { error: "Persona no encontrada" },
        { status: 404 }
      );
    }

    // Verificar si ya pertenece a esta familia
    if (persona.familiaId === familiaId) {
      return NextResponse.json(
        { error: "La persona ya pertenece a esta familia" },
        { status: 400 }
      );
    }

    // Actualizar la persona para asignarla a la familia
    const updateData: { familiaId: number; relacionFamiliar?: string } = {
      familiaId: familiaId,
    };
    if (parentescoFamiliar) {
      updateData.relacionFamiliar = parentescoFamiliar;
    }

    await prisma.persona.update({
      where: { id: personaId },
      data: updateData,
    });

    return NextResponse.json(
      { message: "Persona agregada a la familia exitosamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al agregar persona a la familia:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
