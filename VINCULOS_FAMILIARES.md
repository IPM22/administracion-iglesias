# Vínculos Familiares - Funcionalidad del Miembro Conector

## Descripción

Los vínculos familiares permiten establecer conexiones entre diferentes familias de la congregación. Un **miembro conector** es la persona que establece la relación entre las dos familias.

## Mejoras Implementadas

### 1. Validación del Miembro Conector

**Antes**: Se podía seleccionar cualquier miembro de la congregación como conector.

**Ahora**: El miembro conector debe pertenecer a una de las familias que se están vinculando.

#### Validaciones Implementadas:

- **Frontend**: El selector solo muestra miembros de las familias involucradas
- **Backend**: Validación en el servidor para asegurar que el miembro pertenece a una de las familias
- **Organización**: Los miembros se muestran agrupados por familia con separadores visuales

### 2. Interfaz de Usuario Mejorada

#### Selector de Miembro Conector:

- Se deshabilita hasta que se seleccione una familia a vincular
- Muestra mensaje explicativo sobre el propósito del miembro conector
- Agrupa miembros por familia con separadores visuales:

  ```
  — Familia García —
  • Juan García
  • María García

  — Familia Rodríguez —
  • Pedro Rodríguez
  • Ana Rodríguez
  ```

#### Visualización en el Árbol Familiar:

- El miembro conector se muestra en una tarjeta destacada
- Indica de qué familia proviene el conector
- Estilo visual mejorado con colores distintivos

### 3. Validaciones de Backend

#### En Creación de Vínculos (`POST /api/familias/[id]/vinculos`):

```javascript
// Verifica que el miembro conector exista
if (!miembroVinculo) {
  return error("El miembro conector no existe");
}

// Verifica que pertenezca a una de las familias vinculadas
if (
  miembroVinculo.familiaId !== familiaOrigenId &&
  miembroVinculo.familiaId !== familiaRelacionadaId
) {
  return error(
    "El miembro conector debe pertenecer a una de las familias que se están vinculando"
  );
}
```

#### En Actualización de Vínculos (`PUT /api/familias/[id]/vinculos/[vinculoId]`):

- Mismas validaciones aplicadas al actualizar un vínculo existente

## Casos de Uso

### Ejemplo 1: Familia Extendida

- **Familia García**: Juan (padre), María (madre), Pedro (hijo)
- **Familia Rodríguez**: Ana (madre), Carlos (padre), Luis (hijo)
- **Vínculo**: Pedro García se casó con Ana Rodríguez
- **Miembro Conector**: Pedro García (pertenece a Familia García) o Ana Rodríguez (pertenece a Familia Rodríguez)

### Ejemplo 2: Familia Política

- **Familia López**: Roberto (padre), Carmen (madre)
- **Familia Morales**: Diego (padre), Sofía (madre), Elena (hija)
- **Vínculo**: Elena Morales se casó con el hijo de los López (que vive independiente)
- **Miembro Conector**: Elena Morales (única opción válida ya que pertenece a una de las familias registradas)

## Beneficios

1. **Consistencia de Datos**: Asegura que las conexiones familiares sean lógicas
2. **Mejor UX**: Interfaz más intuitiva que guía al usuario
3. **Integridad Referencial**: Validaciones que previenen datos inconsistentes
4. **Visualización Clara**: Mejor comprensión de las relaciones familiares

## Arquitectura Técnica

### Componentes Frontend:

- `app/familias/[id]/vinculos/page.tsx`: Gestión de vínculos con selector mejorado
- `app/familias/[id]/arbol/page.tsx`: Visualización en árbol familiar

### APIs Backend:

- `app/api/familias/[id]/vinculos/route.ts`: CRUD de vínculos con validaciones
- `app/api/familias/[id]/vinculos/[vinculoId]/route.ts`: Actualización con validaciones

### Base de Datos:

- `VinculoFamiliar.miembroVinculoId`: Referencia al miembro conector
- Validaciones de integridad referencial en Prisma

## Próximas Mejoras

1. **Detección Automática**: Sugerir automáticamente el miembro conector basado en relaciones familiares existentes
2. **Validación Cruzada**: Verificar que el vínculo sea consistente con las relaciones familiares individuales
3. **Historial**: Mantener un historial de cambios en los vínculos familiares
4. **Reportes**: Generar reportes de conexiones familiares en la congregación
