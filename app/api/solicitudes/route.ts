import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/db";

interface WhereClause {
  iglesiaId?: number;
  usuarioId?: string;
  estado?: string;
}

interface UpdateData {
  estado: string;
  updatedAt: Date;
  rol?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { usuarioId, iglesiaId, mensaje } = await request.json();

    if (!usuarioId || !iglesiaId) {
      return NextResponse.json(
        { error: "Usuario ID e Iglesia ID son requeridos" },
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

    // Verificar que la iglesia existe y está activa
    const iglesia = await prisma.iglesia.findFirst({
      where: { id: iglesiaId, activa: true },
    });

    if (!iglesia) {
      return NextResponse.json(
        { error: "Iglesia no encontrada o inactiva" },
        { status: 404 }
      );
    }

    // Verificar que no existe ya una relación
    const relacionExistente = await prisma.usuarioIglesia.findUnique({
      where: {
        usuarioId_iglesiaId: {
          usuarioId,
          iglesiaId,
        },
      },
    });

    if (relacionExistente) {
      let mensaje = "Ya tienes una relación con esta iglesia";
      if (relacionExistente.estado === "PENDIENTE") {
        mensaje = "Ya tienes una solicitud pendiente para esta iglesia";
      } else if (relacionExistente.estado === "ACTIVO") {
        mensaje = "Ya eres miembro de esta iglesia";
      } else if (relacionExistente.estado === "RECHAZADO") {
        mensaje = "Tu solicitud anterior fue rechazada";
      }

      return NextResponse.json({ error: mensaje }, { status: 409 });
    }

    // Crear la solicitud (relación con estado PENDIENTE)
    const solicitud = await prisma.usuarioIglesia.create({
      data: {
        usuarioId,
        iglesiaId,
        rol: "MIEMBRO", // Rol por defecto
        estado: "PENDIENTE",
        permisos: { mensaje }, // Guardar mensaje en permisos temporalmente
      },
      include: {
        usuario: {
          select: {
            nombres: true,
            apellidos: true,
            email: true,
          },
        },
        iglesia: {
          select: {
            nombre: true,
          },
        },
      },
    });

    // Marcar que el usuario ya no es primer login
    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { primerLogin: false },
    });

    return NextResponse.json({
      success: true,
      solicitud,
      message: "Solicitud enviada exitosamente",
    });
  } catch (error) {
    console.error("Error creando solicitud:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const iglesiaId = searchParams.get("iglesiaId");
    const usuarioId = searchParams.get("usuarioId");
    const estado = searchParams.get("estado");

    if (!iglesiaId && !usuarioId) {
      return NextResponse.json(
        { error: "Se requiere iglesiaId o usuarioId" },
        { status: 400 }
      );
    }

    const where: WhereClause = {};

    if (iglesiaId) {
      where.iglesiaId = parseInt(iglesiaId);
    }

    if (usuarioId) {
      where.usuarioId = usuarioId;
    }

    if (estado) {
      where.estado = estado;
    }

    const solicitudes = await prisma.usuarioIglesia.findMany({
      where,
      include: {
        usuario: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            email: true,
            avatar: true,
            createdAt: true,
          },
        },
        iglesia: {
          select: {
            id: true,
            nombre: true,
            logoUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ solicitudes });
  } catch (error) {
    console.error("Error obteniendo solicitudes:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, estado, rol } = await request.json();

    if (!id || !estado) {
      return NextResponse.json(
        { error: "ID y estado son requeridos" },
        { status: 400 }
      );
    }

    if (!["ACTIVO", "RECHAZADO", "SUSPENDIDO"].includes(estado)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    const updateData: UpdateData = {
      estado,
      updatedAt: new Date(),
    };

    if (
      rol &&
      ["ADMIN", "PASTOR", "LIDER", "SECRETARIO", "MIEMBRO"].includes(rol)
    ) {
      updateData.rol = rol;
    }

    const solicitud = await prisma.usuarioIglesia.update({
      where: { id },
      data: updateData,
      include: {
        usuario: {
          select: {
            nombres: true,
            apellidos: true,
            email: true,
          },
        },
        iglesia: {
          select: {
            nombre: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      solicitud,
      message: `Solicitud ${estado.toLowerCase()} exitosamente`,
    });
  } catch (error) {
    console.error("Error actualizando solicitud:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
