import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Obtener miembros
    const miembros = await prisma.miembro.findMany({
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

    // Obtener visitas que no han sido convertidas a miembros
    const visitas = await prisma.visita.findMany({
      where: {
        estado: { not: "Convertido" },
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

    // Combinar y formatear las personas
    const personas = [
      ...miembros.map((miembro) => ({
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
      ...visitas.map((visita) => ({
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
    personas.sort((a, b) => {
      const apellidoCompare = a.apellidos.localeCompare(b.apellidos);
      if (apellidoCompare !== 0) return apellidoCompare;
      return a.nombres.localeCompare(b.nombres);
    });

    return NextResponse.json(personas);
  } catch (error) {
    console.error("Error al obtener personas:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
