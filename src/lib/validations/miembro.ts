import { z } from "zod";

export const miembroSchema = z.object({
  nombres: z.string().min(2, {
    message: "Los nombres deben tener al menos 2 caracteres.",
  }),
  apellidos: z.string().min(2, {
    message: "Los apellidos deben tener al menos 2 caracteres.",
  }),
  email: z.string().email({
    message: "Por favor ingrese un email válido.",
  }),
  telefono: z.string().nullable().optional(),
  celular: z.string().nullable().optional(),
  direccion: z.string().nullable().optional(),
  fechaNacimiento: z.date({
    required_error: "La fecha de nacimiento es requerida.",
  }),
  genero: z.enum(["Masculino", "Femenino", "Otro"], {
    required_error: "Por favor seleccione un género.",
  }),
  estadoCivil: z.enum(["Soltero/a", "Casado/a", "Viudo/a", "Divorciado/a"], {
    required_error: "Por favor seleccione un estado civil.",
  }),
  ocupacion: z.string().nullable().optional(),
  familia: z.string().nullable().optional(),
  fechaIngreso: z.date({
    required_error: "La fecha de ingreso es requerida.",
  }),
  fechaBautismo: z.date().nullable().optional(),
  estado: z.enum(["Activo", "Inactivo"], {
    required_error: "Por favor seleccione un estado.",
  }),
  notasAdicionales: z.string().nullable().optional(),
});

export type MiembroFormValues = z.infer<typeof miembroSchema>;
