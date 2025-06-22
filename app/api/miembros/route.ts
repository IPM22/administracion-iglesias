import { prisma } from "../../../lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getUserContext, requireAuth } from "../../../lib/auth-utils";
import { TipoPersona, RolPersona, EstadoPersona } from "@prisma/client";

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
        rol: "MIEMBRO", // ✅ Solo personas con rol MIEMBRO
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
      // Nuevos campos para determinar tipo y rol
      tipo,
      rol,
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

    // Determinar tipo, rol y estado apropiados
    let tipoPersona: TipoPersona = TipoPersona.ADULTO; // Por defecto
    let rolPersona: RolPersona = RolPersona.MIEMBRO; // Por defecto
    let estadoPersona: EstadoPersona = EstadoPersona.ACTIVA; // Por defecto

    // Calcular edad si hay fecha de nacimiento
    let edad: number | null = null;
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
    }

    // Si se especifica tipo en el cuerpo del request, usarlo
    if (tipo) {
      switch (tipo.toLowerCase()) {
        case "adolescente":
          tipoPersona = TipoPersona.ADOLESCENTE;
          rolPersona = RolPersona.MIEMBRO; // Los adolescentes también pueden ser miembros
          estadoPersona = EstadoPersona.ACTIVA;
          break;
        case "joven":
          tipoPersona = TipoPersona.JOVEN;
          rolPersona = RolPersona.MIEMBRO;
          estadoPersona = EstadoPersona.ACTIVA;
          break;
        case "adulto":
          tipoPersona = TipoPersona.ADULTO;
          rolPersona = RolPersona.MIEMBRO;
          estadoPersona = EstadoPersona.ACTIVA;
          break;
        case "adulto_mayor":
          tipoPersona = TipoPersona.ADULTO_MAYOR;
          rolPersona = RolPersona.MIEMBRO;
          estadoPersona = EstadoPersona.ACTIVA;
          break;
        case "envejeciente":
          tipoPersona = TipoPersona.ENVEJECIENTE;
          rolPersona = RolPersona.MIEMBRO;
          estadoPersona = EstadoPersona.ACTIVA;
          break;
        default:
          // Determinar por fecha de nacimiento si está disponible
          if (edad !== null) {
            if (edad < 18) {
              tipoPersona = TipoPersona.ADOLESCENTE;
              rolPersona = RolPersona.MIEMBRO;
              estadoPersona = EstadoPersona.ACTIVA;
            } else if (edad < 30) {
              tipoPersona = TipoPersona.JOVEN;
              rolPersona = RolPersona.MIEMBRO;
              estadoPersona = EstadoPersona.ACTIVA;
            } else if (edad < 65) {
              tipoPersona = TipoPersona.ADULTO;
              rolPersona = RolPersona.MIEMBRO;
              estadoPersona = EstadoPersona.ACTIVA;
            } else {
              tipoPersona = TipoPersona.ADULTO_MAYOR;
              rolPersona = RolPersona.MIEMBRO;
              estadoPersona = EstadoPersona.ACTIVA;
            }
          }
      }
    } else if (edad !== null) {
      // Si no se especifica tipo, determinar por fecha de nacimiento
      if (edad < 18) {
        tipoPersona = TipoPersona.ADOLESCENTE;
        rolPersona = RolPersona.MIEMBRO;
        estadoPersona = EstadoPersona.ACTIVA;
      } else if (edad < 30) {
        tipoPersona = TipoPersona.JOVEN;
        rolPersona = RolPersona.MIEMBRO;
        estadoPersona = EstadoPersona.ACTIVA;
      } else if (edad < 65) {
        tipoPersona = TipoPersona.ADULTO;
        rolPersona = RolPersona.MIEMBRO;
        estadoPersona = EstadoPersona.ACTIVA;
      } else {
        tipoPersona = TipoPersona.ADULTO_MAYOR;
        rolPersona = RolPersona.MIEMBRO;
        estadoPersona = EstadoPersona.ACTIVA;
      }
    }

    // Si se especifica rol explícitamente, usarlo (pero solo valores válidos para miembros)
    if (rol) {
      switch (rol.toLowerCase()) {
        case "miembro":
          rolPersona = RolPersona.MIEMBRO;
          break;
        case "visita":
          rolPersona = RolPersona.VISITA;
          estadoPersona = EstadoPersona.NUEVA;
          break;
        case "invitado":
          rolPersona = RolPersona.INVITADO;
          break;
        default:
          // Por defecto miembro
          rolPersona = RolPersona.MIEMBRO;
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
        // ✅ Establecer tipo, rol y estado correctamente
        tipo: tipoPersona,
        rol: rolPersona,
        estado: estadoPersona,
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
