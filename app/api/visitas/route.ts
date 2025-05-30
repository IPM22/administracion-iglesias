import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper function para manejar strings vacios
function parseString(value: any): string | undefined {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }
  return value;
}

// Helper function para manejar fechas
function parseDate(value: any): Date | undefined {
  if (!value || (typeof value === "string" && value.trim() === "")) {
    return undefined;
  }
  return new Date(value);
}

export async function GET() {
  try {
    const visitas = await prisma.visita.findMany({
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(visitas);
  } catch (error) {
    console.error("Error al obtener visitas:", error);
    return NextResponse.json(
      { error: "Error al obtener las visitas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const nuevaVisita = await prisma.visita.create({
      data: {
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        correo: parseString(correo),
        telefono: parseString(telefono),
        celular: parseString(celular),
        direccion: parseString(direccion),
        fechaNacimiento: parseDate(fechaNacimiento),
        sexo: parseString(sexo),
        estadoCivil: parseString(estadoCivil),
        ocupacion: parseString(ocupacion),
        familia: parseString(familia),
        estado: parseString(estado) || "Activa",
        foto: parseString(foto),
        notasAdicionales: parseString(notasAdicionales),
        fechaPrimeraVisita: parseDate(fechaPrimeraVisita),
      },
    });

    return NextResponse.json(nuevaVisita, { status: 201 });
  } catch (error: any) {
    console.error("Error al crear visita:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe una visita con ese correo electrónico" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al crear la visita" },
      { status: 500 }
    );
  }
}
