# Configuración de SMS con Twilio

## 📱 SMS como Alternativa a WhatsApp

Hemos agregado funcionalidad de SMS para cuando WhatsApp no funcione o el mensaje no llegue al destinatario.

## 🚀 Configuración

### 1. Variables de Entorno

Agrega esta variable a tu archivo `.env.local`:

```bash
# SMS Configuration (además de las variables de WhatsApp)
TWILIO_PHONE_NUMBER="+1234567890"  # Tu número de teléfono de Twilio
```

### 2. Obtener un número de Twilio

1. Ve a tu [Console de Twilio](https://console.twilio.com/)
2. Ve a **Phone Numbers > Manage > Buy a number**
3. Selecciona un número en tu país
4. Copia el número y agrégalo a `TWILIO_PHONE_NUMBER`

## 💰 Costos de SMS

- **SMS local**: ~$0.0075 USD por mensaje
- **SMS internacional**: ~$0.05-0.20 USD por mensaje
- Más económico que WhatsApp Business API en algunos casos

## 🛠️ Cómo Usar

### En la aplicación:

1. Ve a **Actividades** > **[Tu Actividad]**
2. Haz clic en **"Mensajes Masivos"**
3. Ahora verás 3 opciones:
   - ✅ **WhatsApp Masivo** (opción original)
   - ✅ **SMS Masivo** (nueva opción)
   - ✅ **Correo** (opción original)

### Cuándo usar SMS en lugar de WhatsApp:

- ❌ WhatsApp no llega al destinatario
- ❌ El número no tiene WhatsApp
- ❌ Problemas con WhatsApp Business API
- ✅ Mayor alcance (todos los celulares reciben SMS)
- ✅ No requiere aplicación específica

## 🔧 Funcionalidades

### ✅ Lo que funciona:

- ✅ Envío masivo de SMS a visitas
- ✅ Mismos templates que WhatsApp
- ✅ Personalización con nombre de la persona
- ✅ Reportes de éxito/fallo
- ✅ Formato automático de números
- ✅ Rate limiting para evitar spam

### 🚀 Ventajas del SMS:

- 📈 **Mayor alcance**: Todos los celulares reciben SMS
- 🚫 **No requiere app**: No necesita WhatsApp instalado
- ⚡ **Más confiable**: Menor probabilidad de fallos
- 💰 **Predecible**: Costos fijos por mensaje

## 🛠️ Solución de problemas

### Error: "The number provided is not a valid mobile number"

- Verifica que el número esté en formato internacional
- Asegúrate que sea un número de celular, no fijo

### Error: "Account not authorized"

- Verifica tus credenciales en `.env.local`
- Asegúrate que tu cuenta Twilio esté activa

### No se envían SMS

- Verifica que `TWILIO_PHONE_NUMBER` esté configurado
- Revisa que las personas tengan números de celular registrados

## 📞 Ejemplo de Configuración Completa

```bash
# .env.local
TWILIO_ACCOUNT_SID="tu-account-sid"
TWILIO_AUTH_TOKEN="tu-auth-token"
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"
TWILIO_PHONE_NUMBER="+14155234567"
```

## 🎯 Estrategia Recomendada

1. **Primer intento**: WhatsApp (más personal, incluye emojis)
2. **Si falla**: SMS (mayor alcance, más confiable)
3. **Backup**: Correo electrónico

Esta estrategia multi-canal asegura que tu mensaje llegue a los destinatarios.

## 🔄 Diferencias entre WhatsApp y SMS

| Característica | WhatsApp         | SMS                    |
| -------------- | ---------------- | ---------------------- |
| Emojis         | ✅ Sí            | ⚠️ Limitado            |
| Multimedia     | ✅ Sí            | ❌ No                  |
| Alcance        | 📱 Solo WhatsApp | 📞 Todos los celulares |
| Costo          | $0.005 USD       | $0.0075 USD            |
| Confiabilidad  | ⚠️ Media         | ✅ Alta                |
| Longitud       | 1600 chars       | 160 chars              |

El sistema automáticamente formatea los mensajes para que funcionen bien en ambos medios.
