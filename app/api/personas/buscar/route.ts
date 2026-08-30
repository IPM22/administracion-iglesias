import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { createClient } from "@/lib/supabase/server";

// GET /api/personas/buscar?q=juan perez&rol=VISITA
// Búsqueda rápida (multi-término) de personas de la iglesia activa.
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
        { status: 401 },
      );
    }

    const usuarioIglesia = await prisma.usuarioIglesia.findFirst({
      where: { usuarioId: user.id, estado: "ACTIVO" },
    });

    if (!usuarioIglesia) {
      return NextResponse.json(
        { error: "No tienes acceso a ninguna iglesia activa" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const rol = searchParams.get("rol")?.trim();
    const limite = parseInt(searchParams.get("limite") || "8");

    if (q.length < 2) {
      return NextResponse.json([]);
    }

    const terminos = q.split(/\s+/).filter(Boolean);
    const soloNumeros = q.replace(/\D/g, "");

    const personas = await prisma.persona.findMany({
      where: {
        iglesiaId: usuarioIglesia.iglesiaId,
        ...(rol ? { rol: rol as never } : {}),
        OR: [
          {
            AND: terminos.map((t) => ({
              OR: [
                { nombres: { contains: t, mode: "insensitive" as const } },
                { apellidos: { contains: t, mode: "insensitive" as const } },
              ],
            })),
          },
          ...(soloNumeros.length >= 4
            ? [
                { celular: { contains: soloNumeros } },
                { telefono: { contains: soloNumeros } },
              ]
            : []),
        ],
      },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        foto: true,
        correo: true,
        telefono: true,
        celular: true,
        rol: true,
        estado: true,
        fechaPrimeraVisita: true,
        _count: {
          select: { historialVisitas: true },
        },
      },
      orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
      take: Number.isNaN(limite) ? 8 : Math.min(limite, 25),
    });

    return NextResponse.json(personas);
  } catch (error) {
    console.error("Error buscando personas:", error);
    return NextResponse.json(
      { error: "Error al buscar personas" },
      { status: 500 },
    );
  }
}
