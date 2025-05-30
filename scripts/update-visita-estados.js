const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function updateVisitaEstados() {
  try {
    console.log("🔄 Actualizando estados de visitas...");

    // Contar visitas actuales
    const totalVisitas = await prisma.visita.count();
    console.log(`📊 Total de visitas encontradas: ${totalVisitas}`);

    // Actualizar todas las visitas al estado "Recurrente"
    const resultado = await prisma.visita.updateMany({
      data: {
        estado: "Recurrente",
      },
    });

    console.log(
      `✅ Actualizadas ${resultado.count} visitas al estado "Recurrente"`
    );

    // Verificar la actualización
    const visitasRecurrentes = await prisma.visita.count({
      where: {
        estado: "Recurrente",
      },
    });

    console.log(
      `🔍 Verificación: ${visitasRecurrentes} visitas con estado "Recurrente"`
    );
  } catch (error) {
    console.error("❌ Error al actualizar estados:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
updateVisitaEstados()
  .then(() => {
    console.log("🎉 Script completado exitosamente");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Error en el script:", error);
    process.exit(1);
  });
