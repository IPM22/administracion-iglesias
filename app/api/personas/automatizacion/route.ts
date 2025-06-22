import { NextRequest, NextResponse } from "next/server";
import {
  aplicarAutomatizacionPersona,
  aplicarAutomatizacionMasiva,
  jobAutomatizacionPeriodica,
} from "@/src/lib/services/persona-automation";

// POST /api/personas/automatizacion - Aplicar automatización
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tipo, personaId, iglesiaId } = body;

    if (tipo === "persona" && personaId) {
      // Aplicar automatización a una persona específica
      const resultado = await aplicarAutomatizacionPersona(personaId);
      return NextResponse.json(resultado);
    }

    if (tipo === "iglesia" && iglesiaId) {
      // Aplicar automatización a toda una iglesia
      const resultado = await aplicarAutomatizacionMasiva(iglesiaId);
      return NextResponse.json(resultado);
    }

    if (tipo === "completa") {
      // Ejecutar job completo de automatización
      const resultado = await jobAutomatizacionPeriodica();
      return NextResponse.json(resultado);
    }

    return NextResponse.json(
      { error: "Tipo de automatización no válido" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error en automatización:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
