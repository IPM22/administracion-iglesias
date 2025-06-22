import { prisma } from "../../../../../lib/db";
import { NextRequest, NextResponse } from "next/server";
import { parseDateForAPI } from "@/lib/date-utils";
import { getUserContext, requireAuth } from "../../../../../lib/auth-utils";

// Helper function para parsing seguro
function parseString(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Obtener contexto del usuario autenticado
    const userContext = await getUserContext(request);
    const { iglesiaId } = requireAuth(userContext);

    const { id } = await params;
    const ministerioId = parseInt(id);

    if (isNaN(ministerioId)) {
      return NextResponse.json(
        { error: "ID de ministerio inválido" },
        { status: 400 }
      );
    }

    // Verificar que el ministerio existe y obtener sus personas
    const ministerio = await prisma.ministerio.findUnique({
      where: {
        id: ministerioId,
        iglesiaId, // ✅ Filtrar por iglesia del usuario
      },
      include: {
        personas: {
          include: {
            persona: {
              select: {
                id: true,
                nombres: true,
                apellidos: true,
                foto: true,
                correo: true,
                telefono: true,
                celular: true,
                estado: true,
              },
            },
          },
          orderBy: [
            { estado: "desc" }, // Activos primero
            { persona: { apellidos: "asc" } }, // Luego por apellidos
            { persona: { nombres: "asc" } }, // Finalmente por nombres
          ],
        },
      },
    });

    if (!ministerio) {
      return NextResponse.json(
        { error: "Ministerio no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(ministerio.personas);
  } catch (error) {
    console.error("Error al obtener personas del ministerio:", error);

    if (error instanceof Error && error.message === "Usuario no autenticado") {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Error al obtener las personas del ministerio" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Obtener contexto del usuario autenticado
    const userContext = await getUserContext(request);
    const { iglesiaId } = requireAuth(userContext);

    const { id } = await params;
    const ministerioId = parseInt(id);

    if (isNaN(ministerioId)) {
      return NextResponse.json(
        { error: "ID de ministerio inválido" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      personaId,
      rol,
      fechaInicio,
      estado = "Activo",
      esLider = false,
    } = body;

    // Validaciones básicas
    if (!personaId) {
      return NextResponse.json(
        { error: "El ID de la persona es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el ministerio existe y pertenece a la iglesia del usuario
    const ministerio = await prisma.ministerio.findUnique({
      where: {
        id: ministerioId,
        iglesiaId,
      },
    });

    if (!ministerio) {
      return NextResponse.json(
        { error: "Ministerio no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que la persona existe y pertenece a la iglesia del usuario
    const persona = await prisma.persona.findUnique({
      where: {
        id: parseInt(personaId),
        iglesiaId,
        rol: "MIEMBRO",
      },
    });

    if (!persona) {
      return NextResponse.json(
        { error: "Persona con rol de miembro no encontrada" },
        { status: 404 }
      );
    }

    // Verificar si ya existe una relación activa
    const relacionExistente = await prisma.personaMinisterio.findFirst({
      where: {
        personaId: parseInt(personaId),
        ministerioId,
        estado: "Activo",
      },
    });

    if (relacionExistente) {
      return NextResponse.json(
        { error: "La persona ya está asignada a este ministerio" },
        { status: 409 }
      );
    }

    // Crear la nueva relación persona-ministerio
    const nuevaRelacion = await prisma.personaMinisterio.create({
      data: {
        personaId: parseInt(personaId),
        ministerioId,
        rol: parseString(rol),
        esLider,
        fechaInicio: parseDateForAPI(fechaInicio) || new Date(),
        estado,
      },
      include: {
        persona: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            foto: true,
            correo: true,
            telefono: true,
            celular: true,
            estado: true,
          },
        },
      },
    });

    return NextResponse.json(nuevaRelacion, {
      status: 201,
    });
  } catch (error) {
    console.error("Error al agregar persona al ministerio:", error);

    if (error instanceof Error && error.message === "Usuario no autenticado") {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Error al agregar la persona al ministerio" },
      { status: 500 }
    );
  }
}
