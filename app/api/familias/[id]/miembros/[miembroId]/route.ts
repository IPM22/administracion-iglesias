import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// DELETE - Remover miembro de la familia
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; miembroId: string }> }
) {
  try {
    const { id, miembroId } = await params;
    const familiaId = parseInt(id);
    const miembroIdInt = parseInt(miembroId);

    if (
      !familiaId ||
      isNaN(familiaId) ||
      !miembroIdInt ||
      isNaN(miembroIdInt)
    ) {
      return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });
    }

    // Verificar que el miembro existe y pertenece a la familia
    const miembro = await prisma.miembro.findFirst({
      where: {
        id: miembroIdInt,
        familiaId: familiaId,
      },
    });

    if (!miembro) {
      return NextResponse.json(
        { error: "Miembro no encontrado en esta familia" },
        { status: 404 }
      );
    }

    // Verificar si es el jefe de familia
    const familia = await prisma.familia.findUnique({
      where: { id: familiaId },
      select: { jefeFamiliaId: true },
    });

    if (familia?.jefeFamiliaId === miembroIdInt) {
      return NextResponse.json(
        {
          error:
            "No se puede remover al jefe de familia. Asigna otro jefe primero.",
        },
        { status: 400 }
      );
    }

    // Remover al miembro de la familia
    await prisma.miembro.update({
      where: { id: miembroIdInt },
      data: {
        familiaId: null,
        parentescoFamiliar: null,
      },
    });

    return NextResponse.json(
      { message: "Miembro removido de la familia exitosamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al remover miembro de la familia:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PATCH - Actualizar parentesco del miembro
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; miembroId: string }> }
) {
  try {
    const { id, miembroId } = await params;
    const familiaId = parseInt(id);
    const miembroIdInt = parseInt(miembroId);

    if (
      !familiaId ||
      isNaN(familiaId) ||
      !miembroIdInt ||
      isNaN(miembroIdInt)
    ) {
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

    // Verificar que el miembro existe y pertenece a la familia
    const miembro = await prisma.miembro.findFirst({
      where: {
        id: miembroIdInt,
        familiaId: familiaId,
      },
    });

    if (!miembro) {
      return NextResponse.json(
        { error: "Miembro no encontrado en esta familia" },
        { status: 404 }
      );
    }

    // Actualizar el parentesco
    await prisma.miembro.update({
      where: { id: miembroIdInt },
      data: { parentescoFamiliar },
    });

    return NextResponse.json(
      { message: "Parentesco actualizado exitosamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al actualizar parentesco del miembro:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
