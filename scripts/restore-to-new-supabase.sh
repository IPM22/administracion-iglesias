#!/bin/bash
# =============================================================================
# Script para restaurar backup de Supabase antiguo a nuevo proyecto
# =============================================================================
# 
# USO: 
#   ./scripts/restore-to-new-supabase.sh <DATABASE_URL>
#
# EJEMPLO:
#   ./scripts/restore-to-new-supabase.sh "postgresql://postgres.tlsxnjyfpnjjxznjjuap:TU_PASSWORD@aws-0-us-east-2.pooler.supabase.com:5432/postgres"
#
# NOTA: Usa la DIRECT_URL (puerto 5432), NO la URL con pgbouncer (puerto 6543)
# =============================================================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BACKUP_FILE="backups/db_cluster-12-08-2025@07-04-36.backup"
EXTRACT_DIR="backups/extracted"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Agregar psql al PATH si es necesario
export PATH="/opt/homebrew/opt/libpq/bin:$PATH"

echo -e "${BLUE}==============================================================${NC}"
echo -e "${BLUE}  Restauración de Base de Datos a Nuevo Proyecto Supabase     ${NC}"
echo -e "${BLUE}==============================================================${NC}"
echo ""

# Verificar que existe el backup
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ No se encontró el archivo de backup: $BACKUP_FILE${NC}"
    exit 1
fi

# Verificar que psql está disponible
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ psql no está instalado. Ejecuta: brew install libpq${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backup encontrado: $BACKUP_FILE${NC}"
echo -e "${GREEN}✅ psql disponible: $(psql --version)${NC}"
echo ""

# Obtener la URL de la base de datos
if [ -n "$1" ]; then
    DB_URL="$1"
else
    # Intentar leer del .env.local
    if [ -f ".env.local" ]; then
        DB_URL=$(grep "^DIRECT_URL=" .env.local | sed 's/^DIRECT_URL=//' | tr -d '"')
    fi
    
    if [ -z "$DB_URL" ]; then
        echo -e "${RED}❌ Debes proporcionar la DATABASE URL como argumento o tener DIRECT_URL en .env.local${NC}"
        echo ""
        echo "Uso: $0 <DIRECT_URL>"
        echo ""
        echo "Encuentra tu DIRECT_URL en:"
        echo "  Supabase Dashboard > Settings > Database > Connection string > URI"
        echo "  (Usa la conexión directa, NO la de Session/Transaction pooler)"
        exit 1
    fi
fi

echo -e "${YELLOW}📡 Conectando a la base de datos...${NC}"

# Verificar conexión
if ! psql "$DB_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${RED}❌ No se pudo conectar a la base de datos. Verifica la URL.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Conexión exitosa${NC}"
echo ""

# Crear directorio de extracción
mkdir -p "$EXTRACT_DIR"

# =============================================================================
# PASO 1: Extraer SQL de datos de la aplicación desde el backup
# =============================================================================
echo -e "${BLUE}📦 Paso 1: Extrayendo datos del backup...${NC}"

python3 << 'PYTHON_SCRIPT'
import re
import sys

backup_file = "backups/db_cluster-12-08-2025@07-04-36.backup"
output_auth = "backups/extracted/01_auth_users.sql"
output_data = "backups/extracted/02_app_data.sql"
output_sequences = "backups/extracted/03_sequences.sql"

# Tablas de la aplicación en orden de dependencia (respetando foreign keys)
app_tables_order = [
    "public.iglesias",
    "public.usuarios",
    "public.usuario_iglesias",
    "public.familias",
    "public.personas",
    "public.ministerios",
    "public.tipos_actividad",
    "public.actividades",
    "public.actividad_horarios",
    "public.persona_ministerios",
    "public.historial_visitas",
    "public.familiares",
    "public.vinculos_familiares",
]

# Tablas de auth que necesitamos restaurar
auth_tables = [
    "auth.users",
    "auth.identities",
]

print("  Leyendo backup...")
with open(backup_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"  Total de líneas: {len(lines)}")

def extract_copy_data(lines, table_name):
    """Extrae el bloque COPY...FROM stdin para una tabla dada"""
    result = []
    in_block = False
    
    for i, line in enumerate(lines):
        if line.startswith(f"COPY {table_name} ") and "FROM stdin;" in line:
            in_block = True
            result.append(line)
            continue
        if in_block:
            if line.strip() == "\\.":
                result.append(line)
                break
            result.append(line)
    
    return result

# Extraer datos de auth.users
print("  Extrayendo datos de autenticación...")
with open(output_auth, 'w', encoding='utf-8') as f:
    f.write("-- =============================================================\n")
    f.write("-- Restauración de usuarios de autenticación (auth.users)\n")
    f.write("-- =============================================================\n\n")
    
    for table in auth_tables:
        data = extract_copy_data(lines, table)
        if len(data) > 2:  # Más que solo COPY y \.
            f.write(f"-- Tabla: {table} ({len(data) - 2} registros)\n")
            for line in data:
                f.write(line)
            f.write("\n")
        else:
            f.write(f"-- Tabla: {table} (sin datos)\n\n")

print(f"  ✅ Auth data extraída a {output_auth}")

# Extraer datos de la aplicación
print("  Extrayendo datos de la aplicación...")
with open(output_data, 'w', encoding='utf-8') as f:
    f.write("-- =============================================================\n")
    f.write("-- Restauración de datos de la aplicación\n")
    f.write("-- =============================================================\n\n")
    f.write("-- Desactivar triggers temporalmente para evitar conflictos\n")
    f.write("SET session_replication_role = 'replica';\n\n")
    
    for table in app_tables_order:
        data = extract_copy_data(lines, table)
        if len(data) > 2:  # Más que solo COPY y \.
            f.write(f"-- Tabla: {table} ({len(data) - 2} registros)\n")
            for line in data:
                f.write(line)
            f.write("\n")
        else:
            f.write(f"-- Tabla: {table} (sin datos)\n\n")
    
    f.write("\n-- Reactivar triggers\n")
    f.write("SET session_replication_role = 'origin';\n")

print(f"  ✅ App data extraída a {output_data}")

# Extraer secuencias (auto-increment values)
print("  Extrayendo secuencias...")
sequence_lines = []
for i, line in enumerate(lines):
    if "SELECT pg_catalog.setval" in line and "public." in line:
        sequence_lines.append(line)

with open(output_sequences, 'w', encoding='utf-8') as f:
    f.write("-- =============================================================\n")
    f.write("-- Restauración de secuencias (auto-increment counters)\n")
    f.write("-- =============================================================\n\n")
    for line in sequence_lines:
        f.write(line)

print(f"  ✅ Secuencias extraídas a {output_sequences}")
print(f"  📊 {len(sequence_lines)} secuencias encontradas")

PYTHON_SCRIPT

echo -e "${GREEN}✅ Datos extraídos exitosamente${NC}"
echo ""

# =============================================================================
# PASO 2: Crear estructura con Prisma
# =============================================================================
echo -e "${BLUE}🏗️  Paso 2: Creando estructura de la base de datos con Prisma...${NC}"
echo -e "${YELLOW}   (Esto ejecutará prisma db push para crear las tablas)${NC}"

# Usar la DIRECT_URL para Prisma
export DIRECT_URL="$DB_URL"
# Crear una URL con pgbouncer para DATABASE_URL (cambiar puerto 5432 -> 6543 y agregar pgbouncer)
export DATABASE_URL=$(echo "$DB_URL" | sed 's/:5432\//:6543\//' | sed 's/$/?pgbouncer=true/')

echo "  Ejecutando prisma db push..."
npx prisma db push --accept-data-loss 2>&1 | tail -5

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al crear la estructura de la BD${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Estructura de BD creada${NC}"
echo ""

# =============================================================================
# PASO 3: Restaurar datos de autenticación (auth.users)
# =============================================================================
echo -e "${BLUE}🔐 Paso 3: Restaurando usuarios de autenticación...${NC}"

if [ -f "$EXTRACT_DIR/01_auth_users.sql" ]; then
    psql "$DB_URL" -f "$EXTRACT_DIR/01_auth_users.sql" 2>&1 | tail -10
    echo -e "${GREEN}✅ Usuarios de auth restaurados${NC}"
else
    echo -e "${YELLOW}⚠️  No se encontró archivo de auth, saltando...${NC}"
fi
echo ""

# =============================================================================
# PASO 4: Restaurar datos de la aplicación
# =============================================================================
echo -e "${BLUE}📊 Paso 4: Restaurando datos de la aplicación...${NC}"

if [ -f "$EXTRACT_DIR/02_app_data.sql" ]; then
    psql "$DB_URL" -f "$EXTRACT_DIR/02_app_data.sql" 2>&1 | tail -10
    echo -e "${GREEN}✅ Datos de la aplicación restaurados${NC}"
else
    echo -e "${RED}❌ No se encontró archivo de datos de la app${NC}"
    exit 1
fi
echo ""

# =============================================================================
# PASO 5: Restaurar secuencias
# =============================================================================
echo -e "${BLUE}🔢 Paso 5: Restaurando secuencias (auto-increment)...${NC}"

if [ -f "$EXTRACT_DIR/03_sequences.sql" ]; then
    psql "$DB_URL" -f "$EXTRACT_DIR/03_sequences.sql" 2>&1 | tail -10
    echo -e "${GREEN}✅ Secuencias restauradas${NC}"
else
    echo -e "${YELLOW}⚠️  No se encontró archivo de secuencias, saltando...${NC}"
fi
echo ""

# =============================================================================
# PASO 6: Verificación
# =============================================================================
echo -e "${BLUE}🔍 Paso 6: Verificando restauración...${NC}"
echo ""

psql "$DB_URL" << 'VERIFY_SQL'
SELECT '--- Conteo de registros por tabla ---' as info;
SELECT 'iglesias' as tabla, count(*) as registros FROM public.iglesias
UNION ALL SELECT 'usuarios', count(*) FROM public.usuarios
UNION ALL SELECT 'usuario_iglesias', count(*) FROM public.usuario_iglesias
UNION ALL SELECT 'familias', count(*) FROM public.familias
UNION ALL SELECT 'personas', count(*) FROM public.personas
UNION ALL SELECT 'ministerios', count(*) FROM public.ministerios
UNION ALL SELECT 'tipos_actividad', count(*) FROM public.tipos_actividad
UNION ALL SELECT 'actividades', count(*) FROM public.actividades
UNION ALL SELECT 'actividad_horarios', count(*) FROM public.actividad_horarios
UNION ALL SELECT 'persona_ministerios', count(*) FROM public.persona_ministerios
UNION ALL SELECT 'historial_visitas', count(*) FROM public.historial_visitas
UNION ALL SELECT 'familiares', count(*) FROM public.familiares
UNION ALL SELECT 'vinculos_familiares', count(*) FROM public.vinculos_familiares
UNION ALL SELECT 'auth.users', count(*) FROM auth.users
ORDER BY tabla;
VERIFY_SQL

echo ""
echo -e "${GREEN}==============================================================${NC}"
echo -e "${GREEN}  ✅ ¡Restauración completada exitosamente!                   ${NC}"
echo -e "${GREEN}==============================================================${NC}"
echo ""
echo -e "${YELLOW}📋 Próximos pasos:${NC}"
echo "  1. Actualiza tu .env.local con las credenciales del nuevo proyecto"
echo "  2. Ejecuta: npx prisma generate"
echo "  3. Prueba la aplicación: npm run dev"
echo ""
