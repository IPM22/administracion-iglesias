import { NextResponse } from "next/server";

/**
 * Endpoint de diagnóstico temporal - ELIMINAR después de resolver el problema.
 * Visita /api/diagnostico en Vercel para ver qué variables de entorno faltan.
 */
export async function GET() {
  const vars = {
    DATABASE_URL: process.env.DATABASE_URL ? "✅ OK" : "❌ FALTA",
    DIRECT_URL: process.env.DIRECT_URL ? "✅ OK" : "❌ FALTA",
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? "✅ OK"
      : "❌ FALTA",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? "✅ OK" : "❌ FALTA",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? "✅ OK"
      : "❌ FALTA (alternativa a PUBLISHABLE_KEY)",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
      ? "✅ OK"
      : "❌ FALTA",
    NODE_ENV: process.env.NODE_ENV ?? "no definido",
  };

  // Intentar conexión a Prisma
  let prismaStatus = "❓ No verificado";
  try {
    const { prisma } = await import("@/lib/db");
    await prisma.$queryRaw`SELECT 1`;
    prismaStatus = "✅ Conexión OK";
  } catch (e) {
    prismaStatus = `❌ Error: ${e instanceof Error ? e.message : String(e)}`;
  }

  return NextResponse.json({
    variables: vars,
    prisma: prismaStatus,
    timestamp: new Date().toISOString(),
  });
}
