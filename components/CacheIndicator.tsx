import { useEffect, useState } from "react";

export function CacheIndicator() {
  const [esCacheActivo, setEsCacheActivo] = useState(false);

  useEffect(() => {
    const verificarCache = () => {
      try {
        const cacheData = sessionStorage.getItem("usuario_session_cache");
        setEsCacheActivo(!!cacheData);
      } catch {
        setEsCacheActivo(false);
      }
    };

    verificarCache();

    // Verificar cada 30 segundos
    const interval = setInterval(verificarCache, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!esCacheActivo) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-green-100 border border-green-300 text-green-800 px-3 py-2 rounded-lg shadow-sm text-xs flex items-center space-x-1">
        <span>⚡</span>
        <span>Datos optimizados</span>
      </div>
    </div>
  );
}
