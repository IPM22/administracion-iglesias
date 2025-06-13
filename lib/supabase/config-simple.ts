// Configuración simplificada de Supabase - separada para cliente y servidor

// Configuración solo para el cliente (navegador)
export function getSupabaseClientConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isConfigured = Boolean(url && anonKey);

  if (!isConfigured) {
    console.error("❌ Supabase Client Config Missing:", {
      NEXT_PUBLIC_SUPABASE_URL: url ? "OK" : "MISSING",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey ? "OK" : "MISSING",
    });
  }

  return {
    url: url || "",
    anonKey: anonKey || "",
    isConfigured,
  };
}

// Configuración completa para el servidor (incluye serviceKey)
export function getSupabaseServerConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Sin NEXT_PUBLIC_

  const isConfigured = Boolean(url && anonKey && serviceKey);

  if (!isConfigured) {
    console.error("❌ Supabase Server Config Missing:", {
      NEXT_PUBLIC_SUPABASE_URL: url ? "OK" : "MISSING",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey ? "OK" : "MISSING",
      SUPABASE_SERVICE_ROLE_KEY: serviceKey ? "OK" : "MISSING",
    });
  }

  return {
    url: url || "",
    anonKey: anonKey || "",
    serviceKey: serviceKey || "",
    isConfigured,
    isSupabaseProject: true,
  };
}

// Función legacy para compatibilidad (usar getSupabaseClientConfig o getSupabaseServerConfig)
export function getSupabaseConfig() {
  // Para el cliente, solo necesitamos URL y anonKey
  return getSupabaseClientConfig();
}
