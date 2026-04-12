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
 * Extrae solo la parte YYYY-MM-DD de cualquier string de fecha,
 * evitando que la conversión UTC → local reste un día.
 * Ej: "2026-04-11T00:00:00.000Z" → "2026-04-11"
 *     "2026-04-11"               → "2026-04-11"
 */
function extractDatePart(dateString: string): string {
  // Si contiene T o Z, tomar solo los primeros 10 caracteres (YYYY-MM-DD)
  if (dateString.includes("T") || dateString.includes("Z")) {
    return dateString.substring(0, 10);
  }
  return dateString.trim();
}

/**
 * Parsea cualquier fecha de forma segura como fecha LOCAL (sin desplazamiento UTC).
 * Úsalo en lugar de dayjs(dateString) para fechas que solo representan un día (sin hora).
 */
function parseDateLocal(dateString: string | Date): dayjs.Dayjs {
  if (dateString instanceof Date) {
    // Construir desde componentes locales para evitar conversión UTC
    return dayjs(
      `${dateString.getFullYear()}-${String(dateString.getMonth() + 1).padStart(2, "0")}-${String(dateString.getDate()).padStart(2, "0")}`
    );
  }
  return dayjs(extractDatePart(String(dateString)));
}

/**
 * Utilidades para manejo correcto de fechas usando Day.js
 * Evita problemas de zona horaria al convertir fechas para inputs y display
 */

/**
 * Convierte una fecha a string corto "DD/MM/YYYY" sin desfase de timezone.
 * Reemplaza: new Date(x).toLocaleDateString("es-ES")
 */
export function toLocaleDateShort(dateString?: string | Date | null): string {
  if (!dateString) return "—";
  try {
    const d = parseDateLocal(dateString);
    return d.isValid() ? d.format("DD/MM/YYYY") : "—";
  } catch {
    return "—";
  }
}

/**
 * Convierte una fecha a string largo "D de MMMM de YYYY" sin desfase de timezone.
 * Reemplaza: new Date(x).toLocaleDateString("es-ES", { day, month, year })
 */
export function toLocaleDateLong(
  dateString?: string | Date | null,
  opts: { day?: boolean; month?: "short" | "long"; year?: boolean; weekday?: "short" | "long" } = {
    day: true,
    month: "long",
    year: true,
  }
): string {
  if (!dateString) return "—";
  try {
    const d = parseDateLocal(dateString);
    if (!d.isValid()) return "—";
    let fmt = "";
    if (opts.weekday === "long") fmt += "dddd, ";
    else if (opts.weekday === "short") fmt += "ddd. ";
    if (opts.day !== false) fmt += "D";
    if (opts.month === "long") fmt += " [de] MMMM";
    else if (opts.month === "short") fmt += " MMM";
    if (opts.year !== false) fmt += " [de] YYYY";
    return d.format(fmt.trim());
  } catch {
    return "—";
  }
}

/**
 * Convierte una fecha a formato "D MMM YYYY" (ej: "11 abr 2026") sin desfase.
 */
export function toLocaleDateMedium(dateString?: string | Date | null): string {
  if (!dateString) return "—";
  try {
    const d = parseDateLocal(dateString);
    return d.isValid() ? d.format("D MMM YYYY") : "—";
  } catch {
    return "—";
  }
}

/**
 * Convierte una fecha a formato string para inputs type="date" (YYYY-MM-DD)
 * Evita problemas de zona horaria usando dayjs
 */
export function formatDateForInput(dateString?: string | null): string {
  if (!dateString) return "";

  try {
    if (typeof dateString === "string" && dateString.trim() === "") {
      return "";
    }

    const date = parseDateLocal(dateString);

    if (!date.isValid()) {
      return "";
    }

    return date.format("YYYY-MM-DD");
  } catch {
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
    const date = parseDateLocal(dateString as string | Date);

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
    const nacimiento = parseDateLocal(fechaNacimiento as string | Date);
    if (!nacimiento.isValid()) return null;
    return dayjs().diff(nacimiento, "year");
  } catch {
    return null;
  }
}

/**
 * Calcula años transcurridos desde una fecha (útil para calcular años en la iglesia)
 */
export function calcularAniosTranscurridos(
  fechaInicio?: string | Date | null
): number | null {
  if (!fechaInicio) return null;
  try {
    const inicio = parseDateLocal(fechaInicio as string | Date);
    if (!inicio.isValid()) return null;
    return dayjs().diff(inicio, "year");
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
    return undefined;
  }
  try {
    const cleanDate = extractDatePart(dateString.trim());
    const date = dayjs(cleanDate);
    if (!date.isValid()) return undefined;
    // Construir Date en medianoche LOCAL para que Prisma/Postgres no desplace el día
    return new Date(`${cleanDate}T00:00:00`);
  } catch {
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
    const date = parseDateLocal(dateString as string | Date);
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
    const date = parseDateLocal(dateString as string | Date);
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
    const date = parseDateLocal(dateString as string | Date);
    if (!date.isValid()) return "—";

    let result = date.format("DD/MM/YYYY");

    if (timeString) {
      try {
        const [hours, minutes] = timeString.split(":");
        const timeDate = dayjs().hour(parseInt(hours)).minute(parseInt(minutes));
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

/**
 * Formatea una fecha de actividad usando dayjs
 * @param dateString Fecha en formato string o Date
 * @param options Opciones de formateo
 * @returns Fecha formateada
 */
export function formatActivityDate(
  dateString?: string | Date | null,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  }
): string {
  if (!dateString) return "—";
  try {
    const date = parseDateLocal(dateString as string | Date);
    if (!date.isValid()) return "—";

    let formatStr = "";
    if (options.weekday) {
      formatStr += options.weekday === "long" ? "dddd, " : "ddd, ";
    }
    if (options.day) {
      formatStr += options.day === "2-digit" ? "DD" : "D";
    }
    if (options.month) {
      if (options.month === "long") formatStr += " [de] MMMM";
      else if (options.month === "short") formatStr += " MMM";
      else if (options.month === "numeric") formatStr += "/M";
      else if (options.month === "2-digit") formatStr += "/MM";
    }
    if (options.year) {
      formatStr +=
        options.month === "numeric" || options.month === "2-digit"
          ? "/YYYY"
          : " [de] YYYY";
    }

    return date.format(formatStr);
  } catch {
    return "—";
  }
}
