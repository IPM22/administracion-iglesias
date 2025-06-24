"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Building2,
  ArrowLeft,
  Loader2,
  CheckCircle,
  MapPin,
  Phone,
  Mail,
  Globe,
} from "lucide-react";

interface IglesiaData {
  nombre: string;
  descripcion: string;
  direccion: string;
  telefono: string;
  correo: string;
  sitioWeb: string;
}

export default function CrearIglesiaPage() {
  const router = useRouter();
  const { user, cargarUsuarioCompleto } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<IglesiaData>({
    nombre: "",
    descripcion: "",
    direccion: "",
    telefono: "",
    correo: "",
    sitioWeb: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError("Usuario no autenticado");
      return;
    }

    if (!formData.nombre.trim()) {
      setError("El nombre de la iglesia es requerido");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/iglesias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          usuarioId: user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error creando iglesia");
      }

      setSuccess(true);

      // Recargar datos del usuario para que aparezca la nueva iglesia
      if (user) {
        await cargarUsuarioCompleto(user);
      }

      // Redirigir al dashboard después de un breve delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Error:", error);
      setError(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm sm:max-w-md">
          <CardContent className="p-6 sm:p-8 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold mb-2">
              ¡Iglesia Creada!
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              Tu iglesia ha sido configurada exitosamente. Serás redirigido al
              dashboard.
            </p>
            <div className="animate-spin w-5 h-5 sm:w-6 sm:h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-3 sm:p-4">
      <Card className="w-full max-w-2xl">
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
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                Crear Nueva Iglesia
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Configura los datos básicos de tu iglesia
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {/* Información básica */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm sm:text-lg">
                Información Básica
              </h3>

              <div>
                <Label htmlFor="nombre" className="text-sm font-medium">
                  Nombre de la Iglesia *
                </Label>
                <Input
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Iglesia de Cristo"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="descripcion" className="text-sm font-medium">
                  Descripción
                </Label>
                <Textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  placeholder="Breve descripción de la iglesia..."
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Información de contacto */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm sm:text-lg">
                Información de Contacto
              </h3>

              <div>
                <Label
                  htmlFor="direccion"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                  Dirección
                </Label>
                <Input
                  id="direccion"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  placeholder="Calle 123, Ciudad, Estado"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="telefono"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                    Teléfono
                  </Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    placeholder="+1 234 567 8900"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="correo"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                    Correo
                  </Label>
                  <Input
                    id="correo"
                    name="correo"
                    type="email"
                    value={formData.correo}
                    onChange={handleInputChange}
                    placeholder="contacto@iglesia.com"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label
                  htmlFor="sitioWeb"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
                  Sitio Web
                </Label>
                <Input
                  id="sitioWeb"
                  name="sitioWeb"
                  type="url"
                  value={formData.sitioWeb}
                  onChange={handleInputChange}
                  placeholder="https://www.iglesia.com"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Información importante */}
            <div className="p-4 bg-blue-50 rounded-lg border">
              <h4 className="font-semibold text-blue-900 mb-2">
                ℹ️ Información Importante
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Serás el administrador principal de esta iglesia</li>
                <li>• Podrás invitar y gestionar otros usuarios</li>
                <li>• Todos los datos estarán separados de otras iglesias</li>
                <li>• Puedes editar esta información después</li>
              </ul>
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.nombre.trim()}
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creando iglesia...
                  </>
                ) : (
                  <>
                    <Building2 className="h-4 w-4 mr-2" />
                    Crear iglesia
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
