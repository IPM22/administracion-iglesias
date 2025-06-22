"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, X, User, UserCheck, Users } from "lucide-react";

interface Persona {
  id: number;
  nombres: string;
  apellidos: string;
  foto?: string;
  correo?: string;
  telefono?: string;
  celular?: string;
  estado: string;
  tipo: "miembro" | "visita" | "nino"; // Distinguir entre miembro bautizado, visita y niño
  fechaBautismo?: string; // Para mostrar si está bautizado
}

interface PersonaSelectorProps {
  personas: Persona[];
  onSeleccionar: (persona: Persona) => void;
  personaSeleccionada?: Persona | null;
  placeholder?: string;
  disabled?: boolean;
  mostrarTipo?: boolean; // Si mostrar el tipo (miembro/visita)
}

export default function PersonaSelector({
  personas,
  onSeleccionar,
  personaSeleccionada,
  placeholder = "Buscar miembro o visita...",
  disabled = false,
  mostrarTipo = true,
}: PersonaSelectorProps) {
  const [busqueda, setBusqueda] = useState("");
  const [mostrarLista, setMostrarLista] = useState(false);
  const [personasFiltradas, setPersonasFiltradas] = useState<Persona[]>([]);

  useEffect(() => {
    if (!busqueda.trim()) {
      setPersonasFiltradas(personas.slice(0, 10)); // Mostrar solo los primeros 10 si no hay búsqueda
    } else {
      const filtradas = personas.filter(
        (persona) =>
          persona.nombres.toLowerCase().includes(busqueda.toLowerCase()) ||
          persona.apellidos.toLowerCase().includes(busqueda.toLowerCase()) ||
          (persona.correo &&
            persona.correo.toLowerCase().includes(busqueda.toLowerCase()))
      );
      setPersonasFiltradas(filtradas);
    }
  }, [busqueda, personas]);

  const seleccionarPersona = (persona: Persona) => {
    onSeleccionar(persona);
    setBusqueda("");
    setMostrarLista(false);
  };

  const limpiarSeleccion = () => {
    onSeleccionar(null!);
    setBusqueda("");
    setMostrarLista(false);
  };

  const obtenerIconoTipo = (tipo: string) => {
    switch (tipo) {
      case "miembro":
        return <UserCheck className="h-3 w-3" />;
      case "visita":
        return <Users className="h-3 w-3" />;
      case "nino":
        return <User className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const obtenerColorTipo = (tipo: string) => {
    switch (tipo) {
      case "miembro":
        return "default";
      case "visita":
        return "secondary";
      case "nino":
        return "outline";
      default:
        return "outline";
    }
  };

  const obtenerTextoTipo = (tipo: string) => {
    switch (tipo) {
      case "miembro":
        return "Miembro";
      case "visita":
        return "Visita";
      case "nino":
        return "Niño";
      default:
        return "Persona";
    }
  };

  return (
    <div className="relative">
      {/* Campo de búsqueda o persona seleccionada */}
      {personaSeleccionada ? (
        <Card className="border-2 border-primary/20">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={personaSeleccionada.foto || "/placeholder.svg"}
                  />
                  <AvatarFallback>
                    {`${personaSeleccionada.nombres[0]}${personaSeleccionada.apellidos[0]}`}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {personaSeleccionada.nombres}{" "}
                      {personaSeleccionada.apellidos}
                    </p>
                    {mostrarTipo && (
                      <Badge
                        variant={obtenerColorTipo(personaSeleccionada.tipo)}
                        className="text-xs flex items-center gap-1"
                      >
                        {obtenerIconoTipo(personaSeleccionada.tipo)}
                        {obtenerTextoTipo(personaSeleccionada.tipo)}
                      </Badge>
                    )}
                  </div>
                  {personaSeleccionada.correo && (
                    <p className="text-xs text-muted-foreground">
                      {personaSeleccionada.correo}
                    </p>
                  )}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={limpiarSeleccion}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={placeholder}
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setMostrarLista(true);
              }}
              onFocus={() => setMostrarLista(true)}
              className="pl-10"
              disabled={disabled}
            />
          </div>

          {/* Lista de resultados */}
          {mostrarLista && (
            <Card className="absolute z-50 w-full mt-1 max-h-72 overflow-y-auto">
              <CardContent className="p-0">
                {personasFiltradas.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {busqueda ? (
                      <>
                        <User className="h-8 w-8 mx-auto mb-2" />
                        <p>No se encontraron personas</p>
                        <p className="text-xs">
                          Intenta con otro término de búsqueda
                        </p>
                      </>
                    ) : (
                      <>
                        <User className="h-8 w-8 mx-auto mb-2" />
                        <p>Escribe para buscar personas</p>
                        <p className="text-xs">
                          Busca miembros y visitas por nombre, apellido o correo
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="py-1">
                    {!busqueda && personas.length > 10 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/50">
                        Mostrando las primeras 10 personas. Escribe para buscar
                        específicamente.
                      </div>
                    )}
                    {personasFiltradas.map((persona) => (
                      <button
                        key={`${persona.tipo}-${persona.id}`}
                        type="button"
                        className="w-full px-3 py-3 text-left hover:bg-muted transition-colors border-b border-border/50 last:border-b-0"
                        onClick={() => seleccionarPersona(persona)}
                        disabled={disabled}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={persona.foto || "/placeholder.svg"}
                            />
                            <AvatarFallback className="text-xs">
                              {`${persona.nombres[0]}${persona.apellidos[0]}`}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium truncate">
                                {persona.nombres} {persona.apellidos}
                              </p>
                              {mostrarTipo && (
                                <Badge
                                  variant={obtenerColorTipo(persona.tipo)}
                                  className="text-xs flex items-center gap-1"
                                >
                                  {obtenerIconoTipo(persona.tipo)}
                                  {obtenerTextoTipo(persona.tipo)}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {persona.correo && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {persona.correo}
                                </p>
                              )}
                              <Badge
                                variant={
                                  persona.estado === "Activo" ||
                                  persona.estado === "Activa"
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {persona.estado}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                    {busqueda && personasFiltradas.length > 0 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/50">
                        {
                          personasFiltradas.filter((p) => p.tipo === "miembro")
                            .length
                        }{" "}
                        miembro(s),{" "}
                        {
                          personasFiltradas.filter((p) => p.tipo === "visita")
                            .length
                        }{" "}
                        visita(s) encontrada(s)
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Manejador de clics fuera del componente */}
      {mostrarLista && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setMostrarLista(false)}
        />
      )}
    </div>
  );
}
