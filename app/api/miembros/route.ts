import { prisma } from "../../../lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const miembros = await prisma.miembro.findMany({
      orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
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
          where: { id: visitaId },
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

    // Verificar que la familia existe si se proporciona familiaId
    const familiaIdParsed = parseFamiliaId(familiaId);
    if (familiaIdParsed) {
      const familiaExistente = await prisma.familia.findUnique({
        where: { id: familiaIdParsed },
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
          familiaId: familiaIdParsed,
          fechaIngreso: parseDate(fechaIngreso),
          fechaBautismo: parseDate(fechaBautismo),
          estado: parseString(estado) || "Activo",
          foto: parseString(foto),
          notasAdicionales: parseString(notasAdicionales),
          parentescoFamiliar: parseString(parentescoFamiliar),
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
