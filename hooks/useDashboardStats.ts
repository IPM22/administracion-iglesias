import { useState, useEffect } from "react";

interface DashboardStats {
  totalMiembros: number;
  miembrosActivos: number;
  totalVisitas: number;
  totalFamilias: number;
  familiasActivas: number;
  visitasPorEstado: {
    nuevas: number;
    recurrentes: number;
    convertidas: number;
  };
  cambios: {
    miembros: number;
    visitas: number;
    familias: number;
  };
  nuevosUltimos30Dias: {
    miembros: number;
    visitas: number;
    familias: number;
  };
  distribucionEdades: {
    ninos: number;
    jovenes: number;
    adultos: number;
    adultosMayores: number;
  };
  proximasActividades: Array<{
    nombre: string;
    fecha: string;
    fechaCompleta: string;
    lugar: string;
    tipo: string;
    asistentesEsperados: number;
  }>;
  conversionesRecientes: Array<{
    nombres: string;
    apellidos: string;
    fechaConversion: string;
    fechaOriginal: string;
  }>;
  tasaConversion: number;
  promedioPersonasPorFamilia: number;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/dashboard/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        throw new Error("Error al cargar estadísticas");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("No se pudieron cargar las estadísticas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  return {
    stats,
    loading,
    error,
    recargar: cargarEstadisticas,
  };
}
