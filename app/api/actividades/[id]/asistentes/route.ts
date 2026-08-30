import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db";
import { createClient } from "@/lib/supabase/server";

// Helper function para manejar strings vacios
function parseString(value: unknown): string | undefined {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }
  return value.trim();
}

function parseNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const num = typeof value === "number" ? value : parseInt(String(value));
  return isNaN(num) ? undefined : num;
}

const asistenteInclude = {
  persona: {
    select: {
      id: true,
      nombres: true,
      apellidos: true,
      correo: true,
      telefono: true,
      celular: true,
      foto: true,
      rol: true,
      estado: true,
      personaInvita: {
        select: {
          id: true,
          nombres: true,
          apellidos: true,
        },
      },
    },
  },
} as const;

// Obtiene la iglesia activa del usuario autenticado
async function obtenerIglesiaActiva() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Usuario no autenticado", status: 401 as const };
  }

  const usuarioIglesia = await prisma.usuarioIglesia.findFirst({
    where: { usuarioId: user.id, estado: "ACTIVO" },
  });

  if (!usuarioIglesia) {
    return {
      error: "No tienes acceso a ninguna iglesia activa",
      status: 403 as const,
    };
  }

  return { iglesiaId: usuarioIglesia.iglesiaId };
}

// POST /api/actividades/[id]/asistentes
// Registra la asistencia de una persona existente o crea una visita nueva
// y la registra, todo en un solo paso.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const actividadId = parseInt(id);

    if (isNaN(actividadId)) {
      return NextResponse.json(
        { error: "ID de actividad inválido" },
        { status: 400 },
      );
    }

    const contexto = await obtenerIglesiaActiva();
    if ("error" in contexto) {
      return NextResponse.json(
        { error: contexto.error },
        { status: contexto.status },
      );
    }
    const { iglesiaId } = contexto;

    const actividad = await prisma.actividad.findFirst({
      where: { id: actividadId, iglesiaId },
      include: { horarios: true },
    });

    if (!actividad) {
      return NextResponse.json(
        { error: "Actividad no encontrada" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { personaId, nuevaPersona, observaciones } = body;
    const horarioId = parseNumber(body.horarioId);
    const invitadoPorId = parseNumber(body.invitadoPorId);

    if (!personaId && !nuevaPersona) {
      return NextResponse.json(
        { error: "Debe indicar una persona existente o los datos de una nueva" },
        { status: 400 },
      );
    }

    // Validar el horario (si se indicó) y determinar la fecha de la asistencia
    let fechaAsistencia = actividad.fecha;
    if (horarioId) {
      const horario = actividad.horarios.find((h) => h.id === horarioId);
      if (!horario) {
        return NextResponse.json(
          { error: "Horario no encontrado para esta actividad" },
          { status: 404 },
        );
      }
      fechaAsistencia = horario.fecha;
    }

    // Validar la persona que invitó (si se indicó)
    if (invitadoPorId) {
      const personaInvita = await prisma.persona.findFirst({
        where: { id: invitadoPorId, iglesiaId },
      });

      if (!personaInvita) {
        return NextResponse.json(
          { error: "La persona que invitó no fue encontrada" },
          { status: 404 },
        );
      }
    }

    let personaFinalId: number;

    if (personaId) {
      const persona = await prisma.persona.findFirst({
        where: { id: parseNumber(personaId), iglesiaId },
      });

      if (!persona) {
        return NextResponse.json(
          { error: "Persona no encontrada" },
          { status: 404 },
        );
      }

      // Evitar registrar dos veces la misma persona en el mismo horario
      const yaRegistrada = await prisma.historialVisita.findFirst({
        where: {
          actividadId,
          personaId: persona.id,
          horarioId: horarioId ?? null,
        },
      });

      if (yaRegistrada) {
        return NextResponse.json(
          {
            error: `${persona.nombres} ${persona.apellidos} ya está registrado en esta actividad`,
          },
          { status: 409 },
        );
      }

      personaFinalId = persona.id;

      // Si no tenía fecha de primera visita, usar la de esta actividad
      if (!persona.fechaPrimeraVisita && persona.rol === "VISITA") {
        await prisma.persona.update({
          where: { id: persona.id },
          data: { fechaPrimeraVisita: fechaAsistencia },
        });
      }
    } else {
      const nombres = parseString(nuevaPersona?.nombres);
      const apellidos = parseString(nuevaPersona?.apellidos);

      if (!nombres || !apellidos) {
        return NextResponse.json(
          { error: "Nombres y apellidos son requeridos" },
          { status: 400 },
        );
      }

      const visitaCreada = await prisma.persona.create({
        data: {
          iglesiaId,
          nombres,
          apellidos,
          correo: parseString(nuevaPersona?.correo),
          telefono: parseString(nuevaPersona?.telefono),
          celular: parseString(nuevaPersona?.celular),
          sexo: parseString(nuevaPersona?.sexo),
          notas: parseString(nuevaPersona?.notas),
          fechaPrimeraVisita: fechaAsistencia,
          rol: "VISITA",
          estado: "NUEVA",
          tipo: "ADULTO",
        },
      });

      personaFinalId = visitaCreada.id;
    }

    const nuevoHistorial = await prisma.historialVisita.create({
      data: {
        personaId: personaFinalId,
        actividadId,
        horarioId: horarioId ?? null,
        tipoActividadId: actividad.tipoActividadId,
        fecha: fechaAsistencia,
        notas: parseString(observaciones),
      },
      include: asistenteInclude,
    });

    // Registrar quién invitó a la persona
    if (invitadoPorId && invitadoPorId !== personaFinalId) {
      await prisma.persona.update({
        where: { id: personaFinalId },
        data: { personaInvitaId: invitadoPorId },
      });
    }

    // Una visita con más de 2 asistencias pasa a ser recurrente
    const totalVisitas = await prisma.historialVisita.count({
      where: { personaId: personaFinalId },
    });

    if (totalVisitas > 2) {
      await prisma.persona.updateMany({
        where: { id: personaFinalId, rol: "VISITA", estado: "NUEVA" },
        data: { estado: "RECURRENTE" },
      });
    }

    // Releer el historial para devolver la persona ya actualizada
    const historialFinal = await prisma.historialVisita.findUnique({
      where: { id: nuevoHistorial.id },
      include: asistenteInclude,
    });

    return NextResponse.json(historialFinal ?? nuevoHistorial, { status: 201 });
  } catch (error) {
    console.error("Error al registrar asistente:", error);
    return NextResponse.json(
      { error: "Error al registrar el asistente" },
      { status: 500 },
    );
  }
}

// DELETE /api/actividades/[id]/asistentes?historialId=123
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const actividadId = parseInt(id);

    if (isNaN(actividadId)) {
      return NextResponse.json(
        { error: "ID de actividad inválido" },
        { status: 400 },
      );
    }

    const contexto = await obtenerIglesiaActiva();
    if ("error" in contexto) {
      return NextResponse.json(
        { error: contexto.error },
        { status: contexto.status },
      );
    }
    const { iglesiaId } = contexto;

    const { searchParams } = new URL(request.url);
    const historialId = parseNumber(searchParams.get("historialId"));

    if (!historialId) {
      return NextResponse.json(
        { error: "Debe indicar el registro de asistencia a eliminar" },
        { status: 400 },
      );
    }

    const historial = await prisma.historialVisita.findFirst({
      where: {
        id: historialId,
        actividadId,
        actividad: { iglesiaId },
      },
    });

    if (!historial) {
      return NextResponse.json(
        { error: "Registro de asistencia no encontrado" },
        { status: 404 },
      );
    }

    await prisma.historialVisita.delete({ where: { id: historialId } });

    return NextResponse.json({ message: "Asistencia eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar asistente:", error);
    return NextResponse.json(
      { error: "Error al eliminar el asistente" },
      { status: 500 },
    );
  }
}
