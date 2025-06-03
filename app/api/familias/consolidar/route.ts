import { NextRequest, NextResponse } from "next/server";
import { consolidarRelacionesFamiliares } from "../../../../lib/familiares-sync";

/**
 * POST - Consolidar y sincronizar todas las relaciones familiares del sistema
 * Este endpoint permite sincronizar las relaciones familiares existentes
 * con los núcleos familiares, corrigiendo cualquier inconsistencia.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { familiaId, ejecutarConsolidacion } = body;

    // Verificar que el usuario realmente quiere ejecutar la consolidación
    if (!ejecutarConsolidacion) {
      return NextResponse.json(
        {
          error: "Debe confirmar la ejecución de la consolidación",
          instrucciones:
            "Envíe { ejecutarConsolidacion: true } para ejecutar la consolidación",
        },
        { status: 400 }
      );
    }

    console.log("Iniciando consolidación de relaciones familiares...");

    const resultado = await consolidarRelacionesFamiliares(familiaId);

    const respuesta = {
      success: true,
      mensaje: "Consolidación completada exitosamente",
      estadisticas: {
        relacionesCreadas: resultado.relacionesCreadas,
        relacionesActualizadas: resultado.relacionesActualizadas,
        familiasConsolidadas: resultado.familiasConsolidadas,
      },
      detalles: familiaId
        ? `Consolidación aplicada solo a la familia ID: ${familiaId}`
        : "Consolidación aplicada a todo el sistema",
    };

    console.log("Consolidación completada:", respuesta);

    return NextResponse.json(respuesta, { status: 200 });
  } catch (error) {
    console.error("Error durante la consolidación:", error);
    return NextResponse.json(
      {
        error: "Error durante la consolidación de relaciones familiares",
        detalles: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Obtener información sobre el estado actual de las relaciones familiares
 * Proporciona estadísticas sobre inconsistencias y oportunidades de consolidación
 */
export async function GET() {
  try {
    // Esta función podría expandirse para mostrar estadísticas previas
    // Por ahora, retorna información básica sobre la funcionalidad

    return NextResponse.json({
      funcionalidad: "Consolidación de Relaciones Familiares",
      descripcion:
        "Este endpoint permite sincronizar automáticamente las relaciones familiares individuales con los núcleos familiares",
      uso: {
        consolidacionCompleta: {
          metodo: "POST",
          body: { ejecutarConsolidacion: true },
          descripcion: "Consolida todas las relaciones familiares del sistema",
        },
        consolidacionPorFamilia: {
          metodo: "POST",
          body: { familiaId: "ID_FAMILIA", ejecutarConsolidacion: true },
          descripcion: "Consolida las relaciones de una familia específica",
        },
      },
      advertencias: [
        "La consolidación puede crear nuevas familias automáticamente",
        "Las familias pequeñas pueden fusionarse con familias más grandes",
        "Se recomienda hacer backup antes de ejecutar consolidación completa",
      ],
    });
  } catch (error) {
    console.error("Error obteniendo información de consolidación:", error);
    return NextResponse.json(
      { error: "Error obteniendo información del endpoint" },
      { status: 500 }
    );
  }
}
