import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db";
import { parseDateForAPI } from "@/lib/date-utils";
import { getUserContext, requireAuth } from "../../../../../lib/auth-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Obtener contexto del usuario autenticado
    const userContext = await getUserContext(request);
    const { iglesiaId } = requireAuth(userContext);

    const { id } = await params;
    const miembroId = parseInt(id);

    if (!miembroId || isNaN(miembroId)) {
      return NextResponse.json(
        { error: "ID de miembro inválido" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { ministerioId, rol, fechaInicio, esLider } = body;

    // Validaciones
    if (!ministerioId) {
      return NextResponse.json(
        { error: "ID del ministerio es requerido" },
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

    // Verificar si ya existe una asignación activa
    const asignacionExistente = await prisma.miembroMinisterio.findFirst({
      where: {
        miembroId: miembroId,
        ministerioId: ministerioId,
        estado: "Activo",
      },
    });

    if (asignacionExistente) {
      return NextResponse.json(
        { error: "El miembro ya está asignado a este ministerio" },
        { status: 400 }
      );
    }

    // Crear la asignación
    const nuevaAsignacion = await prisma.miembroMinisterio.create({
      data: {
        miembroId: miembroId,
        ministerioId: ministerioId,
        rol: rol || null,
        fechaInicio: parseDateForAPI(fechaInicio) || new Date(),
        esLider: esLider || false,
        estado: "Activo",
      },
      include: {
        miembro: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
          },
        },
        ministerio: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
          },
        },
      },
    });

    return NextResponse.json(nuevaAsignacion, { status: 201 });
  } catch (error) {
    console.error("Error al asignar ministerio:", error);

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
  }
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
    const miembroId = parseInt(id);

    if (!miembroId || isNaN(miembroId)) {
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

    // Obtener los ministerios del miembro
    const ministerios = await prisma.miembroMinisterio.findMany({
      where: {
        miembroId: miembroId,
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
    });

    return NextResponse.json(ministerios);
  } catch (error) {
    console.error("Error al obtener ministerios del miembro:", error);

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
  }
}
