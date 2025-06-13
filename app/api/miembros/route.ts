import { prisma } from "../../../lib/db";
import { NextRequest, NextResponse } from "next/server";
import {
  getUserContext,
  requireAuth,
  createIglesiaFilter,
} from "../../../lib/auth-utils";

export async function GET(request: NextRequest) {
  try {
    // Obtener contexto del usuario autenticado
    const userContext = await getUserContext(request);
    const { iglesiaId } = requireAuth(userContext);

    console.log("🏛️ Filtrando miembros para iglesia ID:", iglesiaId);

    const miembros = await prisma.miembro.findMany({
      where: createIglesiaFilter(iglesiaId),
      orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
    });

    console.log(
      "👥 Se encontraron",
      miembros.length,
      "miembros para esta iglesia"
    );

    return NextResponse.json(miembros);
  } catch (error) {
    console.error("Error al obtener miembros:", error);

    if (error instanceof Error && error.message === "Usuario no autenticado") {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Error al obtener los miembros" },
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
      estado = "Activo",
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

    // Verificar si ya existe un miembro con el mismo correo en esta iglesia
    if (correo) {
      const miembroExistente = await prisma.miembro.findFirst({
        where: {
          correo,
          iglesiaId,
        },
      });

      if (miembroExistente) {
        return NextResponse.json(
          { error: "Ya existe un miembro con ese correo electrónico" },
          { status: 409 }
        );
      }
    }

    const nuevoMiembro = await prisma.miembro.create({
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
        estado,
        familiaId: familiaId ? parseInt(familiaId) : null,
        relacion: relacion?.trim() || null,
      },
    });

    return NextResponse.json(nuevoMiembro, { status: 201 });
  } catch (error) {
    console.error("Error al crear miembro:", error);

    if (error instanceof Error && error.message === "Usuario no autenticado") {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Error al crear el miembro" },
      { status: 500 }
    );
  }
}
