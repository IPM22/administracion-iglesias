import { NextResponse } from "next/server";
import client from "@/lib/twilio";

export async function POST(request) {
  try {
    const { to, message } = await request.json();

    // Validaciones
    if (!to || !message) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: to, message" },
        { status: 400 }
      );
    }

    // Formatear número de SMS (asegurar formato internacional)
    let smsNumber = to;

    // Si no empieza con +, agregar código de país (Colombia +57 por defecto)
    if (!smsNumber.startsWith("+")) {
      smsNumber = `+57${smsNumber}`;
    }

    console.log(`Enviando SMS a: ${smsNumber}`);
    console.log(`Mensaje: ${message.substring(0, 100)}...`);

    // Enviar mensaje via Twilio
    const twilioMessage = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER, // Número de teléfono normal de Twilio
      to: smsNumber,
    });

    console.log(`SMS enviado exitosamente. SID: ${twilioMessage.sid}`);

    return NextResponse.json({
      success: true,
      messageSid: twilioMessage.sid,
      status: twilioMessage.status,
      to: smsNumber,
    });
  } catch (error) {
    console.error("Error enviando SMS:", error);

    // Manejar errores específicos de Twilio
    if (error.code) {
      return NextResponse.json(
        {
          error: "Error de Twilio",
          details: error.message,
          code: error.code,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Para desarrollo: endpoint GET para testing
export async function GET() {
  return NextResponse.json({
    message: "SMS API funcionando",
    timestamp: new Date().toISOString(),
    twilioConfigured: !!(
      process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ),
  });
}
