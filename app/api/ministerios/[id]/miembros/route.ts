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

    // Verificar que el ministerio existe y obtener sus miembros
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
                estado: true,
              },
            },
          },
          orderBy: [
            { estado: "desc" }, // Activos primero
            { miembro: { apellidos: "asc" } }, // Luego por apellidos
            { miembro: { nombres: "asc" } }, // Finalmente por nombres
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

    return NextResponse.json(ministerio.miembros);
  } catch (error) {
    console.error("Error al obtener miembros del ministerio:", error);

    if (error instanceof Error && error.message === "Usuario no autenticado") {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

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
        id: parseInt(miembroId),
        iglesiaId,
      },
    });

    if (!miembro) {
      return NextResponse.json(
        { error: "Miembro no encontrado" },
        { status: 404 }
      );
    }

    // Usar SQL raw con los nombres correctos de columnas (snake_case)
    await prisma.$executeRaw`
      INSERT INTO miembro_ministerios ("miembroId", "ministerioId", rol, "esLider", "fechaInicio", estado, "createdAt", "updatedAt")
      VALUES (${parseInt(miembroId)}, ${ministerioId}, ${parseString(
      rol
    )}, ${esLider}, ${
      parseDateForAPI(fechaInicio) || new Date()
    }, ${estado}, NOW(), NOW())
    `;

    // Obtener el registro creado usando la relación
    const ministerioActualizado = await prisma.ministerio.findUnique({
      where: { id: ministerioId },
      include: {
        miembros: {
          where: {
            miembroId: parseInt(miembroId),
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
        },
      },
    });

    return NextResponse.json(ministerioActualizado?.miembros[0], {
      status: 201,
    });
  } catch (error) {
    console.error("Error al agregar miembro al ministerio:", error);

    if (error instanceof Error && error.message === "Usuario no autenticado") {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Error al agregar el miembro al ministerio" },
      { status: 500 }
    );
  }
}
