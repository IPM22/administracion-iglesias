"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ComunidadEditarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  useEffect(() => {
    // Redireccionar automáticamente a la página de editar miembros
    router.replace(`/miembros/${id}/editar`);
  }, [router, id]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Redirigiendo al editor de persona...</p>
      </div>
    </div>
  );
}
