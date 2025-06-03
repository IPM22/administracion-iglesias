import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { parseDateForAPI } from "@/lib/date-utils";

// Helper function para manejar strings vacios
function parseString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }
  return value as string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const visitaId = parseInt(id);

    if (isNaN(visitaId)) {
      return NextResponse.json(
        { error: "ID de visita inválido" },
        { status: 400 }
      );
    }

    const visita = await prisma.visita.findUnique({
      where: { id: visitaId },
      include: {
        historialVisitas: {
          include: {
            tipoActividad: true,
            actividad: true,
            invitadoPor: {
              select: {
                id: true,
                nombres: true,
                apellidos: true,
              },
            },
          },
          orderBy: {
            fecha: "desc",
          },
        },
        miembroConvertido: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
          },
        },
      },
    });

    if (!visita) {
      return NextResponse.json(
        { error: "Visita no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(visita);
  } catch (error) {
    console.error("Error al obtener visita:", error);
    return NextResponse.json(
      { error: "Error al obtener la visita" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const visitaId = parseInt(id);

    if (isNaN(visitaId)) {
      return NextResponse.json(
        { error: "ID de visita inválido" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      nombres,
      apellidos,
      correo,
      telefono,
      celular,
      direccion,
      fechaNacimiento,
      sexo,
      estadoCivil,
      ocupacion,
      familia,
      estado,
      foto,
      notasAdicionales,
      fechaPrimeraVisita,
    } = body;

    // Validaciones básicas
    if (!nombres || !apellidos) {
      return NextResponse.json(
        { error: "Nombres y apellidos son requeridos" },
        { status: 400 }
      );
    }

    const visitaActualizada = await prisma.visita.update({
      where: { id: visitaId },
      data: {
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        correo: parseString(correo),
        telefono: parseString(telefono),
        celular: parseString(celular),
        direccion: parseString(direccion),
        fechaNacimiento: parseDateForAPI(fechaNacimiento as string),
        sexo: parseString(sexo),
        estadoCivil: parseString(estadoCivil),
        ocupacion: parseString(ocupacion),
        familia: parseString(familia),
        estado: parseString(estado),
        foto: parseString(foto),
        notasAdicionales: parseString(notasAdicionales),
        fechaPrimeraVisita: parseDateForAPI(fechaPrimeraVisita as string),
      },
    });

    return NextResponse.json(visitaActualizada);
  } catch (error: unknown) {
    console.error("Error al actualizar visita:", error);

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ya existe una visita con ese correo electrónico" },
        { status: 400 }
      );
    }

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Visita no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Error al actualizar la visita" },
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
    const visitaId = parseInt(id);

    if (isNaN(visitaId)) {
      return NextResponse.json(
        { error: "ID de visita inválido" },
        { status: 400 }
      );
    }

    await prisma.visita.delete({
      where: { id: visitaId },
    });

    return NextResponse.json({ message: "Visita eliminada correctamente" });
  } catch (error: unknown) {
    console.error("Error al eliminar visita:", error);

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Visita no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Error al eliminar la visita" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const visitaId = parseInt(id);

    if (isNaN(visitaId)) {
      return NextResponse.json(
        { error: "ID de visita inválido" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { familiaId, parentescoFamiliar } = body;

    // Verificar que la visita existe
    const visitaExistente = await prisma.visita.findUnique({
      where: { id: visitaId },
    });

    if (!visitaExistente) {
      return NextResponse.json(
        { error: "Visita no encontrada" },
        { status: 404 }
      );
    }

    // Actualizar solo los campos proporcionados
    const dataToUpdate: {
      familiaId?: number | null;
      parentescoFamiliar?: string | null;
    } = {};

    if (familiaId !== undefined) {
      dataToUpdate.familiaId = familiaId;
    }

    if (parentescoFamiliar !== undefined) {
      dataToUpdate.parentescoFamiliar = parentescoFamiliar;
    }

    const visitaActualizada = await prisma.visita.update({
      where: { id: visitaId },
      data: dataToUpdate,
    });

    return NextResponse.json(visitaActualizada);
  } catch (error) {
    console.error("Error al actualizar visita:", error);
    return NextResponse.json(
      { error: "Error al actualizar la visita" },
      { status: 500 }
    );
  }
}
