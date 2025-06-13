import { prisma } from "../../../../../../lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getUserContext, requireAuth } from "../../../../../../lib/auth-utils";

// Helper function para parsing seguro
function parseString(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; miembroId: string }> }
) {
  try {
    // Obtener contexto del usuario autenticado
    const userContext = await getUserContext(request);
    const { iglesiaId } = requireAuth(userContext);

    const { id, miembroId } = await params;
    const ministerioId = parseInt(id);
    const miembroIdNum = parseInt(miembroId);

    if (isNaN(ministerioId) || isNaN(miembroIdNum)) {
      return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });
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

    // Verificar que el miembro existe y pertenece a la iglesia del usuario
    const miembro = await prisma.miembro.findUnique({
      where: {
        id: miembroIdNum,
        iglesiaId,
      },
    });

    if (!miembro) {
      return NextResponse.json(
        { error: "Miembro no encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { rol, estado, fechaFin, esLider } = body;

    // Buscar la relación existente
    const relacionExistente = await prisma.miembroMinisterio.findFirst({
      where: {
        miembroId: miembroIdNum,
        ministerioId,
      },
    });

    if (!relacionExistente) {
      return NextResponse.json(
        { error: "Relación no encontrada" },
        { status: 404 }
      );
    }

    // Si se está cambiando el liderazgo
    if (esLider !== undefined) {
      if (esLider && !relacionExistente.esLider) {
        // Verificar que no haya otro líder activo
        const liderExistente = await prisma.miembroMinisterio.findFirst({
          where: {
            ministerioId,
            esLider: true,
            estado: "Activo",
            id: { not: relacionExistente.id }, // Excluir el actual
          },
        });

        if (liderExistente) {
          return NextResponse.json(
            {
              error:
                "Ya existe un líder activo en este ministerio. Primero debe remover el liderazgo del líder actual.",
            },
            { status: 409 }
          );
        }
      }
    }

    // Actualizar la relación
    const relacionActualizada = await prisma.miembroMinisterio.update({
      where: { id: relacionExistente.id },
      data: {
        rol: parseString(rol),
        estado: estado || relacionExistente.estado,
        fechaFin: fechaFin ? new Date(fechaFin) : null,
        esLider: esLider !== undefined ? esLider : relacionExistente.esLider,
      },
      include: {
        miembro: {
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

    return NextResponse.json(relacionActualizada);
  } catch (error) {
    console.error("Error al actualizar miembro del ministerio:", error);

    if (error instanceof Error && error.message === "Usuario no autenticado") {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Error al actualizar el miembro del ministerio" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; miembroId: string }> }
) {
  try {
    // Obtener contexto del usuario autenticado
    const userContext = await getUserContext(request);
    const { iglesiaId } = requireAuth(userContext);

    const { id, miembroId } = await params;
    const ministerioId = parseInt(id);
    const miembroIdNum = parseInt(miembroId);

    if (isNaN(ministerioId) || isNaN(miembroIdNum)) {
      return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });
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

    // Verificar que el miembro existe y pertenece a la iglesia del usuario
    const miembro = await prisma.miembro.findUnique({
      where: {
        id: miembroIdNum,
        iglesiaId,
      },
    });

    if (!miembro) {
      return NextResponse.json(
        { error: "Miembro no encontrado" },
        { status: 404 }
      );
    }

    // Buscar la relación existente
    const relacionExistente = await prisma.miembroMinisterio.findFirst({
      where: {
        miembroId: miembroIdNum,
        ministerioId,
      },
    });

    if (!relacionExistente) {
      return NextResponse.json(
        { error: "Relación no encontrada" },
        { status: 404 }
      );
    }

    // En lugar de eliminar, marcamos como inactivo con fecha de fin
    const relacionInactivada = await prisma.miembroMinisterio.update({
      where: { id: relacionExistente.id },
      data: {
        estado: "Inactivo",
        fechaFin: new Date(),
      },
    });

    return NextResponse.json({
      message: "Miembro removido del ministerio correctamente",
      relacion: relacionInactivada,
    });
  } catch (error) {
    console.error("Error al remover miembro del ministerio:", error);

    if (error instanceof Error && error.message === "Usuario no autenticado") {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Error al remover el miembro del ministerio" },
      { status: 500 }
    );
  }
}
