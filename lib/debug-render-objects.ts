// Utilidad para depurar objetos que se renderizar incorrectamente en React
export function debugRenderObject(obj: unknown, context: string = ""): string {
  if (obj === null || obj === undefined) {
    return "";
  }

  if (
    typeof obj === "string" ||
    typeof obj === "number" ||
    typeof obj === "boolean"
  ) {
    return String(obj);
  }

  if (typeof obj === "object") {
    console.warn(`⚠️ Intento de renderizar objeto en ${context}:`, obj);

    // Si es un objeto con propiedades específicas del error, sugerir la corrección
    const objRecord = obj as Record<string, unknown>;
    if (objRecord.apellido && objRecord.nombre) {
      console.warn(
        "💡 Usa obj.nombres y obj.apellidos en lugar de obj.nombre y obj.apellido"
      );
      return `${objRecord.nombre || objRecord.nombres || ""} ${
        objRecord.apellido || objRecord.apellidos || ""
      }`;
    }

    if (objRecord.nombres && objRecord.apellidos) {
      return `${objRecord.nombres} ${objRecord.apellidos}`;
    }

    // Para depuración, devolver JSON stringificado
    return JSON.stringify(obj);
  }

  return String(obj);
}

// Función para validar datos antes de renderizar
export function validateRenderData(data: unknown, fieldName: string): string {
  if (data === null || data === undefined) {
    return "";
  }

  if (typeof data === "object") {
    console.error(
      `❌ Error: Intentando renderizar objeto en campo ${fieldName}:`,
      data
    );
    throw new Error(
      `No se puede renderizar un objeto en el campo ${fieldName}. Usa las propiedades específicas del objeto.`
    );
  }

  return String(data);
}
