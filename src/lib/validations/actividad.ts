import { z } from "zod";

export const actividadSchema = z.object({
  nombre: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  descripcion: z.string().optional(),
  fecha: z.date({
    required_error: "La fecha es requerida.",
  }),
  horaInicio: z.string().optional(),
  horaFin: z.string().optional(),
  ubicacion: z.string().optional(),
  latitud: z.number().optional(),
  longitud: z.number().optional(),
  tipoActividadId: z.number({
    required_error: "El tipo de actividad es requerido.",
  }),
  ministerioId: z.number().optional(),
  estado: z
    .enum(["Programada", "En curso", "Finalizada", "Cancelada"], {
      required_error: "Por favor seleccione un estado.",
    })
    .default("Programada"),
  banner: z.string().optional(),
});

export type ActividadFormValues = z.infer<typeof actividadSchema>;
