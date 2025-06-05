import { useIglesiaStore } from "@/stores/iglesiaStore";
import { useEffect, useRef } from "react";

export function useApiConIglesia() {
  const { iglesiaActiva, getIglesiaId } = useIglesiaStore();
  const cacheRef = useRef<
    Map<string, { data: unknown; timestamp: number; iglesiaId: number }>
  >(new Map());
  const CACHE_DURATION = 30 * 1000; // 30 segundos

  // Limpiar caché cuando cambia la iglesia
  useEffect(() => {
    if (iglesiaActiva) {
      // Limpiar entradas de caché de otras iglesias
      const currentIglesiaId = iglesiaActiva.id;
      const cache = cacheRef.current;

      for (const [key, value] of cache.entries()) {
        if (value.iglesiaId !== currentIglesiaId) {
          cache.delete(key);
        }
      }
    }
  }, [iglesiaActiva?.id]);

  const fetchConIglesia = async (
    endpoint: string,
    options: RequestInit = {}
  ) => {
    const iglesiaId = getIglesiaId();

    if (!iglesiaId) {
      throw new Error("No hay iglesia seleccionada");
    }

    // Crear clave de caché
    const cacheKey = `${endpoint}_${iglesiaId}_${JSON.stringify(options)}`;
    const cache = cacheRef.current;
    const now = Date.now();

    // Verificar caché para GET requests
    if (!options.method || options.method === "GET") {
      const cached = cache.get(cacheKey);
      if (
        cached &&
        now - cached.timestamp < CACHE_DURATION &&
        cached.iglesiaId === iglesiaId
      ) {
        console.log(`📱 Usando caché para ${endpoint}`);
        return cached.data;
      }
    }

    // Agregar iglesiaId como query parameter
    const url = new URL(endpoint, window.location.origin);
    url.searchParams.set("iglesiaId", iglesiaId.toString());

    const response = await fetch(url.toString(), {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Guardar en caché solo para GET requests exitosos
    if (!options.method || options.method === "GET") {
      cache.set(cacheKey, {
        data,
        timestamp: now,
        iglesiaId,
      });
    }

    return data;
  };

  const limpiarCache = () => {
    cacheRef.current.clear();
  };

  return {
    fetchConIglesia,
    limpiarCache,
    iglesiaActiva,
    tieneIglesia: !!iglesiaActiva,
  };
}
