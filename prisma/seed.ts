import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Crear tipos de actividades regulares
  const actividadesRegulares = [
    {
      nombre: "Culto Dominical",
      descripcion: "Servicio principal de adoración dominical",
      tipo: "Regular",
    },
    {
      nombre: "Estudio Bíblico",
      descripcion: "Estudio semanal de la Biblia",
      tipo: "Regular",
    },
    {
      nombre: "Culto de Oración",
      descripcion: "Reunión de oración y ayuno",
      tipo: "Regular",
    },
    {
      nombre: "Actividad Especial",
      descripcion: "Eventos especiales programados",
      tipo: "Especial",
    },
  ];

  for (const actividad of actividadesRegulares) {
    await prisma.tipoActividad.upsert({
      where: { nombre: actividad.nombre },
      update: {},
      create: actividad,
    });
  }

  console.log("Tipos de actividades creados correctamente");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
