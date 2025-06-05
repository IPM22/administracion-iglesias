"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";

export function RegisterForm() {
  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { signUp, loading } = useAuth();
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return "La contraseña debe tener al menos 6 caracteres";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validaciones
    if (
      !formData.nombres ||
      !formData.apellidos ||
      !formData.email ||
      !formData.password
    ) {
      setError("Por favor completa todos los campos");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    const { error: signUpError } = await signUp(
      formData.email,
      formData.password,
      {
        nombres: formData.nombres,
        apellidos: formData.apellidos,
      }
    );

    if (signUpError) {
      setError(signUpError.message);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-center">
            ¡Registro exitoso!
          </CardTitle>
          <CardDescription className="text-center">
            Te hemos enviado un correo de confirmación. Por favor revisa tu
            bandeja de entrada y haz clic en el enlace para activar tu cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={() => router.push("/login")} className="w-full">
              Ir al inicio de sesión
            </Button>
            <Button
              variant="outline"
              onClick={() => setSuccess(false)}
              className="w-full"
            >
              Registrar otra cuenta
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Crear Cuenta</CardTitle>
        <CardDescription className="text-center">
          Completa la información para crear tu cuenta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombres">Nombres</Label>
              <Input
                id="nombres"
                name="nombres"
                type="text"
                placeholder="Juan Carlos"
                value={formData.nombres}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellidos">Apellidos</Label>
              <Input
                id="apellidos"
                name="apellidos"
                type="text"
                placeholder="González"
                value={formData.apellidos}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="tu@correo.com"
              value={formData.email}
              onChange={handleInputChange}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Repite tu contraseña"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear Cuenta
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="link"
              className="text-sm"
              onClick={() => router.push("/login")}
            >
              ¿Ya tienes cuenta? Inicia sesión
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
