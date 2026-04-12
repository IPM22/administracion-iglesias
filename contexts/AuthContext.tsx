"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { type User } from "@supabase/supabase-js";
import { useIglesiaStore, type IglesiaActiva } from "@/stores/iglesiaStore";

interface UsuarioCompleto {
  id: string;
  email: string;
  nombres: string;
  apellidos: string;
  avatar?: string;
  telefono?: string;
  emailVerified: boolean;
  primerLogin: boolean;
  iglesias: {
    id: number;
    rol: string;
    estado: string;
    iglesia: {
      id: number;
      nombre: string;
      logoUrl?: string;
    };
  }[];
}

interface AuthContextValue {
  user: User | null;
  usuarioCompleto: UsuarioCompleto | null;
  iglesiaActiva: IglesiaActiva | null;
  loading: boolean;
  initializing: boolean;
  mostrarSelectorIglesias: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signUp: (email: string, password: string, metadata: { nombres: string; apellidos: string }) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  cambiarIglesia: (iglesia: IglesiaActiva) => void;
  seleccionarIglesia: (iglesia: IglesiaActiva) => void;
  refetch: () => Promise<void>;
  limpiarIglesia: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Caché en memoria (sobrevive a cambios de página sin re-fetch) ────────────
const CACHE_DURATION = 5 * 60 * 1000; // 5 min
const SESSION_STORAGE_KEY = "usuario_session_cache";

interface UsuarioCacheData {
  usuario: UsuarioCompleto;
  timestamp: number;
  sessionId: string;
}

// ─────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [usuarioCompleto, setUsuarioCompleto] =
    useState<UsuarioCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  const cargandoUsuario = useRef(false);
  const ultimoUsuarioId = useRef<string | null>(null);
  const cacheTimestamp = useRef<number>(0);
  const sessionId = useRef<string>("");

  const {
    iglesiaActiva,
    mostrarSelectorIglesias,
    setIglesiaActiva,
    setMostrarSelectorIglesias,
    limpiarIglesia,
  } = useIglesiaStore();

  const supabase = createClient();

  // Generar session ID único una sola vez
  useEffect(() => {
    if (!sessionId.current) {
      sessionId.current = `${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
    }
  }, []);

  // ── Helpers de caché ──────────────────────────────────────────────────────
  const cargarDesdeCache = useCallback((): UsuarioCompleto | null => {
    try {
      const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return null;
      const data: UsuarioCacheData = JSON.parse(raw);
      // Validar caché inline para evitar dependencia externa
      const valido =
        Date.now() - data.timestamp < CACHE_DURATION &&
        data.sessionId === sessionId.current;
      if (valido) {
        cacheTimestamp.current = data.timestamp;
        return data.usuario;
      }
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    } catch {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
  }, []);

  const guardarEnCache = useCallback((usuario: UsuarioCompleto) => {
    try {
      const data: UsuarioCacheData = {
        usuario,
        timestamp: Date.now(),
        sessionId: sessionId.current,
      };
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
      cacheTimestamp.current = data.timestamp;
    } catch {
      // sessionStorage puede fallar en modo privado; ignorar
    }
  }, []);

  const limpiarCache = useCallback(() => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    cacheTimestamp.current = 0;
  }, []);

  // ── Iglesia helpers ───────────────────────────────────────────────────────
  const cargarIglesiaDesdeStorage = (): IglesiaActiva | null => {
    try {
      const raw = localStorage.getItem("iglesiaActiva");
      return raw ? JSON.parse(raw) : null;
    } catch {
      localStorage.removeItem("iglesiaActiva");
      return null;
    }
  };

  const establecerPrimeraIglesiaActiva = useCallback(
    (usuario: UsuarioCompleto) => {
      const activas = usuario.iglesias.filter((ui) => ui.estado === "ACTIVO");
      if (activas.length === 0) return;
      if (activas.length === 1) {
        setIglesiaActiva({
          id: activas[0].iglesia.id,
          nombre: activas[0].iglesia.nombre,
          logoUrl: activas[0].iglesia.logoUrl,
          rol: activas[0].rol,
          estado: activas[0].estado,
        });
      } else {
        setMostrarSelectorIglesias(true);
      }
    },
    [setIglesiaActiva, setMostrarSelectorIglesias]
  );

  const resolverIglesiaParaUsuario = useCallback(
    (usuario: UsuarioCompleto) => {
      if (iglesiaActiva) {
        const valida = usuario.iglesias.find(
          (ui) => ui.estado === "ACTIVO" && ui.iglesia.id === iglesiaActiva.id
        );
        if (!valida) {
          limpiarIglesia();
          establecerPrimeraIglesiaActiva(usuario);
        }
        return;
      }

      const desdeStorage = cargarIglesiaDesdeStorage();
      if (desdeStorage) {
        const valida = usuario.iglesias.find(
          (ui) => ui.estado === "ACTIVO" && ui.iglesia.id === desdeStorage.id
        );
        if (valida) {
          setIglesiaActiva(desdeStorage);
        } else {
          localStorage.removeItem("iglesiaActiva");
          establecerPrimeraIglesiaActiva(usuario);
        }
      } else {
        establecerPrimeraIglesiaActiva(usuario);
      }
    },
    [
      iglesiaActiva,
      limpiarIglesia,
      setIglesiaActiva,
      establecerPrimeraIglesiaActiva,
    ]
  );

  // ── Carga principal del usuario ───────────────────────────────────────────
  const cargarUsuarioCompleto = useCallback(
    async (authUser: User, forzarRecarga = false) => {
      // Evitar llamadas simultáneas
      if (
        cargandoUsuario.current &&
        ultimoUsuarioId.current === authUser.id &&
        !forzarRecarga
      ) {
        return;
      }

      // Intentar caché primero
      if (!forzarRecarga) {
        const enCache = cargarDesdeCache();
        if (enCache && enCache.id === authUser.id) {
          setUsuarioCompleto(enCache);
          resolverIglesiaParaUsuario(enCache);
          setInitializing(false);
          return;
        }

        // Caché en memoria válido (estado de React ya cargado)
        if (
          Date.now() - cacheTimestamp.current < CACHE_DURATION &&
          ultimoUsuarioId.current === authUser.id &&
          usuarioCompleto
        ) {
          setInitializing(false);
          return;
        }
      }

      cargandoUsuario.current = true;
      ultimoUsuarioId.current = authUser.id;

      try {
        const response = await fetch(`/api/usuarios/${authUser.id}`, {
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
          const usuario: UsuarioCompleto = await response.json();
          setUsuarioCompleto(usuario);
          guardarEnCache(usuario);
          resolverIglesiaParaUsuario(usuario);
        } else if (response.status === 404) {
          await crearUsuarioAutomaticamente(authUser);
        } else if (response.status === 401) {
          setUsuarioCompleto(null);
          limpiarIglesia();
          limpiarCache();
        }
      } catch (error) {
        console.error("Error cargando usuario:", error);
        setUsuarioCompleto(null);
        limpiarIglesia();
        limpiarCache();
      } finally {
        setInitializing(false);
        cargandoUsuario.current = false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [usuarioCompleto, cargarDesdeCache, guardarEnCache, limpiarCache, resolverIglesiaParaUsuario, limpiarIglesia]
  );

  const crearUsuarioAutomaticamente = async (authUser: User) => {
    try {
      const res = await fetch("/api/usuarios/crear-usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: authUser.id }),
      });
      if (res.ok) await cargarUsuarioCompleto(authUser);
    } catch (error) {
      console.error("Error creando usuario automáticamente:", error);
    }
  };

  // ── Efecto principal: suscripción a Supabase auth ─────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        cargarUsuarioCompleto(session.user);
      } else {
        limpiarIglesia();
        limpiarCache();
        setInitializing(false);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        const cambioDeUsuario = ultimoUsuarioId.current !== session.user.id;
        if (cambioDeUsuario || event === "SIGNED_IN") {
          setInitializing(true);
          await cargarUsuarioCompleto(session.user);
        }
      } else if (event === "SIGNED_OUT") {
        setUsuarioCompleto(null);
        limpiarIglesia();
        limpiarCache();
        setInitializing(false);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fallback: si ya hay usuarioCompleto pero no iglesia ──────────────────
  useEffect(() => {
    if (usuarioCompleto && !iglesiaActiva && !initializing) {
      establecerPrimeraIglesiaActiva(usuarioCompleto);
    }
  }, [usuarioCompleto, iglesiaActiva, initializing, establecerPrimeraIglesiaActiva]);

  // ── Acciones públicas ─────────────────────────────────────────────────────
  const signUp = (
    email: string,
    password: string,
    metadata: { nombres: string; apellidos: string }
  ) =>
    supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });

  const signIn = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password });

  const signOut = async () => {
    await supabase.auth.signOut();
    setUsuarioCompleto(null);
    limpiarIglesia();
    limpiarCache();
    localStorage.removeItem("iglesiaActiva");
  };

  const resetPassword = (email: string) =>
    supabase.auth.resetPasswordForEmail(email).then(() => {});

  const cambiarIglesia = (iglesia: IglesiaActiva) => {
    setIglesiaActiva(iglesia);
    limpiarCache();
    window.location.reload();
  };

  const seleccionarIglesia = (iglesia: IglesiaActiva) => {
    setIglesiaActiva(iglesia);
    setMostrarSelectorIglesias(false);
  };

  const refetch = async () => {
    if (user) {
      limpiarCache();
      await cargarUsuarioCompleto(user, true);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        usuarioCompleto,
        iglesiaActiva,
        loading,
        initializing,
        mostrarSelectorIglesias,
        signUp,
        signIn,
        signOut,
        resetPassword,
        cambiarIglesia,
        seleccionarIglesia,
        refetch,
        limpiarIglesia,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook de consumo ───────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }
  return ctx;
}
