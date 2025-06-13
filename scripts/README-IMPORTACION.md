# 📊 Scripts de Importación de Miembros y Visitas

## 🎯 Descripción

Estos scripts permiten importar miembros y visitas desde archivos CSV directamente a la **iglesia activa** del usuario autenticado.

## 🔑 Autenticación Requerida

Los scripts requieren un token de autenticación para:

- ✅ Asegurar que solo usuarios autorizados puedan importar datos
- ✅ Insertar automáticamente en la iglesia activa del usuario
- ✅ Mantener la seguridad y aislamiento de datos entre iglesias

## 📋 Obtener Token de Autenticación

### Método 1: Desde Local Storage (Recomendado)

1. **Inicia sesión** en la aplicación web (`http://localhost:3000`)
2. **Abre las herramientas de desarrollador** (F12)
3. **Ve a la pestaña "Application"** (Chrome) o "Storage" (Firefox)
4. **Busca "Local Storage"** en el panel izquierdo
5. **Encuentra la clave** que empiece con `sb-` (ejemplo: `sb-project-auth-token`)
6. **Copia el valor del "access_token"** del objeto JSON

### Método 2: Desde Network Tab

1. **Inicia sesión** en la aplicación web
2. **Abre las herramientas de desarrollador** (F12)
3. **Ve a la pestaña "Network"**
4. **Navega en la aplicación** (por ejemplo, ve a Miembros)
5. **Busca una petición** a `/api/miembros` o similar
6. **Copia el valor del header "Authorization"** (sin el prefijo "Bearer ")

## 🚀 Uso de los Scripts

### Importar Miembros

```bash
node scripts/importar-miembros.js ruta/al/archivo-miembros.csv
```

**Ejemplo:**

```bash
node scripts/importar-miembros.js ./datos/miembros-enero-2024.csv
```

### Importar Visitas

```bash
node scripts/importar-visitas.js ruta/al/archivo-visitas.csv
```

**Ejemplo:**

```bash
node scripts/importar-visitas.js ./datos/visitas-enero-2024.csv
```

## 📄 Formato de Archivos CSV

### Para Miembros

El CSV puede tener las siguientes columnas (flexibles):

- `nombres`, `Nombres`, `Nombre`, `nombre`
- `apellido1`, `Apellido1`, `primer_apellido`
- `apellido2`, `Apellido2`, `segundo_apellido`
- `direccion`, `Direccion`, `Dirección`
- `telefonos`, `telefono`, `Telefono`, `Teléfono`

### Para Visitas

El CSV puede tener las siguientes columnas (flexibles):

- `nombres`, `Nombres`, `Nombre`, `nombre`
- `apellidos`, `Apellidos` (o `apellido1` + `apellido2`)
- `correo`, `email`, `Email`
- `direccion`, `Direccion`, `Dirección`
- `telefonos`, `telefono`, `Telefono`
- `fechaNacimiento`, `fecha_nacimiento`
- `sexo`, `Sexo`
- `estadoCivil`, `estado_civil`
- `ocupacion`, `Ocupacion`
- `familia`, `Familia`

## ⚠️ Consideraciones Importantes

### Seguridad

- ❌ **No compartas tu token** con otras personas
- ❌ **No subas archivos con tokens** a repositorios públicos
- ✅ **Obtén un token nuevo** cada vez que uses los scripts

### Datos

- ✅ Los datos se insertarán en tu **iglesia activa**
- ✅ Si tienes múltiples iglesias, selecciona la correcta antes de obtener el token
- ✅ Los scripts procesan automáticamente diferentes formatos de CSV
- ✅ Se detecta automáticamente el separador (`,` o `;`)

### Errores Comunes

- 🔧 **Token inválido**: Obtén un token nuevo
- 🔧 **Sin iglesia activa**: Asegúrate de tener una iglesia seleccionada
- 🔧 **Aplicación no ejecutándose**: Verifica que `npm run dev` esté activo

## 📊 Flujo Completo de Importación

1. **Preparar datos**: Asegúrate de que tu CSV tenga el formato correcto
2. **Iniciar aplicación**: `npm run dev`
3. **Autenticarse**: Inicia sesión y selecciona tu iglesia
4. **Obtener token**: Sigue las instrucciones arriba
5. **Ejecutar script**:
   ```bash
   node scripts/importar-miembros.js ./mi-archivo.csv
   ```
6. **Ingresar token**: Cuando se solicite
7. **Confirmar importación**: Revisar datos y confirmar con 'y'
8. **Verificar resultados**: Los datos aparecerán en tu iglesia activa

## 🆘 Solución de Problemas

### Error de Autenticación

```
❌ Usuario no autenticado
```

**Solución**: Obtén un token nuevo siguiendo los pasos arriba.

### Error de Iglesia

```
❌ No tienes acceso a ninguna iglesia activa
```

**Solución**:

1. Inicia sesión en la aplicación web
2. Selecciona una iglesia activa
3. Obtén un token nuevo

### Error de Conexión

```
❌ Error de conexión
```

**Solución**: Verifica que la aplicación esté ejecutándose en `http://localhost:3000`

## 📞 Soporte

Si tienes problemas con los scripts:

1. Verifica que tienes la última versión del código
2. Asegúrate de que la aplicación web esté funcionando
3. Revisa los logs de error para más detalles
4. Contacta al administrador del sistema

# Guía de Importación de Datos

Este directorio contiene scripts para importar datos de miembros y visitas desde archivos CSV a la aplicación.

## Scripts Disponibles

### Scripts con Autenticación por Token

- `importar-miembros.js` - Importa miembros usando token de autenticación
- `importar-visitas.js` - Importa visitas usando token de autenticación

### Scripts Simplificados (Recomendados)

- `importar-miembros-simple.js` - Importa miembros con autenticación directa
- `importar-visitas-simple.js` - Importa visitas con autenticación directa

## Scripts Simplificados (Método Recomendado)

Los scripts simplificados (`*-simple.js`) son la opción más fácil de usar ya que:

- Cargan automáticamente las variables de entorno desde `.env.local`
- Solicitan email y contraseña directamente (no necesitas tokens)
- Incluyen todas las validaciones necesarias

### Uso de Scripts Simplificados

#### Importar Miembros

```bash
node scripts/importar-miembros-simple.js ./mi-archivo-miembros.csv
```

#### Importar Visitas

```bash
node scripts/importar-visitas-simple.js ./mi-archivo-visitas.csv
```

### Campos requeridos para miembros:

- `nombres` o `Nombres` o `nombre` o `Nombre`
- `apellido1` o `Apellido1` o `apellidos` o `Apellidos`

### Campos opcionales para miembros:

- `apellido2` o `Apellido2`
- `direccion` o `Direccion`
- `telefono` o `Telefono` o `telefonos`
- `celular` o `Celular`

### Campos requeridos para visitas:

- `nombres` o `Nombres` o `nombre` o `Nombre`
- `apellido1` o `Apellido1` o `apellidos` o `Apellidos`

### Campos opcionales para visitas:

- `apellido2` o `Apellido2`
- `correo` o `email` o `Email`
- `direccion` o `Direccion`
- `telefono` o `Telefono` o `telefonos`
- `celular` o `Celular`
- `fechaNacimiento` o `fecha_nacimiento` o `nacimiento`
- `sexo` o `Sexo` (valores válidos: "Masculino", "Femenino", "Otro")
- `estadoCivil` o `estado_civil` o `EstadoCivil` (valores válidos: "Soltero/a", "Casado/a", "Viudo/a", "Divorciado/a")
- `ocupacion` o `Ocupacion` o `trabajo`
- `familia` o `Familia`
- `fechaPrimeraVisita` o `primera_visita` o `primeraVisita`
- `notas` o `observaciones` o `comentarios`

### Funcionamiento

1. El script lee tu archivo `.env.local` automáticamente
2. Procesa el archivo CSV detectando el separador (coma o punto y coma)
3. Solicita tus credenciales de email y contraseña
4. Se autentica con Supabase directamente
5. Inserta los datos en la iglesia activa de tu usuario

## Scripts con Token (Método Avanzado)

Si prefieres usar tokens de autenticación manualmente, puedes usar los scripts originales.

### 1. Obtener Token de Autenticación

#### Opción A: Desde Local Storage

1. Abre la aplicación web en tu navegador
2. Inicia sesión normalmente
3. Abre las herramientas de desarrollador (F12)
4. Ve a la pestaña "Application" o "Aplicación"
5. En el panel izquierdo, busca "Local Storage"
6. Busca claves que empiecen con `sb-` y contengan tu proyecto de Supabase
7. Copia el valor del token de acceso

#### Opción B: Desde Network Tab

1. Abre la aplicación web en tu navegador
2. Inicia sesión normalmente
3. Abre las herramientas de desarrollador (F12)
4. Ve a la pestaña "Network" o "Red"
5. Navega por la aplicación (ej: ve a miembros o visitas)
6. Busca peticiones a `/api/`
7. En los headers de la petición, busca `Authorization: Bearer ...`
8. Copia el token (sin el "Bearer ")

### 2. Usar los Scripts con Token

#### Importar Miembros

```bash
node scripts/importar-miembros.js ./mi-archivo-miembros.csv
```

Cuando el script pregunte por el token, pégalo.

#### Importar Visitas

```bash
node scripts/importar-visitas.js ./mi-archivo-visitas.csv
```

Cuando el script pregunte por el token, pégalo.

## Formato del Archivo CSV

### Ejemplo para Miembros:

```csv
nombres,apellidos,telefono,direccion
Juan,García López,555-1234,Calle Principal 123
María,Rodríguez,555-5678,Avenida Central 456
```

### Ejemplo para Visitas:

```csv
nombres,apellidos,correo,telefono,sexo,estadoCivil
Ana,Pérez García,ana@email.com,555-9999,Femenino,Soltera
Carlos,López,carlos@email.com,555-8888,Masculino,Casado
```

## Requisitos Previos

1. **Variables de entorno configuradas**: Asegúrate de tener `.env.local` con:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
   ```

2. **Aplicación ejecutándose**: La aplicación web debe estar corriendo en `http://localhost:3000`

3. **Usuario autenticado**: Debes tener una cuenta válida en la aplicación

## Importante sobre Seguridad

- Los datos se insertan automáticamente en **la iglesia activa del usuario autenticado**
- No es posible insertar datos en iglesias de otros usuarios
- Todos los scripts requieren autenticación válida
- Los datos son validados antes de la inserción

## Solución de Problemas

### Error "Variables de entorno no encontradas"

- Verifica que existe el archivo `.env.local` en la raíz del proyecto
- Asegúrate de que las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` estén presentes

### Error "Credenciales inválidas"

- Verifica el email y contraseña
- Asegúrate de que el usuario existe en la aplicación

### Error "Sin iglesia asignada"

- El usuario debe tener al menos una iglesia asignada
- Contacta al administrador para asignar iglesias

### Archivos CSV no se procesan

- Verifica que el archivo existe
- Asegúrate de que tiene los campos mínimos requeridos (nombres y apellidos)
- Revisa que el formato de separadores sea consistente (comas o punto y coma)

## 🧹 Limpieza de Datos Mal Insertados

Si ejecutaste scripts de importación antes de las correcciones y tienes datos incorrectos en la base de datos, puedes usar el script de limpieza.

### Script de Limpieza de Visitas

```bash
node scripts/limpiar-visitas-mal-insertadas.js
```

### ¿Qué hace este script?

1. **Identifica visitas problemáticas** basándose en:

   - Fecha de creación (busca visitas creadas en un período específico)
   - Estado "Activa" (valor típico del script con problemas)
   - Patrones de inserción automática

2. **Te muestra un resumen** de las visitas encontradas:

   - Nombres y apellidos
   - ID de la visita
   - Fecha de creación
   - Razones por las que se considera problemática

3. **Te permite confirmar** antes de eliminar

4. **Elimina las visitas** seleccionadas de forma segura

### Uso del Script de Limpieza

1. **Ejecuta el script:**

   ```bash
   node scripts/limpiar-visitas-mal-insertadas.js
   ```

2. **Proporciona tus credenciales** (mismo email/contraseña de la app)

3. **Especifica la fecha límite** (o presiona Enter para usar hoy):

   - Ejemplo: `2024-01-15` para buscar desde el 15 de enero
   - Vacío: busca desde hoy

4. **Revisa la lista** de visitas encontradas

5. **Confirma la eliminación** escribiendo `y` si estás seguro

### ⚠️ Importante sobre la Limpieza

- **Solo elimina de tu iglesia activa** (misma seguridad que los otros scripts)
- **Pide confirmación** antes de eliminar cualquier dato
- **Muestra detalles** de cada visita antes de eliminarla
- **Es reversible** si tienes respaldos de la base de datos

### Flujo Completo de Corrección

Si tienes datos mal insertados:

1. **Ejecuta la limpieza:**

   ```bash
   node scripts/limpiar-visitas-mal-insertadas.js
   ```

2. **Verifica que se eliminaron** los datos incorrectos

3. **Ejecuta la importación corregida:**

   ```bash
   node scripts/importar-visitas-simple.js ./tu-archivo.csv
   ```

4. **Verifica en la aplicación web** que los datos se insertaron correctamente

### Criterios de Identificación

El script identifica visitas problemáticas si:

- Se crearon después de una fecha específica
- Tienen estado "Activa" (valor por defecto del script con problemas)
- Coinciden con patrones de inserción automática

Esto minimiza el riesgo de eliminar visitas legítimas creadas manualmente.
