import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    // Validar que es un evento de Supabase Auth
    if (payload.type === "user.created") {
      const { user } = payload;

      // Crear usuario en nuestra tabla
      await prisma.usuario.create({
        data: {
          id: user.id,
          email: user.email,
          nombres: user.user_metadata?.nombres || "Usuario",
          apellidos: user.user_metadata?.apellidos || "Nuevo",
          avatar: user.user_metadata?.avatar_url,
          emailVerified: user.email_confirmed_at ? true : false,
          primerLogin: true,
        },
      });

      return NextResponse.json({ success: true });
    }

    if (payload.type === "user.updated") {
      const { user } = payload;

      // Actualizar usuario
      await prisma.usuario.update({
        where: { id: user.id },
        data: {
          email: user.email,
          emailVerified: user.email_confirmed_at ? true : false,
          ultimoLogin: new Date(),
        },
      });

      return NextResponse.json({ success: true });
    }

    if (payload.type === "user.deleted") {
      const { user } = payload;

      // Eliminar usuario (esto también eliminará sus relaciones por CASCADE)
      await prisma.usuario.delete({
        where: { id: user.id },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true, ignored: true });
  } catch (error) {
    console.error("Error en webhook de auth:", error);
    return NextResponse.json(
      { error: "Error procesando webhook" },
      { status: 500 }
    );
  }
}
