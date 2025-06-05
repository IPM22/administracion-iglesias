import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export async function GET() {
  try {
    // Obtener todos los miembros para ver el estado de los datos
    const todosLosMiembros = await prisma.miembro.findMany({
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        iglesiaId: true,
      },
      orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
    });

    // Contar miembros por iglesia usando groupBy
    const miembrosPorIglesia = await prisma.miembro.groupBy({
      by: ["iglesiaId"],
      _count: {
        id: true,
      },
    });

    // Obtener información de las iglesias
    const iglesias = await prisma.iglesia.findMany({
      select: {
        id: true,
        nombre: true,
      },
    });

    // Separar miembros con y sin iglesia
    const miembrosConIglesia = todosLosMiembros.filter(
      (m) => m.iglesiaId !== null
    );
    const miembrosSinIglesia = todosLosMiembros.filter(
      (m) => m.iglesiaId === null
    );

    const respuesta = {
      totalMiembros: todosLosMiembros.length,
      miembrosConIglesia: miembrosConIglesia.length,
      miembrosSinIglesia: {
        count: miembrosSinIglesia.length,
        miembros: miembrosSinIglesia.slice(0, 10), // Solo los primeros 10
      },
      miembrosPorIglesia,
      iglesias,
      primeros10Miembros: todosLosMiembros.slice(0, 10),
    };

    return NextResponse.json(respuesta);
  } catch (error) {
    console.error("Error en debug:", error);
    return NextResponse.json(
      { error: "Error en debug", details: error.message },
      { status: 500 }
    );
  }
}
