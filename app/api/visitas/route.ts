import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { parseDateForAPI } from "@/lib/date-utils";
import { createClient } from "@/lib/supabase/server";

// Helper function para manejar strings vacios
function parseString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }
  return value as string;
}

export async function GET() {
  try {
    // Obtener el usuario autenticado
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    // Obtener la iglesia activa del usuario
    const usuarioIglesia = await prisma.usuarioIglesia.findFirst({
      where: {
        usuarioId: user.id,
        estado: "ACTIVO",
      },
      include: {
        iglesia: true,
      },
    });

    if (!usuarioIglesia) {
      return NextResponse.json(
        { error: "No tienes acceso a ninguna iglesia activa" },
        { status: 403 }
      );
    }

    const visitas = await prisma.persona.findMany({
      where: {
        iglesiaId: usuarioIglesia.iglesiaId,
        rol: "VISITA",
      },
      include: {
        historialVisitas: {
          include: {
            tipoActividad: true,
            actividad: true,
          },
          orderBy: {
            fecha: "desc",
          },
        },
        personaConvertida: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
          },
        },
      },
      orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
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
    // Obtener el usuario autenticado
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    // Obtener la iglesia activa del usuario
    const usuarioIglesia = await prisma.usuarioIglesia.findFirst({
      where: {
        usuarioId: user.id,
        estado: "ACTIVO",
      },
      include: {
        iglesia: true,
      },
    });

    if (!usuarioIglesia) {
      return NextResponse.json(
        { error: "No tienes acceso a ninguna iglesia activa" },
        { status: 403 }
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

    const nuevaVisita = await prisma.persona.create({
      data: {
        iglesiaId: usuarioIglesia.iglesiaId,
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        correo: parseString(correo),
        telefono: parseString(telefono),
        celular: parseString(celular),
        direccion: parseString(direccion),
        fechaNacimiento: parseDateForAPI(fechaNacimiento as string),
        sexo: parseString(sexo),
        estadoCivil: parseString(estadoCivil),
        ocupacion: parseString(ocupacion),
        foto: parseString(foto),
        notas: parseString(notasAdicionales),
        fechaPrimeraVisita: parseDateForAPI(fechaPrimeraVisita as string),
        rol: "VISITA",
        estado: "NUEVA",
        tipo: "ADULTO",
      },
    });

    return NextResponse.json(nuevaVisita, { status: 201 });
  } catch (error: unknown) {
    console.error("Error al crear visita:", error);

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
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
