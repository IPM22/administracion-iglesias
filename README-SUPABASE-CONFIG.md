# Configuración de Supabase - Variables de Entorno

## ⚠️ Migración de Configuración Hardcoded

Se ha removido la configuración hardcoded de Supabase por motivos de seguridad. Ahora el sistema utiliza variables de entorno.

## 🔒 Limpieza de Logs Sensibles

Se han eliminado todos los console.log que podrían exponer:

- ✅ URLs de proyectos Supabase
- ✅ Datos de configuración de credenciales
- ✅ Información personal de usuarios y familias
- ✅ Logs de debug con datos sensibles

## 🔧 Problema Crítico Resuelto: ServiceKey en Cliente

**PROBLEMA IDENTIFICADO**: La variable `SUPABASE_SERVICE_ROLE_KEY` solo funcionaba cuando se convertía a `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`, lo cual **exponía credenciales administrativas al navegador**.

**SOLUCIÓN IMPLEMENTADA**:

- ✅ **Configuración separada**: Cliente y servidor usan diferentes configuraciones
- ✅ **Cliente**: Solo usa `url` y `anonKey` (públicas)
- ✅ **Servidor**: Usa `url`, `anonKey` y `serviceKey` (secreta)
- ✅ **ServiceKey permanece secreta**: Nunca se expone al navegador

## Variables de Entorno Requeridas

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```bash
# Configuración de Supabase
NEXT_PUBLIC_SUPABASE_URL="https://tu-proyecto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="tu-clave-publica-de-supabase"
SUPABASE_SERVICE_ROLE_KEY="tu-clave-de-servicio-de-supabase"
```

⚠️ **IMPORTANTE**: `SUPABASE_SERVICE_ROLE_KEY` **NO** tiene `NEXT_PUBLIC_` para mantenerla secreta.

## 🔍 Cómo Obtener las Credenciales

### 1. URL del Proyecto

- Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
- La URL tiene el formato: `https://[PROJECT_ID].supabase.co`

### 2. Claves de API

1. En tu proyecto de Supabase, ve a **Settings > API**
2. Copia las siguientes claves:
   - **anon / public**: Para `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role**: Para `SUPABASE_SERVICE_ROLE_KEY`

## 🔒 Notas de Seguridad

- ✅ **NEXT_PUBLIC_SUPABASE_URL**: Pública, puede exponerse al cliente
- ✅ **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Pública, puede exponerse al cliente
- ❌ **SUPABASE_SERVICE_ROLE_KEY**: Privada, NUNCA debe exponerse al cliente

## 🚀 Arquitectura de Configuración

El proyecto ahora utiliza configuraciones separadas:

### Cliente (Navegador)

- **Archivo**: `getSupabaseClientConfig()` en `config-simple.ts`
- **Variables**: Solo `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Uso**: Componentes React, hooks, páginas del cliente

### Servidor (Node.js)

- **Archivo**: `getSupabaseServerConfig()` en `config-simple.ts`
- **Variables**: Incluye `SUPABASE_SERVICE_ROLE_KEY` (secreta)
- **Uso**: API routes, Server Components, operaciones administrativas

### Funciones Disponibles:

- ✅ `getSupabaseClientConfig()` - Para el cliente (sin serviceKey)
- ✅ `getSupabaseServerConfig()` - Para el servidor (con serviceKey)
- ✅ `getSupabaseConfig()` - Legacy, usa cliente por defecto

## 🔧 Troubleshooting

Si ves errores de configuración:

1. Verifica que el archivo `.env.local` existe en la raíz
2. Confirma que todas las variables están definidas
3. **VERIFICA** que `SUPABASE_SERVICE_ROLE_KEY` **NO** tiene `NEXT_PUBLIC_`
4. Reinicia el servidor de desarrollo (`npm run dev`)
5. Revisa la consola para mensajes de debug (sin información sensible)

## 📝 Migración Completa

### Archivos actualizados para usar configuración segura:

- `lib/supabase/client.ts` - Usa `getSupabaseClientConfig()`
- `lib/supabase/server.ts` - Usa configuraciones separadas
- `lib/supabase/middleware.ts` - Usa `getSupabaseClientConfig()`

### Archivos con logs sensibles limpiados:

- `lib/supabase/config-simple.ts` - Configuraciones separadas y logs limpios
- `lib/supabase/config.ts` - Eliminadas URLs hardcoded en logs
- `app/configuracion/page.tsx` - Eliminados logs de datos de perfil e iglesia
- `app/familias/[id]/arbol/page.tsx` - Eliminados logs de datos familiares

### Archivos eliminados:

- `lib/supabase/config-hardcoded.ts` - **Eliminado por seguridad**

## 🛡️ Mejoras de Privacidad y Seguridad

- ❌ Ya no se logea información de configuración de Supabase
- ❌ Ya no se muestran datos de usuarios en logs
- ❌ Ya no se exponen estructuras familiares en console.log
- ❌ Ya no se muestran URLs de proyectos en logs de debug
- ❌ **SOLUCIONADO**: ServiceKey ya no se expone al cliente
- ✅ Solo se mantienen logs de errores necesarios (sin datos sensibles)
- ✅ **Configuración segura**: Cliente y servidor separados correctamente
