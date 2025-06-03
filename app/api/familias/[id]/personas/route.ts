import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST - Agregar persona (miembro o visita) a familia
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
    const { personaId, tipo, parentescoFamiliar } = body;

    // Validaciones
    if (!personaId || !tipo) {
      return NextResponse.json(
        { error: "PersonaId y tipo son requeridos" },
        { status: 400 }
      );
    }

    if (tipo !== "miembro" && tipo !== "visita") {
      return NextResponse.json(
        { error: "Tipo debe ser 'miembro' o 'visita'" },
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

    // Verificar que la persona existe y agregar a la familia
    if (tipo === "miembro") {
      const miembro = await prisma.miembro.findUnique({
        where: { id: personaId },
      });

      if (!miembro) {
        return NextResponse.json(
          { error: "Miembro no encontrado" },
          { status: 404 }
        );
      }

      // Verificar si ya pertenece a esta familia
      if (miembro.familiaId === familiaId) {
        return NextResponse.json(
          { error: "El miembro ya pertenece a esta familia" },
          { status: 400 }
        );
      }

      // Actualizar el miembro para asignarlo a la familia
      const updateData: { familiaId: number; parentescoFamiliar?: string } = {
        familiaId: familiaId,
      };
      if (parentescoFamiliar) {
        updateData.parentescoFamiliar = parentescoFamiliar;
      }

      await prisma.miembro.update({
        where: { id: personaId },
        data: updateData,
      });

      return NextResponse.json(
        { message: "Miembro agregado a la familia exitosamente" },
        { status: 200 }
      );
    } else {
      const visita = await prisma.visita.findUnique({
        where: { id: personaId },
      });

      if (!visita) {
        return NextResponse.json(
          { error: "Visita no encontrada" },
          { status: 404 }
        );
      }

      // Verificar si ya pertenece a esta familia
      if (visita.familiaId === familiaId) {
        return NextResponse.json(
          { error: "La visita ya pertenece a esta familia" },
          { status: 400 }
        );
      }

      // Actualizar la visita para asignarla a la familia
      const updateData: { familiaId: number; parentescoFamiliar?: string } = {
        familiaId: familiaId,
      };
      if (parentescoFamiliar) {
        updateData.parentescoFamiliar = parentescoFamiliar;
      }

      await prisma.visita.update({
        where: { id: personaId },
        data: updateData,
      });

      return NextResponse.json(
        { message: "Visita agregada a la familia exitosamente" },
        { status: 200 }
      );
    }
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
