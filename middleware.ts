import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Coincidir con todas las rutas de request excepto las que empiezan con:
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico (favicon file)
     * - api/webhooks (webhooks públicos)
     * - api/usuarios (API de usuarios para evitar bucles)
     * - api/actividades/[id]/public (API pública de actividades)
     * - actividades/[id]/promocion (páginas públicas de promoción)
     * - actividades/[id]/agradecimiento (páginas públicas de agradecimiento)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks|api/usuarios|api/actividades/\\d+/public|actividades/\\d+/promocion|actividades/\\d+/agradecimiento|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
