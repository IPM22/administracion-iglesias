"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Clock } from "lucide-react";

function LoginContent() {
  const searchParams = useSearchParams();
  const mensaje = searchParams.get("mensaje");

  const mostrarMensajeSolicitud = mensaje === "solicitud-enviada";
  const mostrarMensajePendiente = mensaje === "solicitud-pendiente";

  return (
    <>
      {mostrarMensajeSolicitud && (
        <Alert className="border-green-200 bg-green-50 mb-4">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="space-y-2">
              <p className="font-medium text-sm sm:text-base">
                ¡Solicitud enviada exitosamente!
              </p>
              <p className="text-xs sm:text-sm">
                Tu solicitud para unirte a la iglesia ha sido enviada al
                administrador. Debes esperar a que aprueben tu solicitud antes
                de poder acceder al sistema.
              </p>
              <div className="flex items-center gap-2 text-xs sm:text-sm">
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
        <Alert className="border-orange-200 bg-orange-50 mb-4">
          <Clock className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="space-y-2">
              <p className="font-medium text-sm sm:text-base">
                Solicitud pendiente de aprobación
              </p>
              <p className="text-xs sm:text-sm">
                Tu solicitud para unirte a una iglesia está siendo revisada por
                el administrador. Debes esperar a que aprueben tu solicitud
                antes de poder acceder al sistema.
              </p>
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <Clock className="h-3 w-3" />
                <span>
                  Te notificaremos por correo cuando haya una respuesta.
                </span>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        <div className="text-center px-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Administración de Iglesias
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Sistema de gestión integral
          </p>
        </div>

        <Suspense fallback={null}>
          <LoginContent />
        </Suspense>

        <div className="px-2">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
