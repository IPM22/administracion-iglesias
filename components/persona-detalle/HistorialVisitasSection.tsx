import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDateShort, formatTime12Hour } from "@/lib/date-utils";

interface HistorialVisita {
  id: number;
  fecha: string;
  tipoActividad?: {
    id: number;
    nombre: string;
    tipo: string;
  };
  actividad?: {
    id: number;
    nombre: string;
  };
  horario?: {
    id: number;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    notas?: string;
  };
  invitadoPor?: {
    id: number;
    nombres: string;
    apellidos: string;
  };
  observaciones?: string;
}

interface HistorialVisitasSectionProps {
  historialVisitas: HistorialVisita[];
  personaId: number;
  limite?: number;
}

export function HistorialVisitasSection({
  historialVisitas,
  personaId,
  limite = 5,
}: HistorialVisitasSectionProps) {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Historial de Visitas Reciente
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/visitas/${personaId}/historial`)}
          >
            Ver Todo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {historialVisitas.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No hay registros de visitas
          </p>
        ) : (
          <div className="space-y-3">
            {historialVisitas.slice(0, limite).map((historial) => (
              <div
                key={historial.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div>
                  <p className="font-medium">
                    {historial.actividad?.nombre ||
                      historial.tipoActividad?.nombre ||
                      "Actividad no especificada"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateShort(historial.fecha)}
                    {historial.horario && (
                      <span className="ml-2">
                        • {formatTime12Hour(historial.horario.horaInicio)} -{" "}
                        {formatTime12Hour(historial.horario.horaFin)}
                      </span>
                    )}
                  </p>
                  {historial.invitadoPor && (
                    <p className="text-xs text-muted-foreground">
                      Invitado por: {historial.invitadoPor.nombres}{" "}
                      {historial.invitadoPor.apellidos}
                    </p>
                  )}
                  {historial.observaciones && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {historial.observaciones}
                    </p>
                  )}
                </div>
                <Badge variant="outline">
                  {historial.actividad
                    ? "Actividad Específica"
                    : historial.tipoActividad?.tipo || "Regular"}
                </Badge>
              </div>
            ))}
            {historialVisitas.length > limite && (
              <div className="text-center pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/visitas/${personaId}/historial`)}
                  className="text-muted-foreground hover:text-primary"
                >
                  Ver {historialVisitas.length - limite} visita
                  {historialVisitas.length - limite !== 1 ? "s" : ""} más
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
