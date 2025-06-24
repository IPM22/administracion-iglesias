import { NextResponse } from "next/server";
import { WhatsAppService, templates } from "@/lib/twilio";

export async function POST(request) {
  try {
    const {
      personas,
      templateKey,
      datosPersonalizacion = {},
      filtrarSoloConCelular = true,
    } = await request.json();

    // Validaciones
    if (!personas || !Array.isArray(personas) || personas.length === 0) {
      return NextResponse.json(
        { error: "Se requiere un array de personas" },
        { status: 400 }
      );
    }

    if (!templateKey || !templates[templateKey]) {
      return NextResponse.json(
        { error: `Template '${templateKey}' no encontrado` },
        { status: 400 }
      );
    }

    const template = templates[templateKey];

    // Filtrar personas con celular si se solicita
    let personasAEnviar = personas;
    if (filtrarSoloConCelular) {
      personasAEnviar = personas.filter(
        (p) => p.celular && p.celular.trim() !== ""
      );
    }

    console.log(`Iniciando envío masivo a ${personasAEnviar.length} personas`);
    console.log(`Template: ${templateKey}`);
    console.log(`Datos personalizacion:`, datosPersonalizacion);

    // Enviar mensajes masivos
    const resultados = await WhatsAppService.enviarMensajeMasivo(
      personasAEnviar,
      template,
      datosPersonalizacion
    );

    // Log de resultados
    console.log(`Envío masivo completado:`);
    console.log(`- Exitosos: ${resultados.exitosos.length}`);
    console.log(`- Fallidos: ${resultados.fallidos.length}`);
    console.log(`- Total procesados: ${resultados.total}`);

    return NextResponse.json({
      success: true,
      resultados,
      resumen: {
        total: resultados.total,
        exitosos: resultados.exitosos.length,
        fallidos: resultados.fallidos.length,
        porcentajeExito: (
          (resultados.exitosos.length / resultados.total) *
          100
        ).toFixed(2),
      },
    });
  } catch (error) {
    console.error("Error en envío masivo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    );
  }
}

// Endpoint para obtener templates disponibles
export async function GET() {
  const templatesInfo = Object.keys(templates).map((key) => ({
    key,
    variables: templates[key].variables,
    preview: templates[key].mensaje.substring(0, 150) + "...",
  }));

  return NextResponse.json({
    templates: templatesInfo,
    total: templatesInfo.length,
  });
}
