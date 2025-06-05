import { prisma } from "../../../lib/db";
import { NextRequest, NextResponse } from "next/server";
import { parseDateForAPI } from "@/lib/date-utils";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
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

    // Obtener iglesiaId del query parameter
    const { searchParams } = new URL(request.url);
    const iglesiaIdParam = searchParams.get("iglesiaId");

    let iglesiaId: number;

    if (iglesiaIdParam) {
      // Usar iglesia específica del query parameter
      iglesiaId = parseInt(iglesiaIdParam);

      // Verificar que el usuario tiene acceso a esta iglesia
      const usuarioIglesia = await prisma.usuarioIglesia.findFirst({
        where: {
          usuarioId: user.id,
          iglesiaId: iglesiaId,
          estado: "ACTIVO",
        },
        include: {
          iglesia: true,
        },
      });

      if (!usuarioIglesia) {
        return NextResponse.json(
          { error: "No tienes acceso a esta iglesia" },
          { status: 403 }
        );
      }
    } else {
      // Fallback: obtener cualquier iglesia activa del usuario
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

      iglesiaId = usuarioIglesia.iglesiaId;
    }

    const miembros = await prisma.miembro.findMany({
      where: {
        iglesiaId: iglesiaId,
      },
      orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
    });

    console.log(`🏛️ Filtrando miembros para iglesia ID: ${iglesiaId}`);
    console.log(
      `👥 Se encontraron ${miembros.length} miembros para esta iglesia`
    );

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
      familiaId,
      fechaIngreso,
      fechaBautismo,
      estado,
      foto,
      notasAdicionales,
      parentescoFamiliar,
      fromVisita,
    } = body;

    // Validar campos requeridos
    if (!nombres || !apellidos) {
      return NextResponse.json(
        { error: "Los nombres y apellidos son requeridos" },
        { status: 400 }
      );
    }

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

    // Función para manejar familiaId
    const parseFamiliaId = (id: string) => {
      if (!id || id.trim() === "") {
        return null;
      }
      const parsed = parseInt(id);
      return isNaN(parsed) ? null : parsed;
    };

    // Si viene de conversión de visita, verificar que la visita existe
    let visitaOriginal = null;
    if (fromVisita) {
      const visitaId = parseInt(fromVisita);
      if (!isNaN(visitaId)) {
        visitaOriginal = await prisma.visita.findUnique({
          where: {
            id: visitaId,
            iglesiaId: usuarioIglesia.iglesiaId, // Verificar que la visita pertenece a la misma iglesia
          },
        });

        if (!visitaOriginal) {
          return NextResponse.json(
            { error: "La visita original no fue encontrada" },
            { status: 404 }
          );
        }

        // Verificar que la visita no haya sido ya convertida
        if (visitaOriginal.miembroConvertidoId) {
          return NextResponse.json(
            { error: "Esta visita ya ha sido convertida en miembro" },
            { status: 400 }
          );
        }
      }
    }

    // Verificar si ya existe un miembro con los mismos nombres y apellidos en la misma iglesia
    const nombresLimpio = nombres.trim().toLowerCase();
    const apellidosLimpio = apellidos.trim().toLowerCase();

    const miembroExistente = await prisma.miembro.findFirst({
      where: {
        iglesiaId: usuarioIglesia.iglesiaId,
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

    // Verificar que la familia existe si se proporciona familiaId
    const familiaIdParsed = parseFamiliaId(familiaId);
    if (familiaIdParsed) {
      const familiaExistente = await prisma.familia.findUnique({
        where: {
          id: familiaIdParsed,
          iglesiaId: usuarioIglesia.iglesiaId, // Verificar que la familia pertenece a la misma iglesia
        },
      });

      if (!familiaExistente) {
        return NextResponse.json(
          { error: "La familia seleccionada no existe" },
          { status: 404 }
        );
      }
    }

    // Crear el miembro dentro de una transacción si viene de conversión
    const resultado = await prisma.$transaction(async (tx) => {
      // Crear el miembro
      const nuevoMiembro = await tx.miembro.create({
        data: {
          iglesiaId: usuarioIglesia.iglesiaId, // ¡AGREGAR EL IGLESIAID!
          nombres: nombres?.trim() || "",
          apellidos: apellidos?.trim() || "",
          correo: parseEmail(correo),
          telefono: parseString(telefono),
          celular: parseString(celular),
          direccion: parseString(direccion),
          fechaNacimiento: parseDateForAPI(fechaNacimiento),
          sexo: parseString(sexo),
          estadoCivil: parseString(estadoCivil),
          ocupacion: parseString(ocupacion),
          familiaId: familiaIdParsed,
          fechaIngreso: parseDateForAPI(fechaIngreso),
          fechaBautismo: parseDateForAPI(fechaBautismo),
          estado: parseString(estado) || "Activo",
          foto: parseString(foto),
          notas: parseString(notasAdicionales),
          relacion: parseString(parentescoFamiliar),
        },
      });

      // Si viene de conversión de visita, actualizar la visita
      if (visitaOriginal) {
        await tx.visita.update({
          where: { id: visitaOriginal.id },
          data: {
            estado: "Convertido",
            miembroConvertidoId: nuevoMiembro.id,
          },
        });
      }

      return nuevoMiembro;
    });

    return NextResponse.json(resultado, { status: 201 });
  } catch (error) {
    console.error("Error al crear miembro:", error);
    return NextResponse.json(
      { error: "Error al crear el miembro" },
      { status: 500 }
    );
  }
}
