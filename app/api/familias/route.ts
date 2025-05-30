import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/db";

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
    const familias = await prisma.familia.findMany({
      include: {
        jefeFamilia: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            foto: true,
            fechaNacimiento: true,
            estado: true,
            parentescoFamiliar: true,
          },
        },
        miembros: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            foto: true,
            fechaNacimiento: true,
            estado: true,
            parentescoFamiliar: true,
          },
          orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
        },
        _count: {
          select: {
            miembros: true,
          },
        },
      },
      orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
    });

    // Calcular estadísticas adicionales para cada familia
    const familiasConEstadisticas = familias.map((familia) => {
      // Asegurar que el jefe de familia esté incluido en la lista de miembros
      const todosMiembros = [...familia.miembros];

      // Si hay jefe de familia y no está en la lista de miembros, agregarlo
      if (
        familia.jefeFamilia &&
        !todosMiembros.some((m) => m.id === familia.jefeFamilia!.id)
      ) {
        todosMiembros.push({
          id: familia.jefeFamilia.id,
          nombres: familia.jefeFamilia.nombres,
          apellidos: familia.jefeFamilia.apellidos,
          foto: familia.jefeFamilia.foto,
          fechaNacimiento: familia.jefeFamilia.fechaNacimiento,
          estado: familia.jefeFamilia.estado || "Activo",
          parentescoFamiliar: "Cabeza de Familia",
        });
      }

      const miembrosActivos = todosMiembros.filter(
        (m) => m.estado === "Activo"
      ).length;

      return {
        ...familia,
        miembros: todosMiembros, // Usar la lista completa que incluye al jefe
        totalMiembros: todosMiembros.length,
        miembrosActivos,
        edadPromedio:
          todosMiembros.length > 0
            ? todosMiembros
                .filter((m) => m.fechaNacimiento)
                .reduce((acc, m) => {
                  const edad =
                    new Date().getFullYear() -
                    new Date(m.fechaNacimiento!).getFullYear();
                  return acc + edad;
                }, 0) / todosMiembros.filter((m) => m.fechaNacimiento).length
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
    const body = await request.json();
    const { apellido, nombre, jefeFamiliaId, estado, notas } = body;

    // Validaciones básicas
    if (!apellido) {
      return NextResponse.json(
        { error: "El apellido familiar es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el jefe de familia existe si se proporciona
    if (jefeFamiliaId && jefeFamiliaId.trim() !== "") {
      const jefeFamilia = await prisma.miembro.findUnique({
        where: { id: parseInt(jefeFamiliaId) },
      });

      if (!jefeFamilia) {
        return NextResponse.json(
          { error: "El miembro seleccionado como cabeza de familia no existe" },
          { status: 404 }
        );
      }
    }

    const nuevaFamilia = await prisma.familia.create({
      data: {
        apellido: apellido.trim(),
        nombre: parseString(nombre),
        jefeFamiliaId:
          jefeFamiliaId && jefeFamiliaId.trim() !== ""
            ? parseInt(jefeFamiliaId)
            : undefined,
        estado: parseString(estado) || "Activa",
        notas: parseString(notas),
      },
      include: {
        jefeFamilia: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            foto: true,
            fechaNacimiento: true,
            estado: true,
            parentescoFamiliar: true,
          },
        },
        miembros: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            foto: true,
            estado: true,
          },
        },
        _count: {
          select: {
            miembros: true,
          },
        },
      },
    });

    // Si se asignó un jefe de familia, actualizar el miembro para que pertenezca a esta familia
    if (jefeFamiliaId && jefeFamiliaId.trim() !== "") {
      await prisma.miembro.update({
        where: { id: parseInt(jefeFamiliaId) },
        data: {
          familiaId: nuevaFamilia.id,
          parentescoFamiliar: "Cabeza de Familia",
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
