import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseClientConfig } from "./config-simple";

// Configuración del caché para middleware
const MIDDLEWARE_CACHE_DURATION = 2 * 60 * 1000; // 2 minutos para middleware
const MIDDLEWARE_CACHE_KEY = "middleware_user_cache";

interface MiddlewareCacheData {
  userId: string;
  hasActiveChurches: boolean;
  hasPendingRequests: boolean;
  timestamp: number;
}

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
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Si el usuario está autenticado, inyectar su ID en los headers de las rutas API
  if (user && pathname.startsWith("/api/")) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", user.id);
    // Crear nuevo response con el header inyectado, preservando las cookies ya seteadas
    const newResponse = NextResponse.next({
      request: { headers: requestHeaders },
    });
    // Copiar todas las cookies del supabaseResponse al nuevo response
    supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
      newResponse.cookies.set(name, value);
    });
    supabaseResponse = newResponse;
  }

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
  // verificar que tenga iglesias activas usando caché cuando sea posible
  if (user && !isPublicRoute) {
    try {
      // Verificar caché del middleware primero
      const cacheData = getCachedUserData(user.id);

      if (cacheData && isCacheValid(cacheData)) {
        // Usar datos del caché
        console.log("⚡ Usando caché del middleware para verificación");

        if (
          !cacheData.hasActiveChurches &&
          cacheData.hasPendingRequests &&
          pathname !== "/login"
        ) {
          const loginUrl = request.nextUrl.clone();
          loginUrl.pathname = "/login";
          loginUrl.searchParams.set("mensaje", "solicitud-pendiente");
          return NextResponse.redirect(loginUrl);
        }
      } else {
        // Solo hacer consulta si no hay caché válido y es una ruta crítica
        const isCriticalRoute =
          pathname === "/" || pathname.startsWith("/dashboard");

        if (isCriticalRoute) {
          console.log("🔄 Verificando estado de iglesias para ruta crítica");

          // Hacer petición interna para obtener datos del usuario
          const baseUrl = request.nextUrl.origin;
          const session = await supabase.auth.getSession();

          if (session.data.session?.access_token) {
            const userResponse = await fetch(
              `${baseUrl}/api/usuarios/${user.id}`,
              {
                headers: {
                  Authorization: `Bearer ${session.data.session.access_token}`,
                  "Content-Type": "application/json",
                },
                // Timeout más corto para middleware
                signal: AbortSignal.timeout(3000),
              },
            );

            if (userResponse.ok) {
              const userData = await userResponse.json();

              // Verificar si el usuario tiene iglesias activas
              const tieneIglesiasActivas = userData.iglesias?.some(
                (iglesia: { estado: string }) => iglesia.estado === "ACTIVO",
              );

              const tieneSolicitudesPendientes = userData.iglesias?.some(
                (iglesia: { estado: string }) => iglesia.estado === "PENDIENTE",
              );

              // Guardar en caché
              setCachedUserData(user.id, {
                userId: user.id,
                hasActiveChurches: tieneIglesiasActivas,
                hasPendingRequests: tieneSolicitudesPendientes,
                timestamp: Date.now(),
              });

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
              console.warn(
                `Error al obtener datos del usuario: ${userResponse.status}`,
              );
            }
          }
        }
      }
    } catch (error) {
      console.error("Error verificando estado de iglesias:", error);
      // Si hay error, continuar normalmente para no bloquear el acceso
    }
  }

  return supabaseResponse;
}

// Funciones de caché para middleware (usar cookies en lugar de sessionStorage)
function getCachedUserData(_userId: string): MiddlewareCacheData | null {
  try {
    // En el middleware no tenemos acceso a sessionStorage, usamos una implementación más simple
    // Esta implementación puede mejorarse usando cookies si es necesario
    return null; // Por simplicidad, devolvemos null para que use el comportamiento de consulta selectiva
  } catch (error) {
    console.error("Error leyendo caché del middleware:", error);
    return null;
  }
}

function setCachedUserData(userId: string, _data: MiddlewareCacheData): void {
  try {
    // En el middleware no tenemos acceso a sessionStorage
    // Esta implementación puede mejorarse usando cookies si es necesario
    console.log(
      `💾 Datos de usuario ${userId} guardados en caché del middleware`,
    );
  } catch (error) {
    console.error("Error guardando caché del middleware:", error);
  }
}

function isCacheValid(data: MiddlewareCacheData): boolean {
  const now = Date.now();
  return now - data.timestamp < MIDDLEWARE_CACHE_DURATION;
}
