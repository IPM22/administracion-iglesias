import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    // Obtener el usuario autenticado
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    // Obtener el usuario completo con sus iglesias
    const usuario = await prisma.usuario.findUnique({
      where: { id: user.id },
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
    console.error("Error obteniendo usuario actual:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
