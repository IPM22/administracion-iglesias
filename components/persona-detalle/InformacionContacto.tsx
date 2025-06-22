import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin } from "lucide-react";

interface InformacionContactoProps {
  persona: {
    correo?: string;
    telefono?: string;
    celular?: string;
    direccion?: string;
  };
  formatPhoneForDisplay?: (phone: string | null | undefined) => string;
}

export function InformacionContacto({
  persona,
  formatPhoneForDisplay,
}: InformacionContactoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Información de Contacto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {persona.correo && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Correo Electrónico
              </label>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {persona.correo}
              </p>
            </div>
          )}
          {persona.telefono && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Teléfono
              </label>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {formatPhoneForDisplay
                  ? formatPhoneForDisplay(persona.telefono)
                  : persona.telefono}
              </p>
            </div>
          )}
          {persona.celular && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Celular
              </label>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {formatPhoneForDisplay
                  ? formatPhoneForDisplay(persona.celular)
                  : persona.celular}
              </p>
            </div>
          )}
          {persona.direccion && (
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-muted-foreground">
                Dirección
              </label>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {persona.direccion}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
