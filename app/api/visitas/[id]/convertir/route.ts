import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db";

// Helper function para manejar strings vacías
function parseString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }
  return value as string;
}

export async function POST(
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

    // Verificar que la visita existe
    const visita = await prisma.visita.findUnique({
      where: { id: visitaId },
    });

    if (!visita) {
      return NextResponse.json(
        { error: "Visita no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que la visita no haya sido ya convertida
    if (visita.miembroConvertidoId) {
      return NextResponse.json(
        { error: "Esta visita ya ha sido convertida en miembro" },
        { status: 400 }
      );
    }

    // Verificar si ya existe un miembro con los mismos nombres y apellidos
    const nombresLimpio = visita.nombres.trim().toLowerCase();
    const apellidosLimpio = visita.apellidos.trim().toLowerCase();

    const miembroExistente = await prisma.miembro.findFirst({
      where: {
        nombres: {
          equals: nombresLimpio,
          mode: "insensitive",
        },
        apellidos: {
          equals: apellidosLimpio,
          mode: "insensitive",
        },
      },
    });

    if (miembroExistente) {
      return NextResponse.json(
        {
          error: `Ya existe un miembro con el nombre ${visita.nombres} ${visita.apellidos}. ID del miembro: ${miembroExistente.id}`,
        },
        { status: 409 }
      );
    }

    // Realizar la conversión dentro de una transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // Crear el miembro con los datos de la visita
      const nuevoMiembro = await tx.miembro.create({
        data: {
          nombres: visita.nombres.trim(),
          apellidos: visita.apellidos.trim(),
          correo: parseString(visita.correo),
          telefono: parseString(visita.telefono),
          celular: parseString(visita.celular),
          direccion: parseString(visita.direccion),
          fechaNacimiento: visita.fechaNacimiento
            ? new Date(visita.fechaNacimiento)
            : null,
          sexo: parseString(visita.sexo),
          estadoCivil: parseString(visita.estadoCivil),
          ocupacion: parseString(visita.ocupacion),
          familia: parseString(visita.familia),
          familiaId: visita.familiaId, // Mantener la familia si existe
          foto: parseString(visita.foto),
          notasAdicionales: parseString(visita.notasAdicionales),
          parentescoFamiliar: parseString(visita.parentescoFamiliar),
          estado: "Nuevo", // Estado inicial para nuevo miembro
          fechaIngreso: new Date(), // Fecha actual como fecha de ingreso
          // No establecer fechaBautismo automáticamente
        },
      });

      // Actualizar la visita para marcarla como convertida
      await tx.visita.update({
        where: { id: visitaId },
        data: {
          estado: "Convertido",
          miembroConvertidoId: nuevoMiembro.id,
        },
      });

      return nuevoMiembro;
    });

    return NextResponse.json(
      {
        message: "Visita convertida exitosamente",
        miembro: resultado,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al convertir visita:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al convertir la visita" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
