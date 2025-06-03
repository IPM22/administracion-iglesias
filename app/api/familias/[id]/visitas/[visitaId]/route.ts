import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// DELETE - Remover visita de la familia
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; visitaId: string }> }
) {
  try {
    const { id, visitaId } = await params;
    const familiaId = parseInt(id);
    const visitaIdInt = parseInt(visitaId);

    if (!familiaId || isNaN(familiaId) || !visitaIdInt || isNaN(visitaIdInt)) {
      return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });
    }

    // Verificar que la visita existe y pertenece a la familia
    const visita = await prisma.visita.findFirst({
      where: {
        id: visitaIdInt,
        familiaId: familiaId,
      },
    });

    if (!visita) {
      return NextResponse.json(
        { error: "Visita no encontrada en esta familia" },
        { status: 404 }
      );
    }

    // Remover la visita de la familia
    await prisma.visita.update({
      where: { id: visitaIdInt },
      data: {
        familiaId: null,
        parentescoFamiliar: null,
      },
    });

    return NextResponse.json(
      { message: "Visita removida de la familia exitosamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al remover visita de la familia:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PATCH - Actualizar parentesco de la visita
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; visitaId: string }> }
) {
  try {
    const { id, visitaId } = await params;
    const familiaId = parseInt(id);
    const visitaIdInt = parseInt(visitaId);

    if (!familiaId || isNaN(familiaId) || !visitaIdInt || isNaN(visitaIdInt)) {
      return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });
    }

    const body = await request.json();
    const { parentescoFamiliar } = body;

    if (!parentescoFamiliar) {
      return NextResponse.json(
        { error: "Parentesco familiar es requerido" },
        { status: 400 }
      );
    }

    // Verificar que la visita existe y pertenece a la familia
    const visita = await prisma.visita.findFirst({
      where: {
        id: visitaIdInt,
        familiaId: familiaId,
      },
    });

    if (!visita) {
      return NextResponse.json(
        { error: "Visita no encontrada en esta familia" },
        { status: 404 }
      );
    }

    // Actualizar el parentesco
    await prisma.visita.update({
      where: { id: visitaIdInt },
      data: { parentescoFamiliar },
    });

    return NextResponse.json(
      { message: "Parentesco actualizado exitosamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al actualizar parentesco de la visita:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
