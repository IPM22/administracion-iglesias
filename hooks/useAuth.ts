"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useRef } from "react";
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

// Configuración del caché
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos en milisegundos
const SESSION_STORAGE_KEY = "usuario_session_cache";

interface UsuarioCacheData {
  usuario: UsuarioCompleto;
  timestamp: number;
  sessionId: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [usuarioCompleto, setUsuarioCompleto] =
    useState<UsuarioCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  // Refs para evitar llamadas duplicadas
  const cargandoUsuario = useRef(false);
  const ultimoUsuarioId = useRef<string | null>(null);
  const cacheTimestamp = useRef<number>(0);
  const sessionId = useRef<string>("");

  // Zustand store
  const {
    iglesiaActiva,
    mostrarSelectorIglesias,
    setIglesiaActiva,
    setMostrarSelectorIglesias,
    limpiarIglesia,
  } = useIglesiaStore();

  const supabase = createClient();

  // Generar ID de sesión único al inicializar
  useEffect(() => {
    if (!sessionId.current) {
      sessionId.current = `${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
    }
  }, []);

  // Función para verificar si el caché es válido
  const esCacheValido = (cacheData: UsuarioCacheData): boolean => {
    const ahora = Date.now();
    const edadCache = ahora - cacheData.timestamp;

    // Verificar si el caché no ha expirado y pertenece a la misma sesión
    return (
      edadCache < CACHE_DURATION && cacheData.sessionId === sessionId.current
    );
  };

  // Función para cargar desde caché
  const cargarDesdeCache = (): UsuarioCompleto | null => {
    try {
      const cacheDataStr = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!cacheDataStr) return null;

      const cacheData: UsuarioCacheData = JSON.parse(cacheDataStr);

      if (esCacheValido(cacheData)) {
        console.log("✅ Cargando usuario desde caché de sesión");
        cacheTimestamp.current = cacheData.timestamp;
        return cacheData.usuario;
      } else {
        console.log("⏰ Caché de usuario expirado, se requiere nueva consulta");
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
      }
    } catch (error) {
      console.error("Error cargando desde caché:", error);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
  };

  // Función para guardar en caché
  const guardarEnCache = (usuario: UsuarioCompleto) => {
    try {
      const ahora = Date.now();
      const cacheData: UsuarioCacheData = {
        usuario,
        timestamp: ahora,
        sessionId: sessionId.current,
      };

      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(cacheData));
      cacheTimestamp.current = ahora;
      console.log("💾 Usuario guardado en caché de sesión");
    } catch (error) {
      console.error("Error guardando en caché:", error);
    }
  };

  // Función para limpiar caché
  const limpiarCache = () => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    cacheTimestamp.current = 0;
    console.log("🗑️ Caché de usuario limpiado");
  };

  // Función de diagnóstico para verificar conectividad
  const verificarConectividad = async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/health", {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  const cargarIglesiaDesdeStorage = (): IglesiaActiva | null => {
    try {
      const iglesiaGuardada = localStorage.getItem("iglesiaActiva");
      if (iglesiaGuardada) {
        return JSON.parse(iglesiaGuardada);
      }
    } catch (error) {
      console.error("Error parsing iglesia activa:", error);
      localStorage.removeItem("iglesiaActiva");
    }
    return null;
  };

  const cargarUsuarioCompleto = async (
    authUser: User,
    forzarRecarga = false
  ) => {
    // Evitar múltiples cargas simultáneas del mismo usuario
    if (
      cargandoUsuario.current &&
      ultimoUsuarioId.current === authUser.id &&
      !forzarRecarga
    ) {
      console.log("⏭️ Carga de usuario ya en progreso, saltando...");
      return;
    }

    // Intentar cargar desde caché primero (solo si no es recarga forzada)
    if (!forzarRecarga) {
      const usuarioEnCache = cargarDesdeCache();
      if (usuarioEnCache && usuarioEnCache.id === authUser.id) {
        setUsuarioCompleto(usuarioEnCache);
        setInitializing(false);

        // Verificar iglesia activa desde el caché
        if (!iglesiaActiva) {
          const iglesiaDesdeStorage = cargarIglesiaDesdeStorage();
          if (iglesiaDesdeStorage) {
            const iglesiaValida = usuarioEnCache.iglesias.find(
              (ui: {
                estado: string;
                iglesia: { id: number; nombre: string; logoUrl?: string };
                rol: string;
              }) =>
                ui.estado === "ACTIVO" &&
                ui.iglesia.id === iglesiaDesdeStorage.id
            );

            if (iglesiaValida) {
              setIglesiaActiva(iglesiaDesdeStorage);
            } else {
              localStorage.removeItem("iglesiaActiva");
              establecerPrimeraIglesiaActiva(usuarioEnCache);
            }
          } else {
            establecerPrimeraIglesiaActiva(usuarioEnCache);
          }
        }
        return;
      }
    }

    const ahora = Date.now();

    // Si no es recarga forzada y el caché aún es válido, no recargar
    if (
      !forzarRecarga &&
      ahora - cacheTimestamp.current < CACHE_DURATION &&
      ultimoUsuarioId.current === authUser.id &&
      usuarioCompleto
    ) {
      console.log("⚡ Usuario ya cargado y caché válido, saltando consulta");
      setInitializing(false);
      return;
    }

    cargandoUsuario.current = true;
    ultimoUsuarioId.current = authUser.id;

    try {
      console.log("🔄 Consultando datos del usuario desde la API");
      const response = await fetch(`/api/usuarios/${authUser.id}`, {
        headers: {
          "Content-Type": "application/json",
        },
        // Agregar timeout para evitar esperas indefinidas
        signal: AbortSignal.timeout(10000), // 10 segundos
      });

      // Verificar si la respuesta es realmente JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.warn("La respuesta no es JSON, posible redirección a login");
        throw new Error("Respuesta inválida del servidor");
      }

      if (response.ok) {
        const usuario = await response.json();
        setUsuarioCompleto(usuario);

        // Guardar en caché
        guardarEnCache(usuario);

        // Si ya hay una iglesia en Zustand, verificar que sea válida
        if (iglesiaActiva) {
          const iglesiaValida = usuario.iglesias.find(
            (ui: {
              estado: string;
              iglesia: { id: number; nombre: string; logoUrl?: string };
              rol: string;
            }) => ui.estado === "ACTIVO" && ui.iglesia.id === iglesiaActiva.id
          );

          if (!iglesiaValida) {
            // Iglesia no válida, limpiar y establecer nueva
            limpiarIglesia();
            establecerPrimeraIglesiaActiva(usuario);
          }
        } else {
          // No hay iglesia activa, intentar cargar desde localStorage o establecer primera
          const iglesiaDesdeStorage = cargarIglesiaDesdeStorage();
          if (iglesiaDesdeStorage) {
            const iglesiaValida = usuario.iglesias.find(
              (ui: {
                estado: string;
                iglesia: { id: number; nombre: string; logoUrl?: string };
                rol: string;
              }) =>
                ui.estado === "ACTIVO" &&
                ui.iglesia.id === iglesiaDesdeStorage.id
            );

            if (iglesiaValida) {
              setIglesiaActiva(iglesiaDesdeStorage);
            } else {
              localStorage.removeItem("iglesiaActiva");
              establecerPrimeraIglesiaActiva(usuario);
            }
          } else {
            establecerPrimeraIglesiaActiva(usuario);
          }
        }
      } else if (response.status === 404) {
        // Usuario no existe, crear automáticamente
        await crearUsuarioAutomaticamente(authUser);
      } else if (response.status === 401) {
        // Usuario no autenticado, limpiar estado y caché
        console.warn("Usuario no autenticado, limpiando estado");
        setUsuarioCompleto(null);
        limpiarIglesia();
        limpiarCache();
      } else {
        throw new Error(`Error del servidor: ${response.status}`);
      }
    } catch (error) {
      console.error("Error cargando usuario completo:", error);

      // Verificar conectividad antes de mostrar errores
      const tieneConectividad = await verificarConectividad();
      if (!tieneConectividad) {
        console.error(
          "❌ Sin conectividad al servidor. Verificar que Next.js esté funcionando en puerto 3000"
        );
      }

      // Manejo específico de diferentes tipos de errores
      if (error instanceof TypeError) {
        if (error.message.includes("Failed to fetch")) {
          console.error(
            "❌ Error de conectividad: No se puede conectar al servidor"
          );
          console.error(
            "🔍 Verificar que el servidor esté ejecutándose en el puerto correcto"
          );
        } else if (error.message.includes("fetch")) {
          console.error("❌ Error de red al hacer fetch");
        }
      } else if (error instanceof DOMException) {
        if (error.name === "AbortError") {
          console.error("❌ Timeout: La petición tardó más de 10 segundos");
        }
      } else if (error instanceof Error) {
        console.error("❌ Error específico:", error.message);
      }

      // Limpiar el estado para evitar bucles infinitos
      setUsuarioCompleto(null);
      limpiarIglesia();
      limpiarCache();
    } finally {
      setInitializing(false);
      cargandoUsuario.current = false;
    }
  };

  const establecerPrimeraIglesiaActiva = (usuario: UsuarioCompleto) => {
    const iglesiasActivas = usuario.iglesias.filter(
      (ui) => ui.estado === "ACTIVO"
    );

    if (iglesiasActivas.length === 0) {
      // No hay iglesias activas
      return;
    } else if (iglesiasActivas.length === 1) {
      // Solo una iglesia activa, seleccionar automáticamente
      const primeraIglesiaActiva = iglesiasActivas[0];
      const nuevaIglesiaActiva: IglesiaActiva = {
        id: primeraIglesiaActiva.iglesia.id,
        nombre: primeraIglesiaActiva.iglesia.nombre,
        logoUrl: primeraIglesiaActiva.iglesia.logoUrl,
        rol: primeraIglesiaActiva.rol,
        estado: primeraIglesiaActiva.estado,
      };
      setIglesiaActiva(nuevaIglesiaActiva);
    } else {
      // Múltiples iglesias activas, mostrar selector
      setMostrarSelectorIglesias(true);
    }
  };

  const seleccionarIglesia = (iglesia: IglesiaActiva) => {
    setIglesiaActiva(iglesia);
    setMostrarSelectorIglesias(false);
  };

  const crearUsuarioAutomaticamente = async (authUser: User) => {
    try {
      const response = await fetch("/api/usuarios/crear-usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: authUser.id }),
      });

      if (response.ok) {
        console.log("✅ Usuario creado automáticamente");
        await cargarUsuarioCompleto(authUser);
      } else {
        console.error("❌ Error creando usuario automáticamente");
      }
    } catch (error) {
      console.error("Error creando usuario automáticamente:", error);
    }
  };

  const cambiarIglesia = (iglesia: IglesiaActiva) => {
    setIglesiaActiva(iglesia);

    // Limpiar caché al cambiar de iglesia para forzar nueva carga de datos específicos
    limpiarCache();

    window.location.reload(); // Recargar para refrescar datos
  };

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
      console.log(`🔐 Auth state change: ${event}`);

      setUser(session?.user ?? null);

      if (session?.user) {
        // Solo cargar si el usuario ha cambiado o si es el primer login
        const usuarioHaCambiado = ultimoUsuarioId.current !== session.user.id;
        const esPrimerLogin =
          event === "SIGNED_IN" || event === "TOKEN_REFRESHED";

        if (usuarioHaCambiado || esPrimerLogin) {
          setInitializing(true);
          await cargarUsuarioCompleto(session.user);
        }
      } else {
        // Solo limpiar en logout real, no en refresh de tokens
        if (event === "SIGNED_OUT") {
          console.log("🚪 Usuario cerró sesión, limpiando estado");
          setUsuarioCompleto(null);
          limpiarIglesia();
          limpiarCache();
        }
        setInitializing(false);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (usuarioCompleto && !iglesiaActiva && !initializing) {
      establecerPrimeraIglesiaActiva(usuarioCompleto);
    }
  }, [usuarioCompleto, iglesiaActiva, initializing]);

  const signUp = async (
    email: string,
    password: string,
    metadata: { nombres: string; apellidos: string }
  ) => {
    console.log("🔍 DEBUG - Attempting signup with:", {
      email: email,
      metadata: metadata,
    });

    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    console.log("🔍 DEBUG - Signup result:", {
      user: result.data.user ? "Created" : "Not created",
      session: result.data.session ? "Created" : "Not created",
      error: result.error ? result.error.message : "No error",
    });

    return result;
  };

  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUsuarioCompleto(null);
    limpiarIglesia();
    // Limpiar caché al cerrar sesión
    limpiarCache();
    localStorage.removeItem("iglesiaActiva");
  };

  const resetPassword = async (email: string) => {
    await supabase.auth.resetPasswordForEmail(email);
  };

  const refetch = async () => {
    if (user) {
      // Forzar recarga limpiando caché
      limpiarCache();
      await cargarUsuarioCompleto(user, true);
    }
  };

  return {
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
    cargarUsuarioCompleto,
    refetch,
    limpiarIglesia,
  };
}
