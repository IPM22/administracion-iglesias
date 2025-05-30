"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, X, Users } from "lucide-react";

interface Ministerio {
  id: number;
  nombre: string;
  descripcion?: string;
}

interface MinisterioSelectorProps {
  ministerios: Ministerio[];
  onSeleccionar: (ministerio: Ministerio | null) => void;
  ministerioSeleccionado?: Ministerio | null;
  placeholder?: string;
  disabled?: boolean;
}

export default function MinisterioSelector({
  ministerios,
  onSeleccionar,
  ministerioSeleccionado,
  placeholder = "Buscar y seleccionar ministerio...",
  disabled = false,
}: MinisterioSelectorProps) {
  const [busqueda, setBusqueda] = useState("");
  const [mostrarLista, setMostrarLista] = useState(false);
  const [ministeriosFiltrados, setMinisteriosFiltrados] = useState<
    Ministerio[]
  >([]);

  useEffect(() => {
    if (!busqueda.trim()) {
      setMinisteriosFiltrados(ministerios.slice(0, 10)); // Mostrar solo los primeros 10 si no hay búsqueda
    } else {
      const filtrados = ministerios.filter(
        (ministerio) =>
          ministerio.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          (ministerio.descripcion &&
            ministerio.descripcion
              .toLowerCase()
              .includes(busqueda.toLowerCase()))
      );
      setMinisteriosFiltrados(filtrados);
    }
  }, [busqueda, ministerios]);

  const seleccionarMinisterio = (ministerio: Ministerio) => {
    onSeleccionar(ministerio);
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
      {/* Campo de búsqueda o ministerio seleccionado */}
      {ministerioSeleccionado ? (
        <Card className="border-2 border-primary/20">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{ministerioSeleccionado.nombre}</p>
                  {ministerioSeleccionado.descripcion && (
                    <p className="text-xs text-muted-foreground">
                      {ministerioSeleccionado.descripcion}
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
                {ministeriosFiltrados.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {busqueda ? (
                      <>
                        <Users className="h-8 w-8 mx-auto mb-2" />
                        <p>No se encontraron ministerios</p>
                        <p className="text-xs">
                          Intenta con otro término de búsqueda
                        </p>
                      </>
                    ) : (
                      <>
                        <Users className="h-8 w-8 mx-auto mb-2" />
                        <p>Escribe para buscar ministerios</p>
                        <p className="text-xs">
                          Busca por nombre o descripción
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="py-1">
                    {!busqueda && ministerios.length > 10 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/50">
                        Mostrando los primeros 10 ministerios. Escribe para
                        buscar específicamente.
                      </div>
                    )}
                    <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/50 border-b">
                      <button
                        type="button"
                        className="w-full text-left hover:bg-muted transition-colors py-2"
                        onClick={() => {
                          onSeleccionar(null);
                          setBusqueda("");
                          setMostrarLista(false);
                        }}
                        disabled={disabled}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-6 w-6 bg-muted rounded-full flex items-center justify-center">
                            <X className="h-3 w-3" />
                          </div>
                          <span className="text-sm">
                            Sin ministerio asignado
                          </span>
                        </div>
                      </button>
                    </div>
                    {ministeriosFiltrados.map((ministerio) => (
                      <button
                        key={ministerio.id}
                        type="button"
                        className="w-full px-3 py-3 text-left hover:bg-muted transition-colors border-b border-border/50 last:border-b-0"
                        onClick={() => seleccionarMinisterio(ministerio)}
                        disabled={disabled}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {ministerio.nombre}
                            </p>
                            {ministerio.descripcion && (
                              <p className="text-xs text-muted-foreground truncate">
                                {ministerio.descripcion}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                    {busqueda && ministeriosFiltrados.length > 0 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/50">
                        {ministeriosFiltrados.length} resultado(s) encontrado(s)
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
