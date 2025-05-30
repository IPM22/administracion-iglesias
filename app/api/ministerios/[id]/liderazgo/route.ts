import { prisma } from "../../../../../lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ministerioId = parseInt(id);

    if (isNaN(ministerioId)) {
      return NextResponse.json(
        { error: "ID de ministerio inválido" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { nuevoLiderId } = body;

    if (!nuevoLiderId) {
      return NextResponse.json(
        { error: "El ID del nuevo líder es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el ministerio existe
    const ministerio = await prisma.ministerio.findUnique({
      where: { id: ministerioId },
    });

    if (!ministerio) {
      return NextResponse.json(
        { error: "Ministerio no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el nuevo líder está activo en el ministerio
    const nuevoLider = await prisma.ministerioMiembro.findFirst({
      where: {
        miembroId: parseInt(nuevoLiderId),
        ministerioId,
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
    });

    if (!nuevoLider) {
      return NextResponse.json(
        { error: "El miembro seleccionado no está activo en este ministerio" },
        { status: 404 }
      );
    }

    // Usar una transacción para cambiar el liderazgo de forma segura
    const resultado = await prisma.$transaction(async (tx) => {
      // Remover liderazgo del líder actual (si existe)
      await tx.ministerioMiembro.updateMany({
        where: {
          ministerioId,
          esLider: true,
          estado: "Activo",
        },
        data: {
          esLider: false,
        },
      });

      // Asignar liderazgo al nuevo líder
      const nuevoLiderActualizado = await tx.ministerioMiembro.update({
        where: { id: nuevoLider.id },
        data: {
          esLider: true,
          rol: nuevoLider.rol || "Líder", // Asignar rol de líder si no tiene uno
        },
        include: {
          miembro: {
            select: {
              id: true,
              nombres: true,
              apellidos: true,
              foto: true,
              correo: true,
            },
          },
        },
      });

      return nuevoLiderActualizado;
    });

    return NextResponse.json({
      message: "Liderazgo actualizado correctamente",
      nuevoLider: resultado,
    });
  } catch (error) {
    console.error("Error al cambiar liderazgo:", error);
    return NextResponse.json(
      { error: "Error al cambiar el liderazgo del ministerio" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ministerioId = parseInt(id);

    if (isNaN(ministerioId)) {
      return NextResponse.json(
        { error: "ID de ministerio inválido" },
        { status: 400 }
      );
    }

    // Remover liderazgo de todos los miembros del ministerio
    await prisma.ministerioMiembro.updateMany({
      where: {
        ministerioId,
        esLider: true,
      },
      data: {
        esLider: false,
      },
    });

    return NextResponse.json({
      message: "Liderazgo removido correctamente",
    });
  } catch (error) {
    console.error("Error al remover liderazgo:", error);
    return NextResponse.json(
      { error: "Error al remover el liderazgo del ministerio" },
      { status: 500 }
    );
  }
}
