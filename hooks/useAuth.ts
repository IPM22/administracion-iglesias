"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
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

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [usuarioCompleto, setUsuarioCompleto] =
    useState<UsuarioCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  // Zustand store
  const {
    iglesiaActiva,
    mostrarSelectorIglesias,
    setIglesiaActiva,
    setMostrarSelectorIglesias,
    limpiarIglesia,
  } = useIglesiaStore();

  const supabase = createClient();

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

  const cargarUsuarioCompleto = async (authUser: User) => {
    try {
      const response = await fetch(`/api/usuarios/${authUser.id}`);
      if (response.ok) {
        const usuario = await response.json();
        setUsuarioCompleto(usuario);

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
        console.log("👤 Usuario no encontrado, creando automáticamente...");
        await crearUsuarioAutomaticamente(authUser);
      }
    } catch (error) {
      console.error("Error cargando usuario completo:", error);
    } finally {
      setInitializing(false);
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
    window.location.reload(); // Recargar para refrescar datos
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        cargarUsuarioCompleto(session.user);
      } else {
        limpiarIglesia();
        setInitializing(false);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        setInitializing(true);
        cargarUsuarioCompleto(session.user);
      } else {
        setUsuarioCompleto(null);
        limpiarIglesia();
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
    localStorage.removeItem("iglesiaActiva");
    return await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email);
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
  };
}
