import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db";
import { EstadoUsuarioIglesia, RolUsuario } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const estado = (searchParams.get("estado") ||
      "ACTIVO") as EstadoUsuarioIglesia;
    const limite = parseInt(searchParams.get("limite") || "50");
    const pagina = parseInt(searchParams.get("pagina") || "1");

    // Verificar que la iglesia existe
    const iglesia = await prisma.iglesia.findUnique({
      where: { id: parseInt(id) },
    });

    if (!iglesia) {
      return NextResponse.json(
        { error: "Iglesia no encontrada" },
        { status: 404 }
      );
    }

    const where = {
      iglesiaId: parseInt(id),
      estado: estado,
    };

    const [usuarios, total] = await Promise.all([
      prisma.usuarioIglesia.findMany({
        where,
        include: {
          usuario: {
            select: {
              id: true,
              nombres: true,
              apellidos: true,
              email: true,
              avatar: true,
              telefono: true,
              createdAt: true,
              ultimoLogin: true,
            },
          },
        },
        orderBy: [
          { rol: "asc" }, // ADMIN, PASTOR, LIDER, SECRETARIO, MIEMBRO
          { usuario: { nombres: "asc" } },
        ],
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      prisma.usuarioIglesia.count({ where }),
    ]);

    return NextResponse.json({
      usuarios: usuarios.map((ui) => ({
        id: ui.id,
        rol: ui.rol,
        estado: ui.estado,
        fechaUnion: ui.createdAt,
        usuario: ui.usuario,
      })),
      pagination: {
        total,
        pagina,
        limite,
        totalPaginas: Math.ceil(total / limite),
      },
    });
  } catch (error) {
    console.error("Error obteniendo usuarios de iglesia:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { usuarioId, rol, estado } = await request.json();

    if (!usuarioId || (!rol && !estado)) {
      return NextResponse.json(
        { error: "Usuario ID y al menos rol o estado son requeridos" },
        { status: 400 }
      );
    }

    // Verificar que la iglesia existe
    const iglesia = await prisma.iglesia.findUnique({
      where: { id: parseInt(id) },
    });

    if (!iglesia) {
      return NextResponse.json(
        { error: "Iglesia no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que la relación usuario-iglesia existe
    const usuarioIglesia = await prisma.usuarioIglesia.findUnique({
      where: {
        usuarioId_iglesiaId: {
          usuarioId: usuarioId,
          iglesiaId: parseInt(id),
        },
      },
    });

    if (!usuarioIglesia) {
      return NextResponse.json(
        { error: "Usuario no encontrado en esta iglesia" },
        { status: 404 }
      );
    }

    const updateData: {
      updatedAt: Date;
      rol?: RolUsuario;
      estado?: EstadoUsuarioIglesia;
    } = {
      updatedAt: new Date(),
    };

    if (rol) updateData.rol = rol as RolUsuario;
    if (estado) updateData.estado = estado as EstadoUsuarioIglesia;

    const usuarioActualizado = await prisma.usuarioIglesia.update({
      where: {
        usuarioId_iglesiaId: {
          usuarioId: usuarioId,
          iglesiaId: parseInt(id),
        },
      },
      data: updateData,
      include: {
        usuario: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            email: true,
            avatar: true,
            telefono: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      usuario: {
        id: usuarioActualizado.id,
        rol: usuarioActualizado.rol,
        estado: usuarioActualizado.estado,
        fechaUnion: usuarioActualizado.createdAt,
        usuario: usuarioActualizado.usuario,
      },
      message: "Usuario actualizado exitosamente",
    });
  } catch (error) {
    console.error("Error actualizando usuario:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
