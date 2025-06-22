import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserContext, requireAuth } from "../../../../../lib/auth-utils";

const prisma = new PrismaClient();

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
