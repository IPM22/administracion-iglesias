import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  getSupabaseServerConfig,
  getSupabaseClientConfig,
} from "./config-simple";

export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey, isConfigured } = getSupabaseClientConfig();

  if (!isConfigured) {
    throw new Error(
      "Supabase no está configurado. Revisa la consola para las instrucciones."
    );
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

// Cliente administrativo con service key para operaciones de servidor
export async function createAdminClient() {
  const { url, serviceKey, isConfigured } = getSupabaseServerConfig();

  if (!isConfigured) {
    throw new Error(
      "Supabase no está configurado. Revisa la consola para las instrucciones."
    );
  }

  return createServerClient(url, serviceKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        // No cookies needed for admin client
      },
    },
  });
}
