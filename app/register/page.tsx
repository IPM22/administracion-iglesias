import { RegisterForm } from "@/components/auth/register-form";
import { Church } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12">
      {/* Fondo con gradiente y patrón */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] dark:[mask-image:linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0))]" />

      {/* Elementos decorativos */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-purple-200/20 dark:bg-purple-400/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-200/20 dark:bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10 w-full max-w-md mx-auto p-6">
        {/* Header mejorado */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 dark:from-purple-500 dark:to-blue-500 rounded-2xl mb-6 shadow-lg">
            <Church className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-blue-800 dark:from-gray-100 dark:via-purple-200 dark:to-blue-200 bg-clip-text text-transparent mb-2">
            Administración de Iglesias
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Sistema de gestión integral
          </p>
        </div>

        <RegisterForm />
      </div>
    </div>
  );
}
