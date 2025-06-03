import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - Obtener personas disponibles (miembros y visitas sin familia asignada)
export async function GET(
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

    // Obtener miembros que no pertenecen a esta familia
    const miembrosDisponibles = await prisma.miembro.findMany({
      where: {
        OR: [{ familiaId: null }, { familiaId: { not: familiaId } }],
      },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        correo: true,
        telefono: true,
        celular: true,
        foto: true,
        estado: true,
        fechaBautismo: true,
      },
      orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
    });

    // Obtener visitas que no pertenecen a esta familia y no han sido convertidas
    const visitasDisponibles = await prisma.visita.findMany({
      where: {
        estado: { not: "Convertido" },
        OR: [{ familiaId: null }, { familiaId: { not: familiaId } }],
      },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        correo: true,
        telefono: true,
        celular: true,
        foto: true,
        estado: true,
        fechaPrimeraVisita: true,
      },
      orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
    });

    // Combinar y formatear las personas disponibles
    const personasDisponibles = [
      ...miembrosDisponibles.map((miembro) => ({
        id: miembro.id,
        nombres: miembro.nombres,
        apellidos: miembro.apellidos,
        correo: miembro.correo,
        telefono: miembro.telefono,
        celular: miembro.celular,
        foto: miembro.foto,
        estado: miembro.estado || "Activo",
        tipo: "miembro" as const,
        fechaBautismo: miembro.fechaBautismo,
      })),
      ...visitasDisponibles.map((visita) => ({
        id: visita.id,
        nombres: visita.nombres,
        apellidos: visita.apellidos,
        correo: visita.correo,
        telefono: visita.telefono,
        celular: visita.celular,
        foto: visita.foto,
        estado: visita.estado || "Nuevo",
        tipo: "visita" as const,
        fechaBautismo: null,
      })),
    ];

    // Ordenar por apellido y nombre
    personasDisponibles.sort((a, b) => {
      const apellidoCompare = a.apellidos.localeCompare(b.apellidos);
      if (apellidoCompare !== 0) return apellidoCompare;
      return a.nombres.localeCompare(b.nombres);
    });

    return NextResponse.json(personasDisponibles);
  } catch (error) {
    console.error("Error al obtener personas disponibles:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
