"use client";

import { useEffect, useState } from "react";

export default function TestActividadesPage() {
  const [estado, setEstado] = useState("Cargando...");
  const [datos, setDatos] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testActividades = async () => {
      try {
        console.log("🧪 TEST: Iniciando prueba de actividades...");
        setEstado("Enviando petición...");

        const response = await fetch("/api/actividades");
        console.log(
          "🧪 TEST: Respuesta recibida:",
          response.status,
          response.statusText
        );
        setEstado(`Respuesta: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("🧪 TEST: Error del servidor:", errorText);
          throw new Error(`Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log("🧪 TEST: Datos recibidos:", data);
        setDatos(data);
        setEstado(
          `Éxito: ${Array.isArray(data) ? data.length : "No array"} actividades`
        );
      } catch (err) {
        console.error("🧪 TEST: Error:", err);
        setError(err instanceof Error ? err.message : "Error desconocido");
        setEstado("Error");
      }
    };

    testActividades();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🧪 Test de Actividades</h1>

      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="font-semibold">Estado:</h2>
          <p>{estado}</p>
        </div>

        {error && (
          <div className="bg-red-50 p-4 rounded-lg">
            <h2 className="font-semibold text-red-600">Error:</h2>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {datos && (
          <div className="bg-green-50 p-4 rounded-lg">
            <h2 className="font-semibold text-green-600">Datos recibidos:</h2>
            <pre className="text-xs overflow-x-auto mt-2 bg-white p-2 rounded">
              {JSON.stringify(datos, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="font-semibold">Instrucciones:</h2>
          <ol className="list-decimal list-inside space-y-1 text-sm mt-2">
            <li>Abre la consola del navegador (F12 → Console)</li>
            <li>Busca mensajes que empiecen con "🧪 TEST:"</li>
            <li>Copia todo lo que aparezca aquí y en la consola</li>
          </ol>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            🔄 Recargar Test
          </button>

          <a
            href="/api/actividades"
            target="_blank"
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 inline-block ml-2"
          >
            🔗 Abrir API directamente
          </a>

          <a
            href="/actividades"
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 inline-block ml-2"
          >
            📋 Ir a página principal
          </a>
        </div>
      </div>
    </div>
  );
}
