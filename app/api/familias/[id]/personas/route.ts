import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db";

// POST - Agregar persona (miembro o visita) a familia
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
    const { personaId, tipo, parentescoFamiliar } = body;

    if (!personaId || !tipo) {
      return NextResponse.json(
        { error: "ID de persona y tipo son requeridos" },
        { status: 400 }
      );
    }

    if (!["miembro", "visita"].includes(tipo)) {
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

    let personaActualizada;

    if (tipo === "miembro") {
      // Verificar que el miembro existe
      const miembro = await prisma.miembro.findUnique({
        where: { id: parseInt(personaId) },
      });

      if (!miembro) {
        return NextResponse.json(
          { error: "Miembro no encontrado" },
          { status: 404 }
        );
      }

      // Verificar si el miembro ya pertenece a otra familia
      if (miembro.familiaId && miembro.familiaId !== familiaId) {
        const familiaActual = await prisma.familia.findUnique({
          where: { id: miembro.familiaId },
          select: { apellido: true, nombre: true },
        });

        return NextResponse.json(
          {
            error: `El miembro ya pertenece a la familia ${
              familiaActual?.nombre || `Familia ${familiaActual?.apellido}`
            }`,
          },
          { status: 400 }
        );
      }

      // Agregar miembro a la familia
      personaActualizada = await prisma.miembro.update({
        where: { id: parseInt(personaId) },
        data: {
          familiaId: familiaId,
          parentescoFamiliar: parentescoFamiliar || null,
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
          parentescoFamiliar: true,
        },
      });

      return NextResponse.json(
        {
          ...personaActualizada,
          tipo: "miembro",
        },
        { status: 201 }
      );
    } else {
      // Verificar que la visita existe
      const visita = await prisma.visita.findUnique({
        where: { id: parseInt(personaId) },
      });

      if (!visita) {
        return NextResponse.json(
          { error: "Visita no encontrada" },
          { status: 404 }
        );
      }

      // Verificar si la visita ya pertenece a otra familia
      if (visita.familiaId && visita.familiaId !== familiaId) {
        const familiaActual = await prisma.familia.findUnique({
          where: { id: visita.familiaId },
          select: { apellido: true, nombre: true },
        });

        return NextResponse.json(
          {
            error: `La visita ya pertenece a la familia ${
              familiaActual?.nombre || `Familia ${familiaActual?.apellido}`
            }`,
          },
          { status: 400 }
        );
      }

      // Agregar visita a la familia
      personaActualizada = await prisma.visita.update({
        where: { id: parseInt(personaId) },
        data: {
          familiaId: familiaId,
          parentescoFamiliar: parentescoFamiliar || null,
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
          fechaPrimeraVisita: true,
          parentescoFamiliar: true,
        },
      });

      return NextResponse.json(
        {
          ...personaActualizada,
          tipo: "visita",
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Error al agregar persona a familia:", error);
    return NextResponse.json(
      { error: "Error al agregar persona a la familia" },
      { status: 500 }
    );
  }
}
