import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";

const prisma = new PrismaClient();

// GET - Obtener personas disponibles (miembros y visitas sin familia asignada)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const familiaId = parseInt(id);

    if (!familiaId || isNaN(familiaId)) {
      return NextResponse.json(
        { error: "ID de familia inválido" },
        { status: 400 }
      );
    }

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

    // Verificar que la familia pertenece a la iglesia del usuario
    const familia = await prisma.familia.findUnique({
      where: {
        id: familiaId,
        iglesiaId: usuarioIglesia.iglesiaId,
      },
    });

    if (!familia) {
      return NextResponse.json(
        { error: "Familia no encontrada" },
        { status: 404 }
      );
    }

    // Obtener personas que no pertenecen a esta familia (de la misma iglesia)
    const personasDisponibles = await prisma.persona.findMany({
      where: {
        iglesiaId: usuarioIglesia.iglesiaId, // FILTRAR POR IGLESIA
        OR: [{ familiaId: null }, { familiaId: { not: familiaId } }],
      },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        correo: true,
        telefono: true,
        celular: true,
        foto: true,
        estado: true,
        fechaBautismo: true,
        fechaPrimeraVisita: true,
        rol: true,
      },
      orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
    });

    // Formatear las personas disponibles según su rol
    const personasFormateadas = personasDisponibles.map((persona) => ({
      id: persona.id,
      nombres: persona.nombres,
      apellidos: persona.apellidos,
      correo: persona.correo,
      telefono: persona.telefono,
      celular: persona.celular,
      foto: persona.foto,
      estado: persona.estado || "ACTIVA",
      tipo: persona.rol === "MIEMBRO" ? "miembro" : "visita",
      fechaBautismo: persona.fechaBautismo,
      fechaPrimeraVisita: persona.fechaPrimeraVisita,
    }));

    // Ordenar por apellido y nombre
    personasFormateadas.sort((a, b) => {
      const apellidoCompare = a.apellidos.localeCompare(b.apellidos);
      if (apellidoCompare !== 0) return apellidoCompare;
      return a.nombres.localeCompare(b.nombres);
    });

    return NextResponse.json(personasFormateadas);
  } catch (error) {
    console.error("Error al obtener personas disponibles:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
