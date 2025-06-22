import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Briefcase } from "lucide-react";

interface InformacionPersonalProps {
  persona: {
    nombres: string;
    apellidos: string;
    sexo?: string;
    estadoCivil?: string;
    ocupacion?: string;
    fechaNacimiento?: string;
  };
  calcularEdad?: (fecha: string) => number;
  formatDate?: (fecha: string) => string;
}

export function InformacionPersonal({
  persona,
  calcularEdad,
  formatDate,
}: InformacionPersonalProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Información Personal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Nombres
            </label>
            <p className="text-lg font-medium">{persona.nombres}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Apellidos
            </label>
            <p className="text-lg font-medium">{persona.apellidos}</p>
          </div>
          {persona.fechaNacimiento && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Fecha de Nacimiento
              </label>
              <p>
                {formatDate
                  ? formatDate(persona.fechaNacimiento)
                  : persona.fechaNacimiento}
                {calcularEdad && (
                  <span className="text-muted-foreground ml-2">
                    ({calcularEdad(persona.fechaNacimiento)} años)
                  </span>
                )}
              </p>
            </div>
          )}
          {persona.sexo && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Sexo
              </label>
              <p>{persona.sexo}</p>
            </div>
          )}
          {persona.estadoCivil && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Estado Civil
              </label>
              <p>{persona.estadoCivil}</p>
            </div>
          )}
          {persona.ocupacion && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Ocupación
              </label>
              <p className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                {persona.ocupacion}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
