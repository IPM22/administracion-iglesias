"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Users,
  Heart,
  Info,
} from "lucide-react";

interface EstadisticasSincronizacion {
  relacionesCreadas: number;
  relacionesActualizadas: number;
  familiasConsolidadas: number;
}

interface SincronizacionFamiliarProps {
  familiaId?: number;
  mostrarBotonConsolidar?: boolean;
  onSincronizacionCompleta?: (resultado: EstadisticasSincronizacion) => void;
}

export default function SincronizacionFamiliar({
  familiaId,
  mostrarBotonConsolidar = true,
  onSincronizacionCompleta,
}: SincronizacionFamiliarProps) {
  const [consolidando, setConsolidando] = useState(false);
  const [ultimoResultado, setUltimoResultado] =
    useState<EstadisticasSincronizacion | null>(null);
  const [mensaje, setMensaje] = useState<string>("");
  const [error, setError] = useState<string>("");

  const ejecutarConsolidacion = async () => {
    setConsolidando(true);
    setError("");
    setMensaje("");

    try {
      const body: { ejecutarConsolidacion: boolean; familiaId?: number } = {
        ejecutarConsolidacion: true,
      };
      if (familiaId) {
        body.familiaId = familiaId;
      }

      const response = await fetch("/api/familias/consolidar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al ejecutar consolidación");
      }

      setUltimoResultado(data.estadisticas);
      setMensaje(data.mensaje);

      if (onSincronizacionCompleta) {
        onSincronizacionCompleta(data.estadisticas);
      }
    } catch (error) {
      console.error("Error ejecutando consolidación:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Error al ejecutar consolidación"
      );
    } finally {
      setConsolidando(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-pink-600" />
          Sincronización de Relaciones Familiares
          {familiaId && (
            <Badge variant="outline" className="ml-2">
              Familia #{familiaId}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Información sobre la funcionalidad */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="font-medium text-blue-800 dark:text-blue-200">
              Información
            </span>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            La sincronización automática mantiene coherencia entre las
            relaciones familiares individuales y los núcleos familiares.
            {familiaId
              ? " Se procesará solo esta familia."
              : " Se procesarán todas las familias del sistema."}
          </p>
        </div>

        {/* Botón para ejecutar consolidación */}
        {mostrarBotonConsolidar && (
          <div className="flex flex-col gap-3">
            <Button
              onClick={ejecutarConsolidacion}
              disabled={consolidando}
              className="w-full"
              variant={ultimoResultado ? "outline" : "default"}
            >
              {consolidando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ejecutando sincronización...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {ultimoResultado
                    ? "Ejecutar nueva sincronización"
                    : "Ejecutar sincronización"}
                </>
              )}
            </Button>

            {consolidando && (
              <div className="text-center text-sm text-muted-foreground">
                Este proceso puede tomar unos momentos...
              </div>
            )}
          </div>
        )}

        {/* Mostrar errores */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-red-800 dark:text-red-200">{error}</span>
            </div>
          </div>
        )}

        {/* Mostrar mensaje de éxito */}
        {mensaje && !error && (
          <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-green-800 dark:text-green-200">
                {mensaje}
              </span>
            </div>
          </div>
        )}

        {/* Mostrar resultados de la última sincronización */}
        {ultimoResultado && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">
              Resultados de la última sincronización:
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <Heart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <div>
                  <div className="font-medium text-blue-900 dark:text-blue-100">
                    {ultimoResultado.relacionesCreadas}
                  </div>
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    Relaciones creadas
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <RefreshCw className="h-4 w-4 text-green-600 dark:text-green-400" />
                <div>
                  <div className="font-medium text-green-900 dark:text-green-100">
                    {ultimoResultado.relacionesActualizadas}
                  </div>
                  <div className="text-xs text-green-700 dark:text-green-300">
                    Relaciones actualizadas
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <div>
                  <div className="font-medium text-purple-900 dark:text-purple-100">
                    {ultimoResultado.familiasConsolidadas}
                  </div>
                  <div className="text-xs text-purple-700 dark:text-purple-300">
                    Familias consolidadas
                  </div>
                </div>
              </div>
            </div>

            {ultimoResultado.relacionesCreadas === 0 &&
              ultimoResultado.familiasConsolidadas === 0 && (
                <div className="text-center text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                  ✅ No se encontraron inconsistencias. El sistema está
                  sincronizado.
                </div>
              )}
          </div>
        )}

        {/* Información adicional para administradores */}
        <details className="text-sm">
          <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
            Información técnica
          </summary>
          <div className="mt-2 space-y-2 text-xs text-muted-foreground">
            <p>
              • La sincronización verifica relaciones familiares vs núcleos
              familiares
            </p>
            <p>
              • Crea familias automáticamente para relaciones que lo requieren
            </p>
            <p>
              • Fusiona familias pequeñas con familias más grandes cuando es
              necesario
            </p>
            <p>• Mantiene compatibilidad con el sistema legacy de relaciones</p>
            {!familiaId && (
              <p className="text-amber-600 dark:text-amber-400">
                ⚠️ La consolidación completa puede modificar múltiples familias
              </p>
            )}
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
