#!/usr/bin/env ts-node

/**
 * Script para consolidar relaciones familiares y núcleos familiares
 *
 * Uso:
 * npm run consolidar-familias           # Consolida todo el sistema
 * npm run consolidar-familias -- 123   # Consolida solo la familia ID 123
 */

import { PrismaClient } from "@prisma/client";
import { consolidarRelacionesFamiliares } from "../lib/familiares-sync";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🔄 Iniciando consolidación de relaciones familiares...\n");

    // Obtener ID de familia específica si se proporciona
    const familiaId = process.argv[2] ? parseInt(process.argv[2]) : undefined;

    if (familiaId && isNaN(familiaId)) {
      console.error("❌ Error: El ID de familia debe ser un número válido");
      process.exit(1);
    }

    if (familiaId) {
      console.log(`📋 Consolidando solo la familia ID: ${familiaId}`);

      // Verificar que la familia existe
      const familia = await prisma.familia.findUnique({
        where: { id: familiaId },
        select: { apellido: true, nombre: true },
      });

      if (!familia) {
        console.error(
          `❌ Error: No se encontró la familia con ID ${familiaId}`
        );
        process.exit(1);
      }

      console.log(
        `📋 Familia encontrada: ${
          familia.nombre || `Familia ${familia.apellido}`
        }\n`
      );
    } else {
      console.log("📋 Consolidando todas las familias del sistema\n");

      // Mostrar estadísticas previas
      const [totalMiembros, totalFamilias, totalRelaciones] = await Promise.all(
        [
          prisma.miembro.count(),
          prisma.familia.count(),
          prisma.relacionFamiliar.count(),
        ]
      );

      console.log("📊 Estadísticas actuales:");
      console.log(`   - Miembros totales: ${totalMiembros}`);
      console.log(`   - Familias totales: ${totalFamilias}`);
      console.log(`   - Relaciones familiares: ${totalRelaciones}\n`);
    }

    // Ejecutar consolidación
    console.log("⚙️  Ejecutando consolidación...");
    const startTime = Date.now();

    const resultado = await consolidarRelacionesFamiliares(familiaId);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Mostrar resultados
    console.log("\n✅ Consolidación completada exitosamente!\n");
    console.log("📊 Resultados:");
    console.log(
      `   - Relaciones familiares creadas: ${resultado.relacionesCreadas}`
    );
    console.log(
      `   - Relaciones actualizadas: ${resultado.relacionesActualizadas}`
    );
    console.log(
      `   - Familias consolidadas: ${resultado.familiasConsolidadas}`
    );
    console.log(`   - Tiempo de ejecución: ${duration}s\n`);

    if (resultado.relacionesCreadas > 0 || resultado.familiasConsolidadas > 0) {
      console.log("🎉 Se realizaron cambios en el sistema:");
      if (resultado.relacionesCreadas > 0) {
        console.log(
          `   - Se crearon ${resultado.relacionesCreadas} nuevas relaciones familiares automáticamente`
        );
      }
      if (resultado.familiasConsolidadas > 0) {
        console.log(
          `   - Se consolidaron ${resultado.familiasConsolidadas} núcleos familiares`
        );
      }
    } else {
      console.log(
        "ℹ️  No se encontraron inconsistencias que corregir. El sistema ya está sincronizado."
      );
    }

    // Mostrar estadísticas finales si se procesó todo el sistema
    if (!familiaId) {
      const [nuevoTotalFamilias, nuevoTotalRelaciones] = await Promise.all([
        prisma.familia.count(),
        prisma.relacionFamiliar.count(),
      ]);

      console.log("\n📊 Estadísticas finales:");
      console.log(`   - Familias totales: ${nuevoTotalFamilias}`);
      console.log(`   - Relaciones familiares: ${nuevoTotalRelaciones}`);
    }

    console.log("\n✨ Proceso completado exitosamente!");
  } catch (error) {
    console.error("\n❌ Error durante la consolidación:", error);
    console.error("\nDetalles del error:");
    if (error instanceof Error) {
      console.error(`   Mensaje: ${error.message}`);
      if (error.stack) {
        console.error(`   Stack: ${error.stack}`);
      }
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar solo si este archivo se ejecuta directamente
if (require.main === module) {
  main().catch((error) => {
    console.error("Error fatal:", error);
    process.exit(1);
  });
}
