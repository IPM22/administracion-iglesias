"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormDescription, FormItem, FormLabel } from "@/components/ui/form";
import { Trash2, Plus, Clock } from "lucide-react";
import { formatDate, formatDateForInput } from "@/lib/date-utils";
import dayjs from "dayjs";

interface Horario {
  id?: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  notas?: string;
}

interface HorariosSelectorProps {
  horarios: Horario[];
  onHorariosChange: (horarios: Horario[]) => void;
  fechaInicio?: string;
  fechaFin?: string;
  esRangoFechas: boolean;
}

export function HorariosSelector({
  horarios,
  onHorariosChange,
  fechaInicio,
  fechaFin,
  esRangoFechas,
}: HorariosSelectorProps) {
  const agregarHorario = () => {
    const nuevoHorario: Horario = {
      fecha: fechaInicio || formatDateForInput(new Date().toISOString()),
      horaInicio: "",
      horaFin: "",
      notas: "",
    };
    onHorariosChange([...horarios, nuevoHorario]);
  };

  const actualizarHorario = (
    index: number,
    campo: keyof Horario,
    valor: string
  ) => {
    const nuevosHorarios = [...horarios];
    nuevosHorarios[index] = {
      ...nuevosHorarios[index],
      [campo]: valor,
    };
    onHorariosChange(nuevosHorarios);
  };

  const eliminarHorario = (index: number) => {
    const nuevosHorarios = horarios.filter((_, i) => i !== index);
    onHorariosChange(nuevosHorarios);
  };

  const formatearFecha = (fecha: string) => {
    return formatDate(fecha, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const validarFecha = (fecha: string) => {
    if (!esRangoFechas) return true;
    if (!fechaInicio || !fechaFin) return true;

    const fechaSeleccionada = dayjs(fecha);
    const inicio = dayjs(fechaInicio);
    const fin = dayjs(fechaFin);

    return (
      (fechaSeleccionada.isAfter(inicio) ||
        fechaSeleccionada.isSame(inicio, "day")) &&
      (fechaSeleccionada.isBefore(fin) || fechaSeleccionada.isSame(fin, "day"))
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Horarios de la Actividad
        </CardTitle>
        <FormDescription>
          {esRangoFechas
            ? "Agrega múltiples horarios para los días de la actividad"
            : "Agrega horarios adicionales para el día de la actividad"}
        </FormDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {horarios.map((horario, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Horario {index + 1}</h4>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => eliminarHorario(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <FormItem>
                <FormLabel>Fecha</FormLabel>
                <Input
                  type="date"
                  value={horario.fecha}
                  onChange={(e) =>
                    actualizarHorario(index, "fecha", e.target.value)
                  }
                  className={
                    !validarFecha(horario.fecha) ? "border-red-500" : ""
                  }
                />
                {horario.fecha && (
                  <FormDescription className="text-xs">
                    {formatearFecha(horario.fecha)}
                  </FormDescription>
                )}
                {!validarFecha(horario.fecha) && (
                  <FormDescription className="text-red-500 text-xs">
                    La fecha debe estar dentro del rango de la actividad
                  </FormDescription>
                )}
              </FormItem>

              <FormItem>
                <FormLabel>Notas (opcional)</FormLabel>
                <Input
                  placeholder="Ej: Día especial, actividad extra..."
                  value={horario.notas || ""}
                  onChange={(e) =>
                    actualizarHorario(index, "notas", e.target.value)
                  }
                />
              </FormItem>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <FormItem>
                <FormLabel>Hora de Inicio</FormLabel>
                <Input
                  type="time"
                  value={horario.horaInicio}
                  onChange={(e) =>
                    actualizarHorario(index, "horaInicio", e.target.value)
                  }
                />
              </FormItem>

              <FormItem>
                <FormLabel>Hora de Fin</FormLabel>
                <Input
                  type="time"
                  value={horario.horaFin}
                  onChange={(e) =>
                    actualizarHorario(index, "horaFin", e.target.value)
                  }
                />
              </FormItem>
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={agregarHorario}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Horario
        </Button>

        {horarios.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay horarios configurados</p>
            <p className="text-sm">
              Haz clic en &quot;Agregar Horario&quot; para comenzar
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
