import { SMSService } from "@/lib/twilio";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { messageSid } = await request.json();

    if (!messageSid) {
      return NextResponse.json(
        { error: "MessageSid es requerido" },
        { status: 400 }
      );
    }

    console.log(`🔍 Verificando estado del mensaje: ${messageSid}`);

    const estado = await SMSService.verificarEstadoMensaje(messageSid);

    return NextResponse.json({
      success: true,
      mensaje: estado,
    });
  } catch (error) {
    console.error("❌ Error verificando mensaje SMS:", error);
    return NextResponse.json(
      {
        error: "Error verificando el estado del mensaje",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
