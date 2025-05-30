import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/db";

// DELETE - Remover miembro de familia
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; miembroId: string }> }
) {
  try {
    const { id, miembroId } = await params;
    const familiaId = parseInt(id);
    const miembroIdNum = parseInt(miembroId);

    if (isNaN(familiaId) || isNaN(miembroIdNum)) {
      return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });
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

    // Verificar que el miembro existe y pertenece a esta familia
    const miembro = await prisma.miembro.findUnique({
      where: { id: miembroIdNum },
    });

    if (!miembro) {
      return NextResponse.json(
        { error: "Miembro no encontrado" },
        { status: 404 }
      );
    }

    if (miembro.familiaId !== familiaId) {
      return NextResponse.json(
        { error: "El miembro no pertenece a esta familia" },
        { status: 400 }
      );
    }

    // Verificar si el miembro es el jefe de familia
    if (familia.jefeFamiliaId === miembroIdNum) {
      return NextResponse.json(
        {
          error:
            "No se puede remover al cabeza de familia. Primero cambie el cabeza de familia.",
        },
        { status: 400 }
      );
    }

    // Remover miembro de la familia
    await prisma.miembro.update({
      where: { id: miembroIdNum },
      data: { familiaId: null },
    });

    return NextResponse.json(
      { message: "Miembro removido de la familia exitosamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al remover miembro de familia:", error);
    return NextResponse.json(
      { error: "Error al remover miembro de la familia" },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar parentesco familiar de un miembro
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; miembroId: string }> }
) {
  try {
    const { id, miembroId } = await params;
    const familiaId = parseInt(id);
    const miembroIdNum = parseInt(miembroId);

    if (isNaN(familiaId) || isNaN(miembroIdNum)) {
      return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });
    }

    const body = await request.json();
    const { parentescoFamiliar } = body;

    if (!parentescoFamiliar) {
      return NextResponse.json(
        { error: "El parentesco familiar es requerido" },
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

    // Verificar que el miembro existe y pertenece a esta familia
    const miembro = await prisma.miembro.findUnique({
      where: { id: miembroIdNum },
    });

    if (!miembro) {
      return NextResponse.json(
        { error: "Miembro no encontrado" },
        { status: 404 }
      );
    }

    if (miembro.familiaId !== familiaId) {
      return NextResponse.json(
        { error: "El miembro no pertenece a esta familia" },
        { status: 400 }
      );
    }

    // Actualizar el parentesco familiar
    const miembroActualizado = await prisma.miembro.update({
      where: { id: miembroIdNum },
      data: { parentescoFamiliar },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        parentescoFamiliar: true,
      },
    });

    return NextResponse.json(miembroActualizado, { status: 200 });
  } catch (error) {
    console.error("Error al actualizar parentesco familiar:", error);
    return NextResponse.json(
      { error: "Error al actualizar el parentesco familiar" },
      { status: 500 }
    );
  }
}
