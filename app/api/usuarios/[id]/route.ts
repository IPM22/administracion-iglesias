import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const usuario = await prisma.usuario.findUnique({
      where: { id },
      include: {
        iglesias: {
          include: {
            iglesia: {
              select: {
                id: true,
                nombre: true,
                logoUrl: true,
                activa: true,
              },
            },
          },
        },
      },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(usuario);
  } catch (error) {
    console.error("Error obteniendo usuario:", error);
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
    const data = await request.json();

    const usuario = await prisma.usuario.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        iglesias: {
          include: {
            iglesia: {
              select: {
                id: true,
                nombre: true,
                logoUrl: true,
                activa: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(usuario);
  } catch (error) {
    console.error("Error actualizando usuario:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
