import { prisma } from "../../../../lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getUserContext, requireAuth } from "../../../../lib/auth-utils";

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

    const ministerio = await prisma.ministerio.findUnique({
      where: {
        id: ministerioId,
        iglesiaId, // ✅ Filtrar por iglesia del usuario
      },
      include: {
        miembros: {
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
              },
            },
          },
          orderBy: {
            fechaInicio: "desc",
          },
        },
        actividades: {
          select: {
            id: true,
            nombre: true,
            fecha: true,
            estado: true,
            ubicacion: true,
          },
          orderBy: {
            fecha: "desc",
          },
        },
        _count: {
          select: {
            miembros: {
              where: {
                estado: "Activo",
              },
            },
            actividades: true,
          },
        },
      },
    });

    if (!ministerio) {
      return NextResponse.json(
        { error: "Ministerio no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(ministerio);
  } catch (error) {
    console.error("Error al obtener ministerio:", error);

    if (error instanceof Error && error.message === "Usuario no autenticado") {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Error al obtener el ministerio" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ministerioId = parseInt(id);

    if (isNaN(ministerioId)) {
      return NextResponse.json(
        { error: "ID de ministerio inválido" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { nombre, descripcion } = body;

    // Validaciones básicas
    if (!nombre) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el ministerio existe
    const ministerioExiste = await prisma.ministerio.findUnique({
      where: { id: ministerioId },
    });

    if (!ministerioExiste) {
      return NextResponse.json(
        { error: "Ministerio no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que no existe otro ministerio con el mismo nombre
    const ministerioConMismoNombre = await prisma.ministerio.findFirst({
      where: {
        nombre: nombre.trim(),
        id: {
          not: ministerioId,
        },
      },
    });

    if (ministerioConMismoNombre) {
      return NextResponse.json(
        { error: "Ya existe otro ministerio con ese nombre" },
        { status: 409 }
      );
    }

    const ministerioActualizado = await prisma.ministerio.update({
      where: { id: ministerioId },
      data: {
        nombre: nombre.trim(),
        descripcion: parseString(descripcion),
      },
      include: {
        miembros: {
          where: {
            estado: "Activo",
          },
          include: {
            miembro: {
              select: {
                id: true,
                nombres: true,
                apellidos: true,
                foto: true,
              },
            },
          },
        },
        _count: {
          select: {
            miembros: {
              where: {
                estado: "Activo",
              },
            },
            actividades: true,
          },
        },
      },
    });

    return NextResponse.json(ministerioActualizado);
  } catch (error) {
    console.error("Error al actualizar ministerio:", error);
    return NextResponse.json(
      { error: "Error al actualizar el ministerio" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ministerioId = parseInt(id);

    if (isNaN(ministerioId)) {
      return NextResponse.json(
        { error: "ID de ministerio inválido" },
        { status: 400 }
      );
    }

    // Verificar que el ministerio existe
    const ministerio = await prisma.ministerio.findUnique({
      where: { id: ministerioId },
      include: {
        miembros: true,
        actividades: true,
      },
    });

    if (!ministerio) {
      return NextResponse.json(
        { error: "Ministerio no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si tiene miembros activos
    const miembrosActivos = ministerio.miembros.filter(
      (m) => m.estado === "Activo"
    );
    if (miembrosActivos.length > 0) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar el ministerio porque tiene miembros activos",
        },
        { status: 400 }
      );
    }

    // Verificar si tiene actividades asociadas
    if (ministerio.actividades.length > 0) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar el ministerio porque tiene actividades asociadas",
        },
        { status: 400 }
      );
    }

    await prisma.ministerio.delete({
      where: { id: ministerioId },
    });

    return NextResponse.json({ message: "Ministerio eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar ministerio:", error);
    return NextResponse.json(
      { error: "Error al eliminar el ministerio" },
      { status: 500 }
    );
  }
}
