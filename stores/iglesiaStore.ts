import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface IglesiaActiva {
  id: number;
  nombre: string;
  logoUrl?: string;
  rol: string;
  estado: string;
}

interface IglesiaStore {
  iglesiaActiva: IglesiaActiva | null;
  mostrarSelectorIglesias: boolean;
  loading: boolean;

  // Actions
  setIglesiaActiva: (iglesia: IglesiaActiva | null) => void;
  setMostrarSelectorIglesias: (mostrar: boolean) => void;
  setLoading: (loading: boolean) => void;
  limpiarIglesia: () => void;

  // Helpers
  getIglesiaId: () => number | null;
}

export const useIglesiaStore = create<IglesiaStore>()(
  persist(
    (set, get) => ({
      iglesiaActiva: null,
      mostrarSelectorIglesias: false,
      loading: false,

      setIglesiaActiva: (iglesia) => {
        set({
          iglesiaActiva: iglesia,
          mostrarSelectorIglesias: false,
        });

        // También guardar en localStorage para compatibilidad
        if (iglesia) {
          localStorage.setItem("iglesiaActiva", JSON.stringify(iglesia));
        } else {
          localStorage.removeItem("iglesiaActiva");
        }
      },

      setMostrarSelectorIglesias: (mostrar) => {
        set({ mostrarSelectorIglesias: mostrar });
      },

      setLoading: (loading) => {
        set({ loading });
      },

      limpiarIglesia: () => {
        set({
          iglesiaActiva: null,
          mostrarSelectorIglesias: false,
        });
        localStorage.removeItem("iglesiaActiva");
      },

      getIglesiaId: () => {
        const { iglesiaActiva } = get();
        return iglesiaActiva?.id || null;
      },
    }),
    {
      name: "iglesia-storage", // nombre para localStorage
      partialize: (state) => ({
        iglesiaActiva: state.iglesiaActiva,
      }), // solo persistir iglesiaActiva
    }
  )
);

// Hook personalizado para facilitar el uso
export const useIglesiaActiva = () => {
  const { iglesiaActiva, getIglesiaId } = useIglesiaStore();
  return {
    iglesia: iglesiaActiva,
    iglesiaId: getIglesiaId(),
    hasIglesia: !!iglesiaActiva,
  };
};
