import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

interface Ministerio {
  id: number;
  ministerio: {
    id: number;
    nombre: string;
    descripcion?: string;
    colorHex?: string;
  };
  rol?: string;
  fechaInicio?: string;
  fechaFin?: string;
  esLider?: boolean;
}

interface MinisteriosSectionProps {
  ministerios: Ministerio[];
  personaId: number;
  formatDate?: (fecha: string) => string;
  onVerTodos?: () => void;
}

export function MinisteriosSection({
  ministerios,
  personaId,
  formatDate,
  onVerTodos,
}: MinisteriosSectionProps) {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Ministerios Activos
            {ministerios && ministerios.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {ministerios.length}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={
              onVerTodos ||
              (() => router.push(`/miembros/${personaId}/ministerios`))
            }
          >
            Ver Todos
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {ministerios && ministerios.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No participa en ministerios actualmente
            </p>
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/miembros/${personaId}/ministerios/nuevo`)
              }
            >
              <Users className="mr-2 h-4 w-4" />
              Asignar Primer Ministerio
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {ministerios?.slice(0, 3).map((ministerioRel) => (
              <div
                key={ministerioRel.id}
                className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor:
                            ministerioRel.ministerio.colorHex || "#3b82f6",
                        }}
                      />
                      <h4 className="font-semibold text-lg text-blue-900 dark:text-blue-100">
                        {ministerioRel.ministerio.nombre}
                      </h4>
                      {ministerioRel.esLider && (
                        <Badge
                          variant="default"
                          className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
                        >
                          Líder
                        </Badge>
                      )}
                    </div>
                    {ministerioRel.rol && (
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                        {ministerioRel.rol}
                      </p>
                    )}
                    {ministerioRel.ministerio.descripcion && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {ministerioRel.ministerio.descripcion}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      {ministerioRel.fechaInicio && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Desde{" "}
                            {formatDate
                              ? formatDate(ministerioRel.fechaInicio)
                              : ministerioRel.fechaInicio}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                  >
                    Activo
                  </Badge>
                </div>
              </div>
            ))}
            {ministerios && ministerios.length > 3 && (
              <div className="text-center pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onVerTodos}
                  className="text-muted-foreground hover:text-primary"
                >
                  Ver {ministerios.length - 3} ministerio
                  {ministerios.length - 3 !== 1 ? "s" : ""} más
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
