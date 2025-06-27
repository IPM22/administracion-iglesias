"use client";

import { Calendar, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormDescription, FormItem, FormLabel } from "@/components/ui/form";
import { formatDate } from "@/lib/date-utils";
import dayjs from "dayjs";

interface DiasActividadSelectorProps {
  fechaInicio: string;
  fechaFin: string;
  fechasSeleccionadas: string[];
  onFechasChange: (fechas: string[]) => void;
  nombreActividad: string;
}

export function DiasActividadSelector({
  fechaInicio,
  fechaFin,
  fechasSeleccionadas,
  onFechasChange,
  nombreActividad,
}: DiasActividadSelectorProps) {
  // Generar array de fechas entre inicio y fin
  const generarFechas = () => {
    const fechas: Date[] = [];
    const inicio = dayjs(fechaInicio);
    const fin = dayjs(fechaFin);

    for (
      let fecha = inicio;
      fecha.diff(fin, "day") <= 0;
      fecha = fecha.add(1, "day")
    ) {
      fechas.push(fecha.toDate());
    }

    return fechas;
  };

  const fechasDisponibles = generarFechas();

  const formatearFecha = (fecha: Date) => {
    return formatDate(fecha, {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const formatearFechaISO = (fecha: Date) => {
    return dayjs(fecha).format("YYYY-MM-DD");
  };

  const manejarCambioFecha = (fechaISO: string, checked: boolean) => {
    if (checked) {
      onFechasChange([...fechasSeleccionadas, fechaISO]);
    } else {
      onFechasChange(fechasSeleccionadas.filter((f) => f !== fechaISO));
    }
  };

  const seleccionarTodos = () => {
    const todasLasFechas = fechasDisponibles.map(formatearFechaISO);
    onFechasChange(todasLasFechas);
  };

  const limpiarSeleccion = () => {
    onFechasChange([]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Días de Asistencia - {nombreActividad}
        </CardTitle>
        <FormDescription>
          Selecciona los días específicos en los que la persona asistió a esta
          actividad
        </FormDescription>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={seleccionarTodos}
            disabled={fechasSeleccionadas.length === fechasDisponibles.length}
          >
            <Check className="h-4 w-4 mr-2" />
            Seleccionar todos
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={limpiarSeleccion}
            disabled={fechasSeleccionadas.length === 0}
          >
            Limpiar selección
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          {fechasDisponibles.map((fecha) => {
            const fechaISO = formatearFechaISO(fecha);
            const estaSeleccionada = fechasSeleccionadas.includes(fechaISO);

            return (
              <FormItem
                key={fechaISO}
                className="flex flex-row items-start space-x-3 space-y-0"
              >
                <Input
                  type="checkbox"
                  checked={estaSeleccionada}
                  onChange={(e) =>
                    manejarCambioFecha(fechaISO, e.target.checked)
                  }
                  className="w-4 h-4 mt-1"
                />
                <div className="grid gap-1.5 leading-none">
                  <FormLabel className="text-sm font-normal cursor-pointer">
                    {formatearFecha(fecha)}
                  </FormLabel>
                  <FormDescription className="text-xs">
                    {fecha.toLocaleDateString("es-ES")}
                  </FormDescription>
                </div>
              </FormItem>
            );
          })}
        </div>

        {fechasSeleccionadas.length > 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-1">
              Días seleccionados: {fechasSeleccionadas.length}
            </p>
            <p className="text-xs text-muted-foreground">
              Se registrará asistencia para{" "}
              {fechasSeleccionadas.length === 1 ? "este día" : "estos días"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
