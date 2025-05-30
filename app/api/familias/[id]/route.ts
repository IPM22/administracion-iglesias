import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

// Helper function para manejar strings vacíos
function parseString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }
  return value as string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const familiaId = parseInt(id);

    if (isNaN(familiaId)) {
      return NextResponse.json(
        { error: "ID de familia inválido" },
        { status: 400 }
      );
    }

    const familia = await prisma.familia.findUnique({
      where: { id: familiaId },
      include: {
        jefeFamilia: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            foto: true,
            fechaNacimiento: true,
            correo: true,
            telefono: true,
          },
        },
        miembros: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            correo: true,
            telefono: true,
            celular: true,
            fechaNacimiento: true,
            sexo: true,
            estado: true,
            foto: true,
            fechaIngreso: true,
            parentescoFamiliar: true,
          },
          orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
        },
        visitas: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            correo: true,
            telefono: true,
            celular: true,
            fechaNacimiento: true,
            sexo: true,
            estado: true,
            foto: true,
            fechaPrimeraVisita: true,
            parentescoFamiliar: true,
          },
          orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
        },
        _count: {
          select: {
            miembros: true,
          },
        },
        vinculosOrigen: {
          include: {
            familiaRelacionada: {
              select: {
                id: true,
                apellido: true,
                nombre: true,
                estado: true,
              },
            },
            miembroVinculo: {
              select: {
                id: true,
                nombres: true,
                apellidos: true,
              },
            },
          },
        },
        vinculosRelacionados: {
          include: {
            familiaOrigen: {
              select: {
                id: true,
                apellido: true,
                nombre: true,
                estado: true,
              },
            },
            miembroVinculo: {
              select: {
                id: true,
                nombres: true,
                apellidos: true,
              },
            },
          },
        },
      },
    });

    if (!familia) {
      return NextResponse.json(
        { error: "Familia no encontrada" },
        { status: 404 }
      );
    }

    // Calcular estadísticas
    const miembrosActivos = familia.miembros.filter(
      (m) => m.estado === "Activo"
    ).length;

    const visitasActivas = familia.visitas.filter(
      (v) => v.estado === "Activa"
    ).length;

    const todasPersonas = [...familia.miembros, ...familia.visitas];
    const totalPersonas = todasPersonas.length;
    const personasActivas = miembrosActivos + visitasActivas;

    const edadPromedio =
      todasPersonas.length > 0
        ? todasPersonas
            .filter((p) => p.fechaNacimiento)
            .reduce((acc, p) => {
              const edad =
                new Date().getFullYear() -
                new Date(p.fechaNacimiento!).getFullYear();
              return acc + edad;
            }, 0) / todasPersonas.filter((p) => p.fechaNacimiento).length
        : 0;

    const familiaConEstadisticas = {
      ...familia,
      totalMiembros: familia.miembros.length,
      totalVisitas: familia.visitas.length,
      totalPersonas,
      miembrosActivos,
      visitasActivas,
      personasActivas,
      edadPromedio,
    };

    return NextResponse.json(familiaConEstadisticas);
  } catch (error) {
    console.error("Error al obtener familia:", error);
    return NextResponse.json(
      { error: "Error al obtener la familia" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const familiaId = parseInt(id);

    if (isNaN(familiaId)) {
      return NextResponse.json(
        { error: "ID de familia inválido" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      apellido,
      nombre,
      direccion,
      telefono,
      celular,
      email,
      jefeFamiliaId,
      estado,
      notas,
    } = body;

    // Validaciones básicas
    if (!apellido) {
      return NextResponse.json(
        { error: "El apellido familiar es requerido" },
        { status: 400 }
      );
    }

    // Verificar que la familia existe
    const familiaExistente = await prisma.familia.findUnique({
      where: { id: familiaId },
    });

    if (!familiaExistente) {
      return NextResponse.json(
        { error: "Familia no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que el jefe de familia existe si se proporciona
    if (jefeFamiliaId) {
      const jefeFamilia = await prisma.miembro.findUnique({
        where: { id: parseInt(jefeFamiliaId) },
      });

      if (!jefeFamilia) {
        return NextResponse.json(
          { error: "El miembro seleccionado como jefe de familia no existe" },
          { status: 404 }
        );
      }
    }

    const familiaActualizada = await prisma.familia.update({
      where: { id: familiaId },
      data: {
        apellido: apellido.trim(),
        nombre: parseString(nombre),
        direccion: parseString(direccion),
        telefono: parseString(telefono),
        celular: parseString(celular),
        email: parseString(email),
        jefeFamiliaId: jefeFamiliaId ? parseInt(jefeFamiliaId) : null,
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

    return NextResponse.json(familiaActualizada);
  } catch (error: unknown) {
    console.error("Error al actualizar familia:", error);
    return NextResponse.json(
      { error: "Error al actualizar la familia" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const familiaId = parseInt(id);

    if (isNaN(familiaId)) {
      return NextResponse.json(
        { error: "ID de familia inválido" },
        { status: 400 }
      );
    }

    // Verificar que la familia existe
    const familiaExistente = await prisma.familia.findUnique({
      where: { id: familiaId },
      include: {
        miembros: true,
      },
    });

    if (!familiaExistente) {
      return NextResponse.json(
        { error: "Familia no encontrada" },
        { status: 404 }
      );
    }

    // Verificar si la familia tiene miembros asociados
    if (familiaExistente.miembros.length > 0) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar la familia porque tiene miembros asociados. Primero desasocie los miembros.",
        },
        { status: 400 }
      );
    }

    await prisma.familia.delete({
      where: { id: familiaId },
    });

    return NextResponse.json(
      { message: "Familia eliminada exitosamente" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error al eliminar familia:", error);
    return NextResponse.json(
      { error: "Error al eliminar la familia" },
      { status: 500 }
    );
  }
}
