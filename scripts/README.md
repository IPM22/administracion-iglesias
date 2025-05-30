# Scripts de Importación

Este directorio contiene scripts para importar datos desde archivos CSV a la base de datos de la aplicación de administración de iglesias.

## Scripts disponibles

- `importar-miembros.js` - Importa miembros de la iglesia
- `importar-visitas.js` - Importa visitantes de la iglesia

---

# Script de Importación de Miembros

Este script permite importar miembros desde un archivo Excel/CSV a la base de datos de la aplicación.

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

---

# Script de Importación de Visitas

Este script permite importar visitantes desde un archivo Excel/CSV a la base de datos de la aplicación.

## Preparación del archivo

### 1. Exportar desde Excel a CSV

1. Abre tu archivo Excel
2. Ve a `Archivo > Guardar como`
3. Selecciona formato `CSV (separado por comas) (*.csv)`
4. Guarda el archivo

### 2. Estructura esperada del CSV

El script busca las siguientes columnas (no importa el orden ni las mayúsculas):

#### Campos básicos (mismo formato que miembros):

- **Nombre** (requerido)
- **apellido1** (requerido al menos uno)
- **apellido2** (opcional)
- **correo** (opcional)
- **Dirección** (opcional)
- **telefonos** (opcional, puede contener múltiples números)

#### Campos específicos de visitas:

- **fechaNacimiento** (opcional, formato: YYYY-MM-DD)
- **sexo** (opcional: "Masculino", "Femenino", "Otro")
- **estadoCivil** (opcional: "Soltero/a", "Casado/a", "Viudo/a", "Divorciado/a")
- **ocupacion** (opcional)
- **familia** (opcional)
- **fechaPrimeraVisita** (opcional, formato: YYYY-MM-DD)
- **notasAdicionales** (opcional)

### Ejemplo de estructura CSV para visitas:

```
Nombre,apellido1,apellido2,correo,Direccion,telefonos,fechaNacimiento,sexo,estadoCivil,ocupacion,familia,fechaPrimeraVisita,notasAdicionales
María,González,Pérez,maria@email.com,"Av. Principal 123","+1234567890",1985-03-15,Femenino,Casado/a,Doctora,Familia González,2024-01-15,"Primera visita positiva"
Carlos,Rodríguez,,carlos@email.com,"Calle Libertad 456","+1111111111",1990-07-22,Masculino,Soltero/a,Ingeniero,,2024-02-10,"Invitado por Juan"
```

## Cómo usar el script de visitas

### 1. Prerrequisitos

Asegúrate de que:

- El servidor de desarrollo esté corriendo (`npm run dev`)
- El archivo CSV esté en el directorio del proyecto

### 2. Ejecutar el script

```bash
# Navega al directorio del proyecto
cd /ruta/a/tu/proyecto

# Ejecuta el script
node scripts/importar-visitas.js ruta/al/archivo.csv
```

### Ejemplo:

```bash
node scripts/importar-visitas.js ./visitas.csv
```

## Diferencias entre miembros y visitas

### Campos únicos de visitas:

- `fechaNacimiento`: Fecha de nacimiento (formato ISO)
- `sexo`: Género de la persona
- `estadoCivil`: Estado civil actual
- `ocupacion`: Trabajo o profesión
- `familia`: Información familiar
- `fechaPrimeraVisita`: Cuándo visitó por primera vez
- `notasAdicionales`: Observaciones especiales
- `estado`: Se establece automáticamente como "Activa"

### Validaciones específicas:

- El script valida que `sexo` sea uno de los valores permitidos
- El script valida que `estadoCivil` sea uno de los valores permitidos
- Las fechas se procesan automáticamente al formato ISO
- Si un campo no es válido, se establece como `null`

---

# Procesamiento común (miembros y visitas)

## Qué hacen los scripts

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
estado: "Activo" (miembros) / "Activa" (visitas)
```

## Manejo de errores

Los scripts manejan varios tipos de errores:

- **Duplicados**: Si ya existe una persona con el mismo correo
- **Datos incompletos**: Salta filas sin nombre o apellidos
- **Errores de conexión**: Reintentos automáticos
- **Formato inválido**: Muestra qué líneas tienen problemas

## Resultado de la importación

Al finalizar, los scripts muestran:

```
📈 Resultados de la importación:
✅ Insertados exitosamente: 45
❌ Errores: 2

📋 Detalles de errores:
  1. María García: Ya existe una persona con ese correo electrónico
  2. Pedro : Los nombres y apellidos son requeridos
```

## Consejos

### Para mejores resultados:

1. **Limpia los datos** antes de exportar:

   - Elimina filas vacías
   - Verifica que nombres y apellidos estén completos
   - Estandariza el formato de teléfonos y fechas

2. **Formatos de teléfono aceptados**:

   - `+1234567890`
   - `123-456-7890`
   - `(123) 456-7890`
   - `123 456 7890`

3. **Formatos de fecha aceptados**:

   - `2024-01-15` (YYYY-MM-DD)
   - `01/15/2024` (MM/DD/YYYY)
   - `15/01/2024` (DD/MM/YYYY)

4. **Separadores para múltiples teléfonos**:
   - Coma: `123456789, 987654321`
   - Punto y coma: `123456789; 987654321`
   - Slash: `123456789 / 987654321`

## Solución de problemas

### El script no encuentra el archivo:

```bash
# Verifica la ruta completa
ls -la archivo.csv

# O usa ruta absoluta
node scripts/importar-[tipo].js /ruta/completa/al/archivo.csv
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
