import React from "react";
import { Check, X, AlertTriangle, Phone } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface VerificationStatusProps {
  verificacion?: {
    numeroVerificado: boolean;
    mensaje: string;
    numeroFormateado?: string;
    advertencia?: string;
  } | null;
  telefono?: string;
  onVerificar?: () => void;
  mostrarBotonVerificar?: boolean;
}

export function VerificationStatus({
  verificacion,
  telefono,
  onVerificar,
  mostrarBotonVerificar = false,
}: VerificationStatusProps) {
  if (!verificacion && !telefono) {
    return null;
  }

  // Si no hay verificación pero sí hay teléfono, mostrar estado desconocido
  if (!verificacion && telefono) {
    return (
      <Alert className="border-gray-200">
        <Phone className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <strong>Número:</strong> {telefono}
            <br />
            <span className="text-sm text-muted-foreground">
              Estado de verificación no consultado
            </span>
          </div>
          {mostrarBotonVerificar && onVerificar && (
            <Button size="sm" variant="outline" onClick={onVerificar}>
              Verificar
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (!verificacion) return null;

  const isVerified = verificacion.numeroVerificado;

  return (
    <div className="space-y-2">
      {/* Estado de verificación */}
      <Alert
        className={
          isVerified
            ? "border-green-200 bg-green-50"
            : "border-orange-200 bg-orange-50"
        }
      >
        {isVerified ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <X className="h-4 w-4 text-orange-600" />
        )}
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <strong>{verificacion.numeroFormateado || telefono}</strong>
                <Badge
                  variant={isVerified ? "default" : "secondary"}
                  className={
                    isVerified
                      ? "bg-green-100 text-green-800"
                      : "bg-orange-100 text-orange-800"
                  }
                >
                  {isVerified ? "Verificado" : "No verificado"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {verificacion.mensaje}
              </p>
            </div>
            {!isVerified && mostrarBotonVerificar && onVerificar && (
              <Button size="sm" variant="outline" onClick={onVerificar}>
                Verificar ahora
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>

      {/* Advertencia adicional */}
      {verificacion.advertencia && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription>
            <strong>Advertencia:</strong> {verificacion.advertencia}
            <br />
            <span className="text-sm">
              💡 <strong>Solución:</strong> Ve a tu{" "}
              <a
                href="https://console.twilio.com/us1/develop/phone-numbers/manage/verified"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Console de Twilio
              </a>{" "}
              para verificar este número manualmente, o actualiza a cuenta paga.
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Información adicional para números no verificados */}
      {!isVerified && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            📱 ¿Cómo verificar este número?
          </h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>
              Ve a{" "}
              <a
                href="https://console.twilio.com/us1/develop/phone-numbers/manage/verified"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:no-underline"
              >
                Twilio Console → Verified Caller IDs
              </a>
            </li>
            <li>Haz clic en &quot;Add a new Caller ID&quot;</li>
            <li>
              Ingresa el número:{" "}
              <code className="bg-white px-1 rounded">
                {verificacion.numeroFormateado}
              </code>
            </li>
            <li>Selecciona &quot;SMS&quot; como método de verificación</li>
            <li>La persona recibirá un código por SMS para verificar</li>
          </ol>
          <p className="text-xs text-blue-600 mt-2">
            ⚡ <strong>Tip:</strong> En cuentas pagas no necesitas verificar
            números individualmente.
          </p>
        </div>
      )}
    </div>
  );
}
