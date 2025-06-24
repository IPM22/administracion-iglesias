// Script para crear una visita de prueba para testing de WhatsApp
// Ejecutar desde la consola del navegador

async function crearVisitaPrueba() {
  console.log("🧪 Creando visita de prueba para testing de WhatsApp...");

  const visitaPrueba = {
    nombres: "Juan Carlos",
    apellidos: "Pérez García",
    correo: "juan.perez.test@gmail.com",
    telefono: "3101234567", // Número de prueba
    celular: "3101234567", // Mismo número para WhatsApp
    genero: "MASCULINO",
    fechaNacimiento: "1990-05-15",
    direccion: "Carrera 10 #20-30",
    barrio: "Centro",
    ciudad: "Bogotá",
    estadoCivil: "SOLTERO",
    ocupacion: "Ingeniero",
    observaciones: "Visita de prueba para testing de WhatsApp - PUEDE ELIMINAR",
    // Datos específicos de primera visita
    fechaVisita: new Date().toISOString().split("T")[0], // Hoy
    invitadoPor: "Sistema de prueba",
    motivoVisita: "Interés en conocer la iglesia",
    volveriaVisitar: true,
    deseaInformacion: true,
    seguimiento: "PENDIENTE",
  };

  try {
    const response = await fetch("/api/personas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tipo: "visita",
        persona: visitaPrueba,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Visita de prueba creada exitosamente:");
      console.log(`ID: ${data.id}`);
      console.log(`Nombre: ${data.nombres} ${data.apellidos}`);
      console.log(`WhatsApp: ${data.celular}`);
      console.log("\n🎯 Ahora puedes:");
      console.log("1. Ir a Comunidad > Visitas");
      console.log("2. Ver el botón 'Mensaje Masivo'");
      console.log("3. Probar el envío de WhatsApp");

      return data;
    } else {
      const error = await response.json();
      console.error("❌ Error creando visita:", error);
      return false;
    }
  } catch (error) {
    console.error("❌ Error de conexión:", error);
    return false;
  }
}

// Función para crear múltiples visitas de prueba
async function crearVariasVisitasPrueba(cantidad = 3) {
  console.log(`🧪 Creando ${cantidad} visitas de prueba...`);

  const nombres = ["María José", "Carlos Alberto", "Ana Sofía"];
  const apellidos = ["López Gómez", "Rodríguez Silva", "Martínez Torres"];
  const telefonos = ["3201234567", "3151234567", "3001234567"];

  const resultados = [];

  for (let i = 0; i < cantidad; i++) {
    const visitaPrueba = {
      nombres: nombres[i] || `Persona${i + 1}`,
      apellidos: apellidos[i] || `Apellido${i + 1}`,
      correo: `test${i + 1}@example.com`,
      telefono: telefonos[i] || `300123456${i}`,
      celular: telefonos[i] || `300123456${i}`,
      genero: i % 2 === 0 ? "FEMENINO" : "MASCULINO",
      fechaNacimiento: `199${i}-05-15`,
      direccion: `Calle ${i + 1} #20-30`,
      barrio: "Centro",
      ciudad: "Bogotá",
      estadoCivil: "SOLTERO",
      ocupacion: "Profesional",
      observaciones: `Visita de prueba ${
        i + 1
      } para testing WhatsApp - PUEDE ELIMINAR`,
      fechaVisita: new Date().toISOString().split("T")[0],
      invitadoPor: "Sistema de prueba",
      motivoVisita: "Testing",
      volveriaVisitar: true,
      deseaInformacion: true,
      seguimiento: "PENDIENTE",
    };

    try {
      const response = await fetch("/api/personas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo: "visita",
          persona: visitaPrueba,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        resultados.push(data);
        console.log(
          `✅ Visita ${i + 1} creada: ${data.nombres} ${data.apellidos}`
        );
      } else {
        console.error(`❌ Error creando visita ${i + 1}`);
      }
    } catch (error) {
      console.error(`❌ Error en visita ${i + 1}:`, error);
    }

    // Pausa pequeña entre creaciones
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(`\n🎉 ${resultados.length} visitas creadas exitosamente!`);
  console.log(
    "🎯 Ahora ve a Comunidad > Visitas para ver el botón 'Mensaje Masivo'"
  );

  return resultados;
}

// Instrucciones para usar
console.log(`
🧪 SCRIPT DE VISITAS DE PRUEBA PARA WHATSAPP

Para crear UNA visita de prueba:
  await crearVisitaPrueba()

Para crear VARIAS visitas de prueba:
  await crearVariasVisitasPrueba(3)

Después podrás ver el botón "Mensaje Masivo" en Comunidad > Visitas
`);

// Exportar funciones para uso global
window.crearVisitaPrueba = crearVisitaPrueba;
window.crearVariasVisitasPrueba = crearVariasVisitasPrueba;
