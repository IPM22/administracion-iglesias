"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { MapPin, Navigation, Copy, ExternalLink, QrCode } from "lucide-react";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

interface LocationPickerProps {
  direccion?: string;
  latitud?: number;
  longitud?: number;
  onLocationChange: (data: {
    direccion: string;
    latitud?: number;
    longitud?: number;
  }) => void;
  className?: string;
}

export function LocationPicker({
  direccion = "",
  latitud,
  longitud,
  onLocationChange,
  className,
}: LocationPickerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualCoords, setManualCoords] = useState({
    lat: latitud?.toString() || "",
    lng: longitud?.toString() || "",
  });

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("La geolocalización no está disponible en este navegador");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setManualCoords({
          lat: lat.toString(),
          lng: lng.toString(),
        });

        onLocationChange({
          direccion,
          latitud: lat,
          longitud: lng,
        });

        setLoading(false);
      },
      (error) => {
        setError("Error al obtener la ubicación: " + error.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const handleManualCoordinatesChange = () => {
    const lat = parseFloat(manualCoords.lat);
    const lng = parseFloat(manualCoords.lng);

    if (!isNaN(lat) && !isNaN(lng)) {
      onLocationChange({
        direccion,
        latitud: lat,
        longitud: lng,
      });
      setError(null);
    } else {
      setError("Por favor ingresa coordenadas válidas");
    }
  };

  const handleDireccionChange = (nuevaDireccion: string) => {
    onLocationChange({
      direccion: nuevaDireccion,
      latitud,
      longitud,
    });
  };

  const hasCoordinates = latitud !== undefined && longitud !== undefined;

  const getGoogleMapsUrl = () => {
    if (!hasCoordinates) return "";
    return `https://www.google.com/maps?q=${latitud},${longitud}`;
  };

  const getWazeUrl = () => {
    if (!hasCoordinates) return "";
    return `https://waze.com/ul?ll=${latitud},${longitud}&navigate=yes`;
  };

  const copyCoordinates = () => {
    if (!hasCoordinates) return;
    const coordinates = `${latitud}, ${longitud}`;
    navigator.clipboard.writeText(coordinates);
  };

  const generateQRCode = () => {
    if (!hasCoordinates) return "";
    const mapsUrl = getGoogleMapsUrl();
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      mapsUrl
    )}`;
  };

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
                Ubicación GPS
              </CardTitle>
              <CardDescription>
                Ingresa coordenadas manualmente o usa tu ubicación actual
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGetCurrentLocation}
              disabled={loading}
            >
              <Navigation className="h-3 w-3 mr-1" />
              {loading ? "Obteniendo..." : "Ubicación Actual"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Ingreso manual de coordenadas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="latitud">Latitud</Label>
              <Input
                id="latitud"
                placeholder="Ej: 4.6097"
                value={manualCoords.lat}
                onChange={(e) =>
                  setManualCoords((prev) => ({ ...prev, lat: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitud">Longitud</Label>
              <Input
                id="longitud"
                placeholder="Ej: -74.0817"
                value={manualCoords.lng}
                onChange={(e) =>
                  setManualCoords((prev) => ({ ...prev, lng: e.target.value }))
                }
              />
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleManualCoordinatesChange}
            className="w-full"
          >
            Establecer Coordenadas
          </Button>

          {hasCoordinates ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-green-700 dark:text-green-400">
                    Coordenadas establecidas
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-500">
                    Lat: {latitud?.toFixed(6)}, Lng: {longitud?.toFixed(6)}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="text-green-700 dark:text-green-400"
                >
                  GPS
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(getGoogleMapsUrl(), "_blank")}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Google Maps
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(getWazeUrl(), "_blank")}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Waze
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyCoordinates}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copiar
                </Button>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <QrCode className="h-3 w-3 mr-1" />
                      QR Code
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Código QR de Ubicación</DialogTitle>
                      <DialogDescription>
                        Escanea este código para abrir la ubicación en Google
                        Maps
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center py-4">
                      <img
                        src={generateQRCode()}
                        alt="QR Code de ubicación"
                        className="rounded-lg border"
                      />
                    </div>
                    <div className="text-xs text-muted-foreground text-center">
                      {getGoogleMapsUrl()}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setManualCoords({ lat: "", lng: "" });
                  onLocationChange({ direccion });
                }}
                className="text-red-500 hover:text-red-600"
              >
                Quitar coordenadas GPS
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-sm text-muted-foreground mb-2">
                No se han establecido coordenadas GPS
              </div>
              <div className="text-xs text-muted-foreground">
                Ingresa coordenadas manualmente o usa el botón &quot;Ubicación
                Actual&quot;
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Puedes obtener coordenadas desde{" "}
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={() =>
                    window.open("https://maps.google.com", "_blank")
                  }
                >
                  Google Maps
                </Button>{" "}
                haciendo clic derecho en el punto deseado
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
