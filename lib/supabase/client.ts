import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config-simple";

export function createClient() {
  const { url, anonKey, isConfigured } = getSupabaseConfig();

  if (!isConfigured) {
    throw new Error(
      "Supabase no está configurado. Revisa la consola para las instrucciones."
    );
  }

  return createBrowserClient(url, anonKey);
}
