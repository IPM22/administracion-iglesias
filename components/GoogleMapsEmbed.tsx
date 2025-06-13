"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { MapPin, ExternalLink, Copy, Trash2 } from "lucide-react";
import { Badge } from "./ui/badge";

interface GoogleMapsEmbedProps {
  direccion?: string;
  googleMapsEmbed?: string;
  onLocationChange: (data: {
    direccion: string;
    googleMapsEmbed?: string;
  }) => void;
  className?: string;
}

export function GoogleMapsEmbed({
  direccion = "",
  googleMapsEmbed = "",
  onLocationChange,
  className,
}: GoogleMapsEmbedProps) {
  const [embedUrl, setEmbedUrl] = useState(googleMapsEmbed);
  const [error, setError] = useState<string | null>(null);

  const validateEmbedUrl = (url: string): boolean => {
    if (!url.trim()) return true; // Permitir vacío

    // Verificar si es un iframe de Google Maps
    const isGoogleMapsIframe =
      url.includes("google.com/maps/embed") &&
      url.includes("<iframe") &&
      url.includes("</iframe>");

    // Verificar si es solo la URL del src
    const isGoogleMapsUrl = url.includes("google.com/maps/embed");

    return isGoogleMapsIframe || isGoogleMapsUrl;
  };

  const extractSrcFromIframe = (iframeCode: string): string => {
    const srcMatch = iframeCode.match(/src="([^"]+)"/);
    return srcMatch ? srcMatch[1] : iframeCode;
  };

  const handleEmbedChange = (value: string) => {
    setEmbedUrl(value);

    if (!value.trim()) {
      setError(null);
      onLocationChange({
        direccion,
        googleMapsEmbed: undefined,
      });
      return;
    }

    if (validateEmbedUrl(value)) {
      setError(null);
      // Si es un iframe completo, extraer solo la URL del src
      const cleanUrl = extractSrcFromIframe(value);
      onLocationChange({
        direccion,
        googleMapsEmbed: cleanUrl,
      });
    } else {
      setError(
        "Por favor ingresa un código de embed de Google Maps válido o la URL del embed"
      );
    }
  };

  const handleDireccionChange = (nuevaDireccion: string) => {
    onLocationChange({
      direccion: nuevaDireccion,
      googleMapsEmbed: embedUrl || undefined,
    });
  };

  const clearEmbed = () => {
    setEmbedUrl("");
    setError(null);
    onLocationChange({
      direccion,
      googleMapsEmbed: undefined,
    });
  };

  const copyEmbed = () => {
    if (embedUrl) {
      navigator.clipboard.writeText(embedUrl);
    }
  };

  const hasEmbed = embedUrl && embedUrl.trim() !== "";

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <Label htmlFor="direccion">Dirección</Label>
        <Input
          id="direccion"
          placeholder="Ingresa la dirección del evento"
          value={direccion}
          onChange={(e) => handleDireccionChange(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Google Maps Embed
              </CardTitle>
              <CardDescription>
                Pega el código de embed de Google Maps o la URL del iframe
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.open("https://maps.google.com", "_blank")}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Abrir Maps
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="embed">Código de Embed de Google Maps</Label>
            <Textarea
              id="embed"
              placeholder='Ejemplo: <iframe src="https://www.google.com/maps/embed?pb=!1m14..." width="600" height="450"...></iframe>

O solo la URL:
https://www.google.com/maps/embed?pb=!1m14...'
              value={embedUrl}
              onChange={(e) => handleEmbedChange(e.target.value)}
              rows={4}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Ve a Google Maps, busca la ubicación, haz clic en
              &quot;Compartir&quot; → &quot;Insertar mapa&quot; y pega el código
              aquí
            </p>
          </div>

          {hasEmbed && !error && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-green-700 dark:text-green-400">
                    Embed de Google Maps configurado
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-500">
                    El mapa se mostrará en la vista de promoción
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="text-green-700 dark:text-green-400"
                >
                  Maps
                </Badge>
              </div>

              {/* Preview del iframe */}
              <div className="border rounded-lg p-2">
                <iframe
                  src={extractSrcFromIframe(embedUrl)}
                  width="100%"
                  height="200"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Vista previa de Google Maps"
                ></iframe>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyEmbed}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copiar
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearEmbed}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Quitar Embed
                </Button>
              </div>
            </div>
          )}

          {!hasEmbed && (
            <div className="text-center py-4">
              <div className="text-sm text-muted-foreground mb-2">
                No se ha configurado un embed de Google Maps
              </div>
              <div className="text-xs text-muted-foreground">
                Agrega un embed de Google Maps para mostrar la ubicación
                interactiva
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
