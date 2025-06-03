import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db";

// GET - Obtener vínculos de una familia
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

    // Obtener vínculos donde esta familia es origen o relacionada
    const vinculos = await prisma.vinculoFamiliar.findMany({
      where: {
        OR: [
          { familiaOrigenId: familiaId },
          { familiaRelacionadaId: familiaId },
        ],
      },
      include: {
        familiaOrigen: {
          select: {
            id: true,
            apellido: true,
            nombre: true,
            estado: true,
            jefeFamilia: {
              select: {
                id: true,
                nombres: true,
                apellidos: true,
                foto: true,
              },
            },
          },
        },
        familiaRelacionada: {
          select: {
            id: true,
            apellido: true,
            nombre: true,
            estado: true,
            jefeFamilia: {
              select: {
                id: true,
                nombres: true,
                apellidos: true,
                foto: true,
              },
            },
          },
        },
        miembroVinculo: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            foto: true,
          },
        },
      },
    });

    return NextResponse.json(vinculos);
  } catch (error) {
    console.error("Error al obtener vínculos familiares:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST - Crear vínculo entre familias
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const familiaOrigenId = parseInt(id);

    if (isNaN(familiaOrigenId)) {
      return NextResponse.json(
        { error: "ID de familia inválido" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { familiaRelacionadaId, tipoVinculo, descripcion, miembroVinculoId } =
      body;

    // Validaciones
    if (!familiaRelacionadaId || !tipoVinculo) {
      return NextResponse.json(
        { error: "Familia relacionada y tipo de vínculo son requeridos" },
        { status: 400 }
      );
    }

    if (familiaOrigenId === familiaRelacionadaId) {
      return NextResponse.json(
        { error: "Una familia no puede vincularse consigo misma" },
        { status: 400 }
      );
    }

    // Verificar que ambas familias existen
    const [familiaOrigen, familiaRelacionada] = await Promise.all([
      prisma.familia.findUnique({ where: { id: familiaOrigenId } }),
      prisma.familia.findUnique({ where: { id: familiaRelacionadaId } }),
    ]);

    if (!familiaOrigen || !familiaRelacionada) {
      return NextResponse.json(
        { error: "Una o ambas familias no existen" },
        { status: 404 }
      );
    }

    // Verificar que no existe ya un vínculo entre estas familias
    const vinculoExistente = await prisma.vinculoFamiliar.findFirst({
      where: {
        OR: [
          {
            familiaOrigenId: familiaOrigenId,
            familiaRelacionadaId: familiaRelacionadaId,
          },
          {
            familiaOrigenId: familiaRelacionadaId,
            familiaRelacionadaId: familiaOrigenId,
          },
        ],
      },
    });

    if (vinculoExistente) {
      return NextResponse.json(
        { error: "Ya existe un vínculo entre estas familias" },
        { status: 409 }
      );
    }

    // Validar que el miembro conector pertenezca a una de las familias vinculadas
    if (miembroVinculoId) {
      const miembroVinculo = await prisma.miembro.findUnique({
        where: { id: miembroVinculoId },
        select: { id: true, familiaId: true, nombres: true, apellidos: true },
      });

      if (!miembroVinculo) {
        return NextResponse.json(
          { error: "El miembro conector no existe" },
          { status: 404 }
        );
      }

      // Verificar que el miembro pertenezca a una de las familias que se están vinculando
      if (
        miembroVinculo.familiaId !== familiaOrigenId &&
        miembroVinculo.familiaId !== familiaRelacionadaId
      ) {
        return NextResponse.json(
          {
            error:
              "El miembro conector debe pertenecer a una de las familias que se están vinculando",
          },
          { status: 400 }
        );
      }
    }

    // Crear el vínculo
    const nuevoVinculo = await prisma.vinculoFamiliar.create({
      data: {
        familiaOrigenId,
        familiaRelacionadaId,
        tipoVinculo,
        descripcion,
        miembroVinculoId,
      },
      include: {
        familiaOrigen: {
          select: {
            id: true,
            apellido: true,
            nombre: true,
            estado: true,
          },
        },
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
    });

    return NextResponse.json(nuevoVinculo, { status: 201 });
  } catch (error) {
    console.error("Error al crear vínculo familiar:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
