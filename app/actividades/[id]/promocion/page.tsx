"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users, Share2 } from "lucide-react";
import { useParams } from "next/navigation";

export default function PromocionActividadPage() {
  const params = useParams();
  const actividadId = params.id;

  // En una aplicación real, esto vendría de una API
  const actividad = {
    id: actividadId,
    nombre: "Conferencia Especial 2024",
    descripcion:
      "Una conferencia transformadora con invitados especiales que cambiará tu perspectiva de vida. Ven y experimenta el poder de la fe en comunidad.",
    fecha: "2024-02-10",
    hora: "18:00",
    lugar: "Auditorio Central",
    ubicacion: "Centro de Convenciones, Av. Principal 456, Ciudad",
    banner: "/placeholder.svg?height=400&width=800",
    organizador: "Iglesia Central",
    contacto: "+1 234-567-8900",
    email: "eventos@iglesiacentral.com",
    capacidad: 500,
    entrada: "Gratuita",
    coordenadas: "19.4326,-99.1332", // Coordenadas para el QR
  };

  const generateQRCode = () => {
    const googleMapsUrl = `https://www.google.com/maps?q=${actividad.coordenadas}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      googleMapsUrl
    )}`;
  };

  const shareActivity = () => {
    if (navigator.share) {
      navigator.share({
        title: actividad.nombre,
        text: actividad.descripcion,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Enlace copiado al portapapeles");
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toISOString().split("T")[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Banner Principal */}
          <Card className="overflow-hidden mb-8">
            <div className="relative">
              <img
                src={actividad.banner || "/placeholder.svg"}
                alt={actividad.nombre}
                className="w-full h-64 md:h-80 object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
                <div className="p-6 text-white">
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">
                    {actividad.nombre}
                  </h1>
                  <p className="text-lg opacity-90">{actividad.organizador}</p>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Información Principal */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <h2 className="text-2xl font-semibold">Sobre el Evento</h2>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {actividad.descripcion}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h2 className="text-2xl font-semibold">
                    Detalles del Evento
                  </h2>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Fecha</p>
                      <p className="text-muted-foreground">
                        {formatDate(actividad.fecha)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Hora</p>
                      <p className="text-muted-foreground">{actividad.hora}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium">Ubicación</p>
                      <p className="text-muted-foreground">{actividad.lugar}</p>
                      <p className="text-sm text-muted-foreground">
                        {actividad.ubicacion}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Capacidad</p>
                      <p className="text-muted-foreground">
                        {actividad.capacidad} personas
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Panel Lateral */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Información Rápida</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      ENTRADA
                    </p>
                    <Badge variant="secondary" className="mt-1">
                      {actividad.entrada}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      CONTACTO
                    </p>
                    <p className="text-sm">{actividad.contacto}</p>
                    <p className="text-sm text-blue-600">{actividad.email}</p>
                  </div>

                  <div className="pt-4 border-t">
                    <Button onClick={shareActivity} className="w-full mb-3">
                      <Share2 className="mr-2 h-4 w-4" />
                      Compartir Evento
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Ubicación</h3>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-4">
                    <img
                      src={generateQRCode() || "/placeholder.svg"}
                      alt="QR Code para ubicación"
                      className="mx-auto"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Escanea el código QR para abrir la ubicación en Google Maps
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(
                        `https://www.google.com/maps?q=${actividad.coordenadas}`,
                        "_blank"
                      )
                    }
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    Ver en Maps
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">¿Vienes?</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    ¡Nos encantaría verte ahí! Confirma tu asistencia.
                  </p>
                  <Button className="w-full">Confirmar Asistencia</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
