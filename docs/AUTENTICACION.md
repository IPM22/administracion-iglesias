# Sistema de Autenticación con Supabase

## Descripción General

Esta implementación utiliza **Supabase Auth** como sistema de autenticación principal, integrado nativamente con la base de datos PostgreSQL existente de tu aplicación.

## Características Implementadas

### 🔐 Autenticación Básica

- **Registro de usuarios** con email y contraseña
- **Inicio de sesión** con validación
- **Cierre de sesión** seguro
- **Recuperación de contraseñas** (próximamente)

### 🛡️ Seguridad

- **Middleware de autenticación** en todas las rutas
- **Protección de rutas** automática
- **Gestión de sesiones** con cookies seguras
- **Tokens JWT** automáticos

### 🎨 UI/UX

- **Formularios responsive** con shadcn/ui
- **Validación en tiempo real**
- **Estados de carga** y feedback visual
- **Manejo de errores** informativo

## Estructura de Archivos

```
lib/supabase/
├── client.ts          # Cliente para navegador
├── server.ts          # Cliente para servidor
├── middleware.ts      # Middleware de auth
└── types.ts           # Tipos TypeScript

components/auth/
├── login-form.tsx     # Formulario de login
├── register-form.tsx  # Formulario de registro
└── sign-out-button.tsx # Botón cerrar sesión

hooks/
└── use-auth.ts        # Hook personalizado

app/
├── login/page.tsx     # Página de login
├── register/page.tsx  # Página de registro
└── dashboard/page.tsx # Dashboard protegido

middleware.ts          # Middleware principal de Next.js
```

## Variables de Entorno Necesarias

Agrega estas variables a tu archivo `.env.local`:

```env
# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

## Configuración en Supabase

### 1. Habilitar Auth en Supabase

1. Ve a tu proyecto en Supabase Dashboard
2. Navega a **Authentication > Settings**
3. Configura:
   - **Site URL**: `http://localhost:3000` (desarrollo)
   - **Redirect URLs**: `http://localhost:3000/auth/callback`

### 2. Configurar Políticas RLS

```sql
-- Habilitar RLS en tabla Miembro
ALTER TABLE "Miembro" ENABLE ROW LEVEL SECURITY;

-- Política para usuarios autenticados
CREATE POLICY "Users can view all members" ON "Miembro"
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert members" ON "Miembro"
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update members" ON "Miembro"
    FOR UPDATE USING (auth.role() = 'authenticated');
```

### 3. Configurar Tabla de Perfiles (Opcional)

```sql
-- Crear tabla de perfiles de usuario
CREATE TABLE user_profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE,
  nombres TEXT,
  apellidos TEXT,
  rol TEXT DEFAULT 'miembro',
  miembro_id INTEGER REFERENCES "Miembro"(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Habilitar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo vean su propio perfil
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);
```

## Uso de la Autenticación

### Hook useAuth()

```tsx
import { useAuth } from "@/hooks/use-auth";

function MiComponente() {
  const { user, loading, signIn, signOut } = useAuth();

  if (loading) return <div>Cargando...</div>;

  if (!user) return <div>No autenticado</div>;

  return <div>Hola {user.email}</div>;
}
```

### Proteger Rutas en Servidor

```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function RutaProtegida() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <div>Contenido protegido</div>;
}
```

### Middleware Automático

El middleware automáticamente:

- ✅ Renueva sesiones
- ✅ Protege rutas `/admin/*`
- ✅ Redirige a login cuando sea necesario

## Próximos Pasos

### Funcionalidades Pendientes

1. **Recuperación de contraseñas**
2. **Autenticación con OAuth** (Google, GitHub)
3. **Sistema de roles** avanzado
4. **Verificación de email**
5. **Multi-factor authentication (MFA)**

### Integración con Modelos Existentes

1. **Sincronización automática** User ↔ Miembro
2. **Permisos granulares** por ministerio
3. **Roles específicos** (Pastor, Líder, Miembro)

## Solución de Problemas

### Error: "Invalid JWT"

- Verifica que las variables de entorno estén correctas
- Asegúrate de que los tokens no hayan expirado

### Error: "No se puede conectar a Supabase"

- Verifica la URL del proyecto
- Confirma que las claves API sean válidas

### Redirecciones Infinitas

- Revisa la configuración del middleware
- Verifica las URLs permitidas en Supabase

## Comandos Útiles

```bash
# Verificar configuración
npm run dev

# Verificar tipos
npm run build

# Limpiar caché
rm -rf .next
npm run dev
```
