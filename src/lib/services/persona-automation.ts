import { PrismaClient } from "@prisma/client";
import type { TipoPersona, RolPersona, EstadoPersona } from "@prisma/client";

// Función para obtener la instancia de Prisma
function getPrismaClient() {
  return new PrismaClient();
}

/**
 * Calcula el tipo de persona basado en la fecha de nacimiento
 */
export function calcularTipoPersonaAutomatico(
  fechaNacimiento: Date
): TipoPersona {
  const hoy = new Date();
  const edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
  const mesActual = hoy.getMonth();
  const mesNacimiento = fechaNacimiento.getMonth();

  // Ajustar edad si aún no ha pasado el cumpleaños este año
  const edadAjustada =
    mesActual < mesNacimiento ||
    (mesActual === mesNacimiento && hoy.getDate() < fechaNacimiento.getDate())
      ? edad - 1
      : edad;

  if (edadAjustada <= 9) return "NINO";
  if (edadAjustada <= 14) return "ADOLESCENTE";
  if (edadAjustada <= 24) return "JOVEN";
  if (edadAjustada <= 35) return "ADULTO";
  if (edadAjustada <= 59) return "ADULTO_MAYOR";
  return "ENVEJECIENTE";
}

/**
 * Aplica reglas automáticas para determinar rol y estado
 */
export function aplicarReglasAutomaticas(
  tipo: TipoPersona,
  fechaBautismo?: Date | null,
  fechaIngreso?: Date | null
): { rol: RolPersona; estado: EstadoPersona } {
  // Regla 1: Si tiene fecha de bautismo -> MIEMBRO y ACTIVA
  if (fechaBautismo) {
    return { rol: "MIEMBRO", estado: "ACTIVA" };
  }

  // Regla 2: Si tiene fecha de ingreso -> MIEMBRO (puede estar sin bautizar)
  if (fechaIngreso) {
    return { rol: "MIEMBRO", estado: "ACTIVA" };
  }

  // Regla 3: Por defecto para niños -> MIEMBRO y ACTIVA (niños de familias cristianas)
  if (tipo === "NINO") {
    return { rol: "MIEMBRO", estado: "ACTIVA" };
  }

  // Regla 4: Adolescentes sin bautismo ni ingreso -> VISITA y RECURRENTE
  if (tipo === "ADOLESCENTE") {
    return { rol: "VISITA", estado: "RECURRENTE" };
  }

  // Regla 5: Por defecto para otros sin ingreso -> VISITA y NUEVA
  return { rol: "VISITA", estado: "NUEVA" };
}

/**
 * Aplica automatización completa a una persona
 */
export async function aplicarAutomatizacionPersona(personaId: number) {
  const prisma = getPrismaClient();

  const persona = await prisma.persona.findUnique({
    where: { id: personaId },
  });

  if (!persona) {
    throw new Error(`Persona con ID ${personaId} no encontrada`);
  }

  let tipoActualizado = persona.tipo;

  // Recalcular tipo si tiene fecha de nacimiento
  if (persona.fechaNacimiento) {
    tipoActualizado = calcularTipoPersonaAutomatico(persona.fechaNacimiento);
  }

  // Aplicar reglas automáticas
  const reglas = aplicarReglasAutomaticas(
    tipoActualizado,
    persona.fechaBautismo,
    persona.fechaIngreso
  );

  // Actualizar solo si algo cambió
  if (
    tipoActualizado !== persona.tipo ||
    reglas.rol !== persona.rol ||
    reglas.estado !== persona.estado
  ) {
    await prisma.persona.update({
      where: { id: personaId },
      data: {
        tipo: tipoActualizado,
        rol: reglas.rol,
        estado: reglas.estado,
      },
    });

    return {
      cambios: {
        tipoAnterior: persona.tipo,
        tipoNuevo: tipoActualizado,
        rolAnterior: persona.rol,
        rolNuevo: reglas.rol,
        estadoAnterior: persona.estado,
        estadoNuevo: reglas.estado,
      },
      actualizado: true,
    };
  }

  await prisma.$disconnect();
  return { actualizado: false };
}

type CambiosPersona = {
  tipoAnterior: TipoPersona;
  tipoNuevo: TipoPersona;
  rolAnterior: RolPersona;
  rolNuevo: RolPersona;
  estadoAnterior: EstadoPersona;
  estadoNuevo: EstadoPersona;
};

/**
 * Aplica automatización a todas las personas de una iglesia
 */
export async function aplicarAutomatizacionMasiva(iglesiaId: number) {
  const prisma = getPrismaClient();
  const personas = await prisma.persona.findMany({
    where: { iglesiaId },
  });

  const resultados = {
    total: personas.length,
    actualizados: 0,
    errores: 0,
    cambios: [] as Array<{
      personaId: number;
      nombres: string;
      apellidos: string;
      cambios: CambiosPersona;
    }>,
  };

  for (const persona of personas) {
    try {
      const resultado = await aplicarAutomatizacionPersona(persona.id);

      if (resultado.actualizado && resultado.cambios) {
        resultados.actualizados++;
        resultados.cambios.push({
          personaId: persona.id,
          nombres: persona.nombres,
          apellidos: persona.apellidos,
          cambios: resultado.cambios,
        });
      }
    } catch (error) {
      console.error(
        `Error aplicando automatización a persona ${persona.id}:`,
        error
      );
      resultados.errores++;
    }
  }

  await prisma.$disconnect();
  return resultados;
}

/**
 * Convertir una visita a miembro
 */
export async function convertirVisitaAMiembro(
  personaId: number,
  fechaBautismo?: Date,
  notas?: string
) {
  const prisma = getPrismaClient();
  const persona = await prisma.persona.findUnique({
    where: { id: personaId },
  });

  if (!persona) {
    throw new Error(`Persona con ID ${personaId} no encontrada`);
  }

  if (persona.rol !== "VISITA") {
    throw new Error("La persona no es una visita");
  }

  // Crear nueva persona que represente al miembro convertido
  const miembroConvertido = await prisma.persona.create({
    data: {
      iglesiaId: persona.iglesiaId,
      nombres: persona.nombres,
      apellidos: persona.apellidos,
      correo: persona.correo,
      telefono: persona.telefono,
      celular: persona.celular,
      direccion: persona.direccion,
      fechaNacimiento: persona.fechaNacimiento,
      sexo: persona.sexo,
      estadoCivil: persona.estadoCivil,
      ocupacion: persona.ocupacion,
      foto: persona.foto,
      notas: notas || persona.notas,

      // Nuevos datos de miembro
      tipo: persona.tipo, // Mantener el tipo calculado
      rol: "MIEMBRO",
      estado: fechaBautismo ? "ACTIVA" : "NUEVA",
      fechaIngreso: new Date(),
      fechaBautismo: fechaBautismo,

      // Mantener referencias familiares
      familiaId: persona.familiaId,
      relacionFamiliar: persona.relacionFamiliar,

      // Referencia a la visita original
      personaInvitaId: persona.personaInvitaId,
    },
  });

  // Actualizar la visita original para marcar la conversión
  await prisma.persona.update({
    where: { id: personaId },
    data: {
      personaConvertidaId: miembroConvertido.id,
      fechaConversion: new Date(),
      estado: "INACTIVA", // La visita se vuelve inactiva
    },
  });

  // Aplicar automatización al nuevo miembro
  await aplicarAutomatizacionPersona(miembroConvertido.id);

  await prisma.$disconnect();
  return miembroConvertido;
}

/**
 * Job que debe ejecutarse periódicamente para mantener la automatización
 */
export async function jobAutomatizacionPeriodica() {
  console.log("🤖 Iniciando job de automatización periódica...");

  try {
    // Obtener todas las iglesias activas
    const prisma = getPrismaClient();
    const iglesias = await prisma.iglesia.findMany({
      where: { activa: true },
    });

    let totalPersonas = 0;
    let totalActualizadas = 0;

    for (const iglesia of iglesias) {
      console.log(`🏛️  Procesando iglesia: ${iglesia.nombre}`);

      const resultado = await aplicarAutomatizacionMasiva(iglesia.id);

      totalPersonas += resultado.total;
      totalActualizadas += resultado.actualizados;

      console.log(`   - ${resultado.total} personas procesadas`);
      console.log(`   - ${resultado.actualizados} personas actualizadas`);

      if (resultado.errores > 0) {
        console.warn(`   - ${resultado.errores} errores encontrados`);
      }
    }

    console.log(`✅ Job completado:`);
    console.log(`   - ${iglesias.length} iglesias procesadas`);
    console.log(`   - ${totalPersonas} personas procesadas`);
    console.log(`   - ${totalActualizadas} personas actualizadas`);

    await prisma.$disconnect();
    return {
      success: true,
      iglesias: iglesias.length,
      personas: totalPersonas,
      actualizadas: totalActualizadas,
    };
  } catch (error) {
    console.error("❌ Error en job de automatización:", error);
    throw error;
  }
}
