"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  ArrowLeft,
  Building2,
  Users,
  MapPin,
  Loader2,
  CheckCircle,
  Send,
} from "lucide-react";

interface Iglesia {
  id: number;
  nombre: string;
  descripcion?: string;
  direccion?: string;
  logoUrl?: string;
  createdAt: string;
  _count: {
    usuarios: number;
    personas: number;
  };
}

export default function BuscarIglesiaPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [iglesias, setIglesias] = useState<Iglesia[]>([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [solicitudEnviada, setSolicitudEnviada] = useState<number | null>(null);

  // Estado del modal de solicitud
  const [modalAbierto, setModalAbierto] = useState(false);
  const [iglesiaSeleccionada, setIglesiaSeleccionada] =
    useState<Iglesia | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);

  const buscarIglesias = async (termino: string = "") => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (termino.trim()) {
        params.append("busqueda", termino.trim());
      }
      params.append("limite", "20");

      const response = await fetch(`/api/iglesias?${params}`);
      if (!response.ok) {
        throw new Error("Error al buscar iglesias");
      }

      const data = await response.json();
      setIglesias(data.iglesias || []);
    } catch (error) {
      console.error("Error:", error);
      setError("No se pudieron cargar las iglesias");
      setIglesias([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSolicitarUnion = (iglesia: Iglesia) => {
    setIglesiaSeleccionada(iglesia);
    setMensaje(`Hola, me gustaría unirme a ${iglesia.nombre}. `);
    setModalAbierto(true);
  };

  const enviarSolicitud = async () => {
    if (!user || !iglesiaSeleccionada) return;

    setEnviandoSolicitud(true);
    setError(null);

    try {
      const response = await fetch("/api/solicitudes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuarioId: user.id,
          iglesiaId: iglesiaSeleccionada.id,
          mensaje: mensaje.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error enviando solicitud");
      }

      setSolicitudEnviada(iglesiaSeleccionada.id);
      setModalAbierto(false);
      setMensaje("");

      // Mostrar mensaje de éxito por 3 segundos, luego desloguear y redirigir al login
      setTimeout(async () => {
        await signOut();
        router.push("/login?mensaje=solicitud-enviada");
      }, 3000);
    } catch (error) {
      console.error("Error:", error);
      setError(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setEnviandoSolicitud(false);
    }
  };

  useEffect(() => {
    buscarIglesias();
  }, []);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    buscarIglesias(busqueda);
  };

  if (solicitudEnviada) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm sm:max-w-md">
          <CardContent className="p-6 sm:p-8 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold mb-2">
              ¡Solicitud Enviada!
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              Tu solicitud ha sido enviada al administrador de la iglesia. Te
              notificaremos cuando sea revisada.
            </p>
            <div className="animate-spin w-5 h-5 sm:w-6 sm:h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Redirigiendo al login...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-3 sm:p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Search className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  Buscar Iglesia
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Encuentra y solicita unirte a una iglesia
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Formulario de búsqueda */}
        <Card className="mb-4 sm:mb-6">
          <CardContent className="p-4 sm:p-6">
            <form
              onSubmit={handleBuscar}
              className="flex flex-col sm:flex-row gap-3"
            >
              <div className="flex-1">
                <Input
                  placeholder="Buscar por nombre de iglesia..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span className="ml-2">Buscar</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Lista de iglesias */}
        {error && (
          <Card className="mb-4 sm:mb-6">
            <CardContent className="p-4 sm:p-6 text-center">
              <p className="text-red-600 text-sm sm:text-base">{error}</p>
              <Button
                onClick={() => buscarIglesias(busqueda)}
                variant="outline"
                className="mt-3"
              >
                Reintentar
              </Button>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <Card>
            <CardContent className="p-6 sm:p-8 text-center">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto mb-4" />
              <p className="text-sm sm:text-base text-muted-foreground">
                Buscando iglesias...
              </p>
            </CardContent>
          </Card>
        ) : iglesias.length === 0 ? (
          <Card>
            <CardContent className="p-6 sm:p-8 text-center">
              <Building2 className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">
                {busqueda
                  ? "No se encontraron iglesias"
                  : "Comienza tu búsqueda"}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                {busqueda
                  ? "Intenta con otros términos de búsqueda."
                  : "Escribe el nombre de la iglesia que buscas."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {iglesias.map((iglesia) => (
              <Card
                key={iglesia.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-start gap-3">
                    {iglesia.logoUrl ? (
                      <img
                        src={iglesia.logoUrl}
                        alt={`Logo de ${iglesia.nombre}`}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm sm:text-base font-semibold line-clamp-2">
                        {iglesia.nombre}
                      </CardTitle>
                      {iglesia.descripcion && (
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                          {iglesia.descripcion}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="space-y-3">
                    {iglesia.direccion && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-muted-foreground truncate">
                          {iglesia.direccion}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          {iglesia._count.usuarios + iglesia._count.personas}{" "}
                          miembros
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Activa
                      </Badge>
                    </div>

                    <Button
                      onClick={() => handleSolicitarUnion(iglesia)}
                      className="w-full text-sm"
                      size="sm"
                    >
                      <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Solicitar unirse
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal de solicitud */}
        <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
          <DialogContent className="max-w-md mx-4">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">
                Solicitar unirse a {iglesiaSeleccionada?.nombre}
              </DialogTitle>
              <DialogDescription className="text-sm">
                Escribe un mensaje para el administrador de la iglesia.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="mensaje" className="text-sm font-medium">
                  Mensaje
                </Label>
                <Textarea
                  id="mensaje"
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder="Hola, me gustaría unirme a esta iglesia..."
                  rows={4}
                  className="text-sm"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setModalAbierto(false)}
                disabled={enviandoSolicitud}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={enviarSolicitud}
                disabled={enviandoSolicitud || !mensaje.trim()}
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                {enviandoSolicitud ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar solicitud
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
