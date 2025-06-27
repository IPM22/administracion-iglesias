"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Clock, Church } from "lucide-react";

function LoginContent() {
  const searchParams = useSearchParams();
  const mensaje = searchParams.get("mensaje");

  const mostrarMensajeSolicitud = mensaje === "solicitud-enviada";
  const mostrarMensajePendiente = mensaje === "solicitud-pendiente";

  return (
    <>
      {mostrarMensajeSolicitud && (
        <Alert className="border-green-200 bg-green-50/80 dark:bg-green-950/80 dark:border-green-800 backdrop-blur-sm mb-6 shadow-lg">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
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
        <Alert className="border-orange-200 bg-orange-50/80 dark:bg-orange-950/80 dark:border-orange-800 backdrop-blur-sm mb-6 shadow-lg">
          <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Fondo con gradiente y patrón */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] dark:[mask-image:linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0))]" />

      {/* Elementos decorativos */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-200/20 dark:bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-200/20 dark:bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10 w-full max-w-md mx-auto p-6">
        {/* Header mejorado */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 rounded-2xl mb-6 shadow-lg">
            <Church className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-gray-100 dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent mb-2">
            Administración de Iglesias
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Sistema de gestión integral
          </p>
        </div>

        <Suspense fallback={null}>
          <LoginContent />
        </Suspense>

        <LoginForm />
      </div>
    </div>
  );
}
