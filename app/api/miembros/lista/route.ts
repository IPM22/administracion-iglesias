import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const miembros = await prisma.miembro.findMany({
      select: {
        id: true,
        nombres: true,
        apellidos: true,
      },
      where: {
        estado: "Activo",
      },
      orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
    });

    return NextResponse.json(miembros);
  } catch (error) {
    console.error("Error al obtener lista de miembros:", error);
    return NextResponse.json(
      { error: "Error al obtener la lista de miembros" },
      { status: 500 }
    );
  }
}
