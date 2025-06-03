import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/db";

// DELETE - Eliminar vínculo familiar
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; vinculoId: string }> }
) {
  try {
    const { id, vinculoId } = await params;
    const familiaId = parseInt(id);
    const vinculoIdInt = parseInt(vinculoId);

    if (isNaN(familiaId) || isNaN(vinculoIdInt)) {
      return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });
    }

    // Verificar que el vínculo existe y está relacionado con esta familia
    const vinculo = await prisma.vinculoFamiliar.findFirst({
      where: {
        id: vinculoIdInt,
        OR: [
          { familiaOrigenId: familiaId },
          { familiaRelacionadaId: familiaId },
        ],
      },
    });

    if (!vinculo) {
      return NextResponse.json(
        { error: "Vínculo no encontrado" },
        { status: 404 }
      );
    }

    // Eliminar el vínculo
    await prisma.vinculoFamiliar.delete({
      where: { id: vinculoIdInt },
    });

    return NextResponse.json(
      { message: "Vínculo eliminado exitosamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al eliminar vínculo familiar:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar vínculo familiar
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; vinculoId: string }> }
) {
  try {
    const { id, vinculoId } = await params;
    const familiaId = parseInt(id);
    const vinculoIdInt = parseInt(vinculoId);

    if (isNaN(familiaId) || isNaN(vinculoIdInt)) {
      return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });
    }

    const body = await request.json();
    const { tipoVinculo, descripcion, miembroVinculoId } = body;

    // Verificar que el vínculo existe y está relacionado con esta familia
    const vinculo = await prisma.vinculoFamiliar.findFirst({
      where: {
        id: vinculoIdInt,
        OR: [
          { familiaOrigenId: familiaId },
          { familiaRelacionadaId: familiaId },
        ],
      },
    });

    if (!vinculo) {
      return NextResponse.json(
        { error: "Vínculo no encontrado" },
        { status: 404 }
      );
    }

    // Validar que el miembro conector pertenezca a una de las familias vinculadas
    if (miembroVinculoId) {
      const miembroVinculoData = await prisma.miembro.findUnique({
        where: { id: miembroVinculoId },
        select: { id: true, familiaId: true, nombres: true, apellidos: true },
      });

      if (!miembroVinculoData) {
        return NextResponse.json(
          { error: "El miembro conector no existe" },
          { status: 404 }
        );
      }

      // Verificar que el miembro pertenezca a una de las familias que se están vinculando
      if (
        miembroVinculoData.familiaId !== vinculo.familiaOrigenId &&
        miembroVinculoData.familiaId !== vinculo.familiaRelacionadaId
      ) {
        return NextResponse.json(
          {
            error:
              "El miembro conector debe pertenecer a una de las familias que se están vinculando",
          },
          { status: 400 }
        );
      }
    }

    // Actualizar el vínculo
    const vinculoActualizado = await prisma.vinculoFamiliar.update({
      where: { id: vinculoIdInt },
      data: {
        tipoVinculo: tipoVinculo || vinculo.tipoVinculo,
        descripcion:
          descripcion !== undefined ? descripcion : vinculo.descripcion,
        miembroVinculoId:
          miembroVinculoId !== undefined
            ? miembroVinculoId
            : vinculo.miembroVinculoId,
      },
      include: {
        familiaOrigen: {
          select: {
            id: true,
            apellido: true,
            nombre: true,
            estado: true,
          },
        },
        familiaRelacionada: {
          select: {
            id: true,
            apellido: true,
            nombre: true,
            estado: true,
          },
        },
        miembroVinculo: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
          },
        },
      },
    });

    return NextResponse.json(vinculoActualizado);
  } catch (error) {
    console.error("Error al actualizar vínculo familiar:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
