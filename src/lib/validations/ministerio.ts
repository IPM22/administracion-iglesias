import { z } from "zod";

export const ministerioSchema = z.object({
  nombre: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  descripcion: z.string().nullable().optional(),
});

export const ministerioMiembroSchema = z.object({
  ministerioId: z.number({
    required_error: "El ministerio es requerido.",
  }),
  miembroId: z.number({
    required_error: "El miembro es requerido.",
  }),
  fechaInicio: z.date({
    required_error: "La fecha de inicio es requerida.",
  }),
  fechaFin: z.date().nullable().optional(),
  estado: z.enum(["Activo", "Inactivo"], {
    required_error: "Por favor seleccione un estado.",
  }),
});

export type MinisterioFormValues = z.infer<typeof ministerioSchema>;
export type MinisterioMiembroFormValues = z.infer<
  typeof ministerioMiembroSchema
>;
