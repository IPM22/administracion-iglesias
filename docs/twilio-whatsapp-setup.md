# Configuración de Twilio WhatsApp para Mensajes Masivos

Esta guía te ayudará a configurar Twilio WhatsApp para enviar mensajes masivos de agradecimiento a las visitas de tu iglesia.

## 🚀 Configuración Rápida

### 1. Crear cuenta en Twilio

1. Ve a [Twilio.com](https://www.twilio.com/) y crea una cuenta gratuita
2. Verifica tu número de teléfono
3. Obtendrás **$15 USD de crédito gratis** para empezar

### 2. Obtener credenciales

En tu [Console de Twilio](https://console.twilio.com/):

1. Ve a **Account Info** en el panel principal
2. Copia tu **Account SID**
3. Copia tu **Auth Token** (haz clic en "Show")

### 3. Configurar WhatsApp Sandbox

1. Ve a **Develop > Messaging > Try it out > Send a WhatsApp message**
2. Sigue las instrucciones para unir tu número al sandbox
3. Envía `join [código]` al número de Twilio desde tu WhatsApp
4. Copia el número del sandbox (ej: `whatsapp:+14155238886`)

### 4. Variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID="tu-account-sid-aqui"
TWILIO_AUTH_TOKEN="tu-auth-token-aqui"
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"
```

## 📱 Cómo usar los mensajes masivos

### En la aplicación:

1. Ve a **Comunidad > Visitas**
2. Haz clic en **"Mensaje Masivo"**
3. Selecciona el template de mensaje
4. Personaliza los datos (nombre iglesia, evento, etc.)
5. ¡Envía!

### Templates disponibles:

- **Agradecimiento por Visita**: Mensaje personalizado con evento específico
- **Agradecimiento General**: Mensaje general de bienvenida
- **Invitación a Regresar**: Invitación amable para futuros eventos

## 💰 Costos

### Sandbox (Desarrollo):

- **Gratis** para testing
- Solo puede enviar a números previamente verificados
- Perfecto para probar la funcionalidad

### Producción:

- **$0.005 USD por mensaje** + tarifas de Meta
- Aprox **$0.01 USD por mensaje** total
- 100 mensajes = $1 USD aproximadamente

### WhatsApp Business API:

Para producción necesitarás:

1. Verificar tu negocio con Meta
2. Obtener un número de WhatsApp Business dedicado
3. Proceso de aprobación de 1-2 semanas

## 🔧 Funcionalidades

### ✅ Lo que funciona:

- ✅ Envío masivo a visitas con WhatsApp
- ✅ Personalización con nombre de la persona
- ✅ Templates predefinidos para iglesias
- ✅ Reportes de éxito/fallo
- ✅ Filtrado automático por personas con celular
- ✅ Rate limiting para evitar spam

### ⚠️ Limitaciones actuales:

- Solo funciona con números que hayan optado-in al sandbox
- Máximo ~80 mensajes por segundo
- Requiere que las personas tengan celular registrado

## 🛠️ Solución de problemas

### Error: "Invalid 'To' number"

- Verifica que el número esté en formato internacional (+57...)
- Asegúrate que el número haya optado-in al sandbox

### Error: "Account not authorized"

- Verifica tus credenciales en `.env.local`
- Asegúrate que tu cuenta Twilio esté activa

### No se envían mensajes

- Verifica que las personas tengan números de celular registrados
- Revisa los logs en la consola del navegador

## 📞 Soporte

Si necesitas ayuda:

1. Revisa la [documentación de Twilio](https://www.twilio.com/docs/whatsapp)
2. Chequea los logs en la consola del navegador
3. Verifica que todas las variables de entorno estén configuradas

## 🎯 Próximos pasos

Para pasar a producción:

1. Solicita aprobación de WhatsApp Business API
2. Configura webhook para respuestas
3. Implementa opt-in/opt-out automático
4. Agrega más templates personalizados
