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
                id: true,
                nombre: true,
                descripcion: true,
              },
            },
          },
        },
        familiares: {
          include: {
            familiar: {
              select: {
                id: true,
                nombres: true,
                apellidos: true,
                foto: true,
              },
            },
          },
        },
        visitaOriginal: true, // Para saber si era una visita convertida
      },
    });

    if (!miembro) {
      return NextResponse.json(
        { error: "Miembro no encontrado" },
        { status: 404 }
      );
    }

    // Obtener visitas invitadas por este miembro
    const visitasInvitadas = await prisma.visita.findMany({
      where: {
        historialVisitas: {
          some: {
            invitadoPorId: miembroId,
          },
        },
        estado: {
          not: "Convertida",
        },
      },
      include: {
        historialVisitas: {
          where: {
            invitadoPorId: miembroId,
          },
          select: {
            id: true,
          },
        },
      },
    });

    // Procesar las visitas invitadas para incluir el total de visitas
    const visitasConTotal = visitasInvitadas.map((visita) => ({
      ...visita,
      totalVisitas: visita.historialVisitas?.length || 0,
      historialVisitas: undefined, // Removemos este campo para no enviarlo
    }));

    const miembroCompleto = {
      ...miembro,
      visitasInvitadas: visitasConTotal,
    };

    return NextResponse.json(miembroCompleto);
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
      foto,
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
        foto: parseString(foto),
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

export async function DELETE(
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

    // Verificar si el miembro existe
    const miembroExistente = await prisma.miembro.findUnique({
      where: {
        id: miembroId,
      },
    });

    if (!miembroExistente) {
      return NextResponse.json(
        { error: "Miembro no encontrado" },
        { status: 404 }
      );
    }

    // Eliminar el miembro
    await prisma.miembro.delete({
      where: {
        id: miembroId,
      },
    });

    return NextResponse.json(
      { message: "Miembro eliminado correctamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al eliminar miembro:", error);
    return NextResponse.json(
      { error: "Error al eliminar el miembro" },
      { status: 500 }
    );
  }
}
