import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db";

// GET - Obtener personas disponibles (miembros y visitas sin familia asignada)
export async function GET(
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

    // Obtener miembros sin familia asignada
    const miembrosSinFamilia = await prisma.miembro.findMany({
      where: {
        OR: [{ familiaId: null }, { familiaId: { equals: null } }],
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

    // Obtener visitas sin familia asignada
    const visitasSinFamilia = await prisma.visita.findMany({
      where: {
        OR: [{ familiaId: null }, { familiaId: { equals: null } }],
        estado: { not: "Convertido" }, // Excluir visitas ya convertidas a miembros
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

    // Combinar y formatear los resultados
    const personasDisponibles = [
      // Miembros
      ...miembrosSinFamilia.map((miembro) => ({
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
      // Visitas
      ...visitasSinFamilia.map((visita) => ({
        id: visita.id,
        nombres: visita.nombres,
        apellidos: visita.apellidos,
        correo: visita.correo,
        telefono: visita.telefono,
        celular: visita.celular,
        foto: visita.foto,
        estado: visita.estado || "Activa",
        tipo: "visita" as const,
        fechaPrimeraVisita: visita.fechaPrimeraVisita,
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
      { error: "Error al obtener personas disponibles" },
      { status: 500 }
    );
  }
}
