/**
 * Utilidades para manejo correcto de fechas
 * Evita problemas de zona horaria al convertir fechas para inputs y display
 */

/**
 * Convierte una fecha a formato string para inputs type="date" (YYYY-MM-DD)
 * Evita problemas de zona horaria usando Date local
 */
export function formatDateForInput(dateString?: string | null): string {
  if (!dateString) return "";

  try {
    // Crear la fecha usando el string directamente para evitar problemas UTC
    const date = new Date(dateString + "T00:00:00");

    // Usar métodos locales para obtener año, mes y día
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
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
    let date: Date;

    if (typeof dateString === "string") {
      // Agregar hora local para evitar conversión UTC
      date = new Date(dateString + "T00:00:00");
    } else {
      date = new Date(dateString);
    }

    if (isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("es-ES", options);
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
    let nacimiento: Date;

    if (typeof fechaNacimiento === "string") {
      // Agregar hora local para evitar conversión UTC
      nacimiento = new Date(fechaNacimiento + "T00:00:00");
    } else {
      nacimiento = new Date(fechaNacimiento);
    }

    if (isNaN(nacimiento.getTime())) return null;

    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }

    return edad;
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
    let inicio: Date;

    if (typeof fechaInicio === "string") {
      // Agregar hora local para evitar conversión UTC
      inicio = new Date(fechaInicio + "T00:00:00");
    } else {
      inicio = new Date(fechaInicio);
    }

    if (isNaN(inicio.getTime())) return null;

    const hoy = new Date();
    let anos = hoy.getFullYear() - inicio.getFullYear();
    const mes = hoy.getMonth() - inicio.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < inicio.getDate())) {
      anos--;
    }

    return anos;
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
  if (!dateString || dateString.trim() === "") return undefined;

  try {
    // Crear fecha usando el formato YYYY-MM-DD directamente
    const date = new Date(dateString + "T00:00:00");

    if (isNaN(date.getTime())) return undefined;

    return date;
  } catch {
    return undefined;
  }
}
