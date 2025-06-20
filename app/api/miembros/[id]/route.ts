import { prisma } from "../../../../lib/db";
import { NextRequest, NextResponse } from "next/server";
import { parseDateForAPI } from "@/lib/date-utils";
import { getUserContext, requireAuth } from "../../../../lib/auth-utils";

export async function GET(
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

    const miembro = await prisma.miembro.findUnique({
      where: {
        id: miembroId,
        iglesiaId, // ✅ Verificar que el miembro pertenece a la iglesia del usuario
      },
      include: {
        familia: true,
        visitaOriginal: true,
      },
    });

    if (!miembro) {
      return NextResponse.json(
        { error: "Miembro no encontrado" },
        { status: 404 }
      );
    }

    // Obtener ministerios activos del miembro usando la relación correcta
    const miembroConMinisterios = await prisma.miembro.findUnique({
      where: { id: miembroId },
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
          orderBy: {
            fechaInicio: "desc",
          },
        },
      },
    });

    const ministerios = miembroConMinisterios?.ministerios || [];

    // Obtener familiares del miembro
    const familiares = await prisma.familiar.findMany({
      where: {
        miembroId: miembroId,
      },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        relacion: true,
        esMiembro: true,
        miembroRelacionadoId: true,
      },
      orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
    });

    console.log("🔍 DEBUG API - Familiares raw de Prisma:", familiares);
    console.log("🔍 DEBUG API - Número de familiares:", familiares.length);
    if (familiares.length > 0) {
      console.log("🔍 DEBUG API - Primer familiar raw:", familiares[0]);
      console.log(
        "🔍 DEBUG API - Keys del primer familiar:",
        Object.keys(familiares[0])
      );
    }

    // Obtener visitas invitadas por este miembro
    const visitasInvitadas = await prisma.visita.findMany({
      where: {
        miembroInvitaId: miembroId,
        iglesiaId, // ✅ También filtrar visitas por iglesia
      },
      orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
    });

    // Formatear los datos para el frontend
    const miembroCompleto = {
      ...miembro,
      ministerios: ministerios.map((m) => ({
        id: m.id,
        ministerio: m.ministerio,
        rol: m.rol || m.cargo, // ✅ Usar 'rol' primero, fallback a 'cargo'
        fechaInicio: m.fechaInicio?.toISOString(),
        fechaFin: m.fechaFin?.toISOString(),
        esLider: m.esLider, // ✅ Usar el campo real
      })),
      familiares: familiares.map((f) => ({
        id: f.id.toString(), // ✅ Asegurar que ID es string
        familiar: {
          id: f.miembroRelacionadoId || 0,
          nombres: f.nombres || "", // ✅ Asegurar que no sea null
          apellidos: f.apellidos || "", // ✅ Asegurar que no sea null
          foto: null, // ✅ Familiar no tiene foto, siempre null
          estado: f.esMiembro ? "Activo" : "No Miembro",
        },
        tipoRelacion: f.relacion || "", // ✅ Asegurar que no sea null
        fuente: "directa",
      })),
      visitasInvitadas: visitasInvitadas.map((v) => ({
        id: v.id,
        nombres: v.nombres || "", // ✅ Asegurar que no sea null
        apellidos: v.apellidos || "", // ✅ Asegurar que no sea null
        foto: v.foto || null,
        totalVisitas: 1,
        fechaPrimeraVisita: v.fechaPrimeraVisita?.toISOString(),
        estado: v.estado || "Activa",
      })),
      notasAdicionales: miembro.notas,
    };

    console.log(
      "🔍 DEBUG API - Familiares mapeados:",
      miembroCompleto.familiares
    );
    if (miembroCompleto.familiares.length > 0) {
      console.log(
        "🔍 DEBUG API - Primer familiar mapeado:",
        miembroCompleto.familiares[0]
      );
      console.log(
        "🔍 DEBUG API - Estructura familiar.familiar:",
        miembroCompleto.familiares[0].familiar
      );
    }

    return NextResponse.json(miembroCompleto);
  } catch (error) {
    console.error("Error al obtener miembro:", error);
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
      { error: "Error al obtener el miembro" },
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
    const miembroExistente = await prisma.miembro.findUnique({
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
      familiaId,
      fechaIngreso,
      fechaBautismo,
      fechaConfirmacion,
      estado,
      foto,
      notasAdicionales,
      parentescoFamiliar,
    } = body;

    // Función para manejar strings vacías
    const parseString = (value: string) => {
      if (!value || value.trim() === "") {
        return null;
      }
      return value.trim();
    };

    // Función especial para el correo
    const parseEmail = (email: string) => {
      if (!email || email.trim() === "") {
        return null;
      }
      return email.trim();
    };

    const miembroActualizado = await prisma.miembro.update({
      where: { id: miembroId },
      data: {
        nombres: parseString(nombres) || miembroExistente.nombres,
        apellidos: parseString(apellidos) || miembroExistente.apellidos,
        correo: parseEmail(correo),
        telefono: parseString(telefono),
        celular: parseString(celular),
        direccion: parseString(direccion),
        fechaNacimiento: parseDateForAPI(fechaNacimiento),
        sexo: parseString(sexo),
        estadoCivil: parseString(estadoCivil),
        ocupacion: parseString(ocupacion),
        familiaId: familiaId ? parseInt(familiaId) : null,
        fechaIngreso: parseDateForAPI(fechaIngreso),
        fechaBautismo: parseDateForAPI(fechaBautismo),
        fechaConfirmacion: parseDateForAPI(fechaConfirmacion),
        estado: parseString(estado) || miembroExistente.estado,
        foto: parseString(foto),
        notas: parseString(notasAdicionales),
        relacion: parseString(parentescoFamiliar),
      },
    });

    return NextResponse.json(miembroActualizado);
  } catch (error) {
    console.error("Error al actualizar miembro:", error);

    if (error instanceof Error && error.message === "Usuario no autenticado") {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Error al actualizar el miembro" },
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
    const miembro = await prisma.miembro.findUnique({
      where: {
        id: miembroId,
        iglesiaId,
      },
    });

    if (!miembro) {
      return NextResponse.json(
        { error: "Miembro no encontrado" },
        { status: 404 }
      );
    }

    await prisma.miembro.delete({
      where: { id: miembroId },
    });

    return NextResponse.json({ message: "Miembro eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar miembro:", error);

    if (error instanceof Error && error.message === "Usuario no autenticado") {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Error al eliminar el miembro" },
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
    const miembroExistente = await prisma.miembro.findUnique({
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

    const miembroActualizado = await prisma.miembro.update({
      where: { id: miembroId },
      data: dataToUpdate,
    });

    return NextResponse.json(miembroActualizado);
  } catch (error) {
    console.error("Error al actualizar miembro:", error);

    if (error instanceof Error && error.message === "Usuario no autenticado") {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Error al actualizar el miembro" },
      { status: 500 }
    );
  }
}
