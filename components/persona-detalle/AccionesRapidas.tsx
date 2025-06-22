import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Heart, UserPlus, Edit, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

interface AccionesRapidasProps {
  persona: {
    id: number;
    rol: "MIEMBRO" | "VISITA" | "INVITADO";
  };
  miembroConvertido?: boolean;
}

interface Accion {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  disabled?: boolean;
}

export function AccionesRapidas({
  persona,
  miembroConvertido,
}: AccionesRapidasProps) {
  const router = useRouter();

  const accionesMiembro: Accion[] = [
    {
      label: "Asignar Ministerio",
      icon: Users,
      action: () => router.push(`/miembros/${persona.id}/ministerios/nuevo`),
    },
    {
      label: "Agregar Familiar",
      icon: Heart,
      action: () => router.push(`/miembros/${persona.id}/familia/agregar`),
    },
    {
      label: "Registrar Visita",
      icon: UserPlus,
      action: () => router.push(`/visitas/nueva?invitadoPor=${persona.id}`),
    },
    {
      label: "Editar Información",
      icon: Edit,
      action: () => router.push(`/miembros/${persona.id}/editar`),
    },
  ];

  const accionesVisita: Accion[] = [
    {
      label: "Registrar Nueva Visita",
      icon: Calendar,
      action: () => router.push(`/visitas/${persona.id}/historial/nueva`),
    },
    {
      label: miembroConvertido ? "Ya es miembro" : "Convertir a Miembro",
      icon: UserPlus,
      action: () => {
        if (!miembroConvertido) {
          router.push(`/visitas/${persona.id}/convertir`);
        }
      },
      disabled: miembroConvertido,
    },
    {
      label: "Editar Información",
      icon: Edit,
      action: () => router.push(`/visitas/${persona.id}/editar`),
    },
  ];

  const acciones = persona.rol === "MIEMBRO" ? accionesMiembro : accionesVisita;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acciones Rápidas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {acciones.map((accion, index) => (
          <Button
            key={index}
            variant="outline"
            className="w-full justify-start"
            onClick={accion.action}
            disabled={accion.disabled}
          >
            <accion.icon className="mr-2 h-4 w-4" />
            {accion.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
