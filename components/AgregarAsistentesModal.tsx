"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MiembroAvatar } from "@/components/MiembroAvatar";
import { PhoneInput } from "@/components/PhoneInput";
import { toast } from "sonner";
import {
  Check,
  Loader2,
  Search,
  UserPlus,
  Users,
  X,
  ArrowLeft,
} from "lucide-react";
import { formatActivityDate, formatTime12Hour } from "@/lib/date-utils";

interface HorarioActividad {
  id: number;
  fecha: string;
  horaInicio?: string;
  horaFin?: string;
  notas?: string;
}

interface PersonaBusqueda {
  id: number;
  nombres: string;
  apellidos: string;
  foto?: string | null;
  correo?: string | null;
  telefono?: string | null;
  celular?: string | null;
  rol: string;
  estado: string;
  _count?: { historialVisitas: number };
}

interface AsistenteRegistrado {
  id: number;
  horarioId?: number | null;
  persona: {
    id: number;
    nombres: string;
    apellidos: string;
    foto?: string | null;
  };
}

interface AgregarAsistentesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actividadId: number;
  actividadNombre: string;
  horarios?: HorarioActividad[];
  /** Asistentes ya registrados, para evitar duplicados en la búsqueda */
  asistentesActuales: AsistenteRegistrado[];
  /** Horario preseleccionado (por ejemplo, la pestaña activa) */
  horarioInicialId?: number | null;
  /** Se llama al cerrar si se agregó al menos un asistente */
  onAsistentesAgregados: () => void;
}

// Separa el texto escrito en nombres y apellidos para precargar el formulario
function separarNombre(texto: string) {
  const partes = texto.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return { nombres: "", apellidos: "" };
  if (partes.length === 1) return { nombres: partes[0], apellidos: "" };
  return {
    nombres: partes.slice(0, partes.length - 1).join(" "),
    apellidos: partes[partes.length - 1],
  };
}

const etiquetaRol: Record<string, string> = {
  MIEMBRO: "Miembro",
  VISITA: "Visita",
  INVITADO: "Invitado",
  NINO: "Niño",
};

export function AgregarAsistentesModal({
  open,
  onOpenChange,
  actividadId,
  actividadNombre,
  horarios = [],
  asistentesActuales,
  horarioInicialId = null,
  onAsistentesAgregados,
}: AgregarAsistentesModalProps) {
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<PersonaBusqueda[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [guardandoId, setGuardandoId] = useState<number | "nueva" | null>(null);
  const [horarioId, setHorarioId] = useState<string>(
    horarioInicialId ? String(horarioInicialId) : "general",
  );
  const [agregados, setAgregados] = useState<AsistenteRegistrado[]>([]);
  const [modoNueva, setModoNueva] = useState(false);
  const [nuevaVisita, setNuevaVisita] = useState({
    nombres: "",
    apellidos: "",
    celular: "",
    correo: "",
  });

  // Persona que invita (opcional). Se mantiene entre altas: normalmente varias
  // visitas llegan acompañadas por el mismo miembro.
  const [invitadoPor, setInvitadoPor] = useState<PersonaBusqueda | null>(null);
  const [busquedaInvita, setBusquedaInvita] = useState("");
  const [resultadosInvita, setResultadosInvita] = useState<PersonaBusqueda[]>(
    [],
  );
  const [buscandoInvita, setBuscandoInvita] = useState(false);

  const inputBusquedaRef = useRef<HTMLInputElement>(null);

  // IDs ya registrados en el horario seleccionado (los existentes + los de esta sesión)
  const horarioActualId = horarioId === "general" ? null : parseInt(horarioId);
  const idsRegistrados = new Set(
    [...asistentesActuales, ...agregados]
      .filter((a) => (a.horarioId ?? null) === horarioActualId)
      .map((a) => a.persona.id),
  );

  // Reiniciar el estado cada vez que se abre el modal
  useEffect(() => {
    if (open) {
      setBusqueda("");
      setResultados([]);
      setAgregados([]);
      setModoNueva(false);
      setNuevaVisita({ nombres: "", apellidos: "", celular: "", correo: "" });
      setInvitadoPor(null);
      setBusquedaInvita("");
      setResultadosInvita([]);
      setHorarioId(horarioInicialId ? String(horarioInicialId) : "general");
      setTimeout(() => inputBusquedaRef.current?.focus(), 100);
    }
  }, [open, horarioInicialId]);

  // Búsqueda con debounce
  useEffect(() => {
    const query = busqueda.trim();
    if (query.length < 2) {
      setResultados([]);
      setBuscando(false);
      return;
    }

    setBuscando(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/personas/buscar?q=${encodeURIComponent(query)}`,
        );
        setResultados(res.ok ? await res.json() : []);
      } catch {
        setResultados([]);
      } finally {
        setBuscando(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [busqueda]);

  // Búsqueda con debounce de la persona que invita
  useEffect(() => {
    const query = busquedaInvita.trim();
    if (invitadoPor || query.length < 2) {
      setResultadosInvita([]);
      setBuscandoInvita(false);
      return;
    }

    setBuscandoInvita(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/personas/buscar?q=${encodeURIComponent(query)}`,
        );
        setResultadosInvita(res.ok ? await res.json() : []);
      } catch {
        setResultadosInvita([]);
      } finally {
        setBuscandoInvita(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [busquedaInvita, invitadoPor]);

  const registrarAsistente = useCallback(
    async (
      payload: Record<string, unknown>,
      identificador: number | "nueva",
    ) => {
      setGuardandoId(identificador);
      try {
        const res = await fetch(`/api/actividades/${actividadId}/asistentes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            horarioId: horarioActualId,
            invitadoPorId: invitadoPor?.id ?? null,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Error al registrar el asistente");
          return null;
        }

        setAgregados((prev) => [data, ...prev]);
        toast.success(
          `${data.persona.nombres} ${data.persona.apellidos} agregado a la actividad`,
        );
        return data as AsistenteRegistrado;
      } catch {
        toast.error("Error de red al registrar el asistente");
        return null;
      } finally {
        setGuardandoId(null);
      }
    },
    [actividadId, horarioActualId, invitadoPor],
  );

  const agregarExistente = async (persona: PersonaBusqueda) => {
    const resultado = await registrarAsistente(
      { personaId: persona.id },
      persona.id,
    );
    if (resultado) {
      setBusqueda("");
      setResultados([]);
      inputBusquedaRef.current?.focus();
    }
  };

  // Enter agrega el primer resultado disponible, o abre el formulario de visita nueva
  const manejarEnterBusqueda = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || guardandoId !== null || buscando) return;
    e.preventDefault();

    const primeroDisponible = resultados.find((p) => !idsRegistrados.has(p.id));
    if (primeroDisponible) {
      agregarExistente(primeroDisponible);
    } else if (busqueda.trim().length >= 2) {
      abrirFormularioNueva();
    }
  };

  const abrirFormularioNueva = () => {
    const { nombres, apellidos } = separarNombre(busqueda);
    setNuevaVisita((prev) => ({ ...prev, nombres, apellidos }));
    setModoNueva(true);
  };

  const crearYAgregar = async () => {
    if (!nuevaVisita.nombres.trim() || !nuevaVisita.apellidos.trim()) {
      toast.error("Nombres y apellidos son requeridos");
      return;
    }

    const resultado = await registrarAsistente(
      {
        nuevaPersona: {
          nombres: nuevaVisita.nombres,
          apellidos: nuevaVisita.apellidos,
          celular: nuevaVisita.celular,
          correo: nuevaVisita.correo,
        },
      },
      "nueva",
    );

    if (resultado) {
      setNuevaVisita({ nombres: "", apellidos: "", celular: "", correo: "" });
      setModoNueva(false);
      setBusqueda("");
      setResultados([]);
      setTimeout(() => inputBusquedaRef.current?.focus(), 100);
    }
  };

  const quitarAgregado = async (historialId: number) => {
    try {
      const res = await fetch(
        `/api/actividades/${actividadId}/asistentes?historialId=${historialId}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error al quitar el asistente");
        return;
      }
      setAgregados((prev) => prev.filter((a) => a.id !== historialId));
      toast.success("Asistente removido");
    } catch {
      toast.error("Error de red al quitar el asistente");
    }
  };

  const cerrar = (abierto: boolean) => {
    if (!abierto && agregados.length > 0) {
      onAsistentesAgregados();
    }
    onOpenChange(abierto);
  };

  const etiquetaHorario = (horario: HorarioActividad) =>
    `${formatActivityDate(horario.fecha, {
      day: "2-digit",
      month: "short",
    })} · ${formatTime12Hour(horario.horaInicio)}${
      horario.horaFin ? ` - ${formatTime12Hour(horario.horaFin)}` : ""
    }`;

  return (
    <Dialog open={open} onOpenChange={cerrar}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Agregar asistentes
          </DialogTitle>
          <DialogDescription>
            Busca una persona registrada o crea una visita nueva al instante
            para {actividadNombre}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selector de horario */}
          {horarios.length > 0 && (
            <div className="space-y-1.5">
              <Label>Horario</Label>
              <Select value={horarioId} onValueChange={setHorarioId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un horario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General (sin horario)</SelectItem>
                  {horarios.map((horario) => (
                    <SelectItem key={horario.id} value={String(horario.id)}>
                      {etiquetaHorario(horario)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Persona con la que vienen las visitas (opcional) */}
          <div className="space-y-1.5">
            <Label htmlFor="busqueda-invita">
              ¿Con quién viene?{" "}
              <span className="font-normal text-muted-foreground">
                (opcional)
              </span>
            </Label>

            {invitadoPor ? (
              <div className="flex items-center justify-between gap-2 rounded-lg border p-2">
                <div className="flex items-center gap-2 min-w-0">
                  <MiembroAvatar
                    foto={invitadoPor.foto}
                    nombre={`${invitadoPor.nombres} ${invitadoPor.apellidos}`}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {invitadoPor.nombres} {invitadoPor.apellidos}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {etiquetaRol[invitadoPor.rol] ?? invitadoPor.rol}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  title="Quitar"
                  onClick={() => {
                    setInvitadoPor(null);
                    setBusquedaInvita("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="busqueda-invita"
                    value={busquedaInvita}
                    onChange={(e) => setBusquedaInvita(e.target.value)}
                    placeholder="Miembro o persona que la invitó..."
                    className="pl-10"
                    autoComplete="off"
                  />
                  {buscandoInvita && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>

                {resultadosInvita.length > 0 && (
                  <div className="rounded-lg border divide-y max-h-40 overflow-y-auto">
                    {resultadosInvita.map((persona) => (
                      <button
                        key={persona.id}
                        type="button"
                        onClick={() => {
                          setInvitadoPor(persona);
                          setBusquedaInvita("");
                          setResultadosInvita([]);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-muted"
                      >
                        <MiembroAvatar
                          foto={persona.foto}
                          nombre={`${persona.nombres} ${persona.apellidos}`}
                          size="sm"
                        />
                        <span className="text-sm truncate">
                          {persona.nombres} {persona.apellidos}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-xs ml-auto shrink-0"
                        >
                          {etiquetaRol[persona.rol] ?? persona.rol}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}

                {!buscandoInvita &&
                  busquedaInvita.trim().length >= 2 &&
                  resultadosInvita.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No se encontró a nadie con ese nombre
                    </p>
                  )}
              </>
            )}

            <p className="text-xs text-muted-foreground">
              Se aplica a cada persona que agregues mientras no lo cambies.
            </p>
          </div>

          {modoNueva ? (
            /* Formulario rápido de visita nueva */
            <div
              className="space-y-3 rounded-lg border p-3"
              onKeyDown={(e) => {
                if (e.key === "Enter" && guardandoId !== "nueva") {
                  e.preventDefault();
                  crearYAgregar();
                }
              }}
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">Nueva visita</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setModoNueva(false)}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Volver a buscar
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="nueva-nombres">Nombres *</Label>
                  <Input
                    id="nueva-nombres"
                    value={nuevaVisita.nombres}
                    onChange={(e) =>
                      setNuevaVisita((prev) => ({
                        ...prev,
                        nombres: e.target.value,
                      }))
                    }
                    placeholder="Juan"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nueva-apellidos">Apellidos *</Label>
                  <Input
                    id="nueva-apellidos"
                    value={nuevaVisita.apellidos}
                    onChange={(e) =>
                      setNuevaVisita((prev) => ({
                        ...prev,
                        apellidos: e.target.value,
                      }))
                    }
                    placeholder="Pérez"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nueva-celular">Celular</Label>
                  <PhoneInput
                    id="nueva-celular"
                    value={nuevaVisita.celular}
                    onChange={(value) =>
                      setNuevaVisita((prev) => ({ ...prev, celular: value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nueva-correo">Correo</Label>
                  <Input
                    id="nueva-correo"
                    type="email"
                    value={nuevaVisita.correo}
                    onChange={(e) =>
                      setNuevaVisita((prev) => ({
                        ...prev,
                        correo: e.target.value,
                      }))
                    }
                    placeholder="opcional"
                  />
                </div>
              </div>

              <Button
                className="w-full"
                onClick={crearYAgregar}
                disabled={guardandoId === "nueva"}
              >
                {guardandoId === "nueva" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Crear y agregar a la actividad
              </Button>
              <p className="text-xs text-muted-foreground">
                Se registra como visita nueva. Puedes completar el resto de los
                datos más adelante desde su perfil.
              </p>
            </div>
          ) : (
            <>
              {/* Búsqueda */}
              <div className="space-y-1.5">
                <Label htmlFor="busqueda-asistente">Buscar persona</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="busqueda-asistente"
                    ref={inputBusquedaRef}
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    onKeyDown={manejarEnterBusqueda}
                    placeholder="Nombre, apellido o teléfono..."
                    className="pl-10"
                    autoComplete="off"
                  />
                  {buscando && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Resultados */}
              {busqueda.trim().length >= 2 && (
                <div className="space-y-2">
                  {resultados.map((persona) => {
                    const yaRegistrada = idsRegistrados.has(persona.id);
                    return (
                      <button
                        key={persona.id}
                        type="button"
                        disabled={yaRegistrada || guardandoId === persona.id}
                        onClick={() => agregarExistente(persona)}
                        className="w-full flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted disabled:opacity-60 disabled:hover:bg-transparent"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <MiembroAvatar
                            foto={persona.foto}
                            nombre={`${persona.nombres} ${persona.apellidos}`}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {persona.nombres} {persona.apellidos}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="secondary" className="text-xs">
                                {etiquetaRol[persona.rol] ?? persona.rol}
                              </Badge>
                              {(persona.celular || persona.telefono) && (
                                <span className="truncate">
                                  {persona.celular || persona.telefono}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {yaRegistrada ? (
                          <span className="flex items-center gap-1 text-xs text-green-600 shrink-0">
                            <Check className="h-4 w-4" />
                            Registrado
                          </span>
                        ) : guardandoId === persona.id ? (
                          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                        ) : (
                          <UserPlus className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                      </button>
                    );
                  })}

                  {!buscando && resultados.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No se encontró a nadie con ese nombre
                    </p>
                  )}

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={abrirFormularioNueva}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Crear visita nueva
                    {busqueda.trim() && `: "${busqueda.trim()}"`}
                  </Button>
                </div>
              )}

              {busqueda.trim().length < 2 && (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Escribe al menos 2 letras para buscar
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={abrirFormularioNueva}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Crear visita nueva
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Agregados en esta sesión */}
          {agregados.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Agregados ahora ({agregados.length})
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {agregados.map((asistente) => (
                  <div
                    key={asistente.id}
                    className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Check className="h-4 w-4 text-green-600 shrink-0" />
                      <span className="text-sm truncate">
                        {asistente.persona.nombres} {asistente.persona.apellidos}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => quitarAgregado(asistente.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => cerrar(false)}>
            {agregados.length > 0 ? "Listo" : "Cerrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
