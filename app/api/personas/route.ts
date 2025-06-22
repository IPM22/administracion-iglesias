import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";
import {
  crearPersonaSchema,
  filtrosPersonaSchema,
} from "@/src/lib/validations/persona";
import {
  aplicarReglasAutomaticas,
  calcularTipoPersonaAutomatico,
} from "@/src/lib/services/persona-automation";

const prisma = new PrismaClient();

interface WhereClause {
  tipo?: string | { in: string[] };
  rol?: string;
  estado?: string;
  familiaId?: number;
  sexo?: string;
  estadoCivil?: string;
  fechaBautismo?: { not: null } | null;
  fechaNacimiento?: {
    gte?: Date;
    lte?: Date;
  };
  OR?: Array<{
    nombres?: { contains: string; mode: "insensitive" };
    apellidos?: { contains: string; mode: "insensitive" };
    correo?: { contains: string; mode: "insensitive" };
    telefono?: { contains: string };
    celular?: { contains: string };
  }>;
}

// GET /api/personas - Obtener personas con filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parsear filtros
    const filtros = {
      tipo: searchParams.get("tipo") || undefined,
      rol: searchParams.get("rol") || undefined,
      estado: searchParams.get("estado") || undefined,
      familiaId: searchParams.get("familiaId")
        ? parseInt(searchParams.get("familiaId")!)
        : undefined,
      edadMin: searchParams.get("edadMin")
        ? parseInt(searchParams.get("edadMin")!)
        : undefined,
      edadMax: searchParams.get("edadMax")
        ? parseInt(searchParams.get("edadMax")!)
        : undefined,
      genero: searchParams.get("genero") || undefined,
      estadoCivil: searchParams.get("estadoCivil") || undefined,
      conBautismo:
        searchParams.get("conBautismo") === "true"
          ? true
          : searchParams.get("conBautismo") === "false"
          ? false
          : undefined,
      busqueda: searchParams.get("busqueda") || undefined,
    };

    // Validar filtros
    const filtrosValidados = filtrosPersonaSchema.parse(filtros);

    // Construir where clause
    const where: Prisma.PersonaWhereInput = {};

    if (filtrosValidados.tipo) {
      // Manejar múltiples tipos separados por coma
      if (filtrosValidados.tipo.includes(",")) {
        where.tipo = { in: filtrosValidados.tipo.split(",") as any };
      } else {
        where.tipo = filtrosValidados.tipo as any;
      }
    }

    if (filtrosValidados.rol) {
      where.rol = filtrosValidados.rol as any;
    }

    if (filtrosValidados.estado) {
      where.estado = filtrosValidados.estado as any;
    }

    if (filtrosValidados.familiaId) {
      where.familiaId = filtrosValidados.familiaId;
    }

    if (filtrosValidados.genero) {
      where.sexo = filtrosValidados.genero;
    }

    if (filtrosValidados.estadoCivil) {
      where.estadoCivil = filtrosValidados.estadoCivil;
    }

    if (filtrosValidados.conBautismo !== undefined) {
      where.fechaBautismo = filtrosValidados.conBautismo ? { not: null } : null;
    }

    // Filtro de búsqueda por texto
    if (filtrosValidados.busqueda) {
      const busqueda = filtrosValidados.busqueda.toLowerCase();
      where.OR = [
        { nombres: { contains: busqueda, mode: "insensitive" } },
        { apellidos: { contains: busqueda, mode: "insensitive" } },
        { correo: { contains: busqueda, mode: "insensitive" } },
        { telefono: { contains: busqueda } },
        { celular: { contains: busqueda } },
      ];
    }

    // Filtro por edad (requiere cálculo)
    if (filtrosValidados.edadMin || filtrosValidados.edadMax) {
      const now = new Date();
      const fechaNacimientoFilter: any = {};

      if (filtrosValidados.edadMax) {
        const minFechaNacimiento = new Date(
          now.getFullYear() - filtrosValidados.edadMax - 1,
          now.getMonth(),
          now.getDate()
        );
        fechaNacimientoFilter.gte = minFechaNacimiento;
      }
      if (filtrosValidados.edadMin) {
        const maxFechaNacimiento = new Date(
          now.getFullYear() - filtrosValidados.edadMin,
          now.getMonth(),
          now.getDate()
        );
        fechaNacimientoFilter.lte = maxFechaNacimiento;
      }

      where.fechaNacimiento = fechaNacimientoFilter;
    }

    // Paginación
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // Obtener personas
    const [personas, total] = await Promise.all([
      prisma.persona.findMany({
        where,
        include: {
          familia: {
            select: {
              id: true,
              apellido: true,
              nombre: true,
            },
          },
          ministerios: {
            include: {
              ministerio: {
                select: {
                  nombre: true,
                  colorHex: true,
                },
              },
            },
          },
          _count: {
            select: {
              historialVisitas: true,
            },
          },
        },
        orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
        skip,
        take: limit,
      }),
      prisma.persona.count({ where }),
    ]);

    return NextResponse.json({
      personas,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error obteniendo personas:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST /api/personas - Crear nueva persona
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar datos de entrada
    const datosValidados = crearPersonaSchema.parse(body);

    // Determinar tipo si se proporciona fecha de nacimiento
    let tipoFinal = datosValidados.tipo;
    if (datosValidados.fechaNacimiento && !datosValidados.tipo) {
      tipoFinal = calcularTipoPersonaAutomatico(
        new Date(datosValidados.fechaNacimiento)
      );
    }

    // Aplicar reglas automáticas si no se especifican rol y estado
    let rolFinal = datosValidados.rol;
    let estadoFinal = datosValidados.estado;

    if (!rolFinal || !estadoFinal) {
      const reglas = aplicarReglasAutomaticas(
        tipoFinal as any,
        datosValidados.fechaBautismo
          ? new Date(datosValidados.fechaBautismo)
          : null,
        datosValidados.fechaIngreso
          ? new Date(datosValidados.fechaIngreso)
          : null
      );
      rolFinal = rolFinal || reglas.rol;
      estadoFinal = estadoFinal || reglas.estado;
    }

    // Crear persona
    const persona = await prisma.persona.create({
      data: {
        ...datosValidados,
        tipo: tipoFinal as any,
        rol: rolFinal as any,
        estado: estadoFinal as any,
      },
      include: {
        familia: {
          select: {
            id: true,
            apellido: true,
            nombre: true,
          },
        },
        ministerios: {
          include: {
            ministerio: {
              select: {
                nombre: true,
                colorHex: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ persona }, { status: 201 });
  } catch (error) {
    console.error("Error creando persona:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
