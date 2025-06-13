import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
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

    // Obtener la iglesia activa del usuario
    const usuarioIglesia = await prisma.usuarioIglesia.findFirst({
      where: {
        usuarioId: user.id,
        estado: "ACTIVO",
      },
      include: {
        iglesia: true,
      },
    });

    if (!usuarioIglesia) {
      return NextResponse.json(
        { error: "No tienes acceso a ninguna iglesia activa" },
        { status: 403 }
      );
    }

    let tiposActividad = await prisma.tipoActividad.findMany({
      where: {
        activo: true,
        iglesiaId: usuarioIglesia.iglesiaId, // Filtrar por iglesia
      },
      orderBy: {
        nombre: "asc",
      },
    });

    // Si no hay tipos de actividad para esta iglesia, crear los tipos por defecto
    if (tiposActividad.length === 0) {
      const tiposDefecto = [
        {
          nombre: "Culto Dominical",
          descripcion: "Servicio principal de adoración dominical",
          tipo: "Regular",
          iglesiaId: usuarioIglesia.iglesiaId,
        },
        {
          nombre: "Estudio Bíblico",
          descripcion: "Estudio semanal de la Biblia",
          tipo: "Regular",
          iglesiaId: usuarioIglesia.iglesiaId,
        },
        {
          nombre: "Culto de Oración",
          descripcion: "Reunión de oración y ayuno",
          tipo: "Regular",
          iglesiaId: usuarioIglesia.iglesiaId,
        },
        {
          nombre: "Evento Especial",
          descripcion: "Eventos especiales programados",
          tipo: "Especial",
          iglesiaId: usuarioIglesia.iglesiaId,
        },
      ];

      // Crear los tipos de actividad por defecto
      await prisma.tipoActividad.createMany({
        data: tiposDefecto,
      });

      // Obtener los tipos recién creados
      tiposActividad = await prisma.tipoActividad.findMany({
        where: {
          activo: true,
          iglesiaId: usuarioIglesia.iglesiaId,
        },
        orderBy: {
          nombre: "asc",
        },
      });
    }

    return NextResponse.json(tiposActividad);
  } catch (error) {
    console.error("Error al obtener tipos de actividad:", error);
    return NextResponse.json(
      { error: "Error al obtener los tipos de actividad" },
      { status: 500 }
    );
  }
}
