import { z } from "zod";

// Enums para validación
export const TipoPersonaEnum = z.enum([
  "NINO",
  "ADOLESCENTE",
  "JOVEN",
  "ADULTO",
  "ADULTO_MAYOR",
  "ENVEJECIENTE",
]);

export const RolPersonaEnum = z.enum(["MIEMBRO", "VISITA", "INVITADO"]);

export const EstadoPersonaEnum = z.enum([
  "ACTIVA",
  "INACTIVA",
  "RECURRENTE",
  "NUEVA",
]);

// Esquema base para Persona
export const personaSchema = z.object({
  nombres: z.string().min(2, {
    message: "Los nombres deben tener al menos 2 caracteres.",
  }),
  apellidos: z.string().min(2, {
    message: "Los apellidos deben tener al menos 2 caracteres.",
  }),
  correo: z
    .union([z.string().email("Correo inválido"), z.literal("")])
    .optional(),
  telefono: z.string().optional(),
  celular: z.string().optional(),
  direccion: z.string().optional(),
  fechaNacimiento: z.date().optional(),
  sexo: z.enum(["Masculino", "Femenino", "Otro"]).optional(),
  estadoCivil: z
    .enum(["Soltero/a", "Casado/a", "Viudo/a", "Divorciado/a"])
    .optional(),
  ocupacion: z.string().optional(),
  foto: z.string().optional(),
  notas: z.string().optional(),

  // Clasificación (calculados automáticamente pero editables)
  tipo: TipoPersonaEnum.optional(),
  rol: RolPersonaEnum.optional(),
  estado: EstadoPersonaEnum.optional(),

  // Info eclesiástica
  fechaIngreso: z.date().optional(),
  fechaBautismo: z.date().optional(),
  fechaConfirmacion: z.date().optional(),

  // Info específica de visitas
  fechaPrimeraVisita: z.date().optional(),
  comoConocioIglesia: z.string().optional(),
  motivoVisita: z.string().optional(),
  intereses: z.string().optional(),

  // Familia
  familiaId: z.number().optional(),
  relacionFamiliar: z.string().optional(),

  // Conversión / vínculos
  personaInvitaId: z.number().optional(),
  fechaConversion: z.date().optional(),
});

// Esquema para crear nueva persona
export const crearPersonaSchema = personaSchema
  .extend({
    // Los campos requeridos para crear
    iglesiaId: z.number().min(1, "La iglesia es requerida"),
  })
  .refine(
    (data) => {
      // Si es miembro, debe tener fecha de ingreso
      if (data.rol === "MIEMBRO" && !data.fechaIngreso) {
        return false;
      }
      return true;
    },
    {
      message: "Los miembros deben tener fecha de ingreso",
      path: ["fechaIngreso"],
    }
  )
  .refine(
    (data) => {
      // Si es visita, debe tener fecha de primera visita
      if (data.rol === "VISITA" && !data.fechaPrimeraVisita) {
        return false;
      }
      return true;
    },
    {
      message: "Las visitas deben tener fecha de primera visita",
      path: ["fechaPrimeraVisita"],
    }
  );

// Esquema para editar persona existente
export const editarPersonaSchema = personaSchema.partial();

// Esquema para formularios de frontend (con strings para fechas)
export const personaFormSchema = z.object({
  nombres: z.string().min(2, "Los nombres deben tener al menos 2 caracteres"),
  apellidos: z
    .string()
    .min(2, "Los apellidos deben tener al menos 2 caracteres"),
  correo: z
    .union([z.string().email("Correo inválido"), z.literal("")])
    .optional(),
  telefono: z.string().optional(),
  celular: z.string().optional(),
  direccion: z.string().optional(),
  fechaNacimiento: z.string().optional(),
  sexo: z.enum(["Masculino", "Femenino", "Otro"]).optional(),
  estadoCivil: z
    .enum(["Soltero/a", "Casado/a", "Viudo/a", "Divorciado/a"])
    .optional(),
  ocupacion: z.string().optional(),
  foto: z.string().optional(),
  notas: z.string().optional(),

  // Clasificación
  tipo: TipoPersonaEnum.optional(),
  rol: RolPersonaEnum.optional(),
  estado: EstadoPersonaEnum.optional(),

  // Info eclesiástica
  fechaIngreso: z.string().optional(),
  fechaBautismo: z.string().optional(),
  fechaConfirmacion: z.string().optional(),

  // Info específica de visitas
  fechaPrimeraVisita: z.string().optional(),
  comoConocioIglesia: z.string().optional(),
  motivoVisita: z.string().optional(),
  intereses: z.string().optional(),

  // Familia
  familiaId: z.string().optional(),
  relacionFamiliar: z.string().optional(),

  // Conversión / vínculos
  personaInvitaId: z.string().optional(),
  fechaConversion: z.string().optional(),
});

// Esquema para filtros de búsqueda
export const filtrosPersonaSchema = z.object({
  tipo: z
    .union([
      TipoPersonaEnum,
      z.string().refine(
        (val) => {
          // Permitir múltiples tipos separados por coma
          if (val.includes(",")) {
            const tipos = val.split(",");
            return tipos.every((tipo) =>
              [
                "NINO",
                "ADOLESCENTE",
                "JOVEN",
                "ADULTO",
                "ADULTO_MAYOR",
                "ENVEJECIENTE",
              ].includes(tipo)
            );
          }
          return [
            "NINO",
            "ADOLESCENTE",
            "JOVEN",
            "ADULTO",
            "ADULTO_MAYOR",
            "ENVEJECIENTE",
          ].includes(val);
        },
        { message: "Tipo de persona inválido" }
      ),
    ])
    .optional(),
  rol: RolPersonaEnum.optional(),
  estado: EstadoPersonaEnum.optional(),
  familiaId: z.number().optional(),
  edadMin: z.number().min(0).max(120).optional(),
  edadMax: z.number().min(0).max(120).optional(),
  genero: z.enum(["Masculino", "Femenino", "Otro"]).optional(),
  estadoCivil: z
    .enum(["Soltero/a", "Casado/a", "Viudo/a", "Divorciado/a"])
    .optional(),
  conBautismo: z.boolean().optional(),
  busqueda: z.string().optional(), // Para buscar por nombres/apellidos
});

// Esquema para conversión de visita a miembro
export const convertirVisitaSchema = z.object({
  fechaBautismo: z.date().optional(),
  fechaIngreso: z.date().default(() => new Date()),
  notas: z.string().optional(),
});

// Esquema para agregar a ministerio
export const personaMinisterioSchema = z.object({
  personaId: z.number().min(1, "La persona es requerida"),
  ministerioId: z.number().min(1, "El ministerio es requerido"),
  cargo: z.string().optional(),
  rol: z.string().optional(),
  fechaInicio: z.date().default(() => new Date()),
  fechaFin: z.date().optional(),
  esLider: z.boolean().default(false),
  estado: z.enum(["Activo", "Inactivo"]).default("Activo"),
});

// Tipos TypeScript derivados
export type PersonaFormValues = z.infer<typeof personaFormSchema>;
export type CrearPersonaInput = z.infer<typeof crearPersonaSchema>;
export type EditarPersonaInput = z.infer<typeof editarPersonaSchema>;
export type FiltrosPersona = z.infer<typeof filtrosPersonaSchema>;
export type ConvertirVisitaInput = z.infer<typeof convertirVisitaSchema>;
export type PersonaMinisterioInput = z.infer<typeof personaMinisterioSchema>;

// Valores por defecto para enums
export const TIPOS_PERSONA = [
  { value: "NINO", label: "Niño/a (0-9 años)" },
  { value: "ADOLESCENTE", label: "Adolescente (10-14 años)" },
  { value: "JOVEN", label: "Joven (15-24 años)" },
  { value: "ADULTO", label: "Adulto (25-35 años)" },
  { value: "ADULTO_MAYOR", label: "Adulto Mayor (36-59 años)" },
  { value: "ENVEJECIENTE", label: "Envejeciente (60+ años)" },
];

export const ROLES_PERSONA = [
  { value: "MIEMBRO", label: "Miembro" },
  { value: "VISITA", label: "Visita" },
  { value: "INVITADO", label: "Invitado" },
];

export const ESTADOS_PERSONA = [
  { value: "ACTIVA", label: "Activa" },
  { value: "INACTIVA", label: "Inactiva" },
  { value: "RECURRENTE", label: "Recurrente" },
  { value: "NUEVA", label: "Nueva" },
];

// Funciones de utilidad
export function calcularTipoPersona(
  fechaNacimiento: Date
): typeof TipoPersonaEnum._type {
  const hoy = new Date();
  const edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
  const mesActual = hoy.getMonth();
  const mesNacimiento = fechaNacimiento.getMonth();

  // Ajustar edad si aún no ha pasado el cumpleaños este año
  const edadAjustada =
    mesActual < mesNacimiento ||
    (mesActual === mesNacimiento && hoy.getDate() < fechaNacimiento.getDate())
      ? edad - 1
      : edad;

  if (edadAjustada <= 9) return "NINO";
  if (edadAjustada <= 14) return "ADOLESCENTE";
  if (edadAjustada <= 24) return "JOVEN";
  if (edadAjustada <= 35) return "ADULTO";
  if (edadAjustada <= 59) return "ADULTO_MAYOR";
  return "ENVEJECIENTE";
}

export function aplicarReglasAutomaticas(
  tipo: typeof TipoPersonaEnum._type,
  fechaBautismo?: Date | null,
  fechaIngreso?: Date | null
): {
  rol: typeof RolPersonaEnum._type;
  estado: typeof EstadoPersonaEnum._type;
} {
  // Regla 1: Si tiene fecha de bautismo -> MIEMBRO y ACTIVA
  if (fechaBautismo) {
    return { rol: "MIEMBRO", estado: "ACTIVA" };
  }

  // Regla 2: Si tiene fecha de ingreso -> MIEMBRO (puede estar sin bautizar)
  if (fechaIngreso) {
    return { rol: "MIEMBRO", estado: "ACTIVA" };
  }

  // Regla 3: Por defecto para niños -> MIEMBRO y ACTIVA (niños de familias cristianas)
  if (tipo === "NINO") {
    return { rol: "MIEMBRO", estado: "ACTIVA" };
  }

  // Regla 4: Adolescentes sin bautismo ni ingreso -> VISITA y RECURRENTE
  if (tipo === "ADOLESCENTE") {
    return { rol: "VISITA", estado: "RECURRENTE" };
  }

  // Regla 5: Por defecto para otros sin ingreso -> VISITA y NUEVA
  return { rol: "VISITA", estado: "NUEVA" };
}
