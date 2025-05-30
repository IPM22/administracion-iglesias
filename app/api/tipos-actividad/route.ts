import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const tiposActividad = await prisma.tipoActividad.findMany({
      where: {
        esActivo: true,
      },
      orderBy: {
        nombre: "asc",
      },
    });

    return NextResponse.json(tiposActividad);
  } catch (error) {
    console.error("Error al obtener tipos de actividad:", error);
    return NextResponse.json(
      { error: "Error al obtener los tipos de actividad" },
      { status: 500 }
    );
  }
}
