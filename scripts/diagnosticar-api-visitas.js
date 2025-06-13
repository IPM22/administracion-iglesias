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
  console.log("\n🔐 AUTENTICACIÓN REQUERIDA");
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

// Función para probar inserción con datos de prueba
async function probarInsercionVisita(authToken) {
  console.log("\n🧪 PROBANDO INSERCIÓN DE VISITA DE PRUEBA...");

  // Datos de prueba
  const visitaPrueba = {
    nombres: "Juan Carlos",
    apellidos: "Pérez García",
    correo: "juan.test@ejemplo.com",
    telefono: "555-1234",
    celular: "555-5678",
    direccion: "Calle de Prueba 123",
    fechaNacimiento: "1990-05-15",
    sexo: "Masculino",
    estadoCivil: "Soltero/a",
    ocupacion: "Ingeniero",
    familia: "Familia Pérez",
    estado: "Activa",
    fechaPrimeraVisita: "2024-01-15",
    notasAdicionales: "Visita de prueba para diagnóstico",
  };

  console.log("📋 Datos que se enviarán:");
  console.log(JSON.stringify(visitaPrueba, null, 2));

  try {
    const response = await fetch("http://localhost:3000/api/visitas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(visitaPrueba),
    });

    console.log(
      `\n📡 Respuesta HTTP: ${response.status} ${response.statusText}`
    );

    const responseText = await response.text();
    console.log("📄 Contenido de la respuesta:");
    console.log(responseText);

    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log("\n✅ VISITA CREADA EXITOSAMENTE:");
        console.log(`ID: ${data.id}`);
        console.log(`Nombres: ${data.nombres} ${data.apellidos}`);
        console.log(`Creada: ${data.createdAt}`);
        console.log("\n🎉 La API está funcionando correctamente!");
        return data;
      } catch (parseError) {
        console.log("⚠️ Respuesta exitosa pero no es JSON válido");
        return true;
      }
    } else {
      try {
        const errorData = JSON.parse(responseText);
        console.log("\n❌ ERROR EN LA API:");
        console.log(`Mensaje: ${errorData.error}`);
        console.log(`Detalles: ${JSON.stringify(errorData, null, 2)}`);
      } catch (parseError) {
        console.log("\n❌ ERROR SIN FORMATO JSON:");
        console.log(responseText);
      }
      return false;
    }
  } catch (error) {
    console.error("\n❌ ERROR DE CONEXIÓN:");
    console.error(error.message);
    return false;
  }
}

// Función para obtener información del usuario
async function obtenerInfoUsuario(authToken) {
  console.log("\n👤 OBTENIENDO INFORMACIÓN DEL USUARIO...");

  try {
    const response = await fetch("http://localhost:3000/api/visitas", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (response.ok) {
      const visitas = await response.json();
      console.log(`✅ Usuario autenticado correctamente`);
      console.log(`✅ Tiene acceso a ${visitas.length} visitas`);
      if (visitas.length > 0) {
        console.log(
          `✅ Primera visita: ${visitas[0].nombres} ${visitas[0].apellidos}`
        );
      }
      return true;
    } else {
      const errorData = await response.json();
      console.log(`❌ Error al obtener visitas: ${errorData.error}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error de conexión: ${error.message}`);
    return false;
  }
}

// Función principal
async function main() {
  console.log("🔍 DIAGNÓSTICO DE API DE VISITAS");
  console.log("Este script probará la API de visitas con datos de prueba.\n");

  try {
    // Autenticar usuario
    const authToken = await autenticarUsuario();

    // Verificar acceso a visitas existentes
    const tieneAcceso = await obtenerInfoUsuario(authToken);

    if (!tieneAcceso) {
      console.log(
        "\n❌ No se puede acceder a la API de visitas. Revisa la autenticación."
      );
      return;
    }

    // Probar inserción
    const resultado = await probarInsercionVisita(authToken);

    if (resultado) {
      console.log("\n🎯 DIAGNÓSTICO: La API está funcionando");
      console.log(
        "💡 Si el script de importación no inserta datos, el problema puede estar en:"
      );
      console.log("   - El formato de los datos del CSV");
      console.log("   - La validación de campos específicos");
      console.log("   - El procesamiento de fechas");
      console.log(
        "\n🧹 Considera limpiar la visita de prueba si no la necesitas:"
      );
      console.log(`   ID de la visita creada: ${resultado.id || "Ver arriba"}`);
    } else {
      console.log("\n❌ DIAGNÓSTICO: Hay un problema con la API");
      console.log("💡 Posibles causas:");
      console.log("   - La aplicación web no está ejecutándose");
      console.log("   - Problemas de autenticación");
      console.log("   - Error en la base de datos");
      console.log("   - Campos requeridos faltantes");
    }
  } catch (error) {
    console.error("\n❌ Error durante el diagnóstico:", error.message);
  }
}

// Ejecutar script
if (require.main === module) {
  main().catch(console.error);
}
