"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  ArrowLeft,
  Building2,
  Users,
  MapPin,
  Loader2,
  CheckCircle,
  Clock,
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
    miembros: number;
  };
}

export default function BuscarIglesiaPage() {
  const router = useRouter();
  const { user, cargarUsuarioCompleto } = useAuth();
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

      // Mostrar mensaje de éxito por 3 segundos y redirigir
      setTimeout(() => {
        router.push("/dashboard");
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
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">¡Solicitud Enviada!</h2>
            <p className="text-muted-foreground mb-4">
              Tu solicitud ha sido enviada al administrador de la iglesia. Te
              notificaremos cuando sea revisada.
            </p>
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">
              Redirigiendo al dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
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
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-green-600" />
                  Buscar Iglesia
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Encuentra y solicita unirte a una iglesia
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Formulario de búsqueda */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <form onSubmit={handleBuscar} className="flex gap-3">
              <div className="flex-1">
                <Input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre de iglesia..."
                  className="w-full"
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Mensajes de error */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Lista de iglesias */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            // Skeletons de carga
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))
          ) : iglesias.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No se encontraron iglesias
              </h3>
              <p className="text-muted-foreground">
                {busqueda.trim()
                  ? "Intenta con otros términos de búsqueda"
                  : "Aún no hay iglesias registradas"}
              </p>
            </div>
          ) : (
            iglesias.map((iglesia) => (
              <Card
                key={iglesia.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {iglesia.logoUrl ? (
                        <img
                          src={iglesia.logoUrl}
                          alt={iglesia.nombre}
                          className="w-8 h-8 rounded object-cover"
                        />
                      ) : (
                        <Building2 className="h-6 w-6 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm mb-1 truncate">
                        {iglesia.nombre}
                      </h3>
                      {iglesia.descripcion && (
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {iglesia.descripcion}
                        </p>
                      )}
                    </div>
                  </div>

                  {iglesia.direccion && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{iglesia.direccion}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {iglesia._count.usuarios} usuarios
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {iglesia._count.miembros} miembros
                      </Badge>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleSolicitarUnion(iglesia)}
                    className="w-full"
                    size="sm"
                  >
                    <Send className="h-3 w-3 mr-2" />
                    Solicitar Unión
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Modal de solicitud */}
        <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Solicitar Unión</DialogTitle>
              <DialogDescription>
                Envía una solicitud para unirte a {iglesiaSeleccionada?.nombre}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="mensaje">Mensaje (opcional)</Label>
                <Textarea
                  id="mensaje"
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder="Cuéntales un poco sobre ti y por qué quieres unirte..."
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {mensaje.length}/500 caracteres
                </p>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700 mb-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Proceso de aprobación
                  </span>
                </div>
                <p className="text-xs text-blue-600">
                  Tu solicitud será revisada por un administrador de la iglesia.
                  Te notificaremos por email cuando haya una respuesta.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setModalAbierto(false)}
                  disabled={enviandoSolicitud}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={enviarSolicitud}
                  disabled={enviandoSolicitud}
                  className="flex-1"
                >
                  {enviandoSolicitud ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar Solicitud
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
