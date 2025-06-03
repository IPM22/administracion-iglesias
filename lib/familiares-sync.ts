import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Tipos de relaciones familiares y sus equivalencias
 */
export const RELACIONES_FAMILIARES = {
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
  "Suegro/a": "Yerno/Nuera",
  "Yerno/Nuera": "Suegro/a",
  Otro: "Otro",
} as const;

/**
 * Relaciones que implican mismo núcleo familiar
 */
export const RELACIONES_NUCLEO_FAMILIAR = [
  "Esposo/a",
  "Cónyuge",
  "Hijo/a",
  "Padre",
  "Madre",
  "Hermano/a",
];

/**
 * Función para obtener la relación inversa
 */
export function obtenerRelacionInversa(relacion: string): string {
  return (
    RELACIONES_FAMILIARES[relacion as keyof typeof RELACIONES_FAMILIARES] ||
    "Otro"
  );
}

/**
 * Verifica si una relación implica que las personas deben estar en el mismo núcleo familiar
 */
export function requiereNucleoFamiliar(tipoRelacion: string): boolean {
  return RELACIONES_NUCLEO_FAMILIAR.includes(tipoRelacion);
}

/**
 * Función para determinar si una relación es recíproca (bidireccional)
 */
export function esRelacionReciproca(tipoRelacion: string): boolean {
  const relacionesReciprocas = [
    "Esposo/a",
    "Cónyuge",
    "Hermano/a",
    "Primo/a",
    "Cuñado/a",
  ];
  return relacionesReciprocas.includes(tipoRelacion);
}

/**
 * Sincroniza automáticamente el núcleo familiar cuando se agrega una relación familiar
 */
export async function sincronizarNucleoFamiliar(
  persona1Id: number,
  tipoPersona1: "miembro" | "visita",
  persona2Id: number,
  tipoPersona2: "miembro" | "visita",
  tipoRelacion: string
): Promise<{ familiaId?: number; mensaje: string }> {
  try {
    // Solo procesar si ambos son miembros y la relación requiere núcleo familiar
    if (
      tipoPersona1 !== "miembro" ||
      tipoPersona2 !== "miembro" ||
      !requiereNucleoFamiliar(tipoRelacion)
    ) {
      return { mensaje: "No requiere sincronización de núcleo familiar" };
    }

    // Obtener los miembros
    const [miembro1, miembro2] = await Promise.all([
      prisma.miembro.findUnique({
        where: { id: persona1Id },
        include: { familiaEstructurada: true },
      }),
      prisma.miembro.findUnique({
        where: { id: persona2Id },
        include: { familiaEstructurada: true },
      }),
    ]);

    if (!miembro1 || !miembro2) {
      throw new Error("Uno o ambos miembros no encontrados");
    }

    let familiaDestino: number | null = null;
    let accion = "";

    // Determinar la familia destino
    if (miembro1.familiaId && miembro2.familiaId) {
      // Ambos ya tienen familia - verificar si son la misma
      if (miembro1.familiaId === miembro2.familiaId) {
        return {
          familiaId: miembro1.familiaId,
          mensaje: "Ambos miembros ya están en la misma familia",
        };
      } else {
        // Diferentes familias - decidir cuál mantener
        familiaDestino = await decidirFamiliaDestino(
          miembro1.familiaId,
          miembro2.familiaId
        );
        accion = "fusión de familias";
      }
    } else if (miembro1.familiaId) {
      // Solo miembro1 tiene familia
      familiaDestino = miembro1.familiaId;
      accion = "agregado a familia existente";
    } else if (miembro2.familiaId) {
      // Solo miembro2 tiene familia
      familiaDestino = miembro2.familiaId;
      accion = "agregado a familia existente";
    } else {
      // Ninguno tiene familia - crear nueva
      familiaDestino = await crearNuevaFamiliaParaRelacion(
        miembro1,
        miembro2,
        tipoRelacion
      );
      accion = "nueva familia creada";
    }

    // Asignar ambos miembros a la familia destino
    await Promise.all([
      prisma.miembro.update({
        where: { id: persona1Id },
        data: {
          familiaId: familiaDestino,
          parentescoFamiliar: determinarParentesco(tipoRelacion, true),
        },
      }),
      prisma.miembro.update({
        where: { id: persona2Id },
        data: {
          familiaId: familiaDestino,
          parentescoFamiliar: determinarParentesco(
            obtenerRelacionInversa(tipoRelacion),
            false
          ),
        },
      }),
    ]);

    return {
      familiaId: familiaDestino,
      mensaje: `Núcleo familiar sincronizado: ${accion}`,
    };
  } catch (error) {
    console.error("Error sincronizando núcleo familiar:", error);
    throw error;
  }
}

/**
 * Decide qué familia mantener cuando dos miembros con familias diferentes se relacionan
 */
async function decidirFamiliaDestino(
  familiaId1: number,
  familiaId2: number
): Promise<number> {
  const [familia1, familia2] = await Promise.all([
    prisma.familia.findUnique({
      where: { id: familiaId1 },
      include: { _count: { select: { miembros: true } } },
    }),
    prisma.familia.findUnique({
      where: { id: familiaId2 },
      include: { _count: { select: { miembros: true } } },
    }),
  ]);

  if (!familia1 || !familia2) {
    throw new Error("Una de las familias no existe");
  }

  // Priorizar familia con más miembros
  if (familia1._count.miembros > familia2._count.miembros) {
    // Mover miembros de familia2 a familia1
    await moverMiembrosDeFamilia(familiaId2, familiaId1);
    await prisma.familia.delete({ where: { id: familiaId2 } });
    return familiaId1;
  } else {
    // Mover miembros de familia1 a familia2
    await moverMiembrosDeFamilia(familiaId1, familiaId2);
    await prisma.familia.delete({ where: { id: familiaId1 } });
    return familiaId2;
  }
}

/**
 * Mueve todos los miembros de una familia a otra
 */
async function moverMiembrosDeFamilia(
  familiaOrigen: number,
  familiaDestino: number
): Promise<void> {
  await prisma.miembro.updateMany({
    where: { familiaId: familiaOrigen },
    data: { familiaId: familiaDestino },
  });

  // También mover visitas si las hay
  await prisma.visita.updateMany({
    where: { familiaId: familiaOrigen },
    data: { familiaId: familiaDestino },
  });
}

/**
 * Crea una nueva familia para dos miembros relacionados
 */
async function crearNuevaFamiliaParaRelacion(
  miembro1: { id: number; apellidos: string },
  miembro2: { id: number; apellidos: string },
  tipoRelacion: string
): Promise<number> {
  // Determinar el apellido familiar y jefe de familia
  let apellidoFamiliar = "";
  let jefeFamiliaId: number | null = null;

  if (tipoRelacion === "Esposo/a" || tipoRelacion === "Cónyuge") {
    // Para matrimonios, usar el apellido del esposo/a o el primero alfabéticamente
    apellidoFamiliar = miembro1.apellidos; // Se puede mejorar esta lógica
    jefeFamiliaId = miembro1.id;
  } else if (tipoRelacion === "Padre" || tipoRelacion === "Madre") {
    // El padre/madre es el jefe de familia
    apellidoFamiliar = miembro1.apellidos;
    jefeFamiliaId = miembro1.id;
  } else if (tipoRelacion === "Hijo/a") {
    // El padre/madre (miembro2) es el jefe de familia
    apellidoFamiliar = miembro2.apellidos;
    jefeFamiliaId = miembro2.id;
  } else {
    // Para otros casos, usar el apellido más común o el primer apellido
    apellidoFamiliar = miembro1.apellidos;
    jefeFamiliaId = miembro1.id;
  }

  const nuevaFamilia = await prisma.familia.create({
    data: {
      apellido: apellidoFamiliar,
      nombre: `Familia ${apellidoFamiliar}`,
      jefeFamiliaId: jefeFamiliaId,
      estado: "Activa",
      notas: `Familia creada automáticamente por relación: ${tipoRelacion}`,
    },
  });

  return nuevaFamilia.id;
}

/**
 * Determina el parentesco familiar basado en el tipo de relación
 */
function determinarParentesco(
  tipoRelacion: string,
  esPrimario: boolean
): string {
  if (tipoRelacion === "Padre" || tipoRelacion === "Madre") {
    return esPrimario ? "Cabeza de Familia" : tipoRelacion;
  }
  if (tipoRelacion === "Esposo/a" || tipoRelacion === "Cónyuge") {
    return esPrimario ? "Cabeza de Familia" : tipoRelacion;
  }
  return tipoRelacion;
}

/**
 * Sincroniza relaciones familiares automáticamente cuando se agrega alguien a un núcleo familiar
 */
export async function sincronizarRelacionesFamiliares(
  nuevoMiembroId: number,
  familiaId: number,
  parentescoEspecificado?: string
): Promise<{ relacionesCreadas: number; mensaje: string }> {
  try {
    // Obtener todos los miembros de la familia existente
    const miembrosFamilia = await prisma.miembro.findMany({
      where: {
        familiaId: familiaId,
        id: { not: nuevoMiembroId }, // Excluir el nuevo miembro
      },
      select: { id: true, parentescoFamiliar: true },
    });

    let relacionesCreadas = 0;

    for (const miembro of miembrosFamilia) {
      const tipoRelacion = inferirRelacionFamiliar(
        parentescoEspecificado || "Familiar",
        miembro.parentescoFamiliar || "Familiar"
      );

      if (tipoRelacion && tipoRelacion !== "Sin relación") {
        // Verificar si ya existe la relación
        const relacionExiste = await prisma.relacionFamiliar.findFirst({
          where: {
            OR: [
              {
                persona1Id: nuevoMiembroId,
                tipoPersona1: "miembro",
                persona2Id: miembro.id,
                tipoPersona2: "miembro",
              },
              {
                persona1Id: miembro.id,
                tipoPersona1: "miembro",
                persona2Id: nuevoMiembroId,
                tipoPersona2: "miembro",
              },
            ],
          },
        });

        if (!relacionExiste) {
          // Crear la relación familiar
          await prisma.relacionFamiliar.create({
            data: {
              persona1Id: nuevoMiembroId,
              tipoPersona1: "miembro",
              persona2Id: miembro.id,
              tipoPersona2: "miembro",
              tipoRelacion: tipoRelacion,
              relacionInversa: obtenerRelacionInversa(tipoRelacion),
              esRecíproca: esRelacionReciproca(tipoRelacion),
              familiaContextoId: familiaId,
            },
          });

          relacionesCreadas++;
        }
      }
    }

    return {
      relacionesCreadas,
      mensaje: `Se crearon ${relacionesCreadas} relaciones familiares automáticamente`,
    };
  } catch (error) {
    console.error("Error sincronizando relaciones familiares:", error);
    throw error;
  }
}

/**
 * Infiere el tipo de relación entre dos personas basado en sus parentescos
 */
function inferirRelacionFamiliar(
  parentesco1: string,
  parentesco2: string
): string | null {
  // Matriz de relaciones basada en parentescos familiares
  const matrizRelaciones: { [key: string]: { [key: string]: string } } = {
    "Cabeza de Familia": {
      "Esposo/a": "Esposo/a",
      Cónyuge: "Cónyuge",
      "Hijo/a": "Padre/Madre",
      Padre: "Hijo/a",
      Madre: "Hijo/a",
    },
    "Esposo/a": {
      "Cabeza de Familia": "Esposo/a",
      "Hijo/a": "Padre/Madre",
    },
    Cónyuge: {
      "Cabeza de Familia": "Cónyuge",
      "Hijo/a": "Padre/Madre",
    },
    "Hijo/a": {
      "Cabeza de Familia": "Hijo/a",
      "Esposo/a": "Hijo/a",
      Cónyuge: "Hijo/a",
      "Hijo/a": "Hermano/a",
    },
    Padre: {
      "Hijo/a": "Padre",
    },
    Madre: {
      "Hijo/a": "Madre",
    },
  };

  return (
    matrizRelaciones[parentesco1]?.[parentesco2] ||
    matrizRelaciones[parentesco2]?.[parentesco1] ||
    null
  );
}

/**
 * Función para limpiar y consolidar relaciones familiares existentes
 */
export async function consolidarRelacionesFamiliares(
  familiaId?: number
): Promise<{
  relacionesCreadas: number;
  relacionesActualizadas: number;
  familiasConsolidadas: number;
}> {
  try {
    let whereClause = {};
    if (familiaId) {
      whereClause = { familiaId: familiaId };
    }

    const miembrosConFamilia = await prisma.miembro.findMany({
      where: whereClause,
      include: {
        familiaEstructurada: true,
        familiares: {
          include: { familiar: true },
        },
        familiarDe: {
          include: { miembro: true },
        },
      },
    });

    let relacionesCreadas = 0;
    const relacionesActualizadas = 0;
    let familiasConsolidadas = 0;

    for (const miembro of miembrosConFamilia) {
      // Procesar relaciones familiares directas
      for (const familiar of miembro.familiares) {
        if (requiereNucleoFamiliar(familiar.tipoRelacion)) {
          const resultado = await sincronizarNucleoFamiliar(
            miembro.id,
            "miembro",
            familiar.familiar.id,
            "miembro",
            familiar.tipoRelacion
          );

          if (resultado.familiaId) {
            familiasConsolidadas++;
          }
        }
      }

      // Si el miembro tiene familia, sincronizar relaciones con otros miembros
      if (miembro.familiaId) {
        const resultado = await sincronizarRelacionesFamiliares(
          miembro.id,
          miembro.familiaId,
          miembro.parentescoFamiliar || undefined
        );
        relacionesCreadas += resultado.relacionesCreadas;
      }
    }

    return {
      relacionesCreadas,
      relacionesActualizadas,
      familiasConsolidadas,
    };
  } catch (error) {
    console.error("Error consolidando relaciones familiares:", error);
    throw error;
  }
}
