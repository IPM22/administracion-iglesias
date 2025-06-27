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
import {
  Loader2,
  Eye,
  EyeOff,
  CheckCircle,
  Mail,
  Lock,
  User,
  ArrowRight,
  LogIn,
} from "lucide-react";

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
      <Card className="w-full max-w-md mx-auto bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-0 shadow-2xl shadow-green-500/10 dark:shadow-green-400/10">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-400 dark:to-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
            ¡Registro exitoso!
          </CardTitle>
          <CardDescription className="text-center text-gray-600 dark:text-gray-400 leading-relaxed">
            Te hemos enviado un correo de confirmación. Por favor revisa tu
            bandeja de entrada y haz clic en el enlace para activar tu cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button
              onClick={() => router.push("/login")}
              className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 dark:from-green-500 dark:to-emerald-500 dark:hover:from-green-600 dark:hover:to-emerald-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 group"
            >
              <LogIn className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
              Ir al inicio de sesión
            </Button>
            <Button
              variant="outline"
              onClick={() => setSuccess(false)}
              className="w-full h-12 border-2 border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-950/50 transition-all duration-200"
            >
              Registrar otra cuenta
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-0 shadow-2xl shadow-purple-500/10 dark:shadow-purple-400/10">
      <CardHeader className="space-y-1 pb-8">
        <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
          Crear Cuenta
        </CardTitle>
        <CardDescription className="text-center text-gray-600 dark:text-gray-400 font-medium">
          Completa la información para crear tu cuenta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert
              variant="destructive"
              className="bg-red-50/80 dark:bg-red-950/80 border-red-200 dark:border-red-800 backdrop-blur-sm"
            >
              <AlertDescription className="text-red-800 dark:text-red-200 font-medium">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="nombres"
                className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Nombres
              </Label>
              <div className="relative group">
                <Input
                  id="nombres"
                  name="nombres"
                  type="text"
                  placeholder="Juan Carlos"
                  value={formData.nombres}
                  onChange={handleInputChange}
                  disabled={loading}
                  required
                  className="pl-10 h-12 border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500/20 dark:focus:ring-purple-400/20 transition-all duration-200 bg-white/50 dark:bg-gray-800/50"
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 group-focus-within:text-purple-500 dark:group-focus-within:text-purple-400 transition-colors" />
              </div>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="apellidos"
                className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Apellidos
              </Label>
              <div className="relative group">
                <Input
                  id="apellidos"
                  name="apellidos"
                  type="text"
                  placeholder="González"
                  value={formData.apellidos}
                  onChange={handleInputChange}
                  disabled={loading}
                  required
                  className="pl-10 h-12 border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500/20 dark:focus:ring-purple-400/20 transition-all duration-200 bg-white/50 dark:bg-gray-800/50"
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 group-focus-within:text-purple-500 dark:group-focus-within:text-purple-400 transition-colors" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Correo electrónico
            </Label>
            <div className="relative group">
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@correo.com"
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
                required
                className="pl-10 h-12 border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500/20 dark:focus:ring-purple-400/20 transition-all duration-200 bg-white/50 dark:bg-gray-800/50"
              />
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 group-focus-within:text-purple-500 dark:group-focus-within:text-purple-400 transition-colors" />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2"
            >
              <Lock className="h-4 w-4" />
              Contraseña
            </Label>
            <div className="relative group">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
                required
                className="pl-10 pr-12 h-12 border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500/20 dark:focus:ring-purple-400/20 transition-all duration-200 bg-white/50 dark:bg-gray-800/50"
              />
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 group-focus-within:text-purple-500 dark:group-focus-within:text-purple-400 transition-colors" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
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
            <Label
              htmlFor="confirmPassword"
              className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2"
            >
              <Lock className="h-4 w-4" />
              Confirmar contraseña
            </Label>
            <div className="relative group">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Repite tu contraseña"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                disabled={loading}
                required
                className="pl-10 pr-12 h-12 border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500/20 dark:focus:ring-purple-400/20 transition-all duration-200 bg-white/50 dark:bg-gray-800/50"
              />
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 group-focus-within:text-purple-500 dark:group-focus-within:text-purple-400 transition-colors" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
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

          <Button
            type="submit"
            className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 dark:from-purple-500 dark:to-blue-500 dark:hover:from-purple-600 dark:hover:to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 group"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando cuenta...
              </>
            ) : (
              <>
                Crear Cuenta
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>

          <div className="space-y-4 pt-2">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400 font-medium">
                  O
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all duration-200 group"
              onClick={() => router.push("/login")}
            >
              <LogIn className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
              ¿Ya tienes cuenta? Inicia sesión
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
