import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { editarPersonaSchema } from "@/src/lib/validations/persona";
import {
  aplicarReglasAutomaticas,
  calcularTipoPersonaAutomatico,
} from "@/src/lib/services/persona-automation";
import { getUserContext, requireAuth } from "../../../../lib/auth-utils";

const prisma = new PrismaClient();

interface RouteParams {
  id: string;
}

// GET /api/personas/[id] - Obtener persona por ID
export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID de persona inválido" },
        { status: 400 }
      );
    }

    // Obtener contexto del usuario autenticado
    const userContext = await getUserContext(request);
    const { iglesiaId } = requireAuth(userContext);

    const persona = await prisma.persona.findUnique({
      where: {
        id,
        iglesiaId, // Verificar que la persona pertenece a la iglesia del usuario
      },
      include: {
        iglesia: {
          select: {
            id: true,
            nombre: true,
          },
        },
        familia: {
          select: {
            id: true,
            apellido: true,
            nombre: true,
          },
        },
        ministerios: {
          include: {
            ministerio: {
              select: {
                id: true,
                nombre: true,
                descripcion: true,
                colorHex: true,
              },
            },
          },
        },
        personaInvita: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
          },
        },
        personaConvertida: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
          },
        },
        personasInvitadas: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            rol: true,
            estado: true,
          },
        },
        _count: {
          select: {
            historialVisitas: true,
            ministerios: true,
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

    return NextResponse.json({ persona });
  } catch (error) {
    console.error("Error obteniendo persona:", error);

    if (error instanceof Error && error.message === "Usuario no autenticado") {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/personas/[id] - Actualizar persona
export async function PUT(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID de persona inválido" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validar datos de entrada
    const datosValidados = editarPersonaSchema.parse(body);

    // Aplicar reglas automáticas si se cambió información relevante
    const datosFinales = { ...datosValidados };

    if (datosValidados.fechaNacimiento || datosValidados.fechaBautismo) {
      // Determinar tipo si se proporciona fecha de nacimiento
      let tipoFinal = datosValidados.tipo;
      if (datosValidados.fechaNacimiento) {
        tipoFinal = calcularTipoPersonaAutomatico(
          new Date(datosValidados.fechaNacimiento)
        );
      }

      // Aplicar reglas automáticas
      const reglas = aplicarReglasAutomaticas(
        tipoFinal as any,
        datosValidados.fechaBautismo
          ? new Date(datosValidados.fechaBautismo)
          : null,
        datosValidados.fechaIngreso
          ? new Date(datosValidados.fechaIngreso)
          : null
      );

      datosFinales.tipo = tipoFinal as any;
      datosFinales.rol = datosValidados.rol || (reglas.rol as any);
      datosFinales.estado = datosValidados.estado || (reglas.estado as any);
    }

    // Actualizar persona
    const persona = await prisma.persona.update({
      where: { id },
      data: datosFinales,
      include: {
        iglesia: {
          select: {
            id: true,
            nombre: true,
          },
        },
        familia: {
          select: {
            id: true,
            apellido: true,
            nombre: true,
          },
        },
        ministerios: {
          include: {
            ministerio: {
              select: {
                id: true,
                nombre: true,
                descripcion: true,
                colorHex: true,
              },
            },
          },
        },
        _count: {
          select: {
            historialVisitas: true,
            ministerios: true,
          },
        },
      },
    });

    return NextResponse.json({
      persona,
    });
  } catch (error) {
    console.error("Error actualizando persona:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE /api/personas/[id] - Eliminar persona
export async function DELETE(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID de persona inválido" },
        { status: 400 }
      );
    }

    // Verificar que la persona existe
    const persona = await prisma.persona.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            historialVisitas: true,
            ministerios: true,
            personasInvitadas: true,
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

    // Verificar si tiene relaciones que impidan la eliminación
    const tieneRelaciones =
      persona._count.historialVisitas > 0 ||
      persona._count.ministerios > 0 ||
      persona._count.personasInvitadas > 0;

    if (tieneRelaciones) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar la persona porque tiene historial de actividades o relaciones asociadas",
          detalles: {
            historialVisitas: persona._count.historialVisitas,
            ministerios: persona._count.ministerios,
            personasInvitadas: persona._count.personasInvitadas,
          },
        },
        { status: 409 }
      );
    }

    // Eliminar persona
    await prisma.persona.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Persona eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error eliminando persona:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
