# 🔄 Guía de Backup de Base de Datos

Esta guía te explica cómo hacer backup de tu base de datos Supabase desde tu proyecto de administración de iglesias.

## 📋 Opciones Disponibles

Tienes **3 opciones** para hacer backup de tu base de datos:

### 1. 🚀 **Backup con pg_dump (Recomendado para Producción)**

- **Más rápido y completo**
- Incluye estructura y datos
- Formato SQL estándar
- Requiere PostgreSQL instalado

### 2. 🔧 **Backup con Prisma (Recomendado para Desarrollo)**

- **No requiere instalaciones adicionales**
- Solo datos de la aplicación
- Formato JSON legible
- Más seguro para desarrollo

### 3. 📊 **Backup desde Supabase Dashboard**

- **Más fácil y directo**
- Desde la interfaz web de Supabase
- Backup completo de la base de datos

---

## 🚀 Método 1: Backup con pg_dump

### Requisitos Previos

1. **Instalar PostgreSQL** en tu sistema:

   - **Windows**: Descarga desde [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)
   - **macOS**: `brew install postgresql`
   - **Linux**: `sudo apt-get install postgresql-client`

2. **Verificar instalación**:
   ```bash
   pg_dump --version
   psql --version
   ```

### Uso del Script

```bash
# Crear un nuevo backup
npm run backup:create

# Listar backups existentes
npm run backup:list

# Restaurar un backup específico
npm run backup:restore backup_2024-01-15_10-30-00.sql

# Ver ayuda
node scripts/backup-database.js help
```

### Ventajas

- ✅ **Backup completo**: Estructura + datos
- ✅ **Formato estándar**: SQL compatible
- ✅ **Más rápido**: Para bases de datos grandes
- ✅ **Restauración completa**: Incluye índices, triggers, etc.

---

## 🔧 Método 2: Backup con Prisma

### Uso del Script

```bash
# Crear un nuevo backup
npm run backup:prisma:create

# Listar backups existentes
npm run backup:prisma:list

# Restaurar un backup específico (SOLO DESARROLLO)
npm run backup:prisma:restore prisma_backup_2024-01-15_10-30-00.json

# Ver ayuda
node scripts/backup-prisma.js help
```

### Ventajas

- ✅ **Sin dependencias externas**: Solo Node.js
- ✅ **Backup específico**: Solo datos de la aplicación
- ✅ **Formato legible**: JSON fácil de revisar
- ✅ **Más seguro**: Para desarrollo y testing

### Limitaciones

- ❌ **Solo datos**: No incluye estructura de BD
- ❌ **Más lento**: Para bases de datos grandes
- ❌ **Restauración limitada**: Solo para desarrollo

---

## 📊 Método 3: Backup desde Supabase Dashboard

### Pasos

1. **Accede a tu proyecto** en [Supabase Dashboard](https://supabase.com/dashboard)
2. Ve a **Settings > Database**
3. Busca la sección **Backups**
4. Haz clic en **"Create a new backup"**
5. Descarga el archivo `.sql`

### Ventajas

- ✅ **Sin configuración**: Todo desde la web
- ✅ **Backup completo**: Estructura + datos
- ✅ **Automático**: Puedes programar backups
- ✅ **Seguro**: Desde la plataforma oficial

---

## 📁 Estructura de Archivos

Los backups se guardan en el directorio `backups/`:

```
backups/
├── backup_2024-01-15_10-30-00.sql          # pg_dump
├── prisma_backup_2024-01-15_10-30-00.json  # Prisma
└── ...
```

---

## 🔒 Configuración de Seguridad

### Variables de Entorno Requeridas

Asegúrate de tener en tu archivo `.env.local`:

```bash
# Para pg_dump
DATABASE_URL="postgresql://postgres:[password]@[host]:[port]/postgres"

# Para Prisma (misma variable)
DATABASE_URL="postgresql://postgres:[password]@[host]:[port]/postgres"
```

### Obtener DATABASE_URL desde Supabase

1. Ve a tu proyecto en Supabase Dashboard
2. **Settings > Database**
3. Busca **Connection string**
4. Copia la **URI** completa

---

## 🚨 Recomendaciones de Seguridad

### Para Desarrollo

- ✅ Usa **backup con Prisma** para testing
- ✅ Haz backup antes de cambios importantes
- ✅ Guarda backups en ubicación segura

### Para Producción

- ✅ Usa **pg_dump** o **Supabase Dashboard**
- ✅ Programa backups automáticos
- ✅ Prueba restauraciones en entorno de desarrollo
- ✅ Mantén múltiples versiones de backup

---

## 🔧 Troubleshooting

### Error: "pg_dump no encontrado"

```bash
# Instalar PostgreSQL Client
# Windows: Descargar desde postgresql.org
# macOS: brew install postgresql
# Linux: sudo apt-get install postgresql-client
```

### Error: "DATABASE_URL no definida"

```bash
# Verificar archivo .env.local
# Asegurar que DATABASE_URL esté definida
# Reiniciar terminal después de cambios
```

### Error: "Permiso denegado"

```bash
# Verificar credenciales de Supabase
# Asegurar que la IP esté en whitelist
# Verificar que el usuario tenga permisos
```

---

## 📞 Soporte

Si tienes problemas:

1. **Verifica la configuración** de variables de entorno
2. **Revisa los logs** del script para errores específicos
3. **Prueba con Supabase Dashboard** como alternativa
4. **Consulta la documentación** de Supabase

---

## 🎯 Comandos Rápidos

```bash
# Backup rápido con Prisma (desarrollo)
npm run backup:prisma:create

# Backup completo con pg_dump (producción)
npm run backup:create

# Listar todos los backups
npm run backup:list && npm run backup:prisma:list

# Backup desde Supabase Dashboard
# (Manual desde la web)
```
