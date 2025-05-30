"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, X, User } from "lucide-react";

interface Miembro {
  id: number;
  nombres: string;
  apellidos: string;
  foto?: string;
  correo?: string;
  telefono?: string;
  celular?: string;
  estado: string;
}

interface MiembroSelectorProps {
  miembros: Miembro[];
  onSeleccionar: (miembro: Miembro) => void;
  miembroSeleccionado?: Miembro | null;
  placeholder?: string;
  disabled?: boolean;
}

export default function MiembroSelector({
  miembros,
  onSeleccionar,
  miembroSeleccionado,
  placeholder = "Buscar y seleccionar miembro...",
  disabled = false,
}: MiembroSelectorProps) {
  const [busqueda, setBusqueda] = useState("");
  const [mostrarLista, setMostrarLista] = useState(false);
  const [miembrosFiltrados, setMiembrosFiltrados] = useState<Miembro[]>([]);

  useEffect(() => {
    if (!busqueda.trim()) {
      setMiembrosFiltrados(miembros.slice(0, 10)); // Mostrar solo los primeros 10 si no hay búsqueda
    } else {
      const filtrados = miembros.filter(
        (miembro) =>
          miembro.nombres.toLowerCase().includes(busqueda.toLowerCase()) ||
          miembro.apellidos.toLowerCase().includes(busqueda.toLowerCase()) ||
          (miembro.correo &&
            miembro.correo.toLowerCase().includes(busqueda.toLowerCase()))
      );
      setMiembrosFiltrados(filtrados);
    }
  }, [busqueda, miembros]);

  const seleccionarMiembro = (miembro: Miembro) => {
    onSeleccionar(miembro);
    setBusqueda("");
    setMostrarLista(false);
  };

  const limpiarSeleccion = () => {
    onSeleccionar(null!);
    setBusqueda("");
    setMostrarLista(false);
  };

  return (
    <div className="relative">
      {/* Campo de búsqueda o miembro seleccionado */}
      {miembroSeleccionado ? (
        <Card className="border-2 border-primary/20">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={miembroSeleccionado.foto || "/placeholder.svg"}
                  />
                  <AvatarFallback>
                    {`${miembroSeleccionado.nombres[0]}${miembroSeleccionado.apellidos[0]}`}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {miembroSeleccionado.nombres}{" "}
                    {miembroSeleccionado.apellidos}
                  </p>
                  {miembroSeleccionado.correo && (
                    <p className="text-xs text-muted-foreground">
                      {miembroSeleccionado.correo}
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
                {miembrosFiltrados.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {busqueda ? (
                      <>
                        <User className="h-8 w-8 mx-auto mb-2" />
                        <p>No se encontraron miembros</p>
                        <p className="text-xs">
                          Intenta con otro término de búsqueda
                        </p>
                      </>
                    ) : (
                      <>
                        <User className="h-8 w-8 mx-auto mb-2" />
                        <p>Escribe para buscar miembros</p>
                        <p className="text-xs">
                          Busca por nombre, apellido o correo
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="py-1">
                    {!busqueda && miembros.length > 10 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/50">
                        Mostrando los primeros 10 miembros. Escribe para buscar
                        específicamente.
                      </div>
                    )}
                    {miembrosFiltrados.map((miembro) => (
                      <button
                        key={miembro.id}
                        type="button"
                        className="w-full px-3 py-3 text-left hover:bg-muted transition-colors border-b border-border/50 last:border-b-0"
                        onClick={() => seleccionarMiembro(miembro)}
                        disabled={disabled}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={miembro.foto || "/placeholder.svg"}
                            />
                            <AvatarFallback className="text-xs">
                              {`${miembro.nombres[0]}${miembro.apellidos[0]}`}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {miembro.nombres} {miembro.apellidos}
                            </p>
                            <div className="flex items-center gap-2">
                              {miembro.correo && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {miembro.correo}
                                </p>
                              )}
                              <Badge
                                variant={
                                  miembro.estado === "Activo"
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {miembro.estado}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                    {busqueda && miembrosFiltrados.length > 0 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/50">
                        {miembrosFiltrados.length} resultado(s) encontrado(s)
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Overlay para cerrar la lista */}
      {mostrarLista && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setMostrarLista(false)}
        />
      )}
    </div>
  );
}
