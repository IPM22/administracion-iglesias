import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
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
        <RegisterForm />
      </div>
    </div>
  );
}
