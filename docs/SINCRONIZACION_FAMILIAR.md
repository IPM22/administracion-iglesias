# Sistema de Sincronización de Relaciones Familiares

## Problema Resuelto

Anteriormente existían ambigüedades entre las **relaciones familiares individuales** y los **núcleos familiares**:

- Si se agregaba una relación familiar entre dos personas, no se sincronizaba automáticamente con su núcleo familiar
- Si se agregaba alguien a un núcleo familiar, no se inferían automáticamente las relaciones familiares con otros miembros
- Esto generaba inconsistencias y datos duplicados

## Solución Implementada

### 🔄 Sincronización Automática Bidireccional

**Cuando se agrega una relación familiar:**

- El sistema verifica si la relación requiere que las personas estén en el mismo núcleo familiar
- Automáticamente crea o fusiona núcleos familiares según sea necesario
- Mantiene coherencia entre relaciones individuales y familiares

**Cuando se agrega alguien a un núcleo familiar:**

- El sistema infiere automáticamente las relaciones familiares con otros miembros
- Crea relaciones basadas en el parentesco especificado
- Evita duplicaciones y mantiene consistencia

## 📁 Archivos Principales

### 1. `lib/familiares-sync.ts`

Contiene toda la lógica de sincronización:

```typescript
// Funciones principales
sincronizarNucleoFamiliar(); // Sincroniza núcleos cuando se crea relación
sincronizarRelacionesFamiliares(); // Crea relaciones cuando se agrega a familia
consolidarRelacionesFamiliares(); // Procesa todo el sistema existente
```

### 2. API Endpoints Actualizados

- `POST /api/miembros/[id]/familiares` - Ahora incluye sincronización automática
- `POST /api/familias/[id]/miembros` - Ahora crea relaciones automáticamente
- `POST /api/familias/consolidar` - Nuevo endpoint para consolidación masiva

### 3. Componente UI

- `components/SincronizacionFamiliar.tsx` - Interfaz para ejecutar consolidaciones

### 4. Script de Línea de Comandos

- `scripts/consolidar-familias.ts` - Herramienta administrativa
- `npm run consolidar-familias` - Ejecuta consolidación desde terminal

## 🚀 Uso del Sistema

### Sincronización Automática

La sincronización ocurre automáticamente cuando:

1. **Se agrega una relación familiar:**

   ```javascript
   // Al hacer POST a /api/miembros/{id}/familiares
   {
     "personaId": 123,
     "tipoPersona": "miembro",
     "tipoRelacion": "Esposo/a"
   }

   // Resultado: Se crea automáticamente una familia o se fusionan familias existentes
   ```

2. **Se agrega un miembro a una familia:**

   ```javascript
   // Al hacer POST a /api/familias/{id}/miembros
   {
     "miembroId": 456,
     "parentescoFamiliar": "Hijo/a"
   }

   // Resultado: Se crean automáticamente relaciones con otros miembros de la familia
   ```

### Consolidación Manual

Para datos existentes o corrección de inconsistencias:

#### Desde la Interfaz Web:

```typescript
import SincronizacionFamiliar from '@/components/SincronizacionFamiliar';

// Para toda la familia
<SincronizacionFamiliar />

// Para familia específica
<SincronizacionFamiliar familiaId={123} />
```

#### Desde Línea de Comandos:

```bash
# Consolidar todo el sistema
npm run consolidar-familias

# Consolidar familia específica
npm run consolidar-familias -- 123
```

#### Desde API:

```javascript
// Consolidación completa
POST /api/familias/consolidar
{
  "ejecutarConsolidacion": true
}

// Consolidación por familia
POST /api/familias/consolidar
{
  "ejecutarConsolidacion": true,
  "familiaId": 123
}
```

## 🔧 Configuración de Relaciones

### Relaciones que Requieren Núcleo Familiar

```typescript
const RELACIONES_NUCLEO_FAMILIAR = [
  "Esposo/a",
  "Cónyuge",
  "Hijo/a",
  "Padre",
  "Madre",
  "Hermano/a",
];
```

### Matriz de Relaciones Automáticas

```typescript
const matrizRelaciones = {
  "Cabeza de Familia": {
    "Esposo/a": "Esposo/a",
    "Hijo/a": "Padre/Madre",
  },
  "Hijo/a": {
    "Cabeza de Familia": "Hijo/a",
    "Hijo/a": "Hermano/a",
  },
  // ... más relaciones
};
```

## 📊 Respuestas de la API

### Relación Familiar Creada

```json
{
  "relacion": {
    "id": 456,
    "tipoRelacion": "Esposo/a",
    "relacionInversa": "Esposo/a",
    "esRecíproca": true
  },
  "sincronizacion": "Núcleo familiar sincronizado: nueva familia creada"
}
```

### Miembro Agregado a Familia

```json
{
  "miembro": {
    "id": 789,
    "nombres": "Juan",
    "apellidos": "Pérez",
    "parentescoFamiliar": "Hijo/a"
  },
  "sincronizacion": "Se crearon 2 relaciones familiares automáticamente"
}
```

### Resultado de Consolidación

```json
{
  "success": true,
  "mensaje": "Consolidación completada exitosamente",
  "estadisticas": {
    "relacionesCreadas": 15,
    "relacionesActualizadas": 3,
    "familiasConsolidadas": 2
  }
}
```

## ⚙️ Lógica de Fusión de Familias

Cuando dos miembros con familias diferentes se relacionan:

1. **Priorización:** Se mantiene la familia con más miembros
2. **Fusión:** Los miembros de la familia más pequeña se mueven a la más grande
3. **Eliminación:** La familia vacía se elimina automáticamente
4. **Preservación:** Se mantienen todas las relaciones existentes

## 🛡️ Seguridad y Validaciones

- ✅ Validación de existencia de miembros/visitas
- ✅ Prevención de relaciones circulares
- ✅ Verificación de relaciones duplicadas
- ✅ Manejo de errores y rollback automático
- ✅ Compatibilidad con sistema legacy

## 📈 Beneficios

### Para los Usuarios

- **Consistencia automática:** Las relaciones familiares siempre coinciden con los núcleos familiares
- **Menos trabajo manual:** El sistema infiere relaciones automáticamente
- **Datos limpios:** Eliminación de duplicaciones y inconsistencias

### Para los Administradores

- **Herramientas de consolidación:** Scripts y interfaces para limpiar datos existentes
- **Transparencia:** Mensajes claros sobre qué cambios se realizaron
- **Flexibilidad:** Consolidación por familia específica o todo el sistema

### Para los Desarrolladores

- **API mejorada:** Respuestas más ricas con información de sincronización
- **Lógica centralizada:** Funciones reutilizables en `familiares-sync.ts`
- **Documentación completa:** Tipos, interfaces y ejemplos claros

## 🚧 Consideraciones de Migración

### Datos Existentes

- Ejecutar `npm run consolidar-familias` después del deploy
- Revisar logs para identificar familias fusionadas
- Validar manualmente casos edge complejos

### Monitoreo

- Observar respuestas de sincronización en la UI
- Revisar logs de consolidación automática
- Estar atento a errores de validación

### Rollback

- El sistema mantiene compatibilidad con tablas legacy
- Las consolidaciones se pueden revertir restaurando backup de BD
- Los cambios automáticos son graduales y reversibles

---

## 📞 Soporte

Si encuentras inconsistencias o problemas:

1. **Ejecuta consolidación manual** en la familia afectada
2. **Revisa los logs** para identificar el problema
3. **Reporta el caso** con detalles específicos para mejoras futuras

El sistema está diseñado para ser robusto y autocorrectivo, pero siempre puede mejorarse con feedback real de uso.
