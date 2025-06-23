import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserContext, requireAuth } from "../../../../../lib/auth-utils";
import * as z from "zod";

const prisma = new PrismaClient();

// Schema para validar los datos de entrada del POST
const crearHistorialVisitaSchema = z
  .object({
    fecha: z.string(),
    tipoActividadId: z.number().nullable().optional(),
    actividadId: z.number().nullable().optional(),
    horarioId: z.number().nullable().optional(),
    invitadoPorId: z.number().nullable().optional(),
    observaciones: z.string().nullable().optional(),
  })
  .refine((data) => data.tipoActividadId || data.actividadId, {
    message: "Debe especificar un tipo de actividad o una actividad específica",
  });

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const personaId = parseInt(id);

    if (isNaN(personaId)) {
      return NextResponse.json(
        { error: "ID de persona inválido" },
        { status: 400 }
      );
    }

    // Obtener contexto del usuario autenticado
    const userContext = await getUserContext(request);
    const { iglesiaId } = requireAuth(userContext);

    // Verificar que la persona existe y pertenece a la iglesia del usuario
    const persona = await prisma.persona.findUnique({
      where: {
        id: personaId,
        iglesiaId,
      },
    });

    if (!persona) {
      return NextResponse.json(
        { error: "Persona no encontrada" },
        { status: 404 }
      );
    }

    // Obtener el historial de visitas
    const historialVisitas = await prisma.historialVisita.findMany({
      where: {
        personaId: personaId,
      },
      include: {
        tipoActividad: {
          select: {
            id: true,
            nombre: true,
            tipo: true,
          },
        },
        actividad: {
          select: {
            id: true,
            nombre: true,
          },
        },
        horario: {
          select: {
            id: true,
            fecha: true,
            horaInicio: true,
            horaFin: true,
            notas: true,
          },
        },
        // Si existe una relación con quien invitó
        persona: {
          select: {
            personaInvita: {
              select: {
                id: true,
                nombres: true,
                apellidos: true,
              },
            },
          },
        },
      },
      orderBy: {
        fecha: "desc",
      },
    });

    // Formatear los datos para el frontend
    const historialFormateado = historialVisitas.map((visita) => ({
      id: visita.id,
      fecha: visita.fecha.toISOString(),
      tipoActividad: visita.tipoActividad,
      actividad: visita.actividad,
      horario: visita.horario,
      invitadoPor: visita.persona?.personaInvita,
      observaciones: visita.notas,
    }));

    return NextResponse.json({
      historial: historialFormateado,
    });
  } catch (error) {
    console.error("Error al obtener historial de visitas:", error);

    if (error instanceof Error && error.message === "Usuario no autenticado") {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Error al obtener el historial de visitas" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/personas/[id]/historial-visitas - Crear nueva entrada en el historial
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const personaId = parseInt(id);

    if (isNaN(personaId)) {
      return NextResponse.json(
        { error: "ID de persona inválido" },
        { status: 400 }
      );
    }

    // Obtener contexto del usuario autenticado
    const userContext = await getUserContext(request);
    const { iglesiaId } = requireAuth(userContext);

    // Verificar que la persona existe y pertenece a la iglesia del usuario
    const persona = await prisma.persona.findUnique({
      where: {
        id: personaId,
        iglesiaId,
      },
    });

    if (!persona) {
      return NextResponse.json(
        { error: "Persona no encontrada" },
        { status: 404 }
      );
    }

    // Validar los datos de entrada
    const body = await request.json();
    const datosValidados = crearHistorialVisitaSchema.parse(body);

    // Verificar que el tipo de actividad existe (si se proporcionó)
    if (datosValidados.tipoActividadId) {
      const tipoActividad = await prisma.tipoActividad.findUnique({
        where: {
          id: datosValidados.tipoActividadId,
          iglesiaId,
        },
      });

      if (!tipoActividad) {
        return NextResponse.json(
          { error: "Tipo de actividad no encontrado" },
          { status: 404 }
        );
      }
    }

    // Verificar que la actividad existe (si se proporcionó)
    if (datosValidados.actividadId) {
      const actividad = await prisma.actividad.findUnique({
        where: {
          id: datosValidados.actividadId,
          iglesiaId,
        },
      });

      if (!actividad) {
        return NextResponse.json(
          { error: "Actividad no encontrada" },
          { status: 404 }
        );
      }
    }

    // Verificar que la persona que invitó existe (si se proporcionó)
    if (datosValidados.invitadoPorId) {
      const personaInvita = await prisma.persona.findUnique({
        where: {
          id: datosValidados.invitadoPorId,
          iglesiaId,
        },
      });

      if (!personaInvita) {
        return NextResponse.json(
          { error: "Persona que invitó no encontrada" },
          { status: 404 }
        );
      }
    }

    // Verificar que el horario existe (si se proporcionó)
    if (datosValidados.horarioId) {
      const horario = await prisma.actividadHorario.findUnique({
        where: {
          id: datosValidados.horarioId,
        },
        include: {
          actividad: {
            select: {
              iglesiaId: true,
            },
          },
        },
      });

      if (!horario || horario.actividad.iglesiaId !== iglesiaId) {
        return NextResponse.json(
          { error: "Horario no encontrado" },
          { status: 404 }
        );
      }
    }

    // Crear la entrada en el historial
    const nuevaEntrada = await prisma.historialVisita.create({
      data: {
        personaId: personaId,
        fecha: new Date(datosValidados.fecha),
        tipoActividadId: datosValidados.tipoActividadId,
        actividadId: datosValidados.actividadId,
        horarioId: datosValidados.horarioId,
        notas: datosValidados.observaciones,
      },
      include: {
        tipoActividad: {
          select: {
            id: true,
            nombre: true,
            tipo: true,
          },
        },
        actividad: {
          select: {
            id: true,
            nombre: true,
          },
        },
        horario: {
          select: {
            id: true,
            fecha: true,
            horaInicio: true,
            horaFin: true,
          },
        },
      },
    });

    // Actualizar la relación de invitación si se proporcionó
    if (datosValidados.invitadoPorId) {
      await prisma.persona.update({
        where: { id: personaId },
        data: {
          personaInvitaId: datosValidados.invitadoPorId,
        },
      });
    }

    return NextResponse.json({
      message: "Entrada de historial creada exitosamente",
      entrada: {
        id: nuevaEntrada.id,
        fecha: nuevaEntrada.fecha.toISOString(),
        tipoActividad: nuevaEntrada.tipoActividad,
        actividad: nuevaEntrada.actividad,
        observaciones: nuevaEntrada.notas,
      },
    });
  } catch (error) {
    console.error("Error al crear entrada de historial:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", detalles: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === "Usuario no autenticado") {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Error al crear la entrada de historial" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
