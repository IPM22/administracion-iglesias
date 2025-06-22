#!/usr/bin/env tsx

import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log(
    "🚀 Iniciando reestructuración completa del modelo de personas...\n"
  );

  try {
    // Paso 1: Generar migración de Prisma
    console.log("📝 Paso 1: Generando migración de Prisma...");
    execSync('npx prisma migrate dev --name "add_persona_unified_model"', {
      stdio: "inherit",
    });
    console.log("✅ Migración generada exitosamente\n");

    // Paso 2: Generar cliente Prisma
    console.log("🔧 Paso 2: Generando cliente Prisma...");
    execSync("npx prisma generate", { stdio: "inherit" });
    console.log("✅ Cliente Prisma generado exitosamente\n");

    // Paso 3: Ejecutar migración de datos
    console.log("📊 Paso 3: Ejecutando migración de datos...");
    const { migrarAPersona } = await import("./migrate-to-persona");
    await migrarAPersona();
    console.log("✅ Migración de datos completada\n");

    // Paso 4: Ejecutar automatización inicial
    console.log("🤖 Paso 4: Ejecutando automatización inicial...");
    const { ejecutarAutomatizacionCompleta } = await import(
      "../src/lib/services/persona-automation"
    );
    const resultado = await ejecutarAutomatizacionCompleta();

    console.log("📈 Resumen de automatización:");
    console.log(`- Personas procesadas: ${resultado.resumen.totalPersonas}`);
    console.log(`- Tipos actualizados: ${resultado.resumen.tiposActualizados}`);
    console.log(
      `- Adolescentes procesados: ${resultado.resumen.adolescentesProcesados}`
    );
    console.log(
      `- Bautizados procesados: ${resultado.resumen.bautizadosProcesados}\n`
    );

    // Paso 5: Verificar integridad de datos
    console.log("🔍 Paso 5: Verificando integridad de datos...");
    await verificarIntegridad();

    console.log("🎉 ¡Reestructuración completada exitosamente!");
    console.log("\n📋 Próximos pasos recomendados:");
    console.log("1. Revisar y probar el nuevo módulo Comunidad en /comunidad");
    console.log("2. Actualizar las APIs que usen las tablas Miembro y Visita");
    console.log("3. Configurar un cron job para la automatización periódica");
    console.log("4. Actualizar la navegación para incluir el módulo Comunidad");
    console.log(
      "5. Deprecar gradualmente los módulos Miembros y Visitas antiguos"
    );
  } catch (error) {
    console.error("❌ Error durante la reestructuración:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function verificarIntegridad() {
  console.log("🔍 Verificando integridad de datos...");

  // Verificar que todas las personas tienen iglesia
  const personasSinIglesia = await prisma.persona.count({
    where: { iglesiaId: null },
  });

  if (personasSinIglesia > 0) {
    console.warn(
      `⚠️  Advertencia: ${personasSinIglesia} personas sin iglesia asignada`
    );
  }

  // Verificar rangos de edad
  const personasConFechaNacimiento = await prisma.persona.count({
    where: { fechaNacimiento: { not: null } },
  });

  const tiposPorEdad = await prisma.persona.groupBy({
    by: ["tipo"],
    _count: { tipo: true },
    where: { fechaNacimiento: { not: null } },
  });

  console.log(
    `📊 Personas con fecha de nacimiento: ${personasConFechaNacimiento}`
  );
  console.log("📊 Distribución por tipo:", tiposPorEdad);

  // Verificar adolescentes sin bautismo
  const adolescentesSinBautismo = await prisma.persona.count({
    where: {
      tipo: "ADOLESCENTE",
      fechaBautismo: null,
      rol: "VISITA",
      estado: "RECURRENTE",
    },
  });

  console.log(
    `👥 Adolescentes sin bautismo (VISITA RECURRENTE): ${adolescentesSinBautismo}`
  );

  // Verificar miembros bautizados
  const miembrosBautizados = await prisma.persona.count({
    where: {
      rol: "MIEMBRO",
      fechaBautismo: { not: null },
    },
  });

  const miembrosSinBautismo = await prisma.persona.count({
    where: {
      rol: "MIEMBRO",
      fechaBautismo: null,
    },
  });

  console.log(`💒 Miembros bautizados: ${miembrosBautizados}`);
  console.log(`❓ Miembros sin fecha de bautismo: ${miembrosSinBautismo}`);

  // Verificar relaciones familiares
  const personasConFamilia = await prisma.persona.count({
    where: { familiaId: { not: null } },
  });

  console.log(`👨‍👩‍👧‍👦 Personas con familia asignada: ${personasConFamilia}`);

  // Verificar relaciones con ministerios
  const personasEnMinisterios = await prisma.personaMinisterio.count();
  console.log(`⛪ Relaciones persona-ministerio: ${personasEnMinisterios}`);

  console.log("✅ Verificación de integridad completada");
}

// Ejecutar el script
if (require.main === module) {
  main().catch((error) => {
    console.error("💥 Error fatal durante la reestructuración:", error);
    process.exit(1);
  });
}

export { main as aplicarReestructuracion };
