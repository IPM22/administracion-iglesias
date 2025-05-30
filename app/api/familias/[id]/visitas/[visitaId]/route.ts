import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/db";

// PATCH - Actualizar parentesco familiar de una visita
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; visitaId: string }> }
) {
  try {
    const { id, visitaId } = await params;
    const familiaId = parseInt(id);
    const visitaIdNum = parseInt(visitaId);

    if (isNaN(familiaId) || isNaN(visitaIdNum)) {
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

    // Verificar que la visita existe y pertenece a esta familia
    const visita = await prisma.visita.findUnique({
      where: { id: visitaIdNum },
    });

    if (!visita) {
      return NextResponse.json(
        { error: "Visita no encontrada" },
        { status: 404 }
      );
    }

    if (visita.familiaId !== familiaId) {
      return NextResponse.json(
        { error: "La visita no pertenece a esta familia" },
        { status: 400 }
      );
    }

    // Actualizar el parentesco familiar
    const visitaActualizada = await prisma.visita.update({
      where: { id: visitaIdNum },
      data: { parentescoFamiliar },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        parentescoFamiliar: true,
      },
    });

    return NextResponse.json(visitaActualizada, { status: 200 });
  } catch (error) {
    console.error("Error al actualizar parentesco familiar de visita:", error);
    return NextResponse.json(
      { error: "Error al actualizar el parentesco familiar" },
      { status: 500 }
    );
  }
}

// DELETE - Remover visita de familia
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; visitaId: string }> }
) {
  try {
    const { id, visitaId } = await params;
    const familiaId = parseInt(id);
    const visitaIdNum = parseInt(visitaId);

    if (isNaN(familiaId) || isNaN(visitaIdNum)) {
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

    // Verificar que la visita existe y pertenece a esta familia
    const visita = await prisma.visita.findUnique({
      where: { id: visitaIdNum },
    });

    if (!visita) {
      return NextResponse.json(
        { error: "Visita no encontrada" },
        { status: 404 }
      );
    }

    if (visita.familiaId !== familiaId) {
      return NextResponse.json(
        { error: "La visita no pertenece a esta familia" },
        { status: 400 }
      );
    }

    // Remover la visita de la familia
    const visitaActualizada = await prisma.visita.update({
      where: { id: visitaIdNum },
      data: {
        familiaId: null,
        parentescoFamiliar: null,
      },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
      },
    });

    return NextResponse.json(visitaActualizada, { status: 200 });
  } catch (error) {
    console.error("Error al remover visita de familia:", error);
    return NextResponse.json(
      { error: "Error al remover visita de la familia" },
      { status: 500 }
    );
  }
}
