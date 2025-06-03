import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// DELETE - Eliminar una relación familiar específica
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; relacionId: string }> }
) {
  try {
    const { id, relacionId } = await params;
    const miembroId = parseInt(id);
    const relacionIdInt = parseInt(relacionId);

    if (
      !miembroId ||
      isNaN(miembroId) ||
      !relacionIdInt ||
      isNaN(relacionIdInt)
    ) {
      return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });
    }

    // Verificar que el miembro existe
    const miembro = await prisma.miembro.findUnique({
      where: { id: miembroId },
    });

    if (!miembro) {
      return NextResponse.json(
        { error: "Miembro no encontrado" },
        { status: 404 }
      );
    }

    // Buscar la relación familiar en la nueva tabla (RelacionFamiliar)
    const relacionFamiliar = await prisma.relacionFamiliar.findFirst({
      where: {
        OR: [
          {
            id: relacionIdInt,
            persona1Id: miembroId,
            tipoPersona1: "miembro",
          },
          {
            id: relacionIdInt,
            persona2Id: miembroId,
            tipoPersona2: "miembro",
          },
        ],
      },
    });

    // Si no se encuentra en RelacionFamiliar, buscar en la tabla legacy
    let relacionLegacy = null;
    if (!relacionFamiliar) {
      relacionLegacy = await prisma.familiarMiembro.findFirst({
        where: {
          OR: [
            {
              id: relacionIdInt,
              miembroId: miembroId,
            },
            {
              id: relacionIdInt,
              familiarId: miembroId,
            },
          ],
        },
      });
    }

    if (!relacionFamiliar && !relacionLegacy) {
      return NextResponse.json(
        { error: "Relación familiar no encontrada" },
        { status: 404 }
      );
    }

    // Eliminar la relación
    if (relacionFamiliar) {
      // Eliminar de la nueva tabla
      await prisma.relacionFamiliar.delete({
        where: { id: relacionIdInt },
      });

      // También eliminar la relación recíproca si existe
      if (relacionFamiliar.esRecíproca) {
        await prisma.relacionFamiliar.deleteMany({
          where: {
            OR: [
              {
                persona1Id: relacionFamiliar.persona2Id,
                tipoPersona1: relacionFamiliar.tipoPersona2,
                persona2Id: relacionFamiliar.persona1Id,
                tipoPersona2: relacionFamiliar.tipoPersona1,
              },
            ],
          },
        });
      }
    }

    if (relacionLegacy) {
      // Eliminar de la tabla legacy
      await prisma.familiarMiembro.delete({
        where: { id: relacionIdInt },
      });

      // También eliminar la relación inversa en la tabla legacy
      await prisma.familiarMiembro.deleteMany({
        where: {
          miembroId: relacionLegacy.familiarId,
          familiarId: relacionLegacy.miembroId,
        },
      });
    }

    return NextResponse.json(
      { message: "Relación familiar eliminada exitosamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al eliminar relación familiar:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
