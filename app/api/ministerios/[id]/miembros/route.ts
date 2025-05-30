import { prisma } from "../../../../../lib/db";
import { NextRequest, NextResponse } from "next/server";

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
    });

    if (!ministerio) {
      return NextResponse.json(
        { error: "Ministerio no encontrado" },
        { status: 404 }
      );
    }

    // Obtener miembros del ministerio
    const miembros = await prisma.ministerioMiembro.findMany({
      where: { ministerioId },
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
      orderBy: [
        { estado: "desc" }, // Activos primero
        { miembro: { apellidos: "asc" } }, // Luego por apellidos
        { miembro: { nombres: "asc" } }, // Finalmente por nombres
      ],
    });

    return NextResponse.json(miembros);
  } catch (error) {
    console.error("Error al obtener miembros del ministerio:", error);
    return NextResponse.json(
      { error: "Error al obtener los miembros del ministerio" },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const {
      miembroId,
      rol,
      fechaInicio,
      estado = "Activo",
      esLider = false,
    } = body;

    // Validaciones básicas
    if (!miembroId) {
      return NextResponse.json(
        { error: "El ID del miembro es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el ministerio existe
    const ministerio = await prisma.ministerio.findUnique({
      where: { id: ministerioId },
    });

    if (!ministerio) {
      return NextResponse.json(
        { error: "Ministerio no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el miembro existe
    const miembro = await prisma.miembro.findUnique({
      where: { id: parseInt(miembroId) },
    });

    if (!miembro) {
      return NextResponse.json(
        { error: "Miembro no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si ya existe una relación activa
    const relacionExistente = await prisma.ministerioMiembro.findFirst({
      where: {
        miembroId: parseInt(miembroId),
        ministerioId,
        estado: "Activo",
      },
    });

    if (relacionExistente) {
      return NextResponse.json(
        { error: "El miembro ya está activo en este ministerio" },
        { status: 409 }
      );
    }

    // Si se está designando como líder, verificar que no haya otro líder activo
    if (esLider) {
      const liderExistente = await prisma.ministerioMiembro.findFirst({
        where: {
          ministerioId,
          esLider: true,
          estado: "Activo",
        },
      });

      if (liderExistente) {
        return NextResponse.json(
          {
            error:
              "Ya existe un líder activo en este ministerio. Primero debe cambiar el liderazgo.",
          },
          { status: 409 }
        );
      }
    }

    // Crear la relación
    const nuevoMiembroMinisterio = await prisma.ministerioMiembro.create({
      data: {
        miembroId: parseInt(miembroId),
        ministerioId,
        rol: parseString(rol),
        esLider,
        fechaInicio: fechaInicio ? new Date(fechaInicio) : new Date(),
        estado,
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

    return NextResponse.json(nuevoMiembroMinisterio, { status: 201 });
  } catch (error) {
    console.error("Error al agregar miembro al ministerio:", error);
    return NextResponse.json(
      { error: "Error al agregar el miembro al ministerio" },
      { status: 500 }
    );
  }
}
