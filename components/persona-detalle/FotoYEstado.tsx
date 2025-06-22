import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MiembroAvatar } from "../MiembroAvatar";

interface FotoYEstadoProps {
  persona: {
    foto?: string;
    nombres: string;
    apellidos: string;
    estado?: string;
    rol: "MIEMBRO" | "VISITA" | "INVITADO";
  };
  getBadgeVariant?: (
    estado?: string
  ) => "default" | "destructive" | "outline" | "secondary";
  getRolColor?: (rol: string) => string;
}

export function FotoYEstado({
  persona,
  getBadgeVariant,
  getRolColor,
}: FotoYEstadoProps) {
  const nombreCompleto = `${persona.nombres} ${persona.apellidos}`;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <MiembroAvatar
            foto={persona.foto}
            nombre={nombreCompleto}
            size="xl"
            className="mx-auto"
          />
          <div>
            <h2 className="text-xl font-bold">{nombreCompleto}</h2>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge
                className={
                  getRolColor
                    ? getRolColor(persona.rol)
                    : "bg-blue-100 text-blue-800"
                }
              >
                {persona.rol === "MIEMBRO"
                  ? "Miembro"
                  : persona.rol === "VISITA"
                  ? "Visita"
                  : "Invitado"}
              </Badge>
              {persona.estado && (
                <Badge
                  variant={
                    getBadgeVariant
                      ? getBadgeVariant(persona.estado)
                      : "default"
                  }
                >
                  {persona.estado}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
