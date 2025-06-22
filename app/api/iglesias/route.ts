import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/db";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { usuarioId, ...iglesiaData } = data;

    if (!usuarioId) {
      return NextResponse.json(
        { error: "Usuario ID es requerido" },
        { status: 400 }
      );
    }

    if (!iglesiaData.nombre?.trim()) {
      return NextResponse.json(
        { error: "El nombre de la iglesia es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Crear la iglesia y la relación del usuario como ADMIN en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear la iglesia
      const iglesia = await tx.iglesia.create({
        data: {
          nombre: iglesiaData.nombre.trim(),
          descripcion: iglesiaData.descripcion?.trim() || null,
          direccion: iglesiaData.direccion?.trim() || null,
          telefono: iglesiaData.telefono?.trim() || null,
          correo: iglesiaData.correo?.trim() || null,
          sitioWeb: iglesiaData.sitioWeb?.trim() || null,
          activa: true,
        },
      });

      // Crear la relación usuario-iglesia como ADMIN
      const usuarioIglesia = await tx.usuarioIglesia.create({
        data: {
          usuarioId: usuarioId,
          iglesiaId: iglesia.id,
          rol: "ADMIN",
          estado: "ACTIVO",
        },
      });

      // Marcar que el usuario ya no es primer login
      await tx.usuario.update({
        where: { id: usuarioId },
        data: { primerLogin: false },
      });

      return { iglesia, usuarioIglesia };
    });

    return NextResponse.json({
      success: true,
      iglesia: result.iglesia,
      message: "Iglesia creada exitosamente",
    });
  } catch (error) {
    console.error("Error creando iglesia:", error);

    // Manejar errores específicos
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Ya existe una iglesia con ese nombre" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const busqueda = searchParams.get("busqueda");
    const limite = parseInt(searchParams.get("limite") || "10");
    const pagina = parseInt(searchParams.get("pagina") || "1");

    const where = busqueda
      ? {
          AND: [
            { activa: true },
            {
              OR: [
                {
                  nombre: { contains: busqueda, mode: "insensitive" as const },
                },
                {
                  descripcion: {
                    contains: busqueda,
                    mode: "insensitive" as const,
                  },
                },
              ],
            },
          ],
        }
      : { activa: true };

    const [iglesias, total] = await Promise.all([
      prisma.iglesia.findMany({
        where,
        select: {
          id: true,
          nombre: true,
          descripcion: true,
          direccion: true,
          logoUrl: true,
          createdAt: true,
          _count: {
            select: {
              usuarios: {
                where: { estado: "ACTIVO" },
              },
              personas: {
                where: { rol: "MIEMBRO" },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      prisma.iglesia.count({ where }),
    ]);

    return NextResponse.json({
      iglesias,
      pagination: {
        total,
        pagina,
        limite,
        totalPaginas: Math.ceil(total / limite),
      },
    });
  } catch (error) {
    console.error("Error obteniendo iglesias:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
