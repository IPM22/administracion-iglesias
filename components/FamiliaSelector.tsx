"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, X, HomeIcon } from "lucide-react";

interface Familia {
  id: number;
  apellido: string;
  nombre?: string;
  estado: string;
}

interface FamiliaSelectorProps {
  familias: Familia[];
  onSeleccionar: (familia: Familia | null) => void;
  familiaSeleccionada?: Familia | null;
  placeholder?: string;
  disabled?: boolean;
}

export default function FamiliaSelector({
  familias,
  onSeleccionar,
  familiaSeleccionada,
  placeholder = "Buscar y seleccionar familia...",
  disabled = false,
}: FamiliaSelectorProps) {
  const [busqueda, setBusqueda] = useState("");
  const [mostrarLista, setMostrarLista] = useState(false);
  const [familiasFiltradas, setFamiliasFiltradas] = useState<Familia[]>([]);

  useEffect(() => {
    if (!busqueda.trim()) {
      setFamiliasFiltradas(familias.slice(0, 10)); // Mostrar solo las primeras 10 si no hay búsqueda
    } else {
      const filtradas = familias.filter(
        (familia) =>
          familia.apellido.toLowerCase().includes(busqueda.toLowerCase()) ||
          (familia.nombre &&
            familia.nombre.toLowerCase().includes(busqueda.toLowerCase()))
      );
      setFamiliasFiltradas(filtradas);
    }
  }, [busqueda, familias]);

  const seleccionarFamilia = (familia: Familia) => {
    onSeleccionar(familia);
    setBusqueda("");
    setMostrarLista(false);
  };

  const limpiarSeleccion = () => {
    onSeleccionar(null);
    setBusqueda("");
    setMostrarLista(false);
  };

  return (
    <div className="relative">
      {/* Campo de búsqueda o familia seleccionada */}
      {familiaSeleccionada ? (
        <Card className="border-2 border-primary/20">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <HomeIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">
                    {familiaSeleccionada.nombre ||
                      `Familia ${familiaSeleccionada.apellido}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {familiaSeleccionada.estado}
                  </p>
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
                {familiasFiltradas.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {busqueda ? (
                      <>
                        <HomeIcon className="h-8 w-8 mx-auto mb-2" />
                        <p>No se encontraron familias</p>
                        <p className="text-xs">
                          Intenta con otro término de búsqueda
                        </p>
                      </>
                    ) : (
                      <>
                        <HomeIcon className="h-8 w-8 mx-auto mb-2" />
                        <p>Escribe para buscar familias</p>
                        <p className="text-xs">
                          Busca por apellido o nombre de familia
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="py-1">
                    {!busqueda && familias.length > 10 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/50">
                        Mostrando las primeras 10 familias. Escribe para buscar
                        específicamente.
                      </div>
                    )}
                    {familiasFiltradas.map((familia) => (
                      <button
                        key={familia.id}
                        type="button"
                        className="w-full px-3 py-3 text-left hover:bg-muted transition-colors border-b border-border/50 last:border-b-0"
                        onClick={() => seleccionarFamilia(familia)}
                        disabled={disabled}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <HomeIcon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {familia.nombre || `Familia ${familia.apellido}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {familia.estado}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                    {busqueda && familiasFiltradas.length > 0 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/50">
                        {familiasFiltradas.length} resultado(s) encontrado(s)
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
