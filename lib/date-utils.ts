import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import localizedFormat from "dayjs/plugin/localizedFormat";
import "dayjs/locale/es";

// Configurar plugins de dayjs
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(localizedFormat);
dayjs.locale("es");

/**
 * Utilidades para manejo correcto de fechas usando Day.js
 * Evita problemas de zona horaria al convertir fechas para inputs y display
 */

/**
 * Convierte una fecha a formato string para inputs type="date" (YYYY-MM-DD)
 * Evita problemas de zona horaria usando dayjs
 */
export function formatDateForInput(dateString?: string | null): string {
  if (!dateString) return "";

  try {
    // Si es una cadena vacía o solo espacios, retornar vacío
    if (typeof dateString === "string" && dateString.trim() === "") {
      return "";
    }

    // Usar dayjs para parsear la fecha como local (sin zona horaria)
    const date = dayjs(dateString).startOf("day");

    // Verificar que la fecha es válida
    if (!date.isValid()) {
      console.warn(
        "📅 formatDateForInput: Fecha inválida recibida:",
        dateString
      );
      return "";
    }

    // Formatear como YYYY-MM-DD
    const result = date.format("YYYY-MM-DD");

    console.log("📅 formatDateForInput:", {
      input: dateString,
      output: result,
      parsed: date.toISOString(),
    });

    return result;
  } catch (error) {
    console.warn(
      "📅 formatDateForInput: Error al formatear fecha:",
      error,
      "Fecha original:",
      dateString
    );
    return "";
  }
}

/**
 * Formatea una fecha para mostrar en la interfaz
 * @param dateString Fecha en formato string o Date
 * @param options Opciones de formateo
 * @returns Fecha formateada en español
 */
export function formatDate(
  dateString?: string | Date | null,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  }
): string {
  if (!dateString) return "—";

  try {
    // LOG TEMPORAL: Verificar que se esté usando la función corregida
    console.log("🔧 FUNCIÓN CORREGIDA formatDate - Input:", dateString);

    // Usar dayjs para parsear la fecha como local (sin zona horaria)
    const date = dayjs(dateString).startOf("day");

    if (!date.isValid()) return "—";

    // Construir el formato según las opciones usando dayjs directamente
    // Esto evita los problemas de zona horaria de toLocaleDateString
    let formatStr = "";

    if (options.weekday) {
      if (options.weekday === "long") formatStr += "dddd, ";
      else if (options.weekday === "short") formatStr += "ddd, ";
    }

    if (options.day) {
      formatStr += "D";
    }

    if (options.month) {
      if (options.month === "long") formatStr += " [de] MMMM";
      else if (options.month === "short") formatStr += " MMM";
      else if (options.month === "numeric") formatStr += "/M";
    }

    if (options.year) {
      if (options.month === "numeric") formatStr += "/YYYY";
      else formatStr += " [de] YYYY";
    }

    // Formatear usando dayjs directamente
    const result = date.format(formatStr);

    // LOG TEMPORAL: Verificar el resultado
    console.log("🔧 FUNCIÓN CORREGIDA formatDate - Output:", result);

    return result;
  } catch {
    return "—";
  }
}

/**
 * Calcula la edad basada en una fecha de nacimiento
 * @param fechaNacimiento Fecha de nacimiento
 * @returns Edad en años o null si no es válida
 */
export function calcularEdad(
  fechaNacimiento?: string | Date | null
): number | null {
  if (!fechaNacimiento) return null;

  try {
    const nacimiento = dayjs(fechaNacimiento);

    if (!nacimiento.isValid()) return null;

    const hoy = dayjs();
    return hoy.diff(nacimiento, "year");
  } catch {
    return null;
  }
}

/**
 * Calcula años transcurridos desde una fecha (útil para calcular años en la iglesia)
 * @param fechaInicio Fecha de inicio
 * @returns Años transcurridos o null si no es válida
 */
export function calcularAniosTranscurridos(
  fechaInicio?: string | Date | null
): number | null {
  if (!fechaInicio) return null;

  try {
    const inicio = dayjs(fechaInicio);

    if (!inicio.isValid()) return null;

    const hoy = dayjs();
    return hoy.diff(inicio, "year");
  } catch {
    return null;
  }
}

/**
 * Convierte una fecha para ser enviada a la API
 * @param dateString Fecha en formato YYYY-MM-DD del input
 * @returns Fecha en formato ISO o undefined
 */
export function parseDateForAPI(dateString?: string): Date | undefined {
  if (!dateString || dateString.trim() === "") {
    console.log("📅 parseDateForAPI: Fecha vacía o nula, retornando undefined");
    return undefined;
  }

  try {
    console.log("📅 parseDateForAPI: Procesando fecha:", dateString);

    // Limpiar la fecha de cualquier espacio extra
    const cleanDate = dateString.trim();

    // Usar dayjs para parsear la fecha como local (sin zona horaria)
    const date = dayjs(cleanDate).startOf("day");

    if (!date.isValid()) {
      console.warn("📅 parseDateForAPI: Fecha inválida:", cleanDate);
      return undefined;
    }

    // Convertir a Date nativo para la API
    const result = date.toDate();

    console.log("📅 parseDateForAPI: Fecha procesada exitosamente:", {
      input: cleanDate,
      output: result.toISOString(),
      local: result.toLocaleDateString(),
    });

    return result;
  } catch (error) {
    console.error(
      "📅 parseDateForAPI: Error al procesar fecha:",
      error,
      "Input:",
      dateString
    );
    return undefined;
  }
}

/**
 * Formatea una fecha en formato dd-mm-yyyy
 * @param dateString Fecha en formato string o Date
 * @returns Fecha formateada como dd-mm-yyyy
 */
export function formatDateShort(dateString?: string | Date | null): string {
  if (!dateString) return "—";

  try {
    const date = dayjs(dateString).startOf("day");

    if (!date.isValid()) return "—";

    return date.format("DD-MM-YYYY");
  } catch {
    return "—";
  }
}

/**
 * Formatea una hora en formato de 12 horas
 * @param timeString Hora en formato HH:mm (24 horas)
 * @returns Hora formateada en formato de 12 horas
 */
export function formatTime12Hour(timeString?: string): string {
  if (!timeString) return "—";

  try {
    // Crear una fecha temporal para formatear la hora
    const [hours, minutes] = timeString.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));

    return date.toLocaleTimeString("es-ES", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return timeString; // Si falla, retornar la hora original
  }
}

/**
 * Formatea una fecha completa con día de la semana
 * @param dateString Fecha en formato string o Date
 * @returns Fecha formateada completa
 */
export function formatDateComplete(dateString?: string | Date | null): string {
  if (!dateString) return "—";

  try {
    const date = dayjs(dateString).startOf("day");

    if (!date.isValid()) return "—";

    return date.format("dddd, D [de] MMMM [de] YYYY");
  } catch {
    return "—";
  }
}

/**
 * Formatea una fecha y hora en formato corto
 * @param dateString Fecha en formato string o Date
 * @param timeString Hora en formato HH:mm (opcional)
 * @returns Fecha y hora formateadas
 */
export function formatDateTimeShort(
  dateString?: string | Date | null,
  timeString?: string
): string {
  if (!dateString) return "—";

  try {
    const date = dayjs(dateString).startOf("day");

    if (!date.isValid()) return "—";

    let result = date.format("DD/MM/YYYY");

    if (timeString) {
      try {
        const [hours, minutes] = timeString.split(":");
        const timeDate = dayjs()
          .hour(parseInt(hours))
          .minute(parseInt(minutes));
        result += ` ${timeDate.format("HH:mm")}`;
      } catch {
        result += ` ${timeString}`;
      }
    }

    return result;
  } catch {
    return "—";
  }
}
