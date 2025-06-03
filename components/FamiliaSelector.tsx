"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, HomeIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Familia {
  id: number;
  apellido: string;
  nombre?: string;
  estado: string;
  jefeFamilia?: {
    id: number;
    nombres: string;
    apellidos: string;
    foto?: string;
  };
}

interface FamiliaSelectorProps {
  familias: Familia[];
  onSeleccionar: (familia: Familia | null) => void;
  familiaSeleccionada: Familia | null;
  placeholder?: string;
  disabled?: boolean;
}

export default function FamiliaSelector({
  familias,
  onSeleccionar,
  familiaSeleccionada,
  placeholder = "Seleccionar familia...",
  disabled = false,
}: FamiliaSelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {familiaSeleccionada ? (
            <div className="flex items-center gap-2">
              <HomeIcon className="h-4 w-4" />
              {familiaSeleccionada.nombre ||
                `Familia ${familiaSeleccionada.apellido}`}
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar familia..." />
          <CommandEmpty>No se encontraron familias.</CommandEmpty>
          <CommandGroup>
            {familias.map((familia) => (
              <CommandItem
                key={familia.id}
                value={`${familia.apellido} ${familia.nombre || ""}`}
                onSelect={() => {
                  onSeleccionar(
                    familia.id === familiaSeleccionada?.id ? null : familia
                  );
                  setOpen(false);
                }}
                className="flex items-center gap-2"
              >
                <HomeIcon className="h-4 w-4" />
                <div className="flex-1">
                  <div className="font-medium">
                    {familia.nombre || `Familia ${familia.apellido}`}
                  </div>
                  {familia.jefeFamilia && (
                    <div className="text-sm text-muted-foreground">
                      Cabeza: {familia.jefeFamilia.nombres}{" "}
                      {familia.jefeFamilia.apellidos}
                    </div>
                  )}
                </div>
                <Check
                  className={cn(
                    "ml-auto h-4 w-4",
                    familiaSeleccionada?.id === familia.id
                      ? "opacity-100"
                      : "opacity-0"
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
