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
    const miembros = [];

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
      const miembroProcesado = procesarMiembro(fila);
      if (miembroProcesado) {
        miembros.push(miembroProcesado);
      }
    }

    return miembros;
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

// Función para procesar cada miembro según los requerimientos
function procesarMiembro(fila) {
  try {
    // Mapear los campos comunes (más flexible para diferentes variaciones)
    const nombre = limpiarNombre(
      fila.nombres ||
        fila.Nombres ||
        fila.Nombre ||
        fila.nombre ||
        fila.NOMBRE ||
        fila.Name ||
        ""
    );
    const apellido1 = limpiarNombre(
      fila.apellido1 ||
        fila.Apellido1 ||
        fila.APELLIDO1 ||
        fila["Primer Apellido"] ||
        fila.primer_apellido ||
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
    const direccion =
      fila.direccion ||
      fila.Direccion ||
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

    // Crear el objeto miembro
    const miembro = {
      nombres: nombre,
      apellidos: apellidosUnificados,
      direccion: direccion.trim() || null,
      telefono: telefono || null,
      celular: celular || null,
      estado: "Activo", // Estado por defecto
    };

    return miembro;
  } catch (error) {
    console.error("Error al procesar miembro:", error, fila);
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

// Función para insertar miembros en la base de datos
async function insertarMiembros(
  miembros,
  urlBase = "http://localhost:3000",
  authToken = null
) {
  const resultados = {
    exitosos: 0,
    errores: 0,
    detallesErrores: [],
  };

  console.log(`Iniciando inserción de ${miembros.length} miembros...`);

  // Validar que se proporcione el token de autenticación
  if (!authToken) {
    throw new Error(
      "❌ Se requiere un token de autenticación para insertar miembros"
    );
  }

  for (let i = 0; i < miembros.length; i++) {
    const miembro = miembros[i];

    try {
      const response = await fetch(`${urlBase}/api/miembros`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(miembro),
      });

      if (response.ok) {
        resultados.exitosos++;
        console.log(
          `✅ Miembro ${i + 1}/${miembros.length}: ${miembro.nombres} ${
            miembro.apellidos
          } - Insertado correctamente`
        );
      } else {
        const errorData = await response.json();
        resultados.errores++;
        resultados.detallesErrores.push({
          miembro: `${miembro.nombres} ${miembro.apellidos}`,
          error: errorData.error || "Error desconocido",
        });
        console.log(
          `❌ Error al insertar ${miembro.nombres} ${miembro.apellidos}: ${errorData.error}`
        );
      }
    } catch (error) {
      resultados.errores++;
      resultados.detallesErrores.push({
        miembro: `${miembro.nombres} ${miembro.apellidos}`,
        error: error.message,
      });
      console.log(
        `❌ Error de conexión al insertar ${miembro.nombres} ${miembro.apellidos}: ${error.message}`
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
    console.log("Uso: node importar-miembros.js <ruta-al-archivo-csv>");
    console.log("Ejemplo: node importar-miembros.js ./miembros.csv");
    console.log("\n📋 Para obtener tu token de autenticación:");
    console.log("1. Inicia sesión en la aplicación web");
    console.log("2. Abre las herramientas de desarrollador (F12)");
    console.log("3. Ve a Application/Storage > Local Storage");
    console.log(
      "4. Busca la clave que contenga 'auth-token' o 'sb-' y copia su valor"
    );
    console.log(
      "   O ve a Network y busca el header 'Authorization' en las peticiones"
    );
    return;
  }

  if (!fs.existsSync(rutaArchivo)) {
    console.error("El archivo no existe:", rutaArchivo);
    return;
  }

  console.log("📂 Procesando archivo:", rutaArchivo);

  // Procesar el CSV
  const miembros = procesarCSV(rutaArchivo);

  if (miembros.length === 0) {
    console.log("❌ No se encontraron miembros válidos en el archivo");
    return;
  }

  console.log(`📊 Se procesaron ${miembros.length} miembros:`);
  miembros.forEach((miembro, index) => {
    console.log(`  ${index + 1}. ${miembro.nombres} ${miembro.apellidos}`);
    if (miembro.telefono) console.log(`     Teléfono: ${miembro.telefono}`);
    if (miembro.celular) console.log(`     Celular: ${miembro.celular}`);
    if (miembro.direccion) console.log(`     Dirección: ${miembro.direccion}`);
  });

  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Solicitar token de autenticación
  console.log("\n🔑 AUTENTICACIÓN REQUERIDA");
  console.log(
    "Para importar los miembros a tu iglesia activa, necesitas proporcionar tu token de autenticación."
  );
  console.log("\n📋 Para obtener tu token:");
  console.log("1. Inicia sesión en la aplicación web");
  console.log("2. Abre las herramientas de desarrollador (F12)");
  console.log("3. Ve a la pestaña 'Application' o 'Storage'");
  console.log("4. Busca en 'Local Storage' las claves que empiecen con 'sb-'");
  console.log("5. Copia el 'access_token' del objeto JSON");

  rl.question("\n🔐 Ingresa tu token de autenticación: ", (authToken) => {
    if (!authToken || authToken.trim() === "") {
      console.log("❌ Token requerido. Importación cancelada.");
      rl.close();
      return;
    }

    // Preguntar confirmación para importar
    console.log(
      "\n¿Desea proceder con la importación a tu iglesia activa? (y/N)"
    );

    rl.question("", async (respuesta) => {
      if (
        respuesta.toLowerCase() === "y" ||
        respuesta.toLowerCase() === "yes"
      ) {
        console.log("\n🚀 Iniciando inserción en tu iglesia activa...");

        try {
          const resultados = await insertarMiembros(
            miembros,
            "http://localhost:3000",
            authToken.trim()
          );

          console.log("\n📈 Resultados de la importación:");
          console.log(`✅ Insertados exitosamente: ${resultados.exitosos}`);
          console.log(`❌ Errores: ${resultados.errores}`);

          if (resultados.detallesErrores.length > 0) {
            console.log("\n📋 Detalles de errores:");
            resultados.detallesErrores.forEach((error, index) => {
              console.log(`  ${index + 1}. ${error.miembro}: ${error.error}`);
            });
          }
        } catch (error) {
          console.error("\n❌ Error durante la importación:", error.message);
          console.log("\n💡 Posibles soluciones:");
          console.log("- Verifica que el token sea correcto");
          console.log("- Asegúrate de tener una iglesia activa");
          console.log("- Verifica que la aplicación web esté ejecutándose");
        }
      } else {
        console.log("❌ Importación cancelada");
      }

      rl.close();
    });
  });
}

// Ejecutar el script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  procesarCSV,
  insertarMiembros,
  procesarMiembro,
  procesarTelefonos,
};
