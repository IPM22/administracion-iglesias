"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeTypes,
  Panel,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { AppSidebar } from "../../../../components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Crown,
  Heart,
  Baby,
  User,
  Users,
  HomeIcon,
  Loader2,
  Calendar,
  Mail,
  Phone,
  UserCheck,
  Link as LinkIcon,
  GitBranch,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { calcularEdad } from "@/lib/date-utils";
import { ModeToggle } from "../../../../components/mode-toggle";

interface FamiliaDetalle {
  id: number;
  apellido: string;
  nombre?: string;
  estado: string;
  jefeFamilia?: {
    id: number;
    nombres: string;
    apellidos: string;
    foto?: string;
    fechaNacimiento?: string;
  };
  miembros: MiembroFamilia[];
  visitas: VisitaFamilia[];
  vinculosOrigen: VinculoFamiliar[];
  vinculosRelacionados: VinculoFamiliar[];
  familiasRelacionadasCompletas?: FamiliaDetalle[];
}

interface MiembroFamilia {
  id: number;
  nombres: string;
  apellidos: string;
  fechaNacimiento?: string;
  estado: string;
  foto?: string;
  parentescoFamiliar?: string;
  correo?: string;
  telefono?: string;
}

interface VisitaFamilia {
  id: number;
  nombres: string;
  apellidos: string;
  fechaNacimiento?: string;
  estado: string;
  foto?: string;
  parentescoFamiliar?: string;
  correo?: string;
  telefono?: string;
}

interface VinculoFamiliar {
  id: number;
  tipoVinculo: string;
  descripcion?: string;
  familiaOrigen: {
    id: number;
    apellido: string;
    nombre?: string;
    estado: string;
  };
  familiaRelacionada: {
    id: number;
    apellido: string;
    nombre?: string;
    estado: string;
  };
  miembroVinculo?: {
    id: number;
    nombres: string;
    apellidos: string;
  };
}

interface PersonaArbol extends MiembroFamilia {
  tipo: "miembro" | "visita";
  familiaId?: number; // Para identificar personas de familias relacionadas
}

interface FamiliaRelacionada {
  id: number;
  apellido: string;
  nombre?: string;
  estado: string;
  miembros?: PersonaArbol[];
  visitas?: PersonaArbol[];
}

// Componente personalizado para nodos de personas
const PersonaNode = ({
  data,
}: {
  data: {
    persona: PersonaArbol;
    onPersonaClick: (persona: PersonaArbol) => void;
    esFamiliaRelacionada?: boolean;
  };
}) => {
  const { persona, onPersonaClick, esFamiliaRelacionada } = data;

  const getIcon = () => {
    if (!persona.parentescoFamiliar) return <User className="h-4 w-4" />;

    switch (persona.parentescoFamiliar.toLowerCase()) {
      case "cabeza de familia":
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case "esposo/a":
      case "esposa":
      case "esposo":
      case "cónyuge":
        return <Heart className="h-4 w-4 text-red-600" />;
      case "hijo/a":
      case "hijo":
      case "hija":
        return <Baby className="h-4 w-4 text-blue-600" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  return (
    <>
      {/* Handles para las conexiones */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      <Card
        className={`min-w-[200px] max-w-[250px] border-2 hover:border-primary/50 transition-colors cursor-pointer ${
          esFamiliaRelacionada
            ? "border-orange-300 bg-orange-50/50 dark:bg-orange-900/10 dark:border-orange-700"
            : "border-border"
        }`}
        onClick={() => onPersonaClick(persona)}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={persona.foto || "/placeholder.svg"} />
              <AvatarFallback>
                {persona.nombres[0]}
                {persona.apellidos[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {getIcon()}
                <p className="font-semibold text-sm truncate">
                  {persona.nombres} {persona.apellidos}
                </p>
              </div>
              {persona.parentescoFamiliar && (
                <Badge variant="outline" className="text-xs mb-2">
                  {persona.parentescoFamiliar}
                </Badge>
              )}
              <div className="space-y-1">
                {persona.fechaNacimiento && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {calcularEdad(persona.fechaNacimiento)} años
                  </div>
                )}
                {persona.correo && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{persona.correo}</span>
                  </div>
                )}
                {persona.telefono && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {persona.telefono}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Badge
                    variant={persona.tipo === "miembro" ? "default" : "outline"}
                    className="text-xs"
                  >
                    {persona.tipo === "miembro" ? (
                      <>
                        <UserCheck className="h-3 w-3 mr-1" />
                        Miembro
                      </>
                    ) : (
                      <>
                        <Users className="h-3 w-3 mr-1" />
                        Visita
                      </>
                    )}
                  </Badge>
                  {esFamiliaRelacionada && (
                    <Badge variant="secondary" className="text-xs">
                      <LinkIcon className="h-3 w-3 mr-1" />
                      Familia Relacionada
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

// Componente personalizado para nodos de familias relacionadas
const FamiliaNode = ({
  data,
}: {
  data: {
    familia: FamiliaRelacionada;
    vinculo: VinculoFamiliar;
    familiaActual?: {
      id: number;
      apellido: string;
      nombre?: string;
      estado: string;
    };
    onFamiliaClick: (familia: FamiliaRelacionada) => void;
  };
}) => {
  const { familia, vinculo, onFamiliaClick } = data;

  return (
    <>
      {/* Handles para las conexiones */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      <Card
        className="min-w-[200px] max-w-[250px] border-2 border-orange-300 bg-orange-50/50 dark:bg-orange-900/10 dark:border-orange-700 hover:border-orange-400 transition-colors cursor-pointer"
        onClick={() => onFamiliaClick(familia)}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <HomeIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <LinkIcon className="h-4 w-4 text-orange-600" />
                <p className="font-semibold text-sm truncate">
                  {familia.nombre || `Familia ${familia.apellido}`}
                </p>
              </div>
              <Badge
                variant="outline"
                className="text-xs mb-2 border-orange-300"
              >
                {vinculo.tipoVinculo}
              </Badge>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  Familia Relacionada
                </div>
                {vinculo.miembroVinculo && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <UserCheck className="h-3 w-3" />
                    <span className="truncate">
                      Conecta: {vinculo.miembroVinculo.nombres}{" "}
                      {vinculo.miembroVinculo.apellidos}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

const nodeTypes: NodeTypes = {
  persona: PersonaNode,
  familia: FamiliaNode,
};

export default function ArbolFamiliarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [familia, setFamilia] = useState<FamiliaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarFamiliasExpandidas, setMostrarFamiliasExpandidas] =
    useState(true);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    if (id) {
      cargarDatos();
    }
  }, [id]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar datos de la familia principal
      const response = await fetch(`/api/familias/${id}`);
      if (response.ok) {
        const familiaData = await response.json();

        // Si está en vista extendida, cargar datos de familias relacionadas
        if (
          mostrarFamiliasExpandidas &&
          (familiaData.vinculosOrigen.length > 0 ||
            familiaData.vinculosRelacionados.length > 0)
        ) {
          console.log("Cargando datos de familias relacionadas...");

          // Obtener IDs únicos de familias relacionadas
          const familiasRelacionadasIds = new Set<number>();

          familiaData.vinculosOrigen.forEach((vinculo: VinculoFamiliar) => {
            if (vinculo.familiaRelacionada.id !== familiaData.id) {
              familiasRelacionadasIds.add(vinculo.familiaRelacionada.id);
            }
          });

          familiaData.vinculosRelacionados.forEach(
            (vinculo: VinculoFamiliar) => {
              if (vinculo.familiaOrigen.id !== familiaData.id) {
                familiasRelacionadasIds.add(vinculo.familiaOrigen.id);
              }
            }
          );

          // Cargar datos completos de familias relacionadas
          const familiasRelacionadasPromises = Array.from(
            familiasRelacionadasIds
          ).map(async (familiaId) => {
            try {
              const famResponse = await fetch(`/api/familias/${familiaId}`);
              if (famResponse.ok) {
                return await famResponse.json();
              }
              return null;
            } catch (error) {
              console.error(`Error cargando familia ${familiaId}:`, error);
              return null;
            }
          });

          const familiasRelacionadasData = await Promise.all(
            familiasRelacionadasPromises
          );
          const familiasValidas = familiasRelacionadasData.filter(
            (f) => f !== null
          );

          console.log("Familias relacionadas cargadas:", familiasValidas);

          // Agregar los datos de familias relacionadas al objeto principal
          familiaData.familiasRelacionadasCompletas = familiasValidas;
        }

        setFamilia(familiaData);
        console.log("✅ Familia establecida correctamente, generando nodos...");
        generarNodosYAristas(familiaData);
        // Asegurar que el error se limpie al finalizar exitosamente
        setError(null);
      } else {
        throw new Error("Error al cargar familia");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("No se pudieron cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const generarNodosYAristas = (familiaData: FamiliaDetalle) => {
    try {
      // Limpiar error al comenzar la generación de nodos
      setError(null);

      const nuevosNodos: Node[] = [];
      const nuevasAristas: Edge[] = [];

      // Validar que familiaData tenga la estructura correcta
      if (!familiaData || !familiaData.miembros || !familiaData.visitas) {
        console.error("Datos de familia inválidos:", familiaData);
        setError("Los datos de la familia no están completos");
        return;
      }

      // Combinar miembros y visitas de la familia principal
      const todasPersonas: PersonaArbol[] = [
        ...familiaData.miembros.map((m) => ({
          ...m,
          tipo: "miembro" as const,
        })),
        ...familiaData.visitas.map((v) => ({ ...v, tipo: "visita" as const })),
      ];

      if (todasPersonas.length === 0) {
        // Crear nodos de prueba si no hay datos
        nuevosNodos.push(
          {
            id: "test-1",
            type: "persona",
            position: { x: 100, y: 100 },
            data: {
              persona: {
                id: 1,
                nombres: "Test",
                apellidos: "Usuario",
                estado: "Activo",
                parentescoFamiliar: "Cabeza de Familia",
                tipo: "miembro",
              },
              onPersonaClick: () => {},
              esFamiliaRelacionada: false,
            },
          },
          {
            id: "test-2",
            type: "persona",
            position: { x: 300, y: 100 },
            data: {
              persona: {
                id: 2,
                nombres: "Test",
                apellidos: "Cónyuge",
                estado: "Activo",
                parentescoFamiliar: "Esposo/a",
                tipo: "miembro",
              },
              onPersonaClick: () => {},
              esFamiliaRelacionada: false,
            },
          },
          {
            id: "test-3",
            type: "persona",
            position: { x: 200, y: 300 },
            data: {
              persona: {
                id: 3,
                nombres: "Test",
                apellidos: "Hijo",
                estado: "Activo",
                parentescoFamiliar: "Hijo/a",
                tipo: "miembro",
              },
              onPersonaClick: () => {},
              esFamiliaRelacionada: false,
            },
          }
        );

        nuevasAristas.push(
          {
            id: "test-edge-1",
            source: "test-1",
            target: "test-2",
            style: { stroke: "#ff0000", strokeWidth: 4 },
            label: "Matrimonio",
          },
          {
            id: "test-edge-2",
            source: "test-1",
            target: "test-3",
            style: { stroke: "#00ff00", strokeWidth: 3 },
            label: "Padre-Hijo",
          }
        );

        setNodes(nuevosNodos);
        setEdges(nuevasAristas);
        return;
      }

      // Organización mejorada de la familia
      const organizarFamilia = () => {
        // Identificar roles familiares
        const jefeFamilia = familiaData.jefeFamilia
          ? todasPersonas.find(
              (p) =>
                p.id === familiaData.jefeFamilia!.id && p.tipo === "miembro"
            )
          : todasPersonas.find((p) =>
              p.parentescoFamiliar?.toLowerCase().includes("cabeza")
            ) || todasPersonas[0];

        const conyuge = todasPersonas.find(
          (p) =>
            p.id !== jefeFamilia?.id &&
            (p.parentescoFamiliar?.toLowerCase().includes("esposo") ||
              p.parentescoFamiliar?.toLowerCase().includes("esposa") ||
              p.parentescoFamiliar?.toLowerCase().includes("cónyuge"))
        );

        const hijos = todasPersonas.filter((p) =>
          p.parentescoFamiliar?.toLowerCase().includes("hijo")
        );

        const padres = todasPersonas.filter(
          (p) =>
            p.parentescoFamiliar?.toLowerCase().includes("padre") ||
            p.parentescoFamiliar?.toLowerCase().includes("madre")
        );

        const hermanos = todasPersonas.filter((p) =>
          p.parentescoFamiliar?.toLowerCase().includes("hermano")
        );

        const otros = todasPersonas.filter(
          (p) =>
            p.id !== jefeFamilia?.id &&
            p.id !== conyuge?.id &&
            !hijos.some((h) => h.id === p.id) &&
            !padres.some((pa) => pa.id === p.id) &&
            !hermanos.some((h) => h.id === p.id)
        );

        return { jefeFamilia, conyuge, hijos, padres, hermanos, otros };
      };

      const { jefeFamilia, conyuge, hijos, padres, hermanos, otros } =
        organizarFamilia();

      // Configuración mejorada de espaciado
      const NIVEL_ALTURA = 300;
      const ESPACIO_HORIZONTAL = 350;
      const CENTRO_X = 500;
      const NIVEL_BASE_Y = 400;

      console.log("Organizando familia:", {
        jefeFamilia,
        conyuge,
        hijos: hijos.length,
        padres: padres.length,
        hermanos: hermanos.length,
        otros: otros.length,
      });

      const posicionActual = { x: CENTRO_X, y: NIVEL_BASE_Y };

      // === CREAR JEFE DE FAMILIA ===
      if (jefeFamilia) {
        const jefeNodeId = `jefe-${jefeFamilia.id}`;

        nuevosNodos.push({
          id: jefeNodeId,
          type: "persona",
          position: {
            x: posicionActual.x,
            y: posicionActual.y,
          },
          data: {
            persona: jefeFamilia,
            onPersonaClick: (p: PersonaArbol) => {
              const ruta =
                p.tipo === "miembro" ? `/miembros/${p.id}` : `/visitas/${p.id}`;
              router.push(ruta);
            },
            esFamiliaRelacionada: false,
          },
        });

        // === CREAR CÓNYUGE ===
        if (conyuge) {
          const conyugeNodeId = `conyuge-${conyuge.id}`;

          const conyugePosition = {
            x: posicionActual.x + ESPACIO_HORIZONTAL,
            y: posicionActual.y,
          };

          nuevosNodos.push({
            id: conyugeNodeId,
            type: "persona",
            position: conyugePosition,
            data: {
              persona: conyuge,
              onPersonaClick: (p: PersonaArbol) => {
                const ruta =
                  p.tipo === "miembro"
                    ? `/miembros/${p.id}`
                    : `/visitas/${p.id}`;
                router.push(ruta);
              },
              esFamiliaRelacionada: false,
            },
          });

          // CREAR CONEXIÓN MATRIMONIAL - del lado derecho del jefe al lado izquierdo del cónyuge
          const edgeId = `matrimonio-${jefeFamilia.id}-${conyuge.id}`;

          nuevasAristas.push({
            id: edgeId,
            source: jefeNodeId,
            target: conyugeNodeId,
            style: {
              stroke: "#dc2626",
              strokeWidth: 4,
            },
            label: "💕",
          });
        }

        // === CREAR TODOS LOS HIJOS ===
        if (hijos.length > 0) {
          // CORREGIR: Calcular posiciones para distribuir hijos horizontalmente sin superposición
          const anchoTotalHijos = (hijos.length - 1) * 300; // Más espacio entre hijos
          const startX = conyuge
            ? (posicionActual.x + posicionActual.x + ESPACIO_HORIZONTAL) / 2 -
              anchoTotalHijos / 2 // Centro entre jefe y cónyuge
            : posicionActual.x - anchoTotalHijos / 2; // Centro en el jefe si no hay cónyuge

          hijos.forEach((hijo, index) => {
            const hijoNodeId = `hijo-${hijo.id}`;

            const hijoPosition = {
              x: startX + index * 300, // Más separación entre hijos
              y: posicionActual.y + NIVEL_ALTURA,
            };

            nuevosNodos.push({
              id: hijoNodeId,
              type: "persona",
              position: hijoPosition,
              data: {
                persona: hijo,
                onPersonaClick: (p: PersonaArbol) => {
                  const ruta =
                    p.tipo === "miembro"
                      ? `/miembros/${p.id}`
                      : `/visitas/${p.id}`;
                  router.push(ruta);
                },
                esFamiliaRelacionada: false,
              },
            });

            // CREAR CONEXIÓN PADRE-HIJO - del centro inferior del padre al centro superior del hijo
            const edgeIdPadre = `padre-hijo-${jefeFamilia.id}-${hijo.id}`;

            nuevasAristas.push({
              id: edgeIdPadre,
              source: jefeNodeId,
              target: hijoNodeId,
              style: {
                stroke: "#3b82f6",
                strokeWidth: 3,
              },
              label: "👨‍👧‍👦",
            });

            // Si hay cónyuge, también crear conexión madre-hijo
            if (conyuge) {
              const conyugeNodeId = `conyuge-${conyuge.id}`;
              const edgeIdMadre = `madre-hijo-${conyuge.id}-${hijo.id}`;

              nuevasAristas.push({
                id: edgeIdMadre,
                source: conyugeNodeId,
                target: hijoNodeId,
                style: {
                  stroke: "#3b82f6",
                  strokeWidth: 2,
                  strokeDasharray: "5,5",
                },
                label: "👩‍👧‍👦",
              });
            }
          });
        }

        // === CREAR PADRES (NIVEL SUPERIOR) ===
        if (padres.length > 0) {
          padres.forEach((padre, index) => {
            const padreNodeId = `padre-${padre.id}`;

            const padrePosition = {
              x:
                CENTRO_X +
                index * ESPACIO_HORIZONTAL -
                ((padres.length - 1) * ESPACIO_HORIZONTAL) / 2,
              y: posicionActual.y - NIVEL_ALTURA,
            };

            nuevosNodos.push({
              id: padreNodeId,
              type: "persona",
              position: padrePosition,
              data: {
                persona: padre,
                onPersonaClick: (p: PersonaArbol) => {
                  const ruta =
                    p.tipo === "miembro"
                      ? `/miembros/${p.id}`
                      : `/visitas/${p.id}`;
                  router.push(ruta);
                },
                esFamiliaRelacionada: false,
              },
            });

            // CREAR CONEXIÓN PADRE-JEFE
            const edgeIdAbuelo = `abuelo-padre-${padre.id}-${jefeFamilia.id}`;

            nuevasAristas.push({
              id: edgeIdAbuelo,
              source: padreNodeId,
              target: jefeNodeId,
              style: {
                stroke: "#f97316",
                strokeWidth: 3,
              },
              label: "👵👴",
            });
          });
        }

        // === CREAR HERMANOS ===
        if (hermanos.length > 0) {
          console.log(`Creando ${hermanos.length} hermanos...`);

          hermanos.forEach((hermano, index) => {
            const hermanoNodeId = `hermano-${hermano.id}`;
            console.log(`Creando nodo hermano ${index + 1}:`, hermanoNodeId);

            const hermanoPosition = {
              x: posicionActual.x - ESPACIO_HORIZONTAL - index * 200,
              y: posicionActual.y,
            };

            nuevosNodos.push({
              id: hermanoNodeId,
              type: "persona",
              position: hermanoPosition,
              data: {
                persona: hermano,
                onPersonaClick: (p: PersonaArbol) => {
                  const ruta =
                    p.tipo === "miembro"
                      ? `/miembros/${p.id}`
                      : `/visitas/${p.id}`;
                  router.push(ruta);
                },
                esFamiliaRelacionada: false,
              },
            });

            // CREAR CONEXIÓN HERMANO-JEFE
            const edgeIdHermano = `hermano-${hermano.id}-${jefeFamilia.id}`;
            console.log(`Creando edge hermano ${index + 1}:`, {
              edgeIdHermano,
              source: hermanoNodeId,
              target: jefeNodeId,
            });

            nuevasAristas.push({
              id: edgeIdHermano,
              source: hermanoNodeId,
              target: jefeNodeId,
              style: {
                stroke: "#10b981",
                strokeWidth: 2,
                strokeDasharray: "10,5",
              },
              label: "👫",
            });
          });
        }

        // === CREAR OTROS FAMILIARES ===
        if (otros.length > 0) {
          console.log(`Creando ${otros.length} otros familiares...`);

          otros.forEach((otro, index) => {
            const otroNodeId = `otro-${otro.id}`;
            console.log(`Creando nodo otro ${index + 1}:`, otroNodeId);

            const otroPosition = {
              x: CENTRO_X + ESPACIO_HORIZONTAL * 2 + index * 200,
              y: posicionActual.y + NIVEL_ALTURA / 2,
            };

            nuevosNodos.push({
              id: otroNodeId,
              type: "persona",
              position: otroPosition,
              data: {
                persona: otro,
                onPersonaClick: (p: PersonaArbol) => {
                  const ruta =
                    p.tipo === "miembro"
                      ? `/miembros/${p.id}`
                      : `/visitas/${p.id}`;
                  router.push(ruta);
                },
                esFamiliaRelacionada: false,
              },
            });

            // CREAR CONEXIÓN OTRO-JEFE
            const edgeIdOtro = `otro-${otro.id}-${jefeFamilia.id}`;
            console.log(`Creando edge otro ${index + 1}:`, {
              edgeIdOtro,
              source: otroNodeId,
              target: jefeNodeId,
            });

            nuevasAristas.push({
              id: edgeIdOtro,
              source: otroNodeId,
              target: jefeNodeId,
              style: {
                stroke: "#6b7280",
                strokeWidth: 2,
                strokeDasharray: "15,10",
              },
              label: "👥",
            });
          });
        }
      }

      // === AGREGAR FAMILIAS RELACIONADAS ===
      console.log("Verificando vínculos familiares...");
      console.log("mostrarFamiliasExpandidas:", mostrarFamiliasExpandidas);
      console.log("familiaData.vinculosOrigen:", familiaData.vinculosOrigen);
      console.log(
        "familiaData.vinculosRelacionados:",
        familiaData.vinculosRelacionados
      );
      console.log(
        "familiaData.familiasRelacionadasCompletas:",
        familiaData.familiasRelacionadasCompletas
      );

      if (
        mostrarFamiliasExpandidas &&
        (familiaData.vinculosOrigen.length > 0 ||
          familiaData.vinculosRelacionados.length > 0)
      ) {
        // Combinar ambos tipos de vínculos
        const todosVinculos = [
          ...familiaData.vinculosOrigen,
          ...familiaData.vinculosRelacionados,
        ];
        console.log(`Creando ${todosVinculos.length} vínculos familiares...`);

        todosVinculos.forEach((vinculo, index) => {
          console.log(`Procesando vínculo ${index + 1}:`, vinculo);

          // Determinar cuál familia mostrar como relacionada
          const familiaRelacionada: FamiliaRelacionada =
            vinculo.familiaOrigen.id === familiaData.id
              ? {
                  id: vinculo.familiaRelacionada.id,
                  apellido: vinculo.familiaRelacionada.apellido,
                  nombre: vinculo.familiaRelacionada.nombre,
                  estado: vinculo.familiaRelacionada.estado,
                }
              : {
                  id: vinculo.familiaOrigen.id,
                  apellido: vinculo.familiaOrigen.apellido,
                  nombre: vinculo.familiaOrigen.nombre,
                  estado: vinculo.familiaOrigen.estado,
                };

          // BUSCAR EL MIEMBRO DEL VÍNCULO EN LA FAMILIA ACTUAL
          let nodoOrigenConexion = null;
          if (vinculo.miembroVinculo) {
            console.log("=== BUSCANDO MIEMBRO DEL VÍNCULO ===");
            console.log(
              "Miembro del vínculo a buscar:",
              vinculo.miembroVinculo
            );

            const miembroVinculoEncontrado = todasPersonas.find((p) => {
              console.log(
                `Comparando persona ${p.id} (${p.nombres} ${
                  p.apellidos
                }) con miembro vínculo ${vinculo.miembroVinculo!.id} (${
                  vinculo.miembroVinculo!.nombres
                } ${vinculo.miembroVinculo!.apellidos})`
              );
              return p.id === vinculo.miembroVinculo!.id;
            });

            if (miembroVinculoEncontrado) {
              console.log(
                "✅ MIEMBRO DEL VÍNCULO ENCONTRADO:",
                miembroVinculoEncontrado
              );

              // Determinar el ID del nodo según el tipo de parentesco
              const parentesco =
                miembroVinculoEncontrado.parentescoFamiliar?.toLowerCase() ||
                "";
              console.log("Parentesco del miembro:", parentesco);

              if (
                parentesco.includes("cabeza") ||
                parentesco.includes("jefe")
              ) {
                nodoOrigenConexion = `jefe-${miembroVinculoEncontrado.id}`;
              } else if (
                parentesco.includes("esposo") ||
                parentesco.includes("esposa") ||
                parentesco.includes("cónyuge")
              ) {
                nodoOrigenConexion = `conyuge-${miembroVinculoEncontrado.id}`;
              } else if (
                parentesco.includes("hijo") ||
                parentesco.includes("hija")
              ) {
                nodoOrigenConexion = `hijo-${miembroVinculoEncontrado.id}`;
              } else if (
                parentesco.includes("padre") ||
                parentesco.includes("madre")
              ) {
                nodoOrigenConexion = `padre-${miembroVinculoEncontrado.id}`;
              } else if (
                parentesco.includes("hermano") ||
                parentesco.includes("hermana")
              ) {
                nodoOrigenConexion = `hermano-${miembroVinculoEncontrado.id}`;
              } else {
                nodoOrigenConexion = `otro-${miembroVinculoEncontrado.id}`;
              }

              console.log(
                `🎯 NODO ORIGEN PARA CONEXIÓN: ${vinculo.miembroVinculo.nombres} ${vinculo.miembroVinculo.apellidos} (${nodoOrigenConexion})`
              );
            }
          }

          // Si no encontramos el miembro del vínculo, usar el jefe de familia como fallback
          if (!nodoOrigenConexion && jefeFamilia) {
            nodoOrigenConexion = `jefe-${jefeFamilia.id}`;
            console.log(
              "⚠️ Usando jefe de familia como origen de conexión:",
              nodoOrigenConexion
            );
          }

          // === AGREGAR MIEMBROS DE FAMILIA RELACIONADA DIRECTAMENTE ===
          if (familiaData.familiasRelacionadasCompletas && nodoOrigenConexion) {
            const familiaCompleta =
              familiaData.familiasRelacionadasCompletas.find(
                (f) => f.id === familiaRelacionada.id
              );

            if (familiaCompleta) {
              console.log(
                `Agregando miembros de familia relacionada ${familiaCompleta.apellido}:`,
                familiaCompleta.miembros
              );

              // BUSCAR MIEMBRO ESPECÍFICO PARA CONECTAR (ej: Chastiry)
              let miembroEspecificoParaConectar = null;

              // Si hay jefe de familia en la familia relacionada, conectar con él
              if (familiaCompleta.jefeFamilia) {
                miembroEspecificoParaConectar = familiaCompleta.miembros.find(
                  (m) => m.id === familiaCompleta.jefeFamilia!.id
                );
              }

              // Si no hay jefe, tomar el primer miembro
              if (
                !miembroEspecificoParaConectar &&
                familiaCompleta.miembros.length > 0
              ) {
                miembroEspecificoParaConectar = familiaCompleta.miembros[0];
              }

              // Calcular posición para los miembros de la familia relacionada
              let miembroOrigenPosition = {
                x: CENTRO_X,
                y: NIVEL_BASE_Y + NIVEL_ALTURA * 2,
              };

              // Intentar obtener la posición del nodo origen
              const nodoOrigen = nuevosNodos.find(
                (nodo) => nodo.id === nodoOrigenConexion
              );
              if (nodoOrigen) {
                miembroOrigenPosition = {
                  x: nodoOrigen.position.x,
                  y: nodoOrigen.position.y + NIVEL_ALTURA + 150,
                };
              }

              // Agregar miembros de la familia relacionada
              familiaCompleta.miembros.forEach((miembro, miembroIndex) => {
                const miembroRelacionadoId = `familiar-${familiaCompleta.id}-${miembro.id}`;
                console.log(
                  `Creando miembro relacionado ${miembroIndex + 1}:`,
                  miembroRelacionadoId
                );

                const miembroPosition = {
                  x: miembroOrigenPosition.x - 200 + miembroIndex * 250, // Distribuir horizontalmente
                  y: miembroOrigenPosition.y, // Mismo nivel
                };

                const miembroArbol: PersonaArbol = {
                  ...miembro,
                  tipo: "miembro" as const,
                  familiaId: familiaCompleta.id,
                };

                nuevosNodos.push({
                  id: miembroRelacionadoId,
                  type: "persona",
                  position: miembroPosition,
                  data: {
                    persona: miembroArbol,
                    onPersonaClick: (p: PersonaArbol) => {
                      const ruta = `/miembros/${p.id}`;
                      router.push(ruta);
                    },
                    esFamiliaRelacionada: true,
                  },
                });

                // CONECTAR DIRECTAMENTE ISAAC CON EL MIEMBRO ESPECÍFICO (sin nodo intermedio)
                if (miembro.id === miembroEspecificoParaConectar?.id) {
                  const edgeIdConexionDirecta = `vinculo-directo-${vinculo.id}-${miembro.id}`;
                  console.log(
                    `🎯 CONECTANDO DIRECTAMENTE: ${
                      vinculo.miembroVinculo?.nombres || "Origen"
                    } → ${miembro.nombres} ${miembro.apellidos}`
                  );

                  nuevasAristas.push({
                    id: edgeIdConexionDirecta,
                    source: nodoOrigenConexion,
                    target: miembroRelacionadoId,
                    style: {
                      stroke: "#dc2626",
                      strokeWidth: 3,
                      strokeDasharray: "20,10",
                    },
                    label: vinculo.tipoVinculo,
                  });
                }
              });

              // Agregar visitas de la familia relacionada si existen
              if (
                familiaCompleta.visitas &&
                familiaCompleta.visitas.length > 0
              ) {
                familiaCompleta.visitas.forEach((visita, visitaIndex) => {
                  const visitaRelacionadaId = `visita-familiar-${familiaCompleta.id}-${visita.id}`;
                  console.log(
                    `Creando visita relacionada ${visitaIndex + 1}:`,
                    visitaRelacionadaId
                  );

                  const visitaPosition = {
                    x:
                      miembroOrigenPosition.x -
                      200 +
                      (familiaCompleta.miembros.length + visitaIndex) * 250,
                    y: miembroOrigenPosition.y,
                  };

                  const visitaArbol: PersonaArbol = {
                    ...visita,
                    tipo: "visita" as const,
                    familiaId: familiaCompleta.id,
                  };

                  nuevosNodos.push({
                    id: visitaRelacionadaId,
                    type: "persona",
                    position: visitaPosition,
                    data: {
                      persona: visitaArbol,
                      onPersonaClick: (p: PersonaArbol) => {
                        const ruta = `/visitas/${p.id}`;
                        router.push(ruta);
                      },
                      esFamiliaRelacionada: true,
                    },
                  });
                });
              }
            }
          } else if (!familiaData.familiasRelacionadasCompletas) {
            // Si no hay datos completos de familias relacionadas, crear solo el nodo familia
            const vinculoNodeId = `vinculo-${vinculo.id}`;

            // Calcular posición debajo del miembro que conecta
            let vinculoPosition = {
              x: CENTRO_X - ESPACIO_HORIZONTAL * 2,
              y: NIVEL_BASE_Y - NIVEL_ALTURA + index * 400,
            };

            if (nodoOrigenConexion) {
              const nodoOrigen = nuevosNodos.find(
                (nodo) => nodo.id === nodoOrigenConexion
              );
              if (nodoOrigen) {
                vinculoPosition = {
                  x: nodoOrigen.position.x,
                  y: nodoOrigen.position.y + NIVEL_ALTURA + 100,
                };
              }
            }

            nuevosNodos.push({
              id: vinculoNodeId,
              type: "familia",
              position: vinculoPosition,
              data: {
                familia: familiaRelacionada,
                vinculo: vinculo,
                familiaActual: {
                  id: familiaData.id,
                  apellido: familiaData.apellido,
                  nombre: familiaData.nombre,
                  estado: familiaData.estado,
                },
                onFamiliaClick: (familia: FamiliaRelacionada) => {
                  router.push(`/familias/${familia.id}/arbol`);
                },
              },
            });

            // Conectar con el nodo familia solo si no hay vista extendida
            if (nodoOrigenConexion) {
              const edgeIdVinculo = `vinculo-${vinculo.id}`;
              nuevasAristas.push({
                id: edgeIdVinculo,
                source: nodoOrigenConexion,
                target: vinculoNodeId,
                style: {
                  stroke: "#dc2626",
                  strokeWidth: 3,
                  strokeDasharray: "20,10",
                },
                label: vinculo.tipoVinculo,
              });
            }
          }
        });
      } else {
        console.log("No se muestran vínculos:", {
          mostrarFamiliasExpandidas,
          vinculosOrigenCount: familiaData.vinculosOrigen.length,
          vinculosRelacionadosCount: familiaData.vinculosRelacionados.length,
        });
      }

      console.log("NODOS FINALES:", nuevosNodos);
      console.log("EDGES FINALES:", nuevasAristas);

      setNodes(nuevosNodos);
      setEdges(nuevasAristas);
    } catch (error) {
      console.error("Error al generar nodos y aristas:", error);
      setError("Error al generar el árbol familiar");
    }
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const alternarVistaFamilias = () => {
    const nuevoEstado = !mostrarFamiliasExpandidas;
    setMostrarFamiliasExpandidas(nuevoEstado);
    // Limpiar el estado de error al cambiar vista
    setError(null);
    if (familia) {
      // Recargar datos para la nueva vista
      cargarDatos();
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando árbol familiar...</span>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4 flex-1">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/familias">Familias</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href={`/familias/${id}`}>
                    {familia?.nombre || `Familia ${familia?.apellido}`}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Árbol Familiar</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="px-4">
            <ModeToggle />
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <GitBranch className="h-6 w-6" />
                Árbol Familiar Interactivo
              </h1>
              <p className="text-muted-foreground">
                {familia?.nombre || `Familia ${familia?.apellido}`}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={alternarVistaFamilias}
              className="flex items-center gap-2"
            >
              {mostrarFamiliasExpandidas ? (
                <ToggleRight className="h-4 w-4" />
              ) : (
                <ToggleLeft className="h-4 w-4" />
              )}
              {mostrarFamiliasExpandidas ? "Vista Compacta" : "Vista Expandida"}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/familias/${id}/vinculos`)}
            >
              <LinkIcon className="mr-2 h-4 w-4" />
              Gestionar Vínculos
            </Button>
          </div>

          {error && (
            <div className="p-4 text-red-600 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex-1 h-[calc(100vh-200px)] border rounded-lg">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 50 }}
            >
              <Controls />
              <Background color="#aaa" gap={16} />
              <Panel
                position="top-right"
                className="bg-white dark:bg-gray-800 p-4 rounded-lg border shadow-sm"
              >
                <div className="space-y-2 text-sm">
                  <div className="font-semibold">Leyenda:</div>
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-yellow-600" />
                    <span>Cabeza de Familia</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-600" />
                    <span>Esposo/a</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Baby className="h-4 w-4 text-blue-600" />
                    <span>Hijo/a</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HomeIcon className="h-4 w-4 text-primary" />
                    <span>Familias Relacionadas</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="font-semibold text-xs mb-1">
                      Conexiones:
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-red-600"></div>
                        <span>Matrimonio</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-blue-600"></div>
                        <span>Padre-Hijo</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-green-600 border-dashed"></div>
                        <span>Hermanos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-red-600 border-dashed"></div>
                        <span>Vínculos Familiares</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Haz clic en cualquier nodo para ver detalles
                  </div>
                </div>
              </Panel>
            </ReactFlow>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
