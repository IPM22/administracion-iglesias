import twilio from "twilio";

// Configuración del cliente Twilio
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Templates de mensajes para la iglesia
export const templates = {
  agradecimientoVisita: {
    mensaje: `¡Hola {{nombre}}! 🙏

Queremos agradecerte de corazón por habernos visitado en {{evento}}.

Tu presencia fue una bendición para nosotros y esperamos que hayas sentido el amor de Dios en nuestra comunidad.

Si tienes alguna pregunta o te gustaría saber más sobre nuestra iglesia, no dudes en contactarnos.

¡Que Dios te bendiga abundantemente! ✨

Con amor,
{{nombreIglesia}}`,
    variables: ["nombre", "evento", "nombreIglesia"],
  },

  // Versión corta para cuentas Trial (menos de 160 caracteres)
  agradecimientoVisitaCorto: {
    mensaje: `¡Hola {{nombre}}! 🙏

Gracias por visitarnos en {{evento}}. Tu presencia fue una bendición.

¡Esperamos verte pronto!

{{nombreIglesia}}`,
    variables: ["nombre", "evento", "nombreIglesia"],
  },

  agradecimientoGeneral: {
    mensaje: `¡Gracias por visitarnos! 🏛️

Hola {{nombre}}, 

Fue un honor tenerte en nuestra iglesia. Creemos que cada persona que llega es enviada por Dios.

Esperamos verte pronto y que puedas formar parte de nuestra familia en Cristo.

¡Bendiciones! 🙏

{{nombreIglesia}}`,
    variables: ["nombre", "nombreIglesia"],
  },

  agradecimientoGeneralCorto: {
    mensaje: `¡Hola {{nombre}}! 🏛️

Gracias por visitarnos. Fue un honor tenerte en nuestra iglesia.

¡Bendiciones!
{{nombreIglesia}}`,
    variables: ["nombre", "nombreIglesia"],
  },

  invitacionRetorno: {
    mensaje: `Te extrañamos {{nombre}} 💕

Han pasado algunos días desde tu visita y queremos que sepas que estás en nuestros pensamientos y oraciones.

Te invitamos cordialmente a acompañarnos este {{proximoEvento}} a las {{hora}}.

¡Será una gran bendición tenerte con nosotros nuevamente!

{{nombreIglesia}}`,
    variables: ["nombre", "proximoEvento", "hora", "nombreIglesia"],
  },

  invitacionRetornoCorto: {
    mensaje: `¡Hola {{nombre}}! 💕

Te invitamos este {{proximoEvento}} a las {{hora}}.

¡Te esperamos!
{{nombreIglesia}}`,
    variables: ["nombre", "proximoEvento", "hora", "nombreIglesia"],
  },
};

// Servicio de WhatsApp
export class WhatsAppService {
  static async enviarMensajeIndividual(telefono, mensaje) {
    try {
      // Limpiar el número de teléfono
      let numeroLimpio = telefono.replace(/\D/g, "");

      console.log(`Número original: ${telefono}`);
      console.log(`Número limpio: ${numeroLimpio}`);

      // Detectar y formatear según el código de país
      let numeroWhatsApp;

      if (numeroLimpio.startsWith("1") && numeroLimpio.length === 11) {
        // Número de Estados Unidos/Canadá/República Dominicana (+1)
        numeroWhatsApp = `whatsapp:+${numeroLimpio}`;
      } else if (numeroLimpio.startsWith("57") && numeroLimpio.length === 12) {
        // Número de Colombia (+57) ya tiene el código
        numeroWhatsApp = `whatsapp:+${numeroLimpio}`;
      } else if (numeroLimpio.startsWith("57") && numeroLimpio.length === 10) {
        // Número de Colombia sin código de país
        numeroWhatsApp = `whatsapp:+57${numeroLimpio}`;
      } else if (numeroLimpio.length === 10 && numeroLimpio.startsWith("3")) {
        // Número colombiano típico (empieza con 3)
        numeroWhatsApp = `whatsapp:+57${numeroLimpio}`;
      } else if (
        numeroLimpio.length === 10 &&
        (numeroLimpio.startsWith("8") || numeroLimpio.startsWith("9"))
      ) {
        // Número dominicano típico (8xx-xxx-xxxx o 9xx-xxx-xxxx)
        numeroWhatsApp = `whatsapp:+1${numeroLimpio}`;
      } else {
        // Formato no reconocido, usar tal como está
        console.log(`⚠️ Formato de número no reconocido: ${numeroLimpio}`);
        numeroWhatsApp = `whatsapp:+${numeroLimpio}`;
      }

      console.log(`Enviando WhatsApp a: ${numeroWhatsApp}`);
      console.log(`Mensaje: ${mensaje.substring(0, 100)}...`);

      // Usar directamente la API de Twilio
      const message = await client.messages.create({
        body: mensaje,
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`, // Agregar prefijo whatsapp:
        to: numeroWhatsApp,
      });

      console.log(`✅ Mensaje enviado exitosamente. SID: ${message.sid}`);

      return {
        success: true,
        messageSid: message.sid,
        status: message.status,
        to: numeroWhatsApp,
      };
    } catch (error) {
      console.error("❌ Error enviando WhatsApp:", error);
      throw new Error(`Error al enviar WhatsApp: ${error.message}`);
    }
  }

  static async enviarMensajeMasivo(
    personas,
    template,
    datosPersonalizacion = {}
  ) {
    const resultados = {
      exitosos: [],
      fallidos: [],
      total: personas.length,
    };

    for (const persona of personas) {
      try {
        // Verificar que tenga número de celular
        if (!persona.celular) {
          resultados.fallidos.push({
            persona: `${persona.nombres} ${persona.apellidos}`,
            error: "No tiene número de celular registrado",
          });
          continue;
        }

        // Personalizar mensaje
        const mensajePersonalizado = this.personalizarMensaje(
          template.mensaje,
          {
            nombre: persona.nombres,
            ...datosPersonalizacion,
          }
        );

        // Enviar mensaje
        const resultado = await this.enviarMensajeIndividual(
          persona.celular,
          mensajePersonalizado
        );

        resultados.exitosos.push({
          persona: `${persona.nombres} ${persona.apellidos}`,
          telefono: persona.celular,
          messageSid: resultado.messageSid,
        });

        // Pequeña pausa para evitar rate limiting
        await this.delay(1000);
      } catch (error) {
        resultados.fallidos.push({
          persona: `${persona.nombres} ${persona.apellidos}`,
          telefono: persona.celular,
          error: error.message,
        });
      }
    }

    return resultados;
  }

  static personalizarMensaje(template, datos) {
    let mensaje = template;

    Object.keys(datos).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      mensaje = mensaje.replace(regex, datos[key] || "");
    });

    return mensaje;
  }

  static delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Función para detectar si es cuenta Trial y seleccionar template apropiado
  static seleccionarTemplate(templateName, datosPersonalizacion = {}) {
    let template = templates[templateName];

    if (!template) {
      throw new Error(`Template '${templateName}' no encontrado`);
    }

    // Crear mensaje de prueba para verificar longitud
    let mensajePrueba = template.mensaje;
    Object.keys(datosPersonalizacion).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      mensajePrueba = mensajePrueba.replace(
        regex,
        datosPersonalizacion[key] || ""
      );
    });

    // Si el mensaje es muy largo (>160 caracteres), usar versión corta
    if (mensajePrueba.length > 160) {
      const templateCorto = `${templateName}Corto`;
      if (templates[templateCorto]) {
        console.log(
          `⚠️ Mensaje muy largo (${mensajePrueba.length} chars). Usando template corto: ${templateCorto}`
        );
        return templates[templateCorto];
      } else {
        console.log(
          `⚠️ Mensaje muy largo (${mensajePrueba.length} chars) pero no hay versión corta. Se enviará como está.`
        );
      }
    }

    return template;
  }
}

// Servicio de SMS
export class SMSService {
  static async enviarMensajeIndividual(telefono, mensaje) {
    try {
      // Verificar que TWILIO_PHONE_NUMBER esté configurado
      if (!process.env.TWILIO_PHONE_NUMBER) {
        throw new Error(
          "TWILIO_PHONE_NUMBER no está configurado en las variables de entorno. " +
            "Agrega esta variable a tu archivo .env.local con tu número de Twilio para SMS."
        );
      }

      // Limpiar el número de teléfono
      let numeroLimpio = telefono.replace(/\D/g, "");

      console.log(`SMS - Número original: ${telefono}`);
      console.log(`SMS - Número limpio: ${numeroLimpio}`);

      // Detectar y formatear según el código de país
      let numeroSMS;

      if (numeroLimpio.startsWith("1") && numeroLimpio.length === 11) {
        // Número de Estados Unidos/Canadá/República Dominicana (+1)
        numeroSMS = `+${numeroLimpio}`;
      } else if (numeroLimpio.startsWith("57") && numeroLimpio.length === 12) {
        // Número de Colombia (+57) ya tiene el código
        numeroSMS = `+${numeroLimpio}`;
      } else if (numeroLimpio.startsWith("57") && numeroLimpio.length === 10) {
        // Número de Colombia sin código de país
        numeroSMS = `+57${numeroLimpio}`;
      } else if (numeroLimpio.length === 10 && numeroLimpio.startsWith("3")) {
        // Número colombiano típico (empieza con 3)
        numeroSMS = `+57${numeroLimpio}`;
      } else if (
        numeroLimpio.length === 10 &&
        (numeroLimpio.startsWith("8") || numeroLimpio.startsWith("9"))
      ) {
        // Número dominicano típico (8xx-xxx-xxxx o 9xx-xxx-xxxx)
        numeroSMS = `+1${numeroLimpio}`;
      } else {
        // Formato no reconocido, usar tal como está
        console.log(
          `⚠️ SMS - Formato de número no reconocido: ${numeroLimpio}`
        );
        numeroSMS = `+${numeroLimpio}`;
      }

      console.log(`Enviando SMS a: ${numeroSMS}`);
      console.log(`Mensaje: ${mensaje.substring(0, 100)}...`);

      // Usar la API de SMS de Twilio
      const message = await client.messages.create({
        body: mensaje,
        from: process.env.TWILIO_PHONE_NUMBER, // Número de teléfono de Twilio (no WhatsApp)
        to: numeroSMS,
      });

      console.log(`✅ SMS enviado exitosamente. SID: ${message.sid}`);
      console.log(`📊 Estado inicial: ${message.status}`);
      console.log(`📋 Dirección: ${message.direction}`);
      console.log(`💰 Precio: ${message.price || "No disponible"}`);

      // Verificar estado después de 10 segundos
      setTimeout(async () => {
        try {
          console.log(
            `🔄 Verificando estado del mensaje ${message.sid} después de 10 segundos...`
          );
          await SMSService.verificarEstadoMensaje(message.sid);
        } catch (error) {
          console.error(`❌ Error verificando estado posterior:`, error);
        }
      }, 10000);

      return {
        success: true,
        messageSid: message.sid,
        status: message.status,
        to: numeroSMS,
        direction: message.direction,
        price: message.price,
      };
    } catch (error) {
      console.error("❌ Error enviando SMS:", error);
      throw new Error(`Error al enviar SMS: ${error.message}`);
    }
  }

  static async enviarMensajeMasivo(
    personas,
    templateName,
    datosPersonalizacion = {}
  ) {
    const resultados = {
      exitosos: [],
      fallidos: [],
      total: personas.length,
    };

    for (const persona of personas) {
      try {
        // Verificar que tenga número de celular
        if (!persona.celular) {
          resultados.fallidos.push({
            persona: `${persona.nombres} ${persona.apellidos}`,
            error: "No tiene número de celular registrado",
          });
          continue;
        }

        // Seleccionar template apropiado (corto si es necesario)
        const template = this.seleccionarTemplate(templateName, {
          nombre: persona.nombres,
          ...datosPersonalizacion,
        });

        // Personalizar mensaje
        const mensajePersonalizado = this.personalizarMensaje(
          template.mensaje,
          {
            nombre: persona.nombres,
            ...datosPersonalizacion,
          }
        );

        console.log(
          `📏 Longitud del mensaje: ${mensajePersonalizado.length} caracteres`
        );

        // Enviar mensaje
        const resultado = await this.enviarMensajeIndividual(
          persona.celular,
          mensajePersonalizado
        );

        resultados.exitosos.push({
          persona: `${persona.nombres} ${persona.apellidos}`,
          telefono: persona.celular,
          messageSid: resultado.messageSid,
        });

        // Pequeña pausa para evitar rate limiting
        await this.delay(1000);
      } catch (error) {
        resultados.fallidos.push({
          persona: `${persona.nombres} ${persona.apellidos}`,
          telefono: persona.celular,
          error: error.message,
        });
      }
    }

    return resultados;
  }

  static personalizarMensaje(template, datos) {
    let mensaje = template;

    Object.keys(datos).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      mensaje = mensaje.replace(regex, datos[key] || "");
    });

    return mensaje;
  }

  static delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Función para detectar si es cuenta Trial y seleccionar template apropiado
  static seleccionarTemplate(templateName, datosPersonalizacion = {}) {
    let template = templates[templateName];

    if (!template) {
      throw new Error(`Template '${templateName}' no encontrado`);
    }

    // Crear mensaje de prueba para verificar longitud
    let mensajePrueba = template.mensaje;
    Object.keys(datosPersonalizacion).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      mensajePrueba = mensajePrueba.replace(
        regex,
        datosPersonalizacion[key] || ""
      );
    });

    // Si el mensaje es muy largo (>160 caracteres), usar versión corta
    if (mensajePrueba.length > 160) {
      const templateCorto = `${templateName}Corto`;
      if (templates[templateCorto]) {
        console.log(
          `⚠️ Mensaje muy largo (${mensajePrueba.length} chars). Usando template corto: ${templateCorto}`
        );
        return templates[templateCorto];
      } else {
        console.log(
          `⚠️ Mensaje muy largo (${mensajePrueba.length} chars) pero no hay versión corta. Se enviará como está.`
        );
      }
    }

    return template;
  }

  // Nueva función para verificar el estado de un mensaje
  static async verificarEstadoMensaje(messageSid) {
    try {
      const message = await client.messages(messageSid).fetch();

      console.log(`📱 Estado del mensaje ${messageSid}:`);
      console.log(`- Estado: ${message.status}`);
      console.log(`- Error Code: ${message.errorCode || "Ninguno"}`);
      console.log(`- Error Message: ${message.errorMessage || "Ninguno"}`);
      console.log(`- Precio: ${message.price || "No disponible"}`);
      console.log(`- Fecha creación: ${message.dateCreated}`);
      console.log(`- Fecha envío: ${message.dateSent || "No enviado aún"}`);
      console.log(`- Fecha actualización: ${message.dateUpdated}`);

      return {
        sid: message.sid,
        status: message.status,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
        price: message.price,
        dateCreated: message.dateCreated,
        dateSent: message.dateSent,
        dateUpdated: message.dateUpdated,
        to: message.to,
        from: message.from,
      };
    } catch (error) {
      console.error(
        `❌ Error verificando estado del mensaje ${messageSid}:`,
        error
      );
      throw error;
    }
  }
}

export default client;
