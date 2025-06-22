#!/usr/bin/env tsx

import { PrismaClient } from "@prisma/client";
import {
  calcularTipoPersona,
  aplicarReglasAutomaticas,
} from "../src/lib/validations/persona";
import type { TipoPersona, RolPersona, EstadoPersona } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Iniciando migración completa a modelo Persona...");

  try {
    // 1. Migrar todos los miembros
    await migrarMiembros();

    // 2. Migrar todas las visitas
    await migrarVisitas();

    // 3. Actualizar referencias e relaciones
    await actualizarReferenciasRelaciones();

    // 4. Migrar historial de visitas
    await migrarHistorialVisitas();

    // 5. Migrar familiares
    await migrarFamiliares();

    // 6. Migrar ministerios
    await migrarMinisterios();

    // 7. Aplicar automatización y reglas
    await aplicarAutomatizacion();

    // 8. Verificar migración
    await verificarMigracion();

    console.log("✅ Migración completada exitosamente!");
  } catch (error) {
    console.error("❌ Error durante la migración:", error);
    throw error;
  }
}

async function migrarMiembros() {
  console.log("👤 Migrando miembros a personas...");

  const miembros = await prisma.miembro.findMany({
    include: {
      familia: true,
    },
  });

  console.log(`📊 Encontrados ${miembros.length} miembros para migrar`);

  for (const miembro of miembros) {
    // Calcular tipo automáticamente si tiene fecha de nacimiento
    let tipo: TipoPersona = "ADULTO"; // Valor por defecto
    if (miembro.fechaNacimiento) {
      tipo = calcularTipoPersona(miembro.fechaNacimiento) as TipoPersona;
    }

    // Aplicar reglas automáticas
    const reglas = aplicarReglasAutomaticas(tipo, miembro.fechaBautismo);

    await prisma.persona.create({
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
        tipo: tipo,
        rol: "MIEMBRO" as RolPersona,
        estado: reglas.estado,

        // Info eclesiástica
        fechaIngreso: miembro.fechaIngreso,
        fechaBautismo: miembro.fechaBautismo,
        fechaConfirmacion: miembro.fechaConfirmacion,

        // Familia
        familiaId: miembro.familiaId,
        relacionFamiliar: miembro.relacion,

        // Timestamps preservados
        createdAt: miembro.createdAt,
        updatedAt: miembro.updatedAt || miembro.createdAt,
      },
    });
  }

  console.log(`✅ ${miembros.length} miembros migrados exitosamente`);
}

async function migrarVisitas() {
  console.log("👥 Migrando visitas a personas...");

  const visitas = await prisma.visita.findMany({
    include: {
      familiaRelacion: true,
    },
  });

  console.log(`📊 Encontradas ${visitas.length} visitas para migrar`);

  for (const visita of visitas) {
    // Calcular tipo automáticamente si tiene fecha de nacimiento
    let tipo: TipoPersona = "ADULTO"; // Valor por defecto
    if (visita.fechaNacimiento) {
      tipo = calcularTipoPersona(visita.fechaNacimiento) as TipoPersona;
    }

    // Aplicar reglas automáticas para visitas
    const reglas = aplicarReglasAutomaticas(tipo, null); // Las visitas no tienen bautismo inicialmente

    await prisma.persona.create({
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
        tipo: tipo,
        rol: "VISITA" as RolPersona,
        estado: reglas.estado,

        // Info específica de visitas
        fechaPrimeraVisita: visita.fechaPrimeraVisita,
        comoConocioIglesia: visita.comoConocioIglesia,
        motivoVisita: visita.motivoVisita,
        intereses: visita.intereses,

        // Familia
        familiaId: visita.familiaId,

        // Timestamps preservados
        createdAt: visita.createdAt,
        updatedAt: visita.updatedAt || visita.createdAt,
      },
    });
  }

  console.log(`✅ ${visitas.length} visitas migradas exitosamente`);
}

async function actualizarReferenciasRelaciones() {
  console.log("🔗 Actualizando referencias de invitaciones y conversiones...");

  // Buscar miembros que invitaron visitas
  const visitasConInvitador = await prisma.visita.findMany({
    where: {
      miembroInvitaId: { not: null },
    },
    include: {
      miembroInvita: true,
    },
  });

  for (const visita of visitasConInvitador) {
    if (visita.miembroInvita) {
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
          nombres: visita.miembroInvita.nombres,
          apellidos: visita.miembroInvita.apellidos,
          iglesiaId: visita.miembroInvita.iglesiaId,
        },
      });

      if (personaVisita && personaMiembro) {
        await prisma.persona.update({
          where: { id: personaVisita.id },
          data: { personaInvitaId: personaMiembro.id },
        });
      }
    }
  }

  // Buscar visitas convertidas a miembros
  const visitasConvertidas = await prisma.visita.findMany({
    where: {
      miembroConvertidoId: { not: null },
    },
    include: {
      miembroConvertido: true,
    },
  });

  for (const visita of visitasConvertidas) {
    if (visita.miembroConvertido) {
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
          data: {
            personaConvertidaId: personaMiembro.id,
            fechaConversion: visita.fechaConversion,
          },
        });
      }
    }
  }

  console.log("✅ Referencias actualizadas");
}

async function migrarHistorialVisitas() {
  console.log("📖 Migrando historial de visitas...");

  // Migrar registros que apuntaban a miembros
  const historialMiembros = await prisma.historialVisita.findMany({
    where: { miembroId: { not: null } },
    include: { miembro: true },
  });

  for (const registro of historialMiembros) {
    if (registro.miembro) {
      const persona = await prisma.persona.findFirst({
        where: {
          nombres: registro.miembro.nombres,
          apellidos: registro.miembro.apellidos,
          iglesiaId: registro.miembro.iglesiaId,
        },
      });

      if (persona) {
        await prisma.historialVisita.update({
          where: { id: registro.id },
          data: {
            personaId: persona.id,
            miembroId: null, // Limpiar referencia antigua
          },
        });
      }
    }
  }

  // Migrar registros que apuntaban a visitas
  const historialVisitas = await prisma.historialVisita.findMany({
    where: { visitaId: { not: null } },
    include: { visita: true },
  });

  for (const registro of historialVisitas) {
    if (registro.visita) {
      const persona = await prisma.persona.findFirst({
        where: {
          nombres: registro.visita.nombres,
          apellidos: registro.visita.apellidos,
          iglesiaId: registro.visita.iglesiaId,
        },
      });

      if (persona) {
        await prisma.historialVisita.update({
          where: { id: registro.id },
          data: {
            personaId: persona.id,
            visitaId: null, // Limpiar referencia antigua
          },
        });
      }
    }
  }

  console.log("✅ Historial de visitas migrado");
}

async function migrarFamiliares() {
  console.log("👨‍👩‍👧‍👦 Migrando familiares...");

  const familiares = await prisma.familiar.findMany({
    include: { miembro: true },
  });

  for (const familiar of familiares) {
    const persona = await prisma.persona.findFirst({
      where: {
        nombres: familiar.miembro.nombres,
        apellidos: familiar.miembro.apellidos,
        iglesiaId: familiar.miembro.iglesiaId,
      },
    });

    if (persona) {
      await prisma.familiar.update({
        where: { id: familiar.id },
        data: {
          personaId: persona.id,
          // Removemos miembroId después de la migración
        },
      });
    }
  }

  console.log("✅ Familiares migrados");
}

async function migrarMinisterios() {
  console.log("⛪ Migrando relaciones con ministerios...");

  const miembroMinisterios = await prisma.miembroMinisterio.findMany({
    include: { miembro: true },
  });

  for (const relacion of miembroMinisterios) {
    const persona = await prisma.persona.findFirst({
      where: {
        nombres: relacion.miembro.nombres,
        apellidos: relacion.miembro.apellidos,
        iglesiaId: relacion.miembro.iglesiaId,
      },
    });

    if (persona) {
      await prisma.personaMinisterio.create({
        data: {
          personaId: persona.id,
          ministerioId: relacion.ministerioId,
          cargo: relacion.cargo,
          rol: relacion.rol,
          fechaInicio: relacion.fechaInicio,
          fechaFin: relacion.fechaFin,
          estado: relacion.estado,
          esLider: relacion.esLider,
          createdAt: relacion.createdAt,
          updatedAt: relacion.updatedAt,
        },
      });
    }
  }

  console.log("✅ Ministerios migrados");
}

async function aplicarAutomatizacion() {
  console.log("🤖 Aplicando reglas de automatización...");

  const personas = await prisma.persona.findMany();

  for (const persona of personas) {
    let tipoActualizado = persona.tipo;

    // Recalcular tipo si tiene fecha de nacimiento
    if (persona.fechaNacimiento) {
      tipoActualizado = calcularTipoPersona(
        persona.fechaNacimiento
      ) as TipoPersona;
    }

    // Aplicar reglas automáticas
    const reglas = aplicarReglasAutomaticas(
      tipoActualizado,
      persona.fechaBautismo
    );

    // Solo actualizar si algo cambió
    if (
      tipoActualizado !== persona.tipo ||
      reglas.rol !== persona.rol ||
      reglas.estado !== persona.estado
    ) {
      await prisma.persona.update({
        where: { id: persona.id },
        data: {
          tipo: tipoActualizado,
          rol: reglas.rol,
          estado: reglas.estado,
        },
      });
    }
  }

  console.log("✅ Automatización aplicada");
}

async function verificarMigracion() {
  console.log("🔍 Verificando migración...");

  const totalPersonas = await prisma.persona.count();
  const totalMiembros = await prisma.miembro.count();
  const totalVisitas = await prisma.visita.count();

  console.log(`📊 Estadísticas después de la migración:`);
  console.log(`   - Personas: ${totalPersonas}`);
  console.log(`   - Miembros originales: ${totalMiembros}`);
  console.log(`   - Visitas originales: ${totalVisitas}`);
  console.log(`   - Total esperado: ${totalMiembros + totalVisitas}`);

  if (totalPersonas !== totalMiembros + totalVisitas) {
    console.warn("⚠️  Los números no coinciden. Revisar migración.");
  } else {
    console.log("✅ Verificación exitosa: todos los registros migrados");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
