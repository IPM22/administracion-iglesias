import { prisma } from "../../../../lib/db";
import { NextRequest, NextResponse } from "next/server";
import { parseDateForAPI } from "@/lib/date-utils";

// Interfaz para familiares consolidados
interface FamiliarConsolidado {
  id: string | number;
  familiar: {
    id: number;
    nombres: string;
    apellidos: string;
    foto?: string | null;
    estado?: string | null;
  };
  tipoRelacion: string;
  fuente: "directa" | "inversa" | "familia";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const miembroId = parseInt(id);

    if (isNaN(miembroId)) {
      return NextResponse.json(
        { error: "ID de miembro inválido" },
        { status: 400 }
      );
    }

    const miembro = await prisma.miembro.findUnique({
      where: {
        id: miembroId,
      },
      include: {
        ministerios: {
          where: {
            estado: "Activo",
          },
          include: {
            ministerio: {
              select: {
                id: true,
                nombre: true,
                descripcion: true,
              },
            },
          },
          orderBy: {
            fechaInicio: "desc",
          },
        },
        familiares: {
          include: {
            familiar: {
              select: {
                id: true,
                nombres: true,
                apellidos: true,
                foto: true,
                estado: true,
              },
            },
          },
          orderBy: [
            { familiar: { apellidos: "asc" } },
            { familiar: { nombres: "asc" } },
          ],
        },
        familiarDe: {
          include: {
            miembro: {
              select: {
                id: true,
                nombres: true,
                apellidos: true,
                foto: true,
                estado: true,
              },
            },
          },
          orderBy: [
            { miembro: { apellidos: "asc" } },
            { miembro: { nombres: "asc" } },
          ],
        },
        familiaEstructurada: {
          include: {
            miembros: {
              where: {
                id: {
                  not: miembroId, // Excluir el miembro actual
                },
              },
              select: {
                id: true,
                nombres: true,
                apellidos: true,
                foto: true,
                estado: true,
                parentescoFamiliar: true,
              },
              orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
            },
          },
        },
        visitaOriginal: true, // Para saber si era una visita convertida
      },
    });

    if (!miembro) {
      return NextResponse.json(
        { error: "Miembro no encontrado" },
        { status: 404 }
      );
    }

    // Obtener visitas invitadas por este miembro
    const visitasInvitadas = await prisma.visita.findMany({
      where: {
        historialVisitas: {
          some: {
            invitadoPorId: miembroId,
          },
        },
        estado: {
          not: "Convertida",
        },
      },
      include: {
        historialVisitas: {
          where: {
            invitadoPorId: miembroId,
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
    });

    // Procesar las visitas invitadas para incluir el total de visitas
    const visitasConTotal = visitasInvitadas.map((visita) => ({
      ...visita,
      totalVisitas: visita.historialVisitas?.length || 0,
      historialVisitas: undefined, // Removemos este campo para no enviarlo
    }));

    // Consolidar familiares de todas las fuentes
    const familiaresCombinados: FamiliarConsolidado[] = [];

    // Familiares directos (donde este miembro es el principal)
    if (miembro.familiares) {
      miembro.familiares.forEach((rel) => {
        familiaresCombinados.push({
          id: rel.id,
          familiar: rel.familiar,
          tipoRelacion: rel.tipoRelacion,
          fuente: "directa",
        });
      });
    }

    // Familiares inversos (donde este miembro es el familiar)
    if (miembro.familiarDe) {
      miembro.familiarDe.forEach((rel) => {
        familiaresCombinados.push({
          id: rel.id,
          familiar: rel.miembro,
          tipoRelacion: obtenerRelacionInversa(rel.tipoRelacion),
          fuente: "inversa",
        });
      });
    }

    // Miembros de la misma familia estructurada
    if (miembro.familiaEstructurada?.miembros) {
      miembro.familiaEstructurada.miembros.forEach((familiar) => {
        // Evitar duplicados
        const yaExiste = familiaresCombinados.some(
          (f) => f.familiar.id === familiar.id
        );
        if (!yaExiste) {
          familiaresCombinados.push({
            id: `familia-${familiar.id}`,
            familiar: {
              id: familiar.id,
              nombres: familiar.nombres,
              apellidos: familiar.apellidos,
              foto: familiar.foto,
              estado: familiar.estado,
            },
            tipoRelacion: familiar.parentescoFamiliar || "Familiar",
            fuente: "familia",
          });
        }
      });
    }

    const miembroCompleto = {
      ...miembro,
      familiares: familiaresCombinados,
      familiarDe: undefined, // Remover para limpiar la respuesta
      familiaEstructurada: miembro.familiaEstructurada
        ? {
            ...miembro.familiaEstructurada,
            miembros: undefined, // Ya procesado en familiares
          }
        : undefined,
      visitasInvitadas: visitasConTotal,
    };

    return NextResponse.json(miembroCompleto);
  } catch (error) {
    console.error("Error al obtener miembro:", error);
    return NextResponse.json(
      { error: "Error al obtener el miembro" },
      { status: 500 }
    );
  }
}

// Función auxiliar para obtener la relación inversa
function obtenerRelacionInversa(tipoRelacion: string): string {
  const relaciones: { [key: string]: string } = {
    "Esposo/a": "Esposo/a",
    Cónyuge: "Cónyuge",
    "Hijo/a": "Padre/Madre",
    Padre: "Hijo/a",
    Madre: "Hijo/a",
    "Hermano/a": "Hermano/a",
    "Abuelo/a": "Nieto/a",
    "Nieto/a": "Abuelo/a",
    "Tío/a": "Sobrino/a",
    "Sobrino/a": "Tío/a",
    "Primo/a": "Primo/a",
    "Cuñado/a": "Cuñado/a",
    Yerno: "Suegro",
    Nuera: "Suegra",
    Suegro: "Yerno",
    Suegra: "Nuera",
  };

  return relaciones[tipoRelacion] || "Familiar";
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const miembroId = parseInt(id);

    if (isNaN(miembroId)) {
      return NextResponse.json(
        { error: "ID de miembro inválido" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      nombres,
      apellidos,
      correo,
      telefono,
      celular,
      direccion,
      fechaNacimiento,
      sexo,
      estadoCivil,
      ocupacion,
      familia,
      fechaIngreso,
      fechaBautismo,
      estado,
      foto,
      notasAdicionales,
    } = body;

    // Validar campos requeridos
    if (!nombres || !apellidos) {
      return NextResponse.json(
        { error: "Los nombres y apellidos son requeridos" },
        { status: 400 }
      );
    }

    // Función para manejar strings vacías
    const parseString = (value: string) => {
      if (!value || value.trim() === "") {
        return null;
      }
      return value.trim();
    };

    // Función especial para el correo (debe ser null si está vacío debido a la restricción unique)
    const parseEmail = (email: string) => {
      if (!email || email.trim() === "") {
        return null;
      }
      return email.trim();
    };

    // Verificar si ya existe otro miembro con los mismos nombres y apellidos
    const nombresLimpio = nombres.trim().toLowerCase();
    const apellidosLimpio = apellidos.trim().toLowerCase();

    const miembroExistente = await prisma.miembro.findFirst({
      where: {
        AND: [
          {
            nombres: {
              equals: nombresLimpio,
              mode: "insensitive",
            },
          },
          {
            apellidos: {
              equals: apellidosLimpio,
              mode: "insensitive",
            },
          },
          {
            id: {
              not: miembroId,
            },
          },
        ],
      },
    });

    if (miembroExistente) {
      return NextResponse.json(
        {
          error: `Ya existe otro miembro con el nombre ${nombres} ${apellidos}`,
        },
        { status: 409 }
      );
    }

    const miembro = await prisma.miembro.update({
      where: {
        id: miembroId,
      },
      data: {
        nombres: nombres?.trim() || "",
        apellidos: apellidos?.trim() || "",
        correo: parseEmail(correo),
        telefono: parseString(telefono),
        celular: parseString(celular),
        direccion: parseString(direccion),
        fechaNacimiento: parseDateForAPI(fechaNacimiento),
        sexo: parseString(sexo),
        estadoCivil: parseString(estadoCivil),
        ocupacion: parseString(ocupacion),
        familia: parseString(familia),
        fechaIngreso: parseDateForAPI(fechaIngreso),
        fechaBautismo: parseDateForAPI(fechaBautismo),
        estado: parseString(estado) || "Activo",
        foto: parseString(foto),
        notasAdicionales: parseString(notasAdicionales),
      },
      include: {
        ministerios: {
          where: {
            estado: "Activo",
          },
          include: {
            ministerio: {
              select: {
                nombre: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(miembro);
  } catch (error) {
    console.error("Error al actualizar miembro:", error);
    return NextResponse.json(
      { error: "Error al actualizar el miembro" },
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
    const miembroId = parseInt(id);

    if (isNaN(miembroId)) {
      return NextResponse.json(
        { error: "ID de miembro inválido" },
        { status: 400 }
      );
    }

    // Verificar si el miembro existe
    const miembroExistente = await prisma.miembro.findUnique({
      where: {
        id: miembroId,
      },
    });

    if (!miembroExistente) {
      return NextResponse.json(
        { error: "Miembro no encontrado" },
        { status: 404 }
      );
    }

    // Eliminar el miembro
    await prisma.miembro.delete({
      where: {
        id: miembroId,
      },
    });

    return NextResponse.json(
      { message: "Miembro eliminado correctamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al eliminar miembro:", error);
    return NextResponse.json(
      { error: "Error al eliminar el miembro" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const miembroId = parseInt(id);

    if (isNaN(miembroId)) {
      return NextResponse.json(
        { error: "ID de miembro inválido" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { familiaId, parentescoFamiliar } = body;

    // Verificar que el miembro existe
    const miembroExistente = await prisma.miembro.findUnique({
      where: { id: miembroId },
    });

    if (!miembroExistente) {
      return NextResponse.json(
        { error: "Miembro no encontrado" },
        { status: 404 }
      );
    }

    // Actualizar solo los campos proporcionados
    const dataToUpdate: {
      familiaId?: number | null;
      parentescoFamiliar?: string | null;
    } = {};

    if (familiaId !== undefined) {
      dataToUpdate.familiaId = familiaId;
    }

    if (parentescoFamiliar !== undefined) {
      dataToUpdate.parentescoFamiliar = parentescoFamiliar;
    }

    const miembroActualizado = await prisma.miembro.update({
      where: { id: miembroId },
      data: dataToUpdate,
    });

    return NextResponse.json(miembroActualizado);
  } catch (error) {
    console.error("Error al actualizar miembro:", error);
    return NextResponse.json(
      { error: "Error al actualizar el miembro" },
      { status: 500 }
    );
  }
}
