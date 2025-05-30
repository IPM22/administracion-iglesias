const fs = require("fs");
const path = require("path");

// Función para detectar el separador CSV
function detectarSeparador(primeraLinea) {
  const comas = (primeraLinea.match(/,/g) || []).length;
  const puntoYComa = (primeraLinea.match(/;/g) || []).length;

  return puntoYComa > comas ? ";" : ",";
}

// Función para leer y procesar el archivo CSV
function procesarCSV(rutaArchivo) {
  try {
    // Leer el archivo
    const contenido = fs.readFileSync(rutaArchivo, "utf-8");
    const lineas = contenido.split("\n");

    if (lineas.length === 0) {
      console.error("El archivo está vacío");
      return [];
    }

    // Detectar separador automáticamente
    const separador = detectarSeparador(lineas[0]);
    console.log(`Separador detectado: "${separador}"`);

    // Obtener encabezados (primera línea)
    const encabezados = lineas[0]
      .split(separador)
      .map((h) => h.trim().replace(/"/g, ""));
    console.log("Encabezados encontrados:", encabezados);

    // Procesar cada línea de datos
    const visitas = [];

    for (let i = 1; i < lineas.length; i++) {
      const linea = lineas[i].trim();
      if (!linea) continue; // Saltar líneas vacías

      // Dividir la línea respetando las comillas
      const valores = parsearLineaCSV(linea, separador);

      if (valores.length < encabezados.length) continue; // Saltar líneas incompletas

      // Crear objeto con los datos
      const fila = {};
      encabezados.forEach((encabezado, index) => {
        fila[encabezado] = valores[index]
          ? valores[index].trim().replace(/"/g, "")
          : "";
      });

      // Procesar los datos según los requerimientos
      const visitaProcesada = procesarVisita(fila);
      if (visitaProcesada) {
        visitas.push(visitaProcesada);
      }
    }

    return visitas;
  } catch (error) {
    console.error("Error al leer el archivo:", error);
    return [];
  }
}

// Función para parsear una línea CSV respetando comillas
function parsearLineaCSV(linea, separador) {
  const resultado = [];
  let valorActual = "";
  let dentroDeComillas = false;

  for (let i = 0; i < linea.length; i++) {
    const char = linea[i];

    if (char === '"') {
      dentroDeComillas = !dentroDeComillas;
    } else if (char === separador && !dentroDeComillas) {
      resultado.push(valorActual);
      valorActual = "";
    } else {
      valorActual += char;
    }
  }

  // Agregar el último valor
  resultado.push(valorActual);

  return resultado;
}

// Función para limpiar nombres
function limpiarNombre(nombre) {
  if (!nombre) return "";

  return (
    nombre
      .trim()
      // Eliminar paréntesis con texto dentro (ej: "Elizer) Alexis" -> "Elizer Alexis")
      .replace(/\([^)]*\)/g, "")
      // Eliminar paréntesis sueltos
      .replace(/[\(\)]/g, "")
      // Normalizar espacios múltiples
      .replace(/\s+/g, " ")
      .trim()
  );
}

// Función para procesar fechas
function procesarFecha(fechaTexto) {
  if (!fechaTexto || fechaTexto.trim() === "") return null;

  try {
    const fecha = new Date(fechaTexto);
    if (isNaN(fecha.getTime())) return null;
    return fecha.toISOString();
  } catch {
    return null;
  }
}

// Función para procesar cada visita según los requerimientos
function procesarVisita(fila) {
  try {
    // Mapear los campos comunes (más flexible para diferentes variaciones)
    const nombre = limpiarNombre(
      fila.Nombre ||
        fila.nombre ||
        fila.NOMBRE ||
        fila.Name ||
        fila.nombres ||
        fila.Nombres ||
        ""
    );
    const apellido1 = limpiarNombre(
      fila.apellido1 ||
        fila.Apellido1 ||
        fila.APELLIDO1 ||
        fila["Primer Apellido"] ||
        fila.primer_apellido ||
        fila.apellidos ||
        fila.Apellidos ||
        ""
    );
    const apellido2 = limpiarNombre(
      fila.apellido2 ||
        fila.Apellido2 ||
        fila.APELLIDO2 ||
        fila["Segundo Apellido"] ||
        fila.segundo_apellido ||
        ""
    );
    const correo =
      fila.correo ||
      fila.Correo ||
      fila.CORREO ||
      fila.email ||
      fila.Email ||
      fila.EMAIL ||
      "";
    const direccion =
      fila.Direccion ||
      fila.direccion ||
      fila.DIRECCION ||
      fila.Dirección ||
      fila.Address ||
      "";
    const telefonos =
      fila.telefonos ||
      fila.Telefonos ||
      fila.TELEFONOS ||
      fila.Teléfonos ||
      fila.Teléfono ||
      fila.telefono ||
      fila.Telefono ||
      fila.Phone ||
      "";

    // Campos específicos de visitas
    const fechaNacimiento = procesarFecha(
      fila.fechaNacimiento ||
        fila.FechaNacimiento ||
        fila.fecha_nacimiento ||
        fila["Fecha de Nacimiento"] ||
        fila.nacimiento ||
        ""
    );

    const sexo =
      fila.sexo ||
      fila.Sexo ||
      fila.SEXO ||
      fila.genero ||
      fila.Genero ||
      fila.genero ||
      "";

    const estadoCivil =
      fila.estadoCivil ||
      fila["Estado Civil"] ||
      fila.estado_civil ||
      fila.EstadoCivil ||
      "";

    const ocupacion =
      fila.ocupacion ||
      fila.Ocupacion ||
      fila.OCUPACION ||
      fila.trabajo ||
      fila.Trabajo ||
      "";

    const familia = fila.familia || fila.Familia || fila.FAMILIA || "";

    const fechaPrimeraVisita = procesarFecha(
      fila.fechaPrimeraVisita ||
        fila.FechaPrimeraVisita ||
        fila.fecha_primera_visita ||
        fila["Primera Visita"] ||
        fila.primeraVisita ||
        ""
    );

    const notasAdicionales =
      fila.notasAdicionales ||
      fila.notas ||
      fila.Notas ||
      fila.observaciones ||
      fila.Observaciones ||
      fila.comentarios ||
      fila.Comentarios ||
      "";

    // Validar que tenga al menos nombre y un apellido
    if (!nombre || (!apellido1 && !apellido2)) {
      console.log("Saltando fila por falta de datos básicos:", {
        nombre,
        apellido1,
        apellido2,
        original: fila,
      });
      return null;
    }

    // Unificar apellidos
    const apellidosUnificados = [apellido1, apellido2]
      .filter((a) => a)
      .join(" ")
      .trim();

    // Procesar teléfonos
    const { telefono, celular } = procesarTelefonos(telefonos);

    // Validar sexo
    const sexoValido = ["Masculino", "Femenino", "Otro"].includes(sexo)
      ? sexo
      : null;

    // Validar estado civil
    const estadoCivilValido = [
      "Soltero/a",
      "Casado/a",
      "Viudo/a",
      "Divorciado/a",
    ].includes(estadoCivil)
      ? estadoCivil
      : null;

    // Crear el objeto visita
    const visita = {
      nombres: nombre,
      apellidos: apellidosUnificados,
      correo: correo.trim() || null,
      telefono: telefono || null,
      celular: celular || null,
      direccion: direccion.trim() || null,
      fechaNacimiento: fechaNacimiento,
      sexo: sexoValido,
      estadoCivil: estadoCivilValido,
      ocupacion: ocupacion.trim() || null,
      familia: familia.trim() || null,
      estado: "Activa", // Estado por defecto para visitas
      fechaPrimeraVisita: fechaPrimeraVisita,
      notasAdicionales: notasAdicionales.trim() || null,
    };

    return visita;
  } catch (error) {
    console.error("Error al procesar visita:", error, fila);
    return null;
  }
}

// Función para procesar múltiples teléfonos
function procesarTelefonos(telefonosTexto) {
  if (!telefonosTexto) {
    return { telefono: null, celular: null };
  }

  // Limpiar y dividir los teléfonos
  const telefonosLimpio = telefonosTexto.replace(/[^\d\s\-\(\)\+,;\/]/g, "");

  // Dividir por diferentes separadores comunes
  const separadores = [",", ";", "/", " - ", "  ", "\n"];
  let telefonos = [telefonosLimpio];

  separadores.forEach((sep) => {
    telefonos = telefonos.flatMap((tel) => tel.split(sep));
  });

  // Filtrar y limpiar teléfonos
  telefonos = telefonos
    .map((tel) => tel.trim())
    .filter((tel) => tel.length >= 7) // Al menos 7 dígitos
    .map((tel) => tel.replace(/\s+/g, " ")); // Normalizar espacios

  // Asignar teléfonos
  const telefono = telefonos[0] || null;
  const celular = telefonos[1] || null;

  return { telefono, celular };
}

// Función para insertar visitas en la base de datos
async function insertarVisitas(visitas, urlBase = "http://localhost:3000") {
  const resultados = {
    exitosos: 0,
    errores: 0,
    detallesErrores: [],
  };

  console.log(`Iniciando inserción de ${visitas.length} visitas...`);

  for (let i = 0; i < visitas.length; i++) {
    const visita = visitas[i];

    try {
      const response = await fetch(`${urlBase}/api/visitas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(visita),
      });

      if (response.ok) {
        resultados.exitosos++;
        console.log(
          `✅ Visita ${i + 1}/${visitas.length}: ${visita.nombres} ${
            visita.apellidos
          } - Insertada correctamente`
        );
      } else {
        const errorData = await response.json();
        resultados.errores++;
        resultados.detallesErrores.push({
          visita: `${visita.nombres} ${visita.apellidos}`,
          error: errorData.error || "Error desconocido",
        });
        console.log(
          `❌ Error al insertar ${visita.nombres} ${visita.apellidos}: ${errorData.error}`
        );
      }
    } catch (error) {
      resultados.errores++;
      resultados.detallesErrores.push({
        visita: `${visita.nombres} ${visita.apellidos}`,
        error: error.message,
      });
      console.log(
        `❌ Error de conexión al insertar ${visita.nombres} ${visita.apellidos}: ${error.message}`
      );
    }

    // Pequeña pausa para no sobrecargar el servidor
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return resultados;
}

// Función principal
async function main() {
  const rutaArchivo = process.argv[2];

  if (!rutaArchivo) {
    console.log("Uso: node importar-visitas.js <ruta-al-archivo-csv>");
    console.log("Ejemplo: node importar-visitas.js ./visitas.csv");
    return;
  }

  if (!fs.existsSync(rutaArchivo)) {
    console.error("El archivo no existe:", rutaArchivo);
    return;
  }

  console.log("📂 Procesando archivo:", rutaArchivo);

  // Procesar el CSV
  const visitas = procesarCSV(rutaArchivo);

  if (visitas.length === 0) {
    console.log("❌ No se encontraron visitas válidas en el archivo");
    return;
  }

  console.log(`📊 Se procesaron ${visitas.length} visitas:`);
  visitas.forEach((visita, index) => {
    console.log(`  ${index + 1}. ${visita.nombres} ${visita.apellidos}`);
    if (visita.telefono) console.log(`     Teléfono: ${visita.telefono}`);
    if (visita.celular) console.log(`     Celular: ${visita.celular}`);
    if (visita.correo) console.log(`     Correo: ${visita.correo}`);
    if (visita.direccion) console.log(`     Dirección: ${visita.direccion}`);
    if (visita.fechaPrimeraVisita)
      console.log(
        `     Primera Visita: ${new Date(
          visita.fechaPrimeraVisita
        ).toLocaleDateString()}`
      );
  });

  // Preguntar confirmación
  console.log("\n¿Desea proceder con la inserción? (y/N)");

  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("", async (respuesta) => {
    if (respuesta.toLowerCase() === "y" || respuesta.toLowerCase() === "yes") {
      console.log("\n🚀 Iniciando inserción...");

      const resultados = await insertarVisitas(visitas);

      console.log("\n📈 Resultados de la importación:");
      console.log(`✅ Insertadas exitosamente: ${resultados.exitosos}`);
      console.log(`❌ Errores: ${resultados.errores}`);

      if (resultados.detallesErrores.length > 0) {
        console.log("\n📋 Detalles de errores:");
        resultados.detallesErrores.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error.visita}: ${error.error}`);
        });
      }
    } else {
      console.log("❌ Importación cancelada");
    }

    rl.close();
  });
}

// Ejecutar el script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  procesarCSV,
  insertarVisitas,
  procesarVisita,
  procesarTelefonos,
  procesarFecha,
};
