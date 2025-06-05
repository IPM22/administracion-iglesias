"use client";

import { useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Clock } from "lucide-react";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const mensaje = searchParams.get("mensaje");

  const mostrarMensajeSolicitud = mensaje === "solicitud-enviada";
  const mostrarMensajePendiente = mensaje === "solicitud-pendiente";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Administración de Iglesias
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Sistema de gestión integral
          </p>
        </div>

        {mostrarMensajeSolicitud && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="space-y-2">
                <p className="font-medium">¡Solicitud enviada exitosamente!</p>
                <p className="text-sm">
                  Tu solicitud para unirte a la iglesia ha sido enviada al
                  administrador. Debes esperar a que aprueben tu solicitud antes
                  de poder acceder al sistema.
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-3 w-3" />
                  <span>
                    Te notificaremos por correo cuando haya una respuesta.
                  </span>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {mostrarMensajePendiente && (
          <Alert className="border-orange-200 bg-orange-50">
            <Clock className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <div className="space-y-2">
                <p className="font-medium">Solicitud pendiente de aprobación</p>
                <p className="text-sm">
                  Tu solicitud para unirte a una iglesia está siendo revisada
                  por el administrador. Debes esperar a que aprueben tu
                  solicitud antes de poder acceder al sistema.
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-3 w-3" />
                  <span>
                    Te notificaremos por correo cuando haya una respuesta.
                  </span>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <LoginForm />
      </div>
    </div>
  );
}
