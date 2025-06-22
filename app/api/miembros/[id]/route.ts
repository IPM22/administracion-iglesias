import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserContext, requireAuth } from "../../../../lib/auth-utils";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const miembroId = parseInt(id);

  try {
    // Obtener contexto del usuario autenticado
    const userContext = await getUserContext(request);
    const { iglesiaId } = requireAuth(userContext);

    if (isNaN(miembroId)) {
      return NextResponse.json(
        { error: "ID de miembro inválido" },
        { status: 400 }
      );
    }

    const persona = await prisma.persona.findUnique({
      where: {
        id: miembroId,
        iglesiaId, // ✅ Verificar que la persona pertenece a la iglesia del usuario
      },
      include: {
        familia: true,
        personaInvita: true,
        personaConvertida: true,
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
          orderBy: {
            fechaInicio: "desc",
          },
        },
      },
    });

    if (!persona) {
      return NextResponse.json(
        { error: "Persona no encontrada" },
        { status: 404 }
      );
    }

    // Obtener familiares de la persona
    const familiares = await prisma.familiar.findMany({
      where: {
        personaId: persona.id,
      },
      orderBy: [{ relacion: "asc" }],
    });

    // Obtener personas invitadas por esta persona
    const personasInvitadas = await prisma.persona.findMany({
      where: {
        personaInvitaId: persona.id,
        iglesiaId, // ✅ También filtrar personas por iglesia
      },
      orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
    });

    // Formatear los datos para el frontend (compatible con la interfaz existente)
    const personaCompleta = {
      ...persona,
      // Mapear los ministerios
      ministerios: persona.ministerios.map((m) => ({
        id: m.id,
        ministerio: m.ministerio,
        rol: m.rol || m.cargo,
        fechaInicio: m.fechaInicio?.toISOString(),
        fechaFin: m.fechaFin?.toISOString(),
        esLider: m.esLider,
      })),

      // Mapear los familiares usando los campos correctos del modelo
      familiares: familiares.map((f) => ({
        id: f.id.toString(),
        familiar: {
          id: f.personaRelacionadaId || 0,
          nombres: f.nombres || "",
          apellidos: f.apellidos || "",
          foto: null, // Los familiares no tienen foto en este modelo
          estado: f.esMiembro ? "Activo" : "No Miembro",
        },
        tipoRelacion: f.relacion || "",
        fuente: "directa" as const,
      })),

      // Mapear las personas invitadas
      visitasInvitadas: personasInvitadas.map((p) => ({
        id: p.id,
        nombres: p.nombres || "",
        apellidos: p.apellidos || "",
        foto: p.foto || null,
        totalVisitas: 1, // Simplificado por ahora
        fechaPrimeraVisita: p.fechaPrimeraVisita?.toISOString(),
        estado: p.estado || "ACTIVA",
      })),

      // Compatibilidad con campos esperados
      notasAdicionales: persona.notas,
    };

    console.log(
      `🔍 DEBUG API - Persona ${persona.id} cargada con ${familiares.length} familiares y ${personasInvitadas.length} personas invitadas`
    );

    return NextResponse.json(personaCompleta);
  } catch (error) {
    console.error("Error al obtener persona:", error);
    console.error(
      "Stack trace:",
      error instanceof Error ? error.stack : "No disponible"
    );

    if (error instanceof Error && error.message === "Usuario no autenticado") {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Error al obtener la persona" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const miembroId = parseInt(id);

  try {
    // Obtener contexto del usuario autenticado
    const userContext = await getUserContext(request);
    const { iglesiaId } = requireAuth(userContext);

    if (isNaN(miembroId)) {
      return NextResponse.json(
        { error: "ID de miembro inválido" },
        { status: 400 }
      );
    }

    // Verificar que el miembro existe y pertenece a la iglesia del usuario
    const miembroExistente = await prisma.persona.findUnique({
      where: {
        id: miembroId,
        iglesiaId,
      },
    });

    if (!miembroExistente) {
      return NextResponse.json(
        { error: "Miembro no encontrado" },
        { status: 404 }
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
      fechaIngreso,
      fechaBautismo,
      notasAdicionales,
    } = body;

    // Función para parsear strings a Date, con manejo de errores
    const parseString = (value: string) => {
      return value && value.trim() !== "" ? value.trim() : undefined;
    };

    // Función para parsear emails con validación básica
    const parseEmail = (email: string) => {
      const cleanEmail = parseString(email);
      if (!cleanEmail) return undefined;

      // Validación básica de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(cleanEmail) ? cleanEmail : undefined;
    };

    // Función para parsear fechas desde string
    const parseDate = (dateString: string) => {
      if (!dateString) return undefined;
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? undefined : date;
    };

    // Preparar datos para actualización
    const dataToUpdate = {
      nombres: parseString(nombres) || miembroExistente.nombres,
      apellidos: parseString(apellidos) || miembroExistente.apellidos,
      correo: parseEmail(correo) || miembroExistente.correo,
      telefono: parseString(telefono) || miembroExistente.telefono,
      celular: parseString(celular) || miembroExistente.celular,
      direccion: parseString(direccion) || miembroExistente.direccion,
      sexo: parseString(sexo) || miembroExistente.sexo,
      estadoCivil: parseString(estadoCivil) || miembroExistente.estadoCivil,
      ocupacion: parseString(ocupacion) || miembroExistente.ocupacion,
      foto: parseString(foto) || miembroExistente.foto,
      notas: parseString(notasAdicionales) || miembroExistente.notas,
      fechaNacimiento:
        parseDate(fechaNacimiento) || miembroExistente.fechaNacimiento,
      fechaIngreso: parseDate(fechaIngreso) || miembroExistente.fechaIngreso,
      fechaBautismo: parseDate(fechaBautismo) || miembroExistente.fechaBautismo,
      updatedAt: new Date(),
    };

    const personaActualizada = await prisma.persona.update({
      where: { id: miembroId },
      data: dataToUpdate,
    });

    return NextResponse.json(personaActualizada);
  } catch (error) {
    console.error("Error al actualizar persona:", error);

    if (error instanceof Error && error.message === "Usuario no autenticado") {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Error al actualizar la persona" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Obtener contexto del usuario autenticado
    const userContext = await getUserContext(request);
    const { iglesiaId } = requireAuth(userContext);

    const { id } = await params;
    const miembroId = parseInt(id);

    if (isNaN(miembroId)) {
      return NextResponse.json(
        { error: "ID de miembro inválido" },
        { status: 400 }
      );
    }

    // Verificar que el miembro existe y pertenece a la iglesia del usuario
    const persona = await prisma.persona.findUnique({
      where: {
        id: miembroId,
        iglesiaId,
      },
    });

    if (!persona) {
      return NextResponse.json(
        { error: "Miembro no encontrado" },
        { status: 404 }
      );
    }

    await prisma.persona.delete({
      where: { id: miembroId },
    });

    return NextResponse.json({ message: "Miembro eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar persona:", error);

    if (error instanceof Error && error.message === "Usuario no autenticado") {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Error al eliminar la persona" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Obtener contexto del usuario autenticado
    const userContext = await getUserContext(request);
    const { iglesiaId } = requireAuth(userContext);

    const { id } = await params;
    const miembroId = parseInt(id);

    if (isNaN(miembroId)) {
      return NextResponse.json(
        { error: "ID de miembro inválido" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { familiaId, parentescoFamiliar } = body;

    // Verificar que el miembro existe y pertenece a la iglesia del usuario
    const personaExistente = await prisma.persona.findUnique({
      where: {
        id: miembroId,
        iglesiaId,
      },
    });

    if (!personaExistente) {
      return NextResponse.json(
        { error: "Miembro no encontrado" },
        { status: 404 }
      );
    }

    // Actualizar solo los campos proporcionados
    const dataToUpdate: {
      familiaId?: number | null;
      relacion?: string | null;
    } = {};

    if (familiaId !== undefined) {
      dataToUpdate.familiaId = familiaId;
    }

    if (parentescoFamiliar !== undefined) {
      dataToUpdate.relacion = parentescoFamiliar;
    }

    const personaActualizada = await prisma.persona.update({
      where: { id: miembroId },
      data: dataToUpdate,
    });

    return NextResponse.json(personaActualizada);
  } catch (error) {
    console.error("Error al actualizar persona:", error);

    if (error instanceof Error && error.message === "Usuario no autenticado") {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Error al actualizar la persona" },
      { status: 500 }
    );
  }
}
