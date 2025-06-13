import { z } from "zod";

export const actividadSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
  fecha: z.string().min(1, "La fecha es requerida"),
  horaInicio: z.string().optional(),
  horaFin: z.string().optional(),
  ubicacion: z.string().optional(),
  googleMapsEmbed: z.string().optional(),
  responsable: z.string().optional(),
  tipoActividadId: z.number().min(1, "El tipo de actividad es requerido"),
  ministerioId: z.number().optional(),
  estado: z
    .enum(["Programada", "En curso", "Finalizada", "Cancelada"], {
      required_error: "Por favor seleccione un estado.",
    })
    .default("Programada"),
  banner: z.string().optional(),
});

export type ActividadFormData = z.infer<typeof actividadSchema>;
