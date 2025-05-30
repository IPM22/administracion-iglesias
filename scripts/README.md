# Script de Importación de Miembros

Este script permite importar miembros desde un archivo Excel/CSV a la base de datos de la aplicación de administración de iglesias.

## Preparación del archivo

### 1. Exportar desde Excel a CSV

1. Abre tu archivo Excel
2. Ve a `Archivo > Guardar como`
3. Selecciona formato `CSV (separado por comas) (*.csv)`
4. Guarda el archivo

### 2. Estructura esperada del CSV

El script busca las siguientes columnas (no importa el orden ni las mayúsculas):

- **Nombre** (requerido)
- **apellido1** (requerido al menos uno)
- **apellido2** (opcional)
- **Dirección** (opcional)
- **telefonos** (opcional, puede contener múltiples números)

### Ejemplo de estructura CSV:

```
Nombre,apellido1,apellido2,Direccion,telefonos
Juan,García,López,"Calle Principal 123","+1234567890, +0987654321"
María,Rodríguez,,"Av. Libertad 456","+1111111111"
Carlos,Martínez,Silva,"Plaza Central 789","+2222222222;+3333333333"
```

## Cómo usar el script

### 1. Prerrequisitos

Asegúrate de que:

- El servidor de desarrollo esté corriendo (`npm run dev`)
- El archivo CSV esté en el directorio del proyecto

### 2. Ejecutar el script

```bash
# Navega al directorio del proyecto
cd /ruta/a/tu/proyecto

# Ejecuta el script
node scripts/importar-miembros.js ruta/al/archivo.csv
```

### Ejemplo:

```bash
node scripts/importar-miembros.js ./miembros.csv
```

## Qué hace el script

### Procesamiento automático:

1. **Unifica apellidos**: Combina `apellido1` y `apellido2` en un solo campo `apellidos`

2. **Procesa teléfonos múltiples**:

   - Si hay varios teléfonos separados por `,`, `;`, `/`, etc.
   - El primero se asigna a `telefono`
   - El segundo se asigna a `celular`

3. **Valida datos**:

   - Requiere al menos nombre y un apellido
   - Filtra teléfonos inválidos (menos de 7 dígitos)

4. **Vista previa**: Te muestra todos los datos procesados antes de insertar

5. **Inserción controlada**: Inserta uno por uno con pausas para no sobrecargar el servidor

### Ejemplo de procesamiento:

**Entrada CSV:**

```
Juan,García,López,"Calle Principal 123","+1234567890, +0987654321"
```

**Resultado procesado:**

```
nombres: "Juan"
apellidos: "García López"
direccion: "Calle Principal 123"
telefono: "+1234567890"
celular: "+0987654321"
estado: "Activo"
```

## Manejo de errores

El script maneja varios tipos de errores:

- **Duplicados**: Si ya existe un miembro con el mismo nombre y apellidos
- **Datos incompletos**: Salta filas sin nombre o apellidos
- **Errores de conexión**: Reintentos automáticos
- **Formato inválido**: Muestra qué líneas tienen problemas

## Resultado de la importación

Al finalizar, el script muestra:

```
📈 Resultados de la importación:
✅ Insertados exitosamente: 45
❌ Errores: 2

📋 Detalles de errores:
  1. María García: Ya existe un miembro con el nombre María García
  2. Pedro : Los nombres y apellidos son requeridos
```

## Consejos

### Para mejores resultados:

1. **Limpia los datos** antes de exportar:

   - Elimina filas vacías
   - Verifica que nombres y apellidos estén completos
   - Estandariza el formato de teléfonos

2. **Formatos de teléfono aceptados**:

   - `+1234567890`
   - `123-456-7890`
   - `(123) 456-7890`
   - `123 456 7890`

3. **Separadores para múltiples teléfonos**:
   - Coma: `123456789, 987654321`
   - Punto y coma: `123456789; 987654321`
   - Slash: `123456789 / 987654321`

## Solución de problemas

### El script no encuentra el archivo:

```bash
# Verifica la ruta completa
ls -la miembros.csv

# O usa ruta absoluta
node scripts/importar-miembros.js /ruta/completa/al/archivo.csv
```

### Error de conexión:

- Verifica que el servidor esté corriendo en `http://localhost:3000`
- Revisa que la base de datos esté conectada

### Caracteres especiales:

- Guarda el CSV con codificación UTF-8
- En Excel: `Archivo > Guardar como > Más opciones > Herramientas > Opciones web > Codificación`

## Respaldo

**¡IMPORTANTE!** Siempre haz un respaldo de tu base de datos antes de importar:

```bash
# Si usas PostgreSQL
pg_dump tu_base_datos > respaldo_antes_importacion.sql
```
