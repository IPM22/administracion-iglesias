"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MiembrosPage() {
  const router = useRouter();

  useEffect(() => {
    // Redireccionar automáticamente al módulo de comunidad con tab de miembros
    router.replace("/comunidad?tab=miembros");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Redirigiendo al módulo de comunidad...</p>
      </div>
    </div>
  );
}
