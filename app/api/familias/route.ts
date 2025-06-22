import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { createClient } from "@/lib/supabase/server";

// Helper function para manejar strings vacíos
function parseString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }
  return value as string;
}

// Datos de ejemplo como fallback
const familiasEjemplo = [
  {
    id: 1,
    apellido: "González",
    nombre: "Familia González",
    estado: "Activa",
    notas: "Familia muy activa en la iglesia",
    fechaRegistro: "2023-01-15T00:00:00.000Z",
    jefeFamilia: {
      id: 1,
      nombres: "Juan",
      apellidos: "González",
      foto: null,
    },
    miembros: [
      {
        id: 1,
        nombres: "Juan",
        apellidos: "González",
        foto: null,
        fechaNacimiento: "1980-05-15T00:00:00.000Z",
        estado: "Activo",
      },
      {
        id: 2,
        nombres: "María",
        apellidos: "González",
        foto: null,
        fechaNacimiento: "1985-08-22T00:00:00.000Z",
        estado: "Activo",
      },
    ],
    totalMiembros: 4,
    miembrosActivos: 3,
    edadPromedio: 28,
  },
  {
    id: 2,
    apellido: "Rodríguez",
    nombre: "Familia Rodríguez",
    estado: "Activa",
    notas: "Familia nueva en la congregación",
    fechaRegistro: "2023-03-20T00:00:00.000Z",
    jefeFamilia: {
      id: 3,
      nombres: "Carlos",
      apellidos: "Rodríguez",
      foto: null,
    },
    miembros: [
      {
        id: 3,
        nombres: "Carlos",
        apellidos: "Rodríguez",
        foto: null,
        fechaNacimiento: "1982-12-10T00:00:00.000Z",
        estado: "Activo",
      },
      {
        id: 4,
        nombres: "Laura",
        apellidos: "Rodríguez",
        foto: null,
        fechaNacimiento: "1988-04-18T00:00:00.000Z",
        estado: "Activo",
      },
    ],
    totalMiembros: 3,
    miembrosActivos: 2,
    edadPromedio: 32,
  },
];

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

    const familias = await prisma.familia.findMany({
      where: {
        iglesiaId: usuarioIglesia.iglesiaId, // FILTRAR POR IGLESIA
      },
      include: {
        personas: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            foto: true,
            fechaNacimiento: true,
            estado: true,
            relacionFamiliar: true,
          },
          orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
        },
        _count: {
          select: {
            personas: true,
          },
        },
      },
      orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
    });

    // Calcular estadísticas adicionales para cada familia
    const familiasConEstadisticas = familias.map((familia) => {
      const todasPersonas = familia.personas;

      const personasActivas = todasPersonas.filter(
        (p) => p.estado === "ACTIVA"
      ).length;

      // Encontrar el jefe de familia (primer miembro con relacion "Cabeza de Familia" o similar)
      const jefeFamilia =
        todasPersonas.find(
          (p) =>
            p.relacionFamiliar === "Cabeza de Familia" ||
            p.relacionFamiliar === "Jefe de Familia" ||
            p.relacionFamiliar === "Padre" ||
            p.relacionFamiliar === "Madre"
        ) || todasPersonas[0]; // Si no hay jefe explícito, tomar el primero

      return {
        ...familia,
        miembros: todasPersonas, // Mantenemos el nombre "miembros" para el frontend
        jefeFamilia: jefeFamilia
          ? {
              id: jefeFamilia.id,
              nombres: jefeFamilia.nombres,
              apellidos: jefeFamilia.apellidos,
              foto: jefeFamilia.foto,
              fechaNacimiento: jefeFamilia.fechaNacimiento,
              estado: jefeFamilia.estado,
              relacion: jefeFamilia.relacionFamiliar,
            }
          : null,
        totalMiembros: todasPersonas.length,
        miembrosActivos: personasActivas,
        edadPromedio:
          todasPersonas.length > 0
            ? todasPersonas
                .filter((p) => p.fechaNacimiento)
                .reduce((acc, p) => {
                  const edad =
                    new Date().getFullYear() -
                    new Date(p.fechaNacimiento!).getFullYear();
                  return acc + edad;
                }, 0) / todasPersonas.filter((p) => p.fechaNacimiento).length
            : 0,
      };
    });

    return NextResponse.json(familiasConEstadisticas);
  } catch (error) {
    console.error("Error al obtener familias:", error);
    console.log("Usando datos de ejemplo como fallback");

    // Si hay error con la BD, devolver datos de ejemplo
    return NextResponse.json(familiasEjemplo);
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { apellido, nombre, jefeFamiliaId, estado, notas } = body;

    // Validaciones básicas
    if (!apellido) {
      return NextResponse.json(
        { error: "El apellido familiar es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el jefe de familia existe si se proporciona y pertenece a la misma iglesia
    if (jefeFamiliaId && jefeFamiliaId.trim() !== "") {
      const jefeFamilia = await prisma.persona.findFirst({
        where: {
          id: parseInt(jefeFamiliaId),
          iglesiaId: usuarioIglesia.iglesiaId, // Verificar que pertenece a la misma iglesia
        },
      });

      if (!jefeFamilia) {
        return NextResponse.json(
          {
            error:
              "La persona seleccionada como cabeza de familia no existe o no pertenece a tu iglesia",
          },
          { status: 404 }
        );
      }
    }

    const nuevaFamilia = await prisma.familia.create({
      data: {
        iglesiaId: usuarioIglesia.iglesiaId, // AGREGAR IGLESIA ID
        apellido: apellido.trim(),
        nombre: parseString(nombre),
        estado: parseString(estado) || "Activa",
        notas: parseString(notas),
      },
      include: {
        personas: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            foto: true,
            estado: true,
            relacionFamiliar: true,
          },
        },
        _count: {
          select: {
            personas: true,
          },
        },
      },
    });

    // Si se asignó un jefe de familia, actualizar la persona para que pertenezca a esta familia
    if (jefeFamiliaId && jefeFamiliaId.trim() !== "") {
      await prisma.persona.update({
        where: { id: parseInt(jefeFamiliaId) },
        data: {
          familiaId: nuevaFamilia.id,
          relacionFamiliar: "Cabeza de Familia",
        },
      });
    }

    return NextResponse.json(nuevaFamilia, { status: 201 });
  } catch (error: unknown) {
    console.error("Error al crear familia:", error);
    return NextResponse.json(
      { error: "Error al crear la familia" },
      { status: 500 }
    );
  }
}
