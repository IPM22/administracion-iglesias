import { prisma } from "../../../lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getUserContext, requireAuth } from "../../../lib/auth-utils";

export async function GET(request: NextRequest) {
  try {
    // Obtener contexto del usuario autenticado
    const userContext = await getUserContext(request);
    const { iglesiaId } = requireAuth(userContext);

    console.log("🏛️ Filtrando personas para iglesia ID:", iglesiaId);

    const personas = await prisma.persona.findMany({
      where: {
        iglesiaId,
        estado: "ACTIVA", // Solo personas activas
      },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        foto: true,
        correo: true,
        telefono: true,
        celular: true,
        estado: true,
        tipo: true,
        rol: true,
      },
      orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
    });

    console.log(
      "👥 Se encontraron",
      personas.length,
      "personas para esta iglesia"
    );

    return NextResponse.json(personas);
  } catch (error) {
    console.error("Error al obtener personas:", error);

    if (error instanceof Error && error.message === "Usuario no autenticado") {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Error al obtener las personas" },
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
      estadoCivil,
      ocupacion,
      notas,
      fechaIngreso,
      fechaBautismo,
      fechaConfirmacion,
      familiaId,
      relacion,
    } = body;

    // Validaciones básicas
    if (!nombres || !apellidos) {
      return NextResponse.json(
        { error: "Nombres y apellidos son requeridos" },
        { status: 400 }
      );
    }

    // Verificar si ya existe una persona con el mismo correo en esta iglesia
    if (correo) {
      const personaExistente = await prisma.persona.findFirst({
        where: {
          correo,
          iglesiaId,
        },
      });

      if (personaExistente) {
        return NextResponse.json(
          { error: "Ya existe una persona con ese correo electrónico" },
          { status: 409 }
        );
      }
    }

    const nuevaPersona = await prisma.persona.create({
      data: {
        iglesiaId, // ✅ Asignar automáticamente la iglesia del usuario
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        correo: correo?.trim() || null,
        telefono: telefono?.trim() || null,
        celular: celular?.trim() || null,
        direccion: direccion?.trim() || null,
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
        sexo: sexo?.trim() || null,
        estadoCivil: estadoCivil?.trim() || null,
        ocupacion: ocupacion?.trim() || null,
        notas: notas?.trim() || null,
        fechaIngreso: fechaIngreso ? new Date(fechaIngreso) : new Date(),
        fechaBautismo: fechaBautismo ? new Date(fechaBautismo) : null,
        fechaConfirmacion: fechaConfirmacion
          ? new Date(fechaConfirmacion)
          : null,
        familiaId: familiaId ? parseInt(familiaId) : null,
        relacionFamiliar: relacion?.trim() || null,
      },
    });

    return NextResponse.json(nuevaPersona, { status: 201 });
  } catch (error) {
    console.error("Error al crear persona:", error);

    if (error instanceof Error && error.message === "Usuario no autenticado") {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Error al crear la persona" },
      { status: 500 }
    );
  }
}
