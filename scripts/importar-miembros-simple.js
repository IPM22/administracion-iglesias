const fs = require("fs");
const path = require("path");

// Función para cargar variables de entorno desde .env.local
function cargarVariablesEntorno() {
  try {
    const envPath = path.join(process.cwd(), ".env.local");

    if (!fs.existsSync(envPath)) {
      console.warn(
        "⚠️ Archivo .env.local no encontrado, intentando con variables del sistema..."
      );
      return false;
    }

    const envContent = fs.readFileSync(envPath, "utf-8");
    const lines = envContent.split("\n");

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith("#")) {
        const [key, ...valueParts] = trimmedLine.split("=");
        if (key && valueParts.length > 0) {
          const value = valueParts.join("=").replace(/^["']|["']$/g, ""); // Remover comillas
          process.env[key] = value;
        }
      }
    });

    console.log("✅ Variables de entorno cargadas desde .env.local");
    return true;
  } catch (error) {
    console.warn("⚠️ Error cargando .env.local:", error.message);
    return false;
  }
}

// Función para obtener la configuración de Supabase
function obtenerConfigSupabase() {
  // Primero intentar cargar variables de entorno
  cargarVariablesEntorno();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error("❌ Variables de entorno de Supabase no encontradas");
    console.log("💡 Asegúrate de tener un archivo .env.local con:");
    console.log("NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co");
    console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_aqui");
    console.log("\n🔍 Variables encontradas:");
    console.log(`NEXT_PUBLIC_SUPABASE_URL: ${url ? "OK" : "FALTA"}`);
    console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${anonKey ? "OK" : "FALTA"}`);
    return null;
  }

  console.log("✅ Configuración de Supabase encontrada");
  return { url, anonKey };
}

// Función simplificada para autenticación
async function autenticarUsuario() {
  console.log("\n🔐 AUTENTICACIÓN SIMPLIFICADA");
  console.log(
    "Este script intentará usar la autenticación de Supabase directamente."
  );
  console.log("Por favor, proporciona tus credenciales:");

  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question("📧 Email: ", (email) => {
      rl.question("🔑 Contraseña: ", async (password) => {
        rl.close();

        try {
          const config = obtenerConfigSupabase();
          if (!config) {
            reject(new Error("Configuración de Supabase no disponible"));
            return;
          }

          // Autenticar con Supabase
          const response = await fetch(
            `${config.url}/auth/v1/token?grant_type=password`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: config.anonKey,
                Authorization: `Bearer ${config.anonKey}`,
              },
              body: JSON.stringify({
                email: email.trim(),
                password: password,
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            console.log("✅ Autenticación exitosa");
            resolve(data.access_token);
          } else {
            const error = await response.json();
            console.error(
              "❌ Error de autenticación:",
              error.error_description || error.error
            );
            reject(new Error("Credenciales inválidas"));
          }
        } catch (error) {
          console.error("❌ Error de conexión:", error.message);
          reject(error);
        }
      });
    });
  });
}

// Función para procesar miembros (simplificada)
function procesarCSV(rutaArchivo) {
  try {
    const contenido = fs.readFileSync(rutaArchivo, "utf-8");
    const lineas = contenido.split("\n");

    if (lineas.length === 0) {
      console.error("El archivo está vacío");
      return [];
    }

    // Detectar separador
    const separador =
      (lineas[0].match(/;/g) || []).length >
      (lineas[0].match(/,/g) || []).length
        ? ";"
        : ",";
    console.log(`Separador detectado: "${separador}"`);

    // Obtener encabezados
    const encabezados = lineas[0]
      .split(separador)
      .map((h) => h.trim().replace(/"/g, ""));
    console.log("Encabezados encontrados:", encabezados);

    const miembros = [];

    for (let i = 1; i < lineas.length; i++) {
      const linea = lineas[i].trim();
      if (!linea) continue;

      const valores = linea
        .split(separador)
        .map((v) => v.trim().replace(/"/g, ""));

      if (valores.length < encabezados.length) continue;

      const fila = {};
      encabezados.forEach((encabezado, index) => {
        fila[encabezado] = valores[index] || "";
      });

      // Procesar datos básicos
      const nombre =
        fila.nombres || fila.Nombres || fila.nombre || fila.Nombre || "";
      const apellido1 =
        fila.apellido1 ||
        fila.Apellido1 ||
        fila.apellidos ||
        fila.Apellidos ||
        "";
      const apellido2 = fila.apellido2 || fila.Apellido2 || "";

      if (!nombre || !apellido1) {
        console.log(`Saltando fila ${i}: falta nombre o apellido`);
        continue;
      }

      const apellidos = [apellido1, apellido2]
        .filter((a) => a)
        .join(" ")
        .trim();

      miembros.push({
        nombres: nombre.trim(),
        apellidos: apellidos,
        direccion: (fila.direccion || fila.Direccion || "").trim() || null,
        telefono:
          (fila.telefono || fila.Telefono || fila.telefonos || "").trim() ||
          null,
        celular: (fila.celular || fila.Celular || "").trim() || null,
        estado: "Activo",
      });
    }

    return miembros;
  } catch (error) {
    console.error("Error al leer el archivo:", error);
    return [];
  }
}

// Función para insertar miembros
async function insertarMiembros(miembros, authToken) {
  const resultados = {
    exitosos: 0,
    errores: 0,
    detallesErrores: [],
  };

  console.log(`\n🚀 Iniciando inserción de ${miembros.length} miembros...`);

  for (let i = 0; i < miembros.length; i++) {
    const miembro = miembros[i];

    try {
      const response = await fetch("http://localhost:3000/api/miembros", {
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
          `✅ ${i + 1}/${miembros.length}: ${miembro.nombres} ${
            miembro.apellidos
          }`
        );
      } else {
        const errorData = await response.json();
        resultados.errores++;
        resultados.detallesErrores.push({
          miembro: `${miembro.nombres} ${miembro.apellidos}`,
          error: errorData.error || "Error desconocido",
        });
        console.log(
          `❌ Error en ${miembro.nombres} ${miembro.apellidos}: ${errorData.error}`
        );
      }
    } catch (error) {
      resultados.errores++;
      resultados.detallesErrores.push({
        miembro: `${miembro.nombres} ${miembro.apellidos}`,
        error: error.message,
      });
      console.log(
        `❌ Error de conexión en ${miembro.nombres} ${miembro.apellidos}`
      );
    }

    // Pausa pequeña
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return resultados;
}

// Función principal
async function main() {
  const rutaArchivo = process.argv[2];

  if (!rutaArchivo) {
    console.log("Uso: node importar-miembros-simple.js <ruta-al-archivo-csv>");
    console.log("Ejemplo: node importar-miembros-simple.js ./miembros.csv");
    console.log(
      "\n⚡ Esta versión simplificada usa autenticación directa con email/contraseña"
    );
    return;
  }

  if (!fs.existsSync(rutaArchivo)) {
    console.error("El archivo no existe:", rutaArchivo);
    return;
  }

  console.log("📂 Procesando archivo:", rutaArchivo);

  // Procesar CSV
  const miembros = procesarCSV(rutaArchivo);

  if (miembros.length === 0) {
    console.log("❌ No se encontraron miembros válidos en el archivo");
    return;
  }

  console.log(`\n📊 Se procesaron ${miembros.length} miembros:`);
  miembros.slice(0, 5).forEach((miembro, index) => {
    console.log(`  ${index + 1}. ${miembro.nombres} ${miembro.apellidos}`);
  });

  if (miembros.length > 5) {
    console.log(`  ... y ${miembros.length - 5} más`);
  }

  try {
    // Autenticar usuario
    const authToken = await autenticarUsuario();

    // Confirmar importación
    const readline = require("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(
      "\n¿Proceder con la importación? (y/N): ",
      async (respuesta) => {
        if (
          respuesta.toLowerCase() === "y" ||
          respuesta.toLowerCase() === "yes"
        ) {
          try {
            const resultados = await insertarMiembros(miembros, authToken);

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
          }
        } else {
          console.log("❌ Importación cancelada");
        }
        rl.close();
      }
    );
  } catch (error) {
    console.error("\n❌ Error de autenticación:", error.message);
    console.log("\n💡 Verifica que:");
    console.log("- El email y contraseña sean correctos");
    console.log("- La aplicación web esté ejecutándose");
    console.log("- Las variables de entorno estén configuradas");
  }
}

// Ejecutar script
if (require.main === module) {
  main().catch(console.error);
}
