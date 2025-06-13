import { z } from "zod";

export const actividadSchema = z
  .object({
    nombre: z.string().min(1, "El nombre es requerido"),
    descripcion: z.string().optional(),
    fecha: z.string().optional(),
    fechaInicio: z.string().optional(),
    fechaFin: z.string().optional(),
    esRangoFechas: z.boolean().default(false),
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
  })
  .refine(
    (data) => {
      if (data.esRangoFechas) {
        return data.fechaInicio && data.fechaFin;
      }
      return data.fecha;
    },
    {
      message: "Debe proporcionar una fecha o un rango de fechas válido",
      path: ["fecha"],
    }
  )
  .refine(
    (data) => {
      if (data.esRangoFechas && data.fechaInicio && data.fechaFin) {
        return new Date(data.fechaFin) >= new Date(data.fechaInicio);
      }
      return true;
    },
    {
      message:
        "La fecha de fin debe ser posterior o igual a la fecha de inicio",
      path: ["fechaFin"],
    }
  );

export type ActividadFormData = z.infer<typeof actividadSchema>;
