import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId es requerido" },
        { status: 400 }
      );
    }

    // Obtener datos del usuario desde Supabase Auth
    const supabase = await createAdminClient();
    const { data: authUser, error: authError } =
      await supabase.auth.admin.getUserById(userId);

    if (authError || !authUser.user) {
      return NextResponse.json(
        { error: "Usuario no encontrado en Supabase Auth" },
        { status: 404 }
      );
    }

    const user = authUser.user;

    // Verificar si ya existe en nuestra base de datos
    const existingUser = await prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Usuario ya existe en la base de datos" },
        { status: 400 }
      );
    }

    // Crear usuario en nuestra base de datos
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        id: user.id,
        email: user.email || "",
        nombres: user.user_metadata?.nombres || "Usuario",
        apellidos: user.user_metadata?.apellidos || "Nuevo",
        avatar: user.user_metadata?.avatar_url,
        emailVerified: user.email_confirmed_at ? true : false,
        primerLogin: true,
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

    return NextResponse.json({
      success: true,
      usuario: nuevoUsuario,
    });
  } catch (error) {
    console.error("Error creando usuario:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
