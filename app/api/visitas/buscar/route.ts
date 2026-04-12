import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
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

    const usuarioIglesia = await prisma.usuarioIglesia.findFirst({
      where: { usuarioId: user.id, estado: "ACTIVO" },
    });

    if (!usuarioIglesia) {
      return NextResponse.json(
        { error: "No tienes acceso a ninguna iglesia activa" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";

    if (q.length < 2) {
      return NextResponse.json([]);
    }

    const terminos = q.split(/\s+/).filter(Boolean);

    const visitas = await prisma.persona.findMany({
      where: {
        iglesiaId: usuarioIglesia.iglesiaId,
        rol: "VISITA",
        AND: terminos.map((t) => ({
          OR: [
            { nombres: { contains: t, mode: "insensitive" } },
            { apellidos: { contains: t, mode: "insensitive" } },
          ],
        })),
      },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        foto: true,
        correo: true,
        celular: true,
        estado: true,
        fechaPrimeraVisita: true,
        _count: {
          select: { historialVisitas: true },
        },
      },
      orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
      take: 6,
    });

    return NextResponse.json(visitas);
  } catch (error) {
    console.error("Error buscando visitas:", error);
    return NextResponse.json(
      { error: "Error al buscar visitas" },
      { status: 500 }
    );
  }
}
