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

    // Obtener miembros que no pertenecen a esta familia (de la misma iglesia)
    const miembrosDisponibles = await prisma.miembro.findMany({
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
      },
      orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
    });

    // Obtener visitas que no pertenecen a esta familia y no han sido convertidas (de la misma iglesia)
    const visitasDisponibles = await prisma.visita.findMany({
      where: {
        iglesiaId: usuarioIglesia.iglesiaId, // FILTRAR POR IGLESIA
        estado: { not: "Convertido" },
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
        fechaPrimeraVisita: true,
      },
      orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
    });

    // Combinar y formatear las personas disponibles
    const personasDisponibles = [
      ...miembrosDisponibles.map((miembro) => ({
        id: miembro.id,
        nombres: miembro.nombres,
        apellidos: miembro.apellidos,
        correo: miembro.correo,
        telefono: miembro.telefono,
        celular: miembro.celular,
        foto: miembro.foto,
        estado: miembro.estado || "Activo",
        tipo: "miembro" as const,
        fechaBautismo: miembro.fechaBautismo,
      })),
      ...visitasDisponibles.map((visita) => ({
        id: visita.id,
        nombres: visita.nombres,
        apellidos: visita.apellidos,
        correo: visita.correo,
        telefono: visita.telefono,
        celular: visita.celular,
        foto: visita.foto,
        estado: visita.estado || "Nuevo",
        tipo: "visita" as const,
        fechaBautismo: null,
      })),
    ];

    // Ordenar por apellido y nombre
    personasDisponibles.sort((a, b) => {
      const apellidoCompare = a.apellidos.localeCompare(b.apellidos);
      if (apellidoCompare !== 0) return apellidoCompare;
      return a.nombres.localeCompare(b.nombres);
    });

    return NextResponse.json(personasDisponibles);
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
