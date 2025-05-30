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

    return NextResponse.json(vinculos);
  } catch (error) {
    console.error("Error al obtener vínculos familiares:", error);
    return NextResponse.json(
      { error: "Error al obtener vínculos familiares" },
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

    if (!familiaRelacionadaId || !tipoVinculo) {
      return NextResponse.json(
        { error: "Familia relacionada y tipo de vínculo son requeridos" },
        { status: 400 }
      );
    }

    // Verificar que ambas familias existen
    const [familiaOrigen, familiaRelacionada] = await Promise.all([
      prisma.familia.findUnique({ where: { id: familiaOrigenId } }),
      prisma.familia.findUnique({
        where: { id: parseInt(familiaRelacionadaId) },
      }),
    ]);

    if (!familiaOrigen || !familiaRelacionada) {
      return NextResponse.json(
        { error: "Una o ambas familias no existen" },
        { status: 404 }
      );
    }

    // Verificar que no es la misma familia
    if (familiaOrigenId === parseInt(familiaRelacionadaId)) {
      return NextResponse.json(
        { error: "No se puede vincular una familia consigo misma" },
        { status: 400 }
      );
    }

    // Verificar si el vínculo ya existe
    const vinculoExistente = await prisma.vinculoFamiliar.findFirst({
      where: {
        OR: [
          {
            familiaOrigenId: familiaOrigenId,
            familiaRelacionadaId: parseInt(familiaRelacionadaId),
          },
          {
            familiaOrigenId: parseInt(familiaRelacionadaId),
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

    // Crear el vínculo
    const nuevoVinculo = await prisma.vinculoFamiliar.create({
      data: {
        familiaOrigenId: familiaOrigenId,
        familiaRelacionadaId: parseInt(familiaRelacionadaId),
        tipoVinculo,
        descripcion: descripcion || null,
        miembroVinculoId: miembroVinculoId ? parseInt(miembroVinculoId) : null,
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
      { error: "Error al crear vínculo familiar" },
      { status: 500 }
    );
  }
}
