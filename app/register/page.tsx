import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
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
        <div className="px-2">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
