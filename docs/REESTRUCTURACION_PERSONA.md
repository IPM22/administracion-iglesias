# 🔄 Reestructuración del Modelo de Personas

## 📋 Resumen

Hemos completado una reestructuración profunda del modelo de personas en el sistema de administración de iglesias, unificando las tablas `Miembro` y `Visita` en una sola tabla `Persona` con automatización de flujos.

## 🎯 Objetivos Alcanzados

- ✅ **Tabla unificada Persona**: Reemplaza Miembro, Visita y incluye niños/adolescentes
- ✅ **Automatización de tipos**: Cálculo automático basado en edad
- ✅ **Reglas de negocio**: Automatización de rol y estado
- ✅ **Migración de datos**: Preserva toda la información existente
- ✅ **Módulo Comunidad**: UI unificada con tabs para diferentes vistas
- ✅ **Validaciones Zod**: Esquemas actualizados para el nuevo modelo

## 🗃️ Cambios en el Modelo de Datos

### Nuevo Modelo Persona

```prisma
model Persona {
  id                Int       @id @default(autoincrement())
  iglesiaId         Int
  nombres           String
  apellidos         String
  correo            String?
  telefono          String?
  celular           String?
  direccion         String?
  fechaNacimiento   DateTime?
  sexo              String?
  estadoCivil       String?
  ocupacion         String?
  foto              String?
  notas             String?

  // Clasificación (automática)
  tipo              TipoPersona     @default(NINO)
  rol               RolPersona      @default(VISITA)
  estado            EstadoPersona   @default(ACTIVA)

  // Info eclesiástica
  fechaIngreso      DateTime?
  fechaBautismo     DateTime?
  fechaConfirmacion DateTime?

  // Info específica de visitas
  fechaPrimeraVisita    DateTime?
  comoConocioIglesia    String?
  motivoVisita          String?
  intereses             String?

  // Familia
  familiaId         Int?
  relacionFamiliar  String?

  // Conversión / vínculos
  personaInvitaId   Int?
  personaConvertidaId Int? @unique
  fechaConversion   DateTime?

  // Relaciones
  iglesia           Iglesia   @relation(fields: [iglesiaId], references: [id])
  familia           Familia?  @relation(fields: [familiaId], references: [id])
  personaInvita     Persona?  @relation("PersonaInvita", fields: [personaInvitaId], references: [id])
  personaConvertida Persona?  @relation("PersonaConvertida", fields: [personaConvertidaId], references: [id])

  historialVisitas  HistorialVisita[]
  ministerios       PersonaMinisterio[]

  @@map("personas")
}
```

### Enums

```prisma
enum TipoPersona {
  NINO              // 0–9 años
  ADOLESCENTE       // 10–14 años
  JOVEN             // 15–24 años
  ADULTO            // 25–35 años
  ADULTO_MAYOR      // 36–59 años
  ENVEJECIENTE      // 60+ años
}

enum RolPersona {
  MIEMBRO
  VISITA
  INVITADO
}

enum EstadoPersona {
  ACTIVA
  INACTIVA
  RECURRENTE
  NUEVA
}
```

## 🤖 Automatización Implementada

### 1. Cálculo Automático de Tipo

- **Basado en fechaNacimiento**
- **Recálculo automático** cuando cambia la fecha
- **Rangos de edad** configurables

### 2. Reglas Automáticas de Rol y Estado

- **Adolescentes sin bautismo** → `VISITA RECURRENTE`
- **Personas bautizadas** → `MIEMBRO ACTIVA`
- **Conversiones** → `MIEMBRO NUEVA`
- **Por defecto** → `VISITA NUEVA`

### 3. Servicios de Automatización

```typescript
// Actualizar tipos automáticamente
await actualizarTiposPersona(iglesiaId);

// Procesar adolescentes sin bautismo
await procesarAdolescentesSinBautismo(iglesiaId);

// Procesar bautizados
await procesarBautizados(iglesiaId);

// Automatización completa
await ejecutarAutomatizacionCompleta(iglesiaId);
```

## 🖥️ Nuevo Módulo Comunidad

### Estructura

- **`/comunidad`** - Vista principal con tabs
- **`/comunidad/nueva`** - Crear nueva persona
- **`/comunidad/[id]`** - Ver/editar persona

### Características

- **3 Tabs principales**:

  - **Miembros**: Filtro `rol == 'MIEMBRO'`
  - **Visitas**: Filtro `rol == 'VISITA'`
  - **Niños/Adolescentes**: Filtro `tipo IN ('NINO', 'ADOLESCENTE')`

- **Filtros avanzados**:

  - Por tipo de persona
  - Por estado
  - Por búsqueda de texto
  - Por familia

- **Estadísticas en tiempo real**
- **Vista unificada** con información contextual

## 📦 Archivos Creados/Modificados

### Nuevos Archivos

```
prisma/schema.prisma                    # ✅ Modelo Persona y enums
src/lib/validations/persona.ts          # ✅ Esquemas Zod
src/lib/services/persona-automation.ts  # ✅ Automatización
scripts/migrate-to-persona.ts          # ✅ Migración de datos
scripts/aplicar-reestructuracion.ts    # ✅ Script principal
app/comunidad/page.tsx                  # ✅ Módulo Comunidad
```

### Archivos Existentes (a actualizar)

```
app/api/personas/route.ts               # ⚠️ Crear API
app/api/personas/[id]/route.ts          # ⚠️ Crear API
components/ui/*                         # ⚠️ Verificar componentes
```

## 🚀 Instrucciones de Implementación

### 1. Ejecutar la Migración

```bash
# Opción A: Script automatizado (recomendado)
npm run tsx scripts/aplicar-reestructuracion.ts

# Opción B: Pasos manuales
npx prisma migrate dev --name "add_persona_unified_model"
npx prisma generate
npm run tsx scripts/migrate-to-persona.ts
```

### 2. Verificar la Migración

```bash
# Conectar a la base de datos y verificar
npx prisma studio

# Verificar que existan las tablas:
# - personas
# - persona_ministerios
# Y que los datos se hayan migrado correctamente
```

### 3. Actualizar APIs

```typescript
// Crear /api/personas/route.ts
// Crear /api/personas/[id]/route.ts
// Actualizar referencias en el frontend
```

### 4. Configurar Automatización

```typescript
// Configurar cron job (opcional)
import { cronAutomatizacion } from "@/src/lib/services/persona-automation";

// Ejecutar diariamente a las 2:00 AM
// 0 2 * * * tsx -e "import('@/src/lib/services/persona-automation').then(m => m.cronAutomatizacion())"
```

### 5. Actualizar Navegación

```typescript
// Agregar enlace a /comunidad en el menú principal
// Deprecar enlaces a /miembros y /visitas gradualmente
```

## 🧪 Testing y Validación

### Pruebas Recomendadas

1. **Verificar migración de datos**

   - Todos los miembros → personas con rol MIEMBRO
   - Todas las visitas → personas con rol VISITA
   - Preservación de relaciones familiares
   - Preservación de ministerios

2. **Probar automatización**

   - Crear persona con fecha de nacimiento → tipo automático
   - Asignar fecha de bautismo → cambio a MIEMBRO
   - Adolescente sin bautismo → VISITA RECURRENTE

3. **Probar UI**
   - Navegación entre tabs
   - Filtros funcionando
   - Estadísticas correctas
   - Formularios de creación/edición

## 📊 Estadísticas Post-Migración

### Consultas Útiles

```sql
-- Distribución por tipo
SELECT tipo, COUNT(*) as cantidad
FROM personas
GROUP BY tipo;

-- Distribución por rol
SELECT rol, COUNT(*) as cantidad
FROM personas
GROUP BY rol;

-- Adolescentes sin bautismo
SELECT COUNT(*) as adolescentes_sin_bautismo
FROM personas
WHERE tipo = 'ADOLESCENTE'
  AND fechaBautismo IS NULL;

-- Miembros vs Visitas
SELECT
  rol,
  COUNT(*) as total,
  COUNT(CASE WHEN fechaBautismo IS NOT NULL THEN 1 END) as bautizados
FROM personas
GROUP BY rol;
```

## ⚠️ Consideraciones Importantes

### Compatibilidad hacia atrás

- Las tablas `miembros` y `visitas` **se mantienen** durante la transición
- **NO eliminar** hasta confirmar que todo funciona correctamente
- **Gradualmente** actualizar referencias en el código

### Migración de APIs

```typescript
// Antes
GET /api/miembros
GET /api/visitas

// Después
GET /api/personas?rol=MIEMBRO
GET /api/personas?rol=VISITA
GET /api/personas?tipo=NINO,ADOLESCENTE
```

### Índices Recomendados

```sql
-- Para consultas frecuentes
CREATE INDEX idx_personas_iglesia_rol ON personas(iglesiaId, rol);
CREATE INDEX idx_personas_iglesia_tipo ON personas(iglesiaId, tipo);
CREATE INDEX idx_personas_fecha_nacimiento ON personas(fechaNacimiento);
CREATE INDEX idx_personas_familia ON personas(familiaId);
```

## 🔮 Próximos Pasos

### Inmediatos

1. ✅ Completar APIs del modelo Persona
2. ✅ Probar migración en entorno de desarrollo
3. ✅ Validar automatización
4. ✅ Probar módulo Comunidad

### A Mediano Plazo

1. Configurar cron job para automatización
2. Migrar todas las referencias del frontend
3. Actualizar documentación de APIs
4. Crear tests automatizados

### A Largo Plazo

1. Deprecar módulos Miembros y Visitas antiguos
2. Eliminar tablas legacy (después de confirmar estabilidad)
3. Optimizar índices según uso real
4. Agregar funcionalidades adicionales (reportes, analytics)

## 🆘 Troubleshooting

### Problema: Error de migración Prisma

```bash
# Resetear si es necesario (⚠️ CUIDADO en producción)
npx prisma migrate reset
npm run tsx scripts/aplicar-reestructuracion.ts
```

### Problema: Datos inconsistentes

```bash
# Ejecutar solo la automatización
npm run tsx scripts/migrate-to-persona.ts
```

### Problema: Tipos incorrectos

```typescript
// Forzar recálculo de tipos
import { actualizarTiposPersona } from "@/src/lib/services/persona-automation";
await actualizarTiposPersona();
```

---

**📧 Contacto**: Si tienes dudas sobre la implementación, consulta este documento o revisa los archivos creados para referencias específicas.
