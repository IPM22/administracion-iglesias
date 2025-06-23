import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseClientConfig } from "./config-simple";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const { url, anonKey, isConfigured } = getSupabaseClientConfig();

  if (!isConfigured) {
    console.warn("⚠️ Supabase no configurado, saltando middleware de auth");
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Rutas públicas que no requieren autenticación
  const isPublicRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.match(/^\/actividades\/\d+\/promocion/) ||
    pathname.match(/^\/actividades\/\d+\/agradecimiento/);

  if (!user && !isPublicRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // Si el usuario está autenticado y no está en una ruta pública,
  // verificar que tenga iglesias activas
  if (user && !isPublicRoute) {
    // Temporalmente comentado para diagnóstico
    /*
    try {
      // Hacer petición interna para obtener datos del usuario
      const baseUrl = request.nextUrl.origin;
      const session = await supabase.auth.getSession();
      
      if (!session.data.session?.access_token) {
        console.warn("No se pudo obtener el token de acceso");
        return supabaseResponse;
      }

      const userResponse = await fetch(`${baseUrl}/api/usuarios/${user.id}`, {
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();

        // Verificar si el usuario tiene iglesias activas
        const tieneIglesiasActivas = userData.iglesias?.some(
          (iglesia: { estado: string }) => iglesia.estado === "ACTIVO"
        );

        const tieneSolicitudesPendientes = userData.iglesias?.some(
          (iglesia: { estado: string }) => iglesia.estado === "PENDIENTE"
        );

        // Si no tiene iglesias activas pero sí solicitudes pendientes,
        // redirigir al login con mensaje
        if (
          !tieneIglesiasActivas &&
          tieneSolicitudesPendientes &&
          pathname !== "/login"
        ) {
          const loginUrl = request.nextUrl.clone();
          loginUrl.pathname = "/login";
          loginUrl.searchParams.set("mensaje", "solicitud-pendiente");
          return NextResponse.redirect(loginUrl);
        }
      } else if (userResponse.status === 404) {
        // Usuario no encontrado en la base de datos, permitir continuar
        console.log("Usuario no encontrado en DB, permitiendo continuar");
      } else {
        console.warn(`Error al obtener datos del usuario: ${userResponse.status}`);
      }
    } catch (error) {
      console.error("Error verificando estado de iglesias:", error);
      // Si hay error, continuar normalmente para no bloquear el acceso
    }
    */
  }

  return supabaseResponse;
}
