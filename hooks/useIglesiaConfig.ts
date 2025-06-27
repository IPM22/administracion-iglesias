import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";

interface ConfiguracionIglesia {
  googleMapsEmbed?: string;
  ubicacionReferencia?: string;
  horariosCultos?: string;
  horarioOficina?: string;
  numeroWhatsapp?: string;
  mensajePromocion?: string;
  configNotificaciones?: boolean;
  // Mantenemos estas por compatibilidad con datos existentes
  coordenadasLat?: string;
  coordenadasLng?: string;
}

interface IglesiaConfig {
  id?: number;
  nombre?: string;
  direccion?: string;
  telefono?: string;
  correo?: string;
  logoUrl?: string;
  sitioWeb?: string;
  configuracion?: ConfiguracionIglesia;
}

export function useIglesiaConfig() {
  const { iglesiaActiva } = useAuth();
  const [config, setConfig] = useState<IglesiaConfig | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (iglesiaActiva?.id) {
      cargarConfiguracion();
    }
  }, [iglesiaActiva?.id]);

  const cargarConfiguracion = async () => {
    if (!iglesiaActiva?.id) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/iglesias/${iglesiaActiva.id}`);
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error("Error cargando configuración de iglesia:", error);
    } finally {
      setLoading(false);
    }
  };

  // Funciones de utilidad
  const obtenerDireccionCompleta = () => {
    if (!config) return "";
    return config.direccion || "";
  };

  const obtenerGoogleMapsEmbed = () => {
    if (!config?.configuracion) return "";
    return config.configuracion.googleMapsEmbed || "";
  };

  const obtenerCoordenadas = () => {
    if (!config?.configuracion) return null;
    const { coordenadasLat, coordenadasLng } = config.configuracion;
    if (coordenadasLat && coordenadasLng) {
      return {
        lat: parseFloat(coordenadasLat),
        lng: parseFloat(coordenadasLng),
      };
    }
    return null;
  };

  const obtenerContactoWhatsapp = () => {
    if (!config?.configuracion) return "";
    return config.configuracion.numeroWhatsapp || config.telefono || "";
  };

  const obtenerMensajePromocion = () => {
    if (!config?.configuracion) return "¡Te esperamos en nuestra iglesia! 🙏";
    return (
      config.configuracion.mensajePromocion ||
      "¡Te esperamos en nuestra iglesia! 🙏"
    );
  };

  const generarMensajeCompleto = (textoPersonalizado?: string) => {
    const mensaje = textoPersonalizado || obtenerMensajePromocion();
    const direccion = obtenerDireccionCompleta();
    const telefono = obtenerContactoWhatsapp();
    const sitioWeb = config?.sitioWeb;

    let mensajeCompleto = mensaje;
    if (direccion) mensajeCompleto += `\n\n📍 ${direccion}`;
    if (telefono) mensajeCompleto += `\n📞 ${telefono}`;
    if (sitioWeb) mensajeCompleto += `\n🌐 ${sitioWeb}`;

    return mensajeCompleto;
  };

  const abrirEnGoogleMaps = () => {
    const embedUrl = obtenerGoogleMapsEmbed();
    if (embedUrl) {
      window.open(embedUrl, "_blank");
    } else {
      // Fallback para coordenadas antiguas
      const coordenadas = obtenerCoordenadas();
      if (coordenadas) {
        const url = `https://www.google.com/maps?q=${coordenadas.lat},${coordenadas.lng}`;
        window.open(url, "_blank");
      } else if (config?.direccion) {
        const url = `https://www.google.com/maps/search/${encodeURIComponent(
          config.direccion
        )}`;
        window.open(url, "_blank");
      }
    }
  };

  const abrirEnWaze = () => {
    // Fallback para coordenadas si existen
    const coordenadas = obtenerCoordenadas();
    if (coordenadas) {
      const url = `https://waze.com/ul?ll=${coordenadas.lat},${coordenadas.lng}&navigate=yes`;
      window.open(url, "_blank");
    } else if (config?.direccion) {
      const url = `https://waze.com/ul?q=${encodeURIComponent(
        config.direccion
      )}`;
      window.open(url, "_blank");
    }
  };

  const copiarUbicacion = () => {
    const coordenadas = obtenerCoordenadas();
    if (coordenadas) {
      const texto = `${coordenadas.lat}, ${coordenadas.lng}`;
      navigator.clipboard.writeText(texto);
      return true;
    } else if (config?.direccion) {
      navigator.clipboard.writeText(config.direccion);
      return true;
    }
    return false;
  };

  return {
    config,
    loading,
    cargarConfiguracion,
    // Datos básicos
    nombre: config?.nombre,
    direccion: config?.direccion,
    telefono: config?.telefono,
    correo: config?.correo,
    logoUrl: config?.logoUrl,
    sitioWeb: config?.sitioWeb,
    // Configuración extendida
    configuracion: config?.configuracion,
    // Funciones de utilidad
    obtenerDireccionCompleta,
    obtenerGoogleMapsEmbed,
    obtenerCoordenadas,
    obtenerContactoWhatsapp,
    obtenerMensajePromocion,
    generarMensajeCompleto,
    abrirEnGoogleMaps,
    abrirEnWaze,
    copiarUbicacion,
  };
}
