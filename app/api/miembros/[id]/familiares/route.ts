import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
  sincronizarNucleoFamiliar,
  obtenerRelacionInversa,
  esRelacionReciproca,
} from "../../../../../lib/familiares-sync";

const prisma = new PrismaClient();

interface RelacionFamiliar {
  id: number;
  persona1Id: number;
  tipoPersona1: string;
  persona2Id: number;
  tipoPersona2: string;
  tipoRelacion: string;
  relacionInversa: string | null;
  esRecíproca: boolean;
  familiaContextoId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PersonaRelacion {
  id: number;
  nombres: string;
  apellidos: string;
  foto: string | null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const miembroId = parseInt(id);

    if (!miembroId || isNaN(miembroId)) {
      return NextResponse.json(
        { error: "ID de miembro inválido" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { personaId, tipoPersona, tipoRelacion } = body;

    // Validaciones
    if (!personaId || !tipoPersona || !tipoRelacion) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    if (tipoPersona !== "miembro" && tipoPersona !== "visita") {
      return NextResponse.json(
        { error: "Tipo de persona inválido" },
        { status: 400 }
      );
    }

    // Verificar que el miembro existe
    const miembro = await prisma.miembro.findUnique({
      where: { id: miembroId },
    });

    if (!miembro) {
      return NextResponse.json(
        { error: "Miembro no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que la persona existe según su tipo
    let persona = null;
    if (tipoPersona === "miembro") {
      persona = await prisma.miembro.findUnique({
        where: { id: personaId },
      });
    } else {
      persona = await prisma.visita.findUnique({
        where: { id: personaId },
      });
    }

    if (!persona) {
      return NextResponse.json(
        {
          error: `${
            tipoPersona === "miembro" ? "Miembro" : "Visita"
          } no encontrado`,
        },
        { status: 404 }
      );
    }

    // Verificar que no son la misma persona (solo aplica si ambos son miembros)
    if (tipoPersona === "miembro" && miembroId === personaId) {
      return NextResponse.json(
        { error: "Un miembro no puede ser familiar de sí mismo" },
        { status: 400 }
      );
    }

    // Verificar si ya existe una relación familiar en la nueva tabla
    const relacionExistente = await prisma.relacionFamiliar.findFirst({
      where: {
        OR: [
          {
            persona1Id: miembroId,
            tipoPersona1: "miembro",
            persona2Id: personaId,
            tipoPersona2: tipoPersona,
          },
          {
            persona1Id: personaId,
            tipoPersona1: tipoPersona,
            persona2Id: miembroId,
            tipoPersona2: "miembro",
          },
        ],
      },
    });

    if (relacionExistente) {
      return NextResponse.json(
        { error: "Esta relación familiar ya existe" },
        { status: 400 }
      );
    }

    // Obtener la familia del miembro si existe para contexto
    const familiaContextoId = miembro.familiaId;

    // Determinar si la relación es recíproca y la relación inversa
    const esReciproca = esRelacionReciproca(tipoRelacion);
    const relacionInversa = obtenerRelacionInversa(tipoRelacion);

    // Crear la relación familiar en la nueva tabla
    const nuevaRelacion = await prisma.relacionFamiliar.create({
      data: {
        persona1Id: miembroId,
        tipoPersona1: "miembro",
        persona2Id: personaId,
        tipoPersona2: tipoPersona,
        tipoRelacion: tipoRelacion,
        relacionInversa: relacionInversa,
        esRecíproca: esReciproca,
        familiaContextoId: familiaContextoId,
      },
    });

    // **NUEVA FUNCIONALIDAD: Sincronización automática del núcleo familiar**
    let mensajeSincronizacion = "";
    try {
      const resultadoSync = await sincronizarNucleoFamiliar(
        miembroId,
        "miembro",
        personaId,
        tipoPersona,
        tipoRelacion
      );
      mensajeSincronizacion = resultadoSync.mensaje;
    } catch (syncError) {
      console.error("Error en sincronización automática:", syncError);
      mensajeSincronizacion =
        "Relación creada, pero hubo un problema con la sincronización del núcleo familiar";
    }

    // También mantener compatibilidad con la tabla antigua si ambos son miembros
    if (tipoPersona === "miembro") {
      try {
        await prisma.familiarMiembro.create({
          data: {
            miembroId: miembroId,
            familiarId: personaId,
            tipoRelacion: tipoRelacion,
          },
        });
      } catch {
        // Si falla, no importa, ya tenemos la relación en la nueva tabla
        console.log(
          "No se pudo crear en tabla legacy, pero relación creada en nueva tabla"
        );
      }
    }

    return NextResponse.json(
      {
        relacion: nuevaRelacion,
        sincronizacion: mensajeSincronizacion,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating familiar relation:", error);
    return NextResponse.json(
      { error: "Error al crear la relación familiar" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const miembroId = parseInt(id);

    if (!miembroId || isNaN(miembroId)) {
      return NextResponse.json(
        { error: "ID de miembro inválido" },
        { status: 400 }
      );
    }

    // Obtener relaciones de la nueva tabla
    const relacionesNuevas = await prisma.relacionFamiliar.findMany({
      where: {
        OR: [
          {
            persona1Id: miembroId,
            tipoPersona1: "miembro",
          },
          {
            persona2Id: miembroId,
            tipoPersona2: "miembro",
          },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Procesar las relaciones para obtener la información completa
    const relacionesProcesadas = await Promise.all(
      relacionesNuevas.map(async (relacion: RelacionFamiliar) => {
        let persona: PersonaRelacion | null, tipoRelacionFinal: string;

        if (relacion.persona1Id === miembroId) {
          // El miembro es persona1, buscar persona2
          if (relacion.tipoPersona2 === "miembro") {
            persona = await prisma.miembro.findUnique({
              where: { id: relacion.persona2Id },
              select: { id: true, nombres: true, apellidos: true, foto: true },
            });
          } else {
            persona = await prisma.visita.findUnique({
              where: { id: relacion.persona2Id },
              select: { id: true, nombres: true, apellidos: true, foto: true },
            });
          }
          tipoRelacionFinal = relacion.tipoRelacion;
        } else {
          // El miembro es persona2, buscar persona1
          if (relacion.tipoPersona1 === "miembro") {
            persona = await prisma.miembro.findUnique({
              where: { id: relacion.persona1Id },
              select: { id: true, nombres: true, apellidos: true, foto: true },
            });
          } else {
            persona = await prisma.visita.findUnique({
              where: { id: relacion.persona1Id },
              select: { id: true, nombres: true, apellidos: true, foto: true },
            });
          }
          tipoRelacionFinal = relacion.relacionInversa || relacion.tipoRelacion;
        }

        if (!persona) return null;

        return {
          id: relacion.id,
          tipoRelacion: tipoRelacionFinal,
          persona: {
            ...persona,
            tipo:
              relacion.persona1Id === miembroId
                ? relacion.tipoPersona2
                : relacion.tipoPersona1,
          },
          createdAt: relacion.createdAt,
        };
      })
    );

    // Filtrar nulls
    const relacionesValidas = relacionesProcesadas.filter(
      (r): r is NonNullable<typeof r> => r !== null
    );

    return NextResponse.json(relacionesValidas);
  } catch (error) {
    console.error("Error al obtener familiares del miembro:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
