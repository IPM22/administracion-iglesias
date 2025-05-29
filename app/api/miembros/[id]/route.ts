import { prisma } from "../../../../lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const miembroId = parseInt(params.id);

    if (isNaN(miembroId)) {
      return NextResponse.json(
        { error: "ID de miembro inválido" },
        { status: 400 }
      );
    }

    const miembro = await prisma.miembro.findUnique({
      where: {
        id: miembroId,
      },
      include: {
        ministerios: {
          where: {
            estado: "Activo",
          },
          include: {
            ministerio: {
              select: {
                nombre: true,
              },
            },
          },
        },
      },
    });

    if (!miembro) {
      return NextResponse.json(
        { error: "Miembro no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(miembro);
  } catch (error) {
    console.error("Error al obtener miembro:", error);
    return NextResponse.json(
      { error: "Error al obtener el miembro" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const miembroId = parseInt(params.id);

    if (isNaN(miembroId)) {
      return NextResponse.json(
        { error: "ID de miembro inválido" },
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

    // Verificar si ya existe otro miembro con los mismos nombres y apellidos
    const nombresLimpio = nombres.trim().toLowerCase();
    const apellidosLimpio = apellidos.trim().toLowerCase();

    const miembroExistente = await prisma.miembro.findFirst({
      where: {
        AND: [
          {
            nombres: {
              equals: nombresLimpio,
              mode: "insensitive",
            },
          },
          {
            apellidos: {
              equals: apellidosLimpio,
              mode: "insensitive",
            },
          },
          {
            id: {
              not: miembroId,
            },
          },
        ],
      },
    });

    if (miembroExistente) {
      return NextResponse.json(
        {
          error: `Ya existe otro miembro con el nombre ${nombres} ${apellidos}`,
        },
        { status: 409 }
      );
    }

    const miembro = await prisma.miembro.update({
      where: {
        id: miembroId,
      },
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
      include: {
        ministerios: {
          where: {
            estado: "Activo",
          },
          include: {
            ministerio: {
              select: {
                nombre: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(miembro);
  } catch (error) {
    console.error("Error al actualizar miembro:", error);
    return NextResponse.json(
      { error: "Error al actualizar el miembro" },
      { status: 500 }
    );
  }
}
