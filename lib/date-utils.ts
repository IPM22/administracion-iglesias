import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// Configurar plugins de dayjs
dayjs.extend(utc);
dayjs.extend(timezone);

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

    // Usar dayjs para parsear la fecha
    const date = dayjs(dateString);

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
    const date = dayjs(dateString);

    if (!date.isValid()) return "—";

    // Usar toDate() para convertir a Date nativo y usar toLocaleDateString
    return date.toDate().toLocaleDateString("es-ES", options);
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

    // Usar dayjs para parsear la fecha
    const date = dayjs(cleanDate);

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
