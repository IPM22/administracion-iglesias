import { prisma } from "../../../lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const miembros = await prisma.miembro.findMany({
      orderBy: {
        apellidos: "asc",
      },
    });

    return NextResponse.json(miembros);
  } catch (error) {
    console.error("Error al obtener miembros:", error);
    return NextResponse.json(
      { error: "Error al obtener los miembros" },
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
      fechaIngreso,
      fechaBautismo,
      estado,
      notasAdicionales,
    } = body;

    // Validar campos requeridos
    if (!nombres || !apellidos) {
      return NextResponse.json(
        { error: "Los nombres y apellidos son requeridos" },
        { status: 400 }
      );
    }

    // Función para manejar fechas vacías
    const parseDate = (dateString: string) => {
      if (!dateString || dateString.trim() === "") {
        return null;
      }
      return new Date(dateString);
    };

    // Función para manejar strings vacías
    const parseString = (value: string) => {
      if (!value || value.trim() === "") {
        return null;
      }
      return value.trim();
    };

    // Función especial para el correo (debe ser null si está vacío debido a la restricción unique)
    const parseEmail = (email: string) => {
      if (!email || email.trim() === "") {
        return null;
      }
      return email.trim();
    };

    // Verificar si ya existe un miembro con los mismos nombres y apellidos
    const nombresLimpio = nombres.trim().toLowerCase();
    const apellidosLimpio = apellidos.trim().toLowerCase();

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
        { error: `Ya existe un miembro con el nombre ${nombres} ${apellidos}` },
        { status: 409 }
      );
    }

    const nuevoMiembro = await prisma.miembro.create({
      data: {
        nombres: nombres?.trim() || "",
        apellidos: apellidos?.trim() || "",
        correo: parseEmail(correo),
        telefono: parseString(telefono),
        celular: parseString(celular),
        direccion: parseString(direccion),
        fechaNacimiento: parseDate(fechaNacimiento),
        sexo: parseString(sexo),
        estadoCivil: parseString(estadoCivil),
        ocupacion: parseString(ocupacion),
        familia: parseString(familia),
        fechaIngreso: parseDate(fechaIngreso),
        fechaBautismo: parseDate(fechaBautismo),
        estado: parseString(estado) || "Activo",
        notasAdicionales: parseString(notasAdicionales),
      },
    });

    return NextResponse.json(nuevoMiembro, { status: 201 });
  } catch (error) {
    console.error("Error al crear miembro:", error);
    return NextResponse.json(
      { error: "Error al crear el miembro" },
      { status: 500 }
    );
  }
}
