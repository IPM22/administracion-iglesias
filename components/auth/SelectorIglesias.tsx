"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Church, Users, Crown } from "lucide-react";

interface IglesiaCompleta {
  id: number;
  rol: string;
  estado: string;
  iglesia: {
    id: number;
    nombre: string;
    logoUrl?: string;
  };
}

interface IglesiaActiva {
  id: number;
  nombre: string;
  logoUrl?: string;
  rol: string;
  estado: string;
}

interface SelectorIglesiasProps {
  iglesias: IglesiaCompleta[];
  onSeleccionarIglesia: (iglesia: IglesiaActiva) => void;
  usuario: {
    nombres: string;
    apellidos: string;
  };
}

export function SelectorIglesias({
  iglesias,
  onSeleccionarIglesia,
  usuario,
}: SelectorIglesiasProps) {
  const iglesiasActivas = iglesias.filter((ui) => ui.estado === "ACTIVO");

  const obtenerColorRol = (rol: string) => {
    switch (rol) {
      case "ADMIN":
        return "bg-red-100 text-red-700";
      case "PASTOR":
        return "bg-purple-100 text-purple-700";
      case "LIDER":
        return "bg-blue-100 text-blue-700";
      case "SECRETARIO":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const obtenerIconoRol = (rol: string) => {
    switch (rol) {
      case "ADMIN":
      case "PASTOR":
        return <Crown className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const handleSeleccionar = (iglesiaCompleta: IglesiaCompleta) => {
    const iglesiaActiva: IglesiaActiva = {
      id: iglesiaCompleta.iglesia.id,
      nombre: iglesiaCompleta.iglesia.nombre,
      logoUrl: iglesiaCompleta.iglesia.logoUrl,
      rol: iglesiaCompleta.rol,
      estado: iglesiaCompleta.estado,
    };
    onSeleccionarIglesia(iglesiaActiva);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Church className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">
            ¡Bienvenido, {usuario.nombres}!
          </CardTitle>
          <p className="text-muted-foreground">
            Tienes acceso a múltiples iglesias. Selecciona con cuál deseas
            trabajar:
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {iglesiasActivas.map((iglesiaCompleta) => (
            <Card
              key={iglesiaCompleta.iglesia.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors border-2 hover:border-blue-300"
              onClick={() => handleSeleccionar(iglesiaCompleta)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {iglesiaCompleta.iglesia.logoUrl ? (
                      <img
                        src={iglesiaCompleta.iglesia.logoUrl}
                        alt={`Logo de ${iglesiaCompleta.iglesia.nombre}`}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Church className="h-6 w-6 text-blue-600" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-lg">
                        {iglesiaCompleta.iglesia.nombre}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          className={`${obtenerColorRol(
                            iglesiaCompleta.rol
                          )} flex items-center gap-1`}
                          variant="outline"
                        >
                          {obtenerIconoRol(iglesiaCompleta.rol)}
                          {iglesiaCompleta.rol}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button>Seleccionar</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
