import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useIglesiaConfig } from "@/hooks/useIglesiaConfig";
import {
  MapPin,
  Phone,
  Copy,
  ExternalLink,
  Building2,
  Clock,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

interface ActividadFormHelpersProps {
  onUseAddress?: (direccion: string) => void;
  onUsePhone?: (telefono: string) => void;
  onGeneratePromotionMessage?: (mensaje: string) => void;
  className?: string;
}

export function ActividadFormHelpers({
  onUseAddress,
  onUsePhone,
  onGeneratePromotionMessage,
  className = "",
}: ActividadFormHelpersProps) {
  const {
    nombre,
    direccion,
    logoUrl,
    configuracion,
    obtenerContactoWhatsapp,
    generarMensajeCompleto,
    abrirEnGoogleMaps,
  } = useIglesiaConfig();

  const handleUseAddress = () => {
    if (direccion && onUseAddress) {
      onUseAddress(direccion);
      toast.success("Dirección de la iglesia aplicada");
    }
  };

  const handleUsePhone = () => {
    const contact = obtenerContactoWhatsapp();
    if (contact && onUsePhone) {
      onUsePhone(contact);
      toast.success("Número de contacto aplicado");
    }
  };

  const handleGenerateMessage = () => {
    const mensaje = generarMensajeCompleto();
    if (onGeneratePromotionMessage) {
      onGeneratePromotionMessage(mensaje);
      toast.success("Mensaje promocional generado");
    }
  };

  if (!nombre) {
    return null; // No mostrar si no hay configuración cargada
  }

  return (
    <Card className={`${className} border-primary/20 bg-primary/5`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-4 w-4 text-primary" />
          Configuración de {nombre}
        </CardTitle>
        <CardDescription>
          Usa la información preconfigurada de tu iglesia para ahorrar tiempo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Información disponible */}
        <div className="grid gap-3">
          {/* Dirección */}
          {direccion && (
            <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm truncate">{direccion}</span>
              </div>
              <div className="flex gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleUseAddress}
                  className="h-8 px-2"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={abrirEnGoogleMaps}
                  className="h-8 px-2"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Teléfono/WhatsApp */}
          {obtenerContactoWhatsapp() && (
            <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm">{obtenerContactoWhatsapp()}</span>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleUsePhone}
                className="h-8 px-2"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Horarios de cultos */}
          {configuracion?.horariosCultos && (
            <div className="p-3 bg-white/60 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Horarios de Cultos</span>
              </div>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                {configuracion.horariosCultos}
              </pre>
            </div>
          )}

          {/* Horarios de oficina */}
          {configuracion?.horarioOficina && (
            <div className="p-3 bg-white/60 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Horario de Oficina</span>
              </div>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                {configuracion.horarioOficina}
              </pre>
            </div>
          )}
        </div>

        {/* Acciones rápidas */}
        <div className="space-y-2 pt-2 border-t border-border/50">
          <div className="flex flex-wrap gap-2">
            {direccion && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleUseAddress}
                className="text-xs"
              >
                <MapPin className="h-3 w-3 mr-1" />
                Usar Dirección
              </Button>
            )}

            {obtenerContactoWhatsapp() && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleUsePhone}
                className="text-xs"
              >
                <Phone className="h-3 w-3 mr-1" />
                Usar Contacto
              </Button>
            )}

            {onGeneratePromotionMessage && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleGenerateMessage}
                className="text-xs"
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Generar Promoción
              </Button>
            )}
          </div>

          {logoUrl && (
            <div className="flex items-center gap-2 p-2 bg-white/40 rounded border border-dashed border-primary/30">
              <img
                src={logoUrl}
                alt="Logo de la iglesia"
                className="h-8 w-8 object-contain rounded"
              />
              <span className="text-xs text-muted-foreground">
                Logo disponible para usar en promociones
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Componente específico para mostrar información de ubicación
export function IglesiaLocationInfo() {
  const {
    nombre,
    direccion,
    configuracion,
    obtenerGoogleMapsEmbed,
    abrirEnGoogleMaps,
    abrirEnWaze,
    copiarUbicacion,
  } = useIglesiaConfig();

  const googleMapsEmbed = obtenerGoogleMapsEmbed();

  if (!direccion) return null;

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <MapPin className="h-4 w-4 text-blue-600" />
          Ubicación de {nombre}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm">{direccion}</p>

        {configuracion?.ubicacionReferencia && (
          <p className="text-xs text-muted-foreground">
            <strong>Referencias:</strong> {configuracion.ubicacionReferencia}
          </p>
        )}

        {googleMapsEmbed && (
          <div className="flex items-center gap-1">
            <Badge
              variant="outline"
              className="text-xs text-green-600 border-green-200"
            >
              ✅ Google Maps configurado
            </Badge>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={abrirEnGoogleMaps}
            className="text-xs"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Google Maps
          </Button>
          {direccion && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={abrirEnWaze}
              className="text-xs"
            >
              🚗 Waze
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={copiarUbicacion}
            className="text-xs"
          >
            <Copy className="h-3 w-3 mr-1" />
            Copiar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para botón que reutiliza la ubicación de la iglesia
export function UseIglesiaLocationButton({
  onLocationSet,
}: {
  onLocationSet: (data: {
    direccion: string;
    googleMapsEmbed?: string;
  }) => void;
}) {
  const { direccion, obtenerGoogleMapsEmbed } = useIglesiaConfig();

  const googleMapsEmbed = obtenerGoogleMapsEmbed();

  if (!direccion) {
    return (
      <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30">
        <CardContent className="p-4">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            No hay ubicación configurada en la iglesia.
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 ml-1"
              onClick={() => window.open("/configuracion", "_blank")}
            >
              Configurar ubicación
            </Button>
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleUseIglesiaLocation = () => {
    onLocationSet({
      direccion,
      googleMapsEmbed: googleMapsEmbed || undefined,
    });
    toast.success("Ubicación de la iglesia aplicada");
  };

  return (
    <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/30">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              📍 Usar ubicación de la iglesia
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              {direccion}
            </p>
            {googleMapsEmbed && (
              <Badge
                variant="outline"
                className="text-xs text-green-600 dark:text-green-400 border-green-200 dark:border-green-700 mt-1"
              >
                Con Google Maps
              </Badge>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUseIglesiaLocation}
            className="text-green-700 dark:text-green-400 border-green-300 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/50"
          >
            <MapPin className="h-3 w-3 mr-1" />
            Usar esta ubicación
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
