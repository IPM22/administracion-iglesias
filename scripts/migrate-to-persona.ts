import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Función para calcular el tipo de persona basado en la fecha de nacimiento
function calcularTipoPersona(
  fechaNacimiento: Date | null
):
  | "NINO"
  | "ADOLESCENTE"
  | "JOVEN"
  | "ADULTO"
  | "ADULTO_MAYOR"
  | "ENVEJECIENTE" {
  if (!fechaNacimiento) {
    return "ADULTO"; // Default para casos sin fecha
  }

  const ahora = new Date();
  const edad = ahora.getFullYear() - fechaNacimiento.getFullYear();
  const mesActual = ahora.getMonth();
  const mesNacimiento = fechaNacimiento.getMonth();

  // Ajustar edad si aún no ha cumplido años este año
  const edadExacta =
    mesActual < mesNacimiento ||
    (mesActual === mesNacimiento && ahora.getDate() < fechaNacimiento.getDate())
      ? edad - 1
      : edad;

  if (edadExacta <= 9) return "NINO";
  if (edadExacta <= 14) return "ADOLESCENTE";
  if (edadExacta <= 24) return "JOVEN";
  if (edadExacta <= 35) return "ADULTO";
  if (edadExacta <= 59) return "ADULTO_MAYOR";
  return "ENVEJECIENTE";
}

// Función para determinar el rol y estado basado en las reglas de negocio
function determinarRolYEstado(
  tipoPersona: string,
  fechaBautismo: Date | null,
  esConversion: boolean = false
): {
  rol: "MIEMBRO" | "VISITA" | "INVITADO";
  estado: "ACTIVA" | "INACTIVA" | "RECURRENTE" | "NUEVA";
} {
  // Si es adolescente sin bautismo, es VISITA RECURRENTE
  if (tipoPersona === "ADOLESCENTE" && !fechaBautismo) {
    return { rol: "VISITA", estado: "RECURRENTE" };
  }

  // Si tiene fecha de bautismo, es MIEMBRO ACTIVO
  if (fechaBautismo) {
    return { rol: "MIEMBRO", estado: "ACTIVA" };
  }

  // Si es conversión reciente, es MIEMBRO NUEVO
  if (esConversion) {
    return { rol: "MIEMBRO", estado: "NUEVA" };
  }

  // Por defecto, VISITA NUEVA
  return { rol: "VISITA", estado: "NUEVA" };
}

async function migrarMiembrosAPersonas() {
  console.log("🚀 Iniciando migración de Miembros a Personas...");

  const miembros = await prisma.miembro.findMany({
    include: {
      ministerios: true,
      historialVisitas: true,
    },
  });

  console.log(`📊 Encontrados ${miembros.length} miembros para migrar`);

  let migrados = 0;

  for (const miembro of miembros) {
    try {
      const tipoPersona = calcularTipoPersona(miembro.fechaNacimiento);
      const { rol, estado } = determinarRolYEstado(
        tipoPersona,
        miembro.fechaBautismo,
        false
      );

      // Crear persona desde miembro
      const persona = await prisma.persona.create({
        data: {
          iglesiaId: miembro.iglesiaId,
          nombres: miembro.nombres,
          apellidos: miembro.apellidos,
          correo: miembro.correo,
          telefono: miembro.telefono,
          celular: miembro.celular,
          direccion: miembro.direccion,
          fechaNacimiento: miembro.fechaNacimiento,
          sexo: miembro.sexo,
          estadoCivil: miembro.estadoCivil,
          ocupacion: miembro.ocupacion,
          foto: miembro.foto,
          notas: miembro.notas,

          // Clasificación
          tipo: tipoPersona,
          rol: rol,
          estado: estado,

          // Info eclesiástica
          fechaIngreso: miembro.fechaIngreso,
          fechaBautismo: miembro.fechaBautismo,
          fechaConfirmacion: miembro.fechaConfirmacion,

          // Familia
          familiaId: miembro.familiaId,
          relacionFamiliar: miembro.relacion,

          // Timestamps
          createdAt: miembro.createdAt,
          updatedAt: miembro.updatedAt || new Date(),
        },
      });

      // Migrar relaciones con ministerios
      for (const ministerio of miembro.ministerios) {
        await prisma.personaMinisterio.create({
          data: {
            personaId: persona.id,
            ministerioId: ministerio.ministerioId,
            cargo: ministerio.cargo,
            rol: ministerio.rol,
            fechaInicio: ministerio.fechaInicio,
            fechaFin: ministerio.fechaFin,
            estado: ministerio.estado,
            esLider: ministerio.esLider,
            createdAt: ministerio.createdAt,
            updatedAt: ministerio.updatedAt,
          },
        });
      }

      // Actualizar referencias en historial de visitas
      await prisma.historialVisita.updateMany({
        where: { miembroId: miembro.id },
        data: { personaId: persona.id },
      });

      migrados++;
      console.log(
        `✅ Migrado miembro: ${miembro.nombres} ${miembro.apellidos} -> Persona ID: ${persona.id}`
      );
    } catch (error) {
      console.error(
        `❌ Error migrando miembro ${miembro.id}: ${miembro.nombres} ${miembro.apellidos}`,
        error
      );
    }
  }

  console.log(
    `✨ Migración de miembros completada: ${migrados}/${miembros.length}`
  );
}

async function migrarVisitasAPersonas() {
  console.log("🚀 Iniciando migración de Visitas a Personas...");

  const visitas = await prisma.visita.findMany({
    include: {
      historialVisitas: true,
      miembroConvertido: true,
    },
  });

  console.log(`📊 Encontradas ${visitas.length} visitas para migrar`);

  let migrados = 0;

  for (const visita of visitas) {
    try {
      const tipoPersona = calcularTipoPersona(visita.fechaNacimiento);
      const esConversion = !!visita.miembroConvertidoId;
      const { rol, estado } = determinarRolYEstado(
        tipoPersona,
        null,
        esConversion
      );

      // Crear persona desde visita
      const persona = await prisma.persona.create({
        data: {
          iglesiaId: visita.iglesiaId,
          nombres: visita.nombres,
          apellidos: visita.apellidos,
          correo: visita.correo,
          telefono: visita.telefono,
          celular: visita.celular,
          direccion: visita.direccion,
          fechaNacimiento: visita.fechaNacimiento,
          sexo: visita.sexo,
          estadoCivil: visita.estadoCivil,
          ocupacion: visita.ocupacion,
          foto: visita.foto,
          notas: visita.notas,

          // Clasificación
          tipo: tipoPersona,
          rol: rol,
          estado: estado,

          // Info específica de visitas
          fechaPrimeraVisita: visita.fechaPrimeraVisita,
          comoConocioIglesia: visita.comoConocioIglesia,
          motivoVisita: visita.motivoVisita,
          intereses: visita.intereses,

          // Familia
          familiaId: visita.familiaId,

          // Conversión
          fechaConversion: visita.fechaConversion,

          // Timestamps
          createdAt: visita.createdAt,
          updatedAt: visita.updatedAt || new Date(),
        },
      });

      // Actualizar referencias en historial de visitas
      await prisma.historialVisita.updateMany({
        where: { visitaId: visita.id },
        data: { personaId: persona.id },
      });

      migrados++;
      console.log(
        `✅ Migrada visita: ${visita.nombres} ${visita.apellidos} -> Persona ID: ${persona.id}`
      );
    } catch (error) {
      console.error(
        `❌ Error migrando visita ${visita.id}: ${visita.nombres} ${visita.apellidos}`,
        error
      );
    }
  }

  console.log(
    `✨ Migración de visitas completada: ${migrados}/${visitas.length}`
  );
}

async function actualizarReferenciasPersonaInvita() {
  console.log("🔗 Actualizando referencias de invitaciones...");

  // Buscar miembros que tienen referencias a personaInvita
  const miembrosConReferencias = await prisma.miembro.findMany({
    where: {
      visitasInvitadas: {
        some: {},
      },
    },
    include: {
      visitasInvitadas: true,
    },
  });

  for (const miembro of miembrosConReferencias) {
    // Encontrar la persona correspondiente al miembro
    const personaMiembro = await prisma.persona.findFirst({
      where: {
        nombres: miembro.nombres,
        apellidos: miembro.apellidos,
        iglesiaId: miembro.iglesiaId,
      },
    });

    if (personaMiembro) {
      // Actualizar todas las visitas invitadas
      for (const visita of miembro.visitasInvitadas) {
        const personaVisita = await prisma.persona.findFirst({
          where: {
            nombres: visita.nombres,
            apellidos: visita.apellidos,
            iglesiaId: visita.iglesiaId,
          },
        });

        if (personaVisita) {
          await prisma.persona.update({
            where: { id: personaVisita.id },
            data: { personaInvitaId: personaMiembro.id },
          });
        }
      }
    }
  }

  console.log("✅ Referencias de invitaciones actualizadas");
}

async function actualizarReferenciasConversiones() {
  console.log("🔄 Actualizando referencias de conversiones...");

  // Buscar visitas que fueron convertidas a miembros
  const visitasConvertidas = await prisma.visita.findMany({
    where: {
      miembroConvertidoId: {
        not: null,
      },
    },
    include: {
      miembroConvertido: true,
    },
  });

  for (const visita of visitasConvertidas) {
    if (visita.miembroConvertido) {
      // Encontrar las personas correspondientes
      const personaVisita = await prisma.persona.findFirst({
        where: {
          nombres: visita.nombres,
          apellidos: visita.apellidos,
          iglesiaId: visita.iglesiaId,
        },
      });

      const personaMiembro = await prisma.persona.findFirst({
        where: {
          nombres: visita.miembroConvertido.nombres,
          apellidos: visita.miembroConvertido.apellidos,
          iglesiaId: visita.miembroConvertido.iglesiaId,
        },
      });

      if (personaVisita && personaMiembro) {
        await prisma.persona.update({
          where: { id: personaVisita.id },
          data: { personaConvertidaId: personaMiembro.id },
        });
      }
    }
  }

  console.log("✅ Referencias de conversiones actualizadas");
}

async function main() {
  try {
    console.log("🏁 Iniciando migración completa a tabla Persona...\n");

    await migrarMiembrosAPersonas();
    console.log("");

    await migrarVisitasAPersonas();
    console.log("");

    await actualizarReferenciasPersonaInvita();
    console.log("");

    await actualizarReferenciasConversiones();
    console.log("");

    console.log("🎉 ¡Migración completada exitosamente!");

    // Mostrar estadísticas finales
    const totalPersonas = await prisma.persona.count();
    const personasPorTipo = await prisma.persona.groupBy({
      by: ["tipo"],
      _count: { tipo: true },
    });
    const personasPorRol = await prisma.persona.groupBy({
      by: ["rol"],
      _count: { rol: true },
    });

    console.log("\n📈 Estadísticas finales:");
    console.log(`Total personas: ${totalPersonas}`);
    console.log("Por tipo:", personasPorTipo);
    console.log("Por rol:", personasPorRol);
  } catch (error) {
    console.error("💥 Error durante la migración:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { main as migrarAPersona };
