import { prisma } from "../../../lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getUserContext, requireAuth } from "../../../lib/auth-utils";

// Helper function para manejar strings vacios
function parseString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }
  return value as string;
}

export async function GET(request: NextRequest) {
  try {
    // Obtener contexto del usuario autenticado
    const userContext = await getUserContext(request);
    const { iglesiaId } = requireAuth(userContext);

    const ninos = await prisma.persona.findMany({
      where: {
        iglesiaId,
        OR: [
          { rol: "NINO" },
          {
            AND: [{ tipo: "NINO" }, { estado: "ACTIVA" }],
          },
        ],
      },
      orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
    });

    return NextResponse.json(ninos);
  } catch (error) {
    console.error("Error al obtener niños:", error);

    if (error instanceof Error && error.message === "Usuario no autenticado") {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Error al obtener los niños" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Obtener contexto del usuario autenticado
    const userContext = await getUserContext(request);
    const { iglesiaId } = requireAuth(userContext);

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
      ocupacion,
      foto,
      notasAdicionales,
      tutorLegal,
    } = body;

    // Validaciones básicas
    if (!nombres || !apellidos) {
      return NextResponse.json(
        { error: "Nombres y apellidos son requeridos" },
        { status: 400 }
      );
    }

    // Calcular edad si hay fecha de nacimiento
    let edad: number | null = null;
    let esNinoMenorDe10 = true;

    if (fechaNacimiento) {
      const hoy = new Date();
      const fechaNac = new Date(fechaNacimiento);
      edad = hoy.getFullYear() - fechaNac.getFullYear();
      const mesActual = hoy.getMonth();
      const diaActual = hoy.getDate();
      const mesNacimiento = fechaNac.getMonth();
      const diaNacimiento = fechaNac.getDate();

      // Ajustar edad si aún no ha cumplido años este año
      if (
        mesActual < mesNacimiento ||
        (mesActual === mesNacimiento && diaActual < diaNacimiento)
      ) {
        edad--;
      }

      esNinoMenorDe10 = edad < 10;
    }

    // Determinar tipo, rol y estado según la edad
    const tipoPersona = esNinoMenorDe10
      ? "NINO"
      : edad && edad < 18
      ? "ADOLESCENTE"
      : "JOVEN";
    const rolPersona = esNinoMenorDe10 ? "NINO" : "VISITA";
    const estadoPersona = esNinoMenorDe10 ? "ACTIVA" : "RECURRENTE";

    const nuevoNino = await prisma.persona.create({
      data: {
        iglesiaId,
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        correo: parseString(correo),
        telefono: parseString(telefono),
        celular: parseString(celular),
        direccion: parseString(direccion),
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
        sexo: parseString(sexo),
        ocupacion: parseString(ocupacion), // Para niños puede ser el grado escolar
        foto: parseString(foto),
        notas: parseString(notasAdicionales),
        // Información específica para niños
        relacionFamiliar: parseString(tutorLegal),
        // Establecer tipo, rol y estado según las reglas de negocio
        tipo: tipoPersona,
        rol: rolPersona,
        estado: estadoPersona,
      },
    });

    return NextResponse.json(nuevoNino, { status: 201 });
  } catch (error: unknown) {
    console.error("Error al crear niño:", error);

    if (error instanceof Error && error.message === "Usuario no autenticado") {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ya existe un niño con ese correo electrónico" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al crear el niño" },
      { status: 500 }
    );
  }
}
