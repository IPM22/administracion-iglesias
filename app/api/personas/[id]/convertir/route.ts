import { NextRequest, NextResponse } from "next/server";
import { convertirVisitaAMiembro } from "@/src/lib/services/persona-automation";
import { getUserContext, requireAuth } from "../../../../../lib/auth-utils";

interface RouteParams {
  id: string;
}

// POST /api/personas/[id]/convertir - Convertir visita a miembro
export async function POST(
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

    // Obtener datos del body (opcional)
    const body = await request.json().catch(() => ({}));
    const { fechaBautismo, notas } = body;

    // Validar que la persona pertenece a la iglesia del usuario
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    try {
      const persona = await prisma.persona.findUnique({
        where: {
          id,
          iglesiaId, // Verificar que la persona pertenece a la iglesia del usuario
        },
      });

      if (!persona) {
        return NextResponse.json(
          { error: "Persona no encontrada" },
          { status: 404 }
        );
      }

      if (persona.rol !== "VISITA") {
        return NextResponse.json(
          { error: "La persona no es una visita" },
          { status: 400 }
        );
      }

      // Realizar la conversión
      const miembroConvertido = await convertirVisitaAMiembro(
        id,
        fechaBautismo ? new Date(fechaBautismo) : undefined,
        notas
      );

      return NextResponse.json(
        {
          message: "Visita convertida exitosamente a miembro",
          miembro: miembroConvertido,
        },
        { status: 201 }
      );
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    console.error("Error convirtiendo visita a miembro:", error);

    if (error instanceof Error) {
      if (error.message === "Usuario no autenticado") {
        return NextResponse.json(
          { error: "Usuario no autenticado" },
          { status: 401 }
        );
      }

      if (
        error.message.includes("no encontrada") ||
        error.message.includes("no es una visita")
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
