// Extrae automáticamente la configuración de Supabase desde DATABASE_URL
function extractSupabaseConfig() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return null;
  }

  // Extraer el project ID desde la URL de Supabase
  // Formato: postgresql://postgres.[PROJECT_ID]:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres
  const urlMatch = databaseUrl.match(
    /postgres\.([^:]+):[^@]+@db\.([^.]+)\.supabase\.co/
  );

  if (!urlMatch) {
    return null; // No es una URL de Supabase
  }

  const projectId = urlMatch[1];

  return {
    url: `https://${projectId}.supabase.co`,
    projectId,
  };
}

// Configuración automática
const autoConfig = extractSupabaseConfig();

export const SUPABASE_URL = autoConfig?.url;
export const SUPABASE_PROJECT_ID = autoConfig?.projectId;

export function getSupabaseConfig() {
  // Priorizar variables explícitas de Supabase, luego auto-detectar
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY;

  const isConfigured = Boolean(url && anonKey && serviceKey);

  if (!isConfigured && autoConfig) {
    console.log(`
🔍 Supabase detectado automáticamente

Para completar la configuración de autenticación, agrega a tu .env.local:

NEXT_PUBLIC_SUPABASE_URL="[URL_DE_TU_PROYECTO]"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[TU_CLAVE_PUBLICA]"
NEXT_SUPABASE_SERVICE_ROLE_KEY="[TU_CLAVE_DE_SERVICIO]"

Obtén las claves desde tu dashboard de Supabase en Settings > API
    `);
  }

  return {
    url: url || "",
    anonKey: anonKey || "",
    serviceKey: serviceKey || "",
    isConfigured,
    isSupabaseProject: Boolean(autoConfig),
  };
}
