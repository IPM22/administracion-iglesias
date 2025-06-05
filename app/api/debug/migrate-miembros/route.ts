import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export async function POST() {
  try {
    // Obtener la primera iglesia disponible como iglesia por defecto
    const primeraIglesia = await prisma.iglesia.findFirst({
      where: {
        activa: true,
      },
    });

    if (!primeraIglesia) {
      return NextResponse.json(
        { error: "No se encontró ninguna iglesia activa" },
        { status: 404 }
      );
    }

    console.log(
      `🏛️ Iglesia por defecto: ${primeraIglesia.nombre} (ID: ${primeraIglesia.id})`
    );

    // Usar raw SQL para buscar y actualizar miembros sin iglesiaId
    const miembrosSinIglesia = await prisma.$queryRaw<
      Array<{ id: number; nombres: string; apellidos: string }>
    >`
      SELECT id, nombres, apellidos FROM miembros WHERE "iglesiaId" IS NULL
    `;

    console.log(
      `📊 Encontrados ${miembrosSinIglesia.length} miembros sin iglesia asignada`
    );

    if (miembrosSinIglesia.length === 0) {
      return NextResponse.json({
        mensaje: "No hay miembros sin iglesia para migrar",
        miembrosActualizados: 0,
      });
    }

    // Actualizar usando raw SQL
    const resultado = await prisma.$executeRaw`
      UPDATE miembros SET "iglesiaId" = ${primeraIglesia.id} WHERE "iglesiaId" IS NULL
    `;

    console.log(
      `✅ Actualizados ${resultado} miembros con iglesia ID: ${primeraIglesia.id}`
    );

    return NextResponse.json({
      mensaje: "Migración de miembros completada exitosamente",
      iglesiaAsignada: {
        id: primeraIglesia.id,
        nombre: primeraIglesia.nombre,
      },
      miembrosActualizados: Number(resultado),
      miembrosEncontrados: miembrosSinIglesia.length,
    });
  } catch (error) {
    console.error("Error en migración:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error durante la migración", details: errorMessage },
      { status: 500 }
    );
  }
}
