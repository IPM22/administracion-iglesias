"use client";

import { AppSidebar } from "../../components/app-sidebar";
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
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Share2,
  MapPin,
  CalendarIcon,
  Clock,
  Users,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Download,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ModeToggle } from "../../components/mode-toggle";
import jsPDF from "jspdf";
import { useAuth } from "@/hooks/useAuth";
import { formatDate, formatActivityDate } from "@/lib/date-utils";
import dayjs from "dayjs";
import "dayjs/locale/es";

// Configurar dayjs en español
dayjs.locale("es");

// Interfaces
interface TipoActividad {
  id: number;
  nombre: string;
  tipo: string;
}

interface HistorialVisita {
  id: number;
  persona: {
    id: number;
    nombres: string;
    apellidos: string;
  };
}

interface Actividad {
  id: number;
  nombre: string;
  descripcion?: string;
  fecha: string;
  horaInicio?: string;
  horaFin?: string;
  ubicacion?: string;
  googleMapsEmbed?: string;
  responsable?: string;
  estado: string;
  createdAt: string;
  updatedAt: string;
  tipoActividad: TipoActividad;
  historialVisitas: HistorialVisita[];
  banner?: string;
  ministerio?: {
    id: number;
    nombre: string;
  };
}

interface ActividadAgrupada {
  año: number;
  meses: {
    mes: number;
    nombreMes: string;
    actividades: Actividad[];
  }[];
}

export default function ActividadesPage() {
  const router = useRouter();
  const { iglesiaActiva } = useAuth(); // Para obtener datos de la iglesia
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [actividadesFiltradas, setActividadesFiltradas] = useState<Actividad[]>(
    []
  );
  const [actividadesAgrupadas, setActividadesAgrupadas] = useState<
    ActividadAgrupada[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Estados para eliminación
  const [actividadAEliminar, setActividadAEliminar] =
    useState<Actividad | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Estados para filtros
  const [showFilters, setShowFilters] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [vistaActual, setVistaActual] = useState<
    "proximas" | "historico" | "calendario"
  >("calendario");

  // Estados para exportación PDF
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // Estados para grupos expandidos en vista calendario
  const [gruposExpandidos, setGruposExpandidos] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    const fetchActividades = async () => {
      try {
        console.log("🔄 Iniciando carga de actividades...");

        const response = await fetch("/api/actividades");
        console.log(
          "📡 Respuesta del servidor:",
          response.status,
          response.statusText
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ Error del servidor:", response.status, errorText);
          throw new Error(`Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log("✅ Actividades recibidas:", data);
        console.log(
          "📊 Cantidad de actividades:",
          Array.isArray(data) ? data.length : "No es array"
        );

        // Verificar que data es un array válido
        if (!Array.isArray(data)) {
          console.error(
            "❌ Los datos recibidos no son un array:",
            typeof data,
            data
          );
          throw new Error("Formato de datos inválido - se esperaba un array");
        }

        // Verificar que cada actividad tiene la estructura correcta
        const actividadesValidas = data.filter((actividad, index) => {
          const esValida =
            actividad &&
            typeof actividad.id === "number" &&
            typeof actividad.nombre === "string" &&
            typeof actividad.fecha === "string" &&
            actividad.tipoActividad &&
            typeof actividad.tipoActividad.nombre === "string";

          if (!esValida) {
            console.warn(
              `⚠️ Actividad ${index} tiene estructura inválida:`,
              actividad
            );
          }

          return esValida;
        });

        console.log(
          "✅ Actividades válidas:",
          actividadesValidas.length,
          "de",
          data.length
        );

        setActividades(actividadesValidas);
        setActividadesFiltradas(actividadesValidas);
      } catch (error) {
        console.error("💥 Error completo:", error);
        console.error(
          "🔍 Stack trace:",
          error instanceof Error ? error.stack : "No stack trace"
        );

        // Mostrar el error al usuario
        alert(
          `Error al cargar actividades: ${
            error instanceof Error ? error.message : "Error desconocido"
          }`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchActividades();
  }, []);

  // Filtrar actividades cuando cambien los filtros
  useEffect(() => {
    filtrarActividades();
  }, [actividades, searchTerm, filtroEstado, filtroTipo, vistaActual]);

  // Agrupar actividades cuando cambien las actividades filtradas
  useEffect(() => {
    agruparActividades();
  }, [actividadesFiltradas]);

  const filtrarActividades = () => {
    console.log("🔄 Filtrando actividades...");
    console.log("📊 Total actividades:", actividades.length);
    console.log("📊 Vista actual:", vistaActual);

    let resultado = [...actividades];
    console.log("📊 Actividades iniciales:", resultado.length);

    // SIMPLIFICADO: Solo filtrar por vista si NO es calendario
    if (vistaActual === "proximas") {
      console.log("🔍 Mostrando actividades próximas (fechas futuras)...");
      const hoy = dayjs().startOf("day");

      resultado = resultado.filter((actividad) => {
        try {
          const fechaActividad = dayjs(actividad.fecha);
          return (
            fechaActividad.isAfter(hoy) || fechaActividad.isSame(hoy, "day")
          );
        } catch {
          console.warn(
            `⚠️ Fecha inválida para "${actividad.nombre}": ${actividad.fecha}`
          );
          return true; // Mostrar actividad con fecha problemática
        }
      });
      console.log(`📊 Actividades próximas: ${resultado.length}`);
    } else if (vistaActual === "historico") {
      console.log("🔍 Mostrando actividades históricas (fechas pasadas)...");
      const hoy = dayjs().startOf("day");

      resultado = resultado.filter((actividad) => {
        try {
          const fechaActividad = dayjs(actividad.fecha);
          return fechaActividad.isBefore(hoy);
        } catch {
          console.warn(
            `⚠️ Fecha inválida para "${actividad.nombre}": ${actividad.fecha}`
          );
          return true; // Mostrar actividad con fecha problemática
        }
      });
      console.log(`📊 Actividades históricas: ${resultado.length}`);
    } else {
      console.log("📅 Vista calendario: mostrando TODAS las actividades");
    }

    // Filtrar por término de búsqueda (solo si hay texto)
    if (searchTerm && searchTerm.trim()) {
      console.log("🔍 Aplicando filtro de búsqueda:", searchTerm);
      const activitiesBefore = resultado.length;
      const searchTermLower = searchTerm.toLowerCase().trim();
      resultado = resultado.filter(
        (actividad) =>
          actividad.nombre.toLowerCase().includes(searchTermLower) ||
          (actividad.descripcion &&
            actividad.descripcion.toLowerCase().includes(searchTermLower)) ||
          (actividad.ubicacion &&
            actividad.ubicacion.toLowerCase().includes(searchTermLower)) ||
          (actividad.tipoActividad &&
            actividad.tipoActividad.nombre
              .toLowerCase()
              .includes(searchTermLower)) ||
          (actividad.ministerio &&
            actividad.ministerio.nombre.toLowerCase().includes(searchTermLower))
      );
      console.log(
        `📊 Después de búsqueda: ${activitiesBefore} -> ${resultado.length}`
      );
    }

    // Filtrar por estado (solo si no es "todos")
    if (filtroEstado && filtroEstado !== "todos") {
      console.log("🔍 Aplicando filtro de estado:", filtroEstado);
      const activitiesBefore = resultado.length;
      resultado = resultado.filter((actividad) => {
        const estadoActividad = (actividad.estado || "").toLowerCase();
        const filtroEstadoLower = filtroEstado.toLowerCase();
        const coincide =
          estadoActividad.includes(filtroEstadoLower) ||
          filtroEstadoLower.includes(estadoActividad);
        return coincide;
      });
      console.log(
        `📊 Después de filtro estado: ${activitiesBefore} -> ${resultado.length}`
      );
    }

    // Filtrar por tipo (solo si no es "todos")
    if (filtroTipo && filtroTipo !== "todos") {
      console.log("🔍 Aplicando filtro de tipo:", filtroTipo);
      const activitiesBefore = resultado.length;
      resultado = resultado.filter((actividad) => {
        const tipoActividad = (
          actividad.tipoActividad?.tipo || ""
        ).toLowerCase();
        const filtroTipoLower = filtroTipo.toLowerCase();
        const coincide =
          tipoActividad.includes(filtroTipoLower) ||
          filtroTipoLower.includes(tipoActividad);
        return coincide;
      });
      console.log(
        `📊 Después de filtro tipo: ${activitiesBefore} -> ${resultado.length}`
      );
    }

    // Ordenar por fecha (simplificado)
    try {
      resultado.sort((a, b) => {
        try {
          const fechaA = dayjs(a.fecha);
          const fechaB = dayjs(b.fecha);

          if (vistaActual === "proximas") {
            return fechaA.isBefore(fechaB)
              ? -1
              : fechaA.isAfter(fechaB)
              ? 1
              : 0; // Más próximas primero
          } else {
            return fechaB.isBefore(fechaA)
              ? -1
              : fechaB.isAfter(fechaA)
              ? 1
              : 0; // Más recientes primero
          }
        } catch (error) {
          console.warn("Error ordenando fechas:", error);
          return 0;
        }
      });
    } catch (error) {
      console.error("❌ Error ordenando actividades:", error);
    }

    console.log("✅ Resultado final del filtrado:", resultado.length);
    console.log(
      "📋 Actividades filtradas:",
      resultado.map((a) => `${a.nombre} (${a.fecha})`)
    );

    setActividadesFiltradas(resultado);
    setCurrentPage(1);
  };

  // Función para agrupar actividades por año y mes - SIMPLIFICADA
  const agruparActividades = () => {
    console.log("🔄 Agrupando actividades...");
    console.log("📊 Actividades a agrupar:", actividadesFiltradas.length);

    if (actividadesFiltradas.length === 0) {
      console.log("📊 No hay actividades para agrupar");
      setActividadesAgrupadas([]);
      return;
    }

    const grupos: { [key: string]: ActividadAgrupada } = {};

    actividadesFiltradas.forEach((actividad) => {
      try {
        console.log(
          `📅 Procesando actividad: "${actividad.nombre}" - fecha: ${actividad.fecha}`
        );

        // Usar dayjs para evitar problemas de zona horaria
        const fecha = dayjs(actividad.fecha);

        // Verificar que la fecha es válida
        if (!fecha.isValid()) {
          console.warn(
            `⚠️ Fecha inválida para "${actividad.nombre}": ${actividad.fecha}, usando año actual`
          );
          // Usar año actual como fallback
          const añoActual = dayjs().year();
          const mesActual = dayjs().month();

          const claveAño = añoActual.toString();
          if (!grupos[claveAño]) {
            grupos[claveAño] = { año: añoActual, meses: [] };
          }

          let mesData = grupos[claveAño].meses.find((m) => m.mes === mesActual);
          if (!mesData) {
            mesData = {
              mes: mesActual,
              nombreMes: dayjs().month(mesActual).format("MMMM"),
              actividades: [],
            };
            grupos[claveAño].meses.push(mesData);
          }

          mesData.actividades.push(actividad);
          return;
        }

        const año = fecha.year();
        const mes = fecha.month(); // 0-11

        console.log(`📅 Fecha válida: año=${año}, mes=${mes}`);

        const claveAño = año.toString();

        if (!grupos[claveAño]) {
          grupos[claveAño] = { año, meses: [] };
        }

        let mesData = grupos[claveAño].meses.find((m) => m.mes === mes);
        if (!mesData) {
          mesData = {
            mes,
            nombreMes: fecha.format("MMMM"),
            actividades: [],
          };
          grupos[claveAño].meses.push(mesData);
        }

        mesData.actividades.push(actividad);
      } catch (errorProcessing) {
        console.error(
          `❌ Error procesando actividad "${actividad.nombre}":`,
          errorProcessing
        );
        // Agrupar en categoría especial "Fechas problemáticas"
        const claveAño = "Sin fecha válida";
        if (!grupos[claveAño]) {
          grupos[claveAño] = {
            año: 9999, // Número alto para que aparezca al final
            meses: [
              {
                mes: 99,
                nombreMes: "Fechas problemáticas",
                actividades: [],
              },
            ],
          };
        }
        grupos[claveAño].meses[0].actividades.push(actividad);
      }
    });

    // Convertir a array y ordenar - SIMPLIFICADO
    const resultado = Object.values(grupos)
      .sort((a, b) => {
        // Años problemáticos al final
        if (a.año === 9999) return 1;
        if (b.año === 9999) return -1;
        return b.año - a.año; // Años más recientes primero
      })
      .map((grupo) => ({
        ...grupo,
        meses: grupo.meses
          .sort((a, b) => {
            // Meses problemáticos al final
            if (a.mes === 99) return 1;
            if (b.mes === 99) return -1;
            return b.mes - a.mes; // Meses más recientes primero
          })
          .map((mes) => ({
            ...mes,
            actividades: mes.actividades.sort((a, b) => {
              try {
                // Usar dayjs para ordenamiento también
                const fechaA = dayjs(a.fecha);
                const fechaB = dayjs(b.fecha);

                // Si alguna fecha es inválida, usar orden alfabético
                if (!fechaA.isValid() || !fechaB.isValid()) {
                  return a.nombre.localeCompare(b.nombre);
                }

                return fechaB.valueOf() - fechaA.valueOf(); // Más recientes primero
              } catch (sortingError) {
                console.warn("Error ordenando actividades:", sortingError);
                return a.nombre.localeCompare(b.nombre);
              }
            }),
          })),
      }));

    console.log("✅ Agrupación completada:", resultado.length, "grupos");
    console.log(
      "📊 Grupos creados:",
      resultado.map((g) => `${g.año} (${g.meses.length} meses)`)
    );

    setActividadesAgrupadas(resultado);
  };

  const mostrarDialogEliminar = (actividad: Actividad) => {
    setActividadAEliminar(actividad);
    setDialogOpen(true);
  };

  const confirmarEliminacion = async () => {
    if (!actividadAEliminar) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/actividades/${actividadAEliminar.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Error ${response.status}: ${response.statusText}`
        );
      }

      // Remover la actividad de la lista local
      setActividades((prev) =>
        prev.filter((actividad) => actividad.id !== actividadAEliminar.id)
      );

      console.log("✅ Actividad eliminada correctamente");
    } catch (error) {
      console.error("❌ Error al eliminar actividad:", error);
      alert(
        `Error al eliminar la actividad: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
    } finally {
      setIsDeleting(false);
      setDialogOpen(false);
      setActividadAEliminar(null);
    }
  };

  const compartirActividad = async (actividad: Actividad) => {
    try {
      const texto = `${actividad.nombre} - ${formatearFechaCompleta(
        actividad.fecha
      )}${actividad.ubicacion ? ` en ${actividad.ubicacion}` : ""}`;

      if (navigator.share) {
        await navigator.share({
          title: actividad.nombre,
          text: texto,
          url: window.location.href,
        });
      } else {
        // Fallback: copiar al portapapeles
        await navigator.clipboard.writeText(texto);
        alert("Información copiada al portapapeles");
      }
    } catch (error) {
      console.error("Error al compartir:", error);
    }
  };

  // Funciones de utilidad para fechas corregidas
  const formatearFechaCompleta = (fecha: string) => {
    try {
      return formatActivityDate(fecha, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch (error) {
      console.error("Error formateando fecha completa:", error);
      return fecha; // Retornar fecha original si hay error
    }
  };

  const formatearFechaCorta = (fecha: string) => {
    try {
      return formatActivityDate(fecha, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      console.error("Error formateando fecha corta:", error);
      return fecha; // Retornar fecha original si hay error
    }
  };

  const formatearHora = (hora?: string) => {
    if (!hora) return "";
    try {
      const [hours, minutes] = hora.split(":");
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return hora;
    }
  };

  // Función para exportar a PDF - DISEÑO MEJORADO Y SIMPLIFICADO
  const exportarAPDF = async () => {
    if (!fechaInicio || !fechaFin) {
      alert("Por favor selecciona ambas fechas");
      return;
    }

    setIsExporting(true);
    try {
      console.log("📄 Iniciando exportación PDF mejorada...");

      // Filtrar actividades por rango de fechas - CORREGIDO
      const fechaInicioDate = dayjs(fechaInicio).startOf("day");
      const fechaFinDate = dayjs(fechaFin).endOf("day");

      const actividadesParaExportar = actividades
        .filter((actividad) => {
          try {
            const fechaActividad = dayjs(actividad.fecha);
            return (
              (fechaActividad.isAfter(fechaInicioDate) ||
                fechaActividad.isSame(fechaInicioDate, "day")) &&
              (fechaActividad.isBefore(fechaFinDate) ||
                fechaActividad.isSame(fechaFinDate, "day"))
            );
          } catch {
            return false;
          }
        })
        .sort((a, b) => dayjs(a.fecha).valueOf() - dayjs(b.fecha).valueOf());

      if (actividadesParaExportar.length === 0) {
        alert(
          `No hay actividades en el rango de fechas seleccionado (${formatearFechaCorta(
            fechaInicio
          )} - ${formatearFechaCorta(fechaFin)})`
        );
        return;
      }

      // Crear PDF con diseño profesional
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;

      // Colores de la iglesia (definidos correctamente para jsPDF)
      const colorPrimario: [number, number, number] = [70, 130, 180]; // Steel Blue
      const colorSecundario: [number, number, number] = [100, 100, 100]; // Gris
      const colorTexto: [number, number, number] = [60, 60, 60]; // Gris oscuro

      // HEADER - Logo y título
      let yPosition = 25;

      // Intentar cargar el logo de la iglesia si existe
      if (iglesiaActiva?.logoUrl) {
        try {
          // Crear elemento imagen temporal para obtener dimensiones
          const img = new Image();
          img.crossOrigin = "anonymous";

          await new Promise<void>((resolve) => {
            img.onload = () => {
              try {
                // Crear canvas temporal para convertir imagen
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                canvas.width = 60;
                canvas.height = 60;

                if (ctx) {
                  ctx.drawImage(img, 0, 0, 60, 60);
                  const imageData = canvas.toDataURL("image/jpeg", 0.8);

                  // Agregar logo al PDF
                  pdf.addImage(imageData, "JPEG", 20, 15, 25, 25);
                }
                resolve();
              } catch (error) {
                console.log("No se pudo cargar el logo:", error);
                resolve();
              }
            };
            img.onerror = () => resolve();
            img.src = iglesiaActiva.logoUrl!;
          });
        } catch (error) {
          console.log("Error cargando logo:", error);
        }
      }

      // Título principal
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(24);
      pdf.setTextColor(...colorPrimario);
      pdf.text(iglesiaActiva?.nombre || "Reporte de Actividades", 55, 25);

      // Subtítulo
      pdf.setFontSize(16);
      pdf.setTextColor(...colorSecundario);
      pdf.text("Reporte de Actividades", 55, 35);

      // Línea decorativa
      pdf.setDrawColor(...colorPrimario);
      pdf.setLineWidth(2);
      pdf.line(20, 45, pageWidth - 20, 45);

      yPosition = 60;

      // Información del período
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      pdf.setTextColor(...colorTexto);
      pdf.text(
        `Período: ${formatearFechaCorta(fechaInicio)} - ${formatearFechaCorta(
          fechaFin
        )}`,
        20,
        yPosition
      );
      pdf.text(
        `Total de actividades: ${actividadesParaExportar.length}`,
        20,
        yPosition + 8
      );
      pdf.text(
        `Generado: ${new Date().toLocaleDateString("es-ES", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}`,
        20,
        yPosition + 16
      );

      yPosition += 35;

      // Encabezados de tabla
      const headerY = yPosition;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(255, 255, 255); // Texto blanco
      pdf.setFillColor(...colorPrimario);
      pdf.rect(20, headerY - 5, pageWidth - 40, 15, "F");

      pdf.text("ACTIVIDAD", 25, headerY + 5);
      pdf.text("FECHA", 120, headerY + 5);
      pdf.text("MINISTERIO", 155, headerY + 5);

      yPosition = headerY + 20;

      // Actividades
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(...colorTexto);

      let filaAlterna = false;

      actividadesParaExportar.forEach((actividad) => {
        // Calcular la altura necesaria para el nombre de la actividad
        const nombreCompleto = actividad.nombre;
        const maxWidthNombre = 90; // Ancho máximo para la columna de nombre
        const lineasNombre = pdf.splitTextToSize(
          nombreCompleto,
          maxWidthNombre
        );
        const alturaFila = Math.max(12, lineasNombre.length * 6 + 6); // Altura mínima 12, más espacio para múltiples líneas

        // Verificar si necesitamos nueva página
        if (yPosition + alturaFila > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;

          // Repetir encabezados en nueva página
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(12);
          pdf.setTextColor(255, 255, 255);
          pdf.setFillColor(...colorPrimario);
          pdf.rect(20, yPosition - 5, pageWidth - 40, 15, "F");

          pdf.text("ACTIVIDAD", 25, yPosition + 5);
          pdf.text("FECHA", 120, yPosition + 5);
          pdf.text("MINISTERIO", 155, yPosition + 5);

          yPosition += 20;
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(10);
          pdf.setTextColor(...colorTexto);
          filaAlterna = false;
        }

        // Fondo alternado para las filas (con altura dinámica)
        if (filaAlterna) {
          pdf.setFillColor(245, 245, 245);
          pdf.rect(20, yPosition - 3, pageWidth - 40, alturaFila, "F");
        }

        // Nombre de la actividad (texto multilínea completo)
        const inicioTextoY = yPosition + 5;
        lineasNombre.forEach((linea: string, index: number) => {
          pdf.text(linea, 25, inicioTextoY + index * 6);
        });

        // Fecha formateada correctamente (centrada verticalmente)
        const centroFilaY = yPosition + alturaFila / 2 + 2;
        try {
          const fechaFormateada = dayjs(actividad.fecha).format("DD/MM/YYYY");
          pdf.text(fechaFormateada, 120, centroFilaY);
        } catch {
          pdf.text(actividad.fecha, 120, centroFilaY);
        }

        // Ministerio (centrado verticalmente y con texto multilínea si es necesario)
        const ministerio = actividad.ministerio?.nombre || "Sin ministerio";
        const maxWidthMinisterio = 35; // Ancho máximo para la columna de ministerio
        const lineasMinisterio = pdf.splitTextToSize(
          ministerio,
          maxWidthMinisterio
        );

        lineasMinisterio.forEach((linea: string, index: number) => {
          pdf.text(linea, 155, inicioTextoY + index * 6);
        });

        yPosition += alturaFila;
        filaAlterna = !filaAlterna;
      });

      // Footer en todas las páginas
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);

        // Línea decorativa del footer
        pdf.setDrawColor(...colorSecundario);
        pdf.setLineWidth(0.5);
        pdf.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25);

        // Información del footer
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(...colorSecundario);

        pdf.text(`Página ${i} de ${totalPages}`, 20, pageHeight - 15);
        pdf.text(
          `${iglesiaActiva?.nombre || "Iglesia"}`,
          pageWidth - 20,
          pageHeight - 15,
          { align: "right" }
        );
        pdf.text(
          `Generado el ${new Date().toLocaleDateString("es-ES")}`,
          pageWidth / 2,
          pageHeight - 15,
          { align: "center" }
        );
      }

      // Descargar el PDF
      const nombreArchivo = `actividades_${fechaInicio}_${fechaFin}.pdf`;
      pdf.save(nombreArchivo);

      console.log("✅ PDF mejorado exportado exitosamente:", nombreArchivo);

      setShowExportDialog(false);
      setFechaInicio("");
      setFechaFin("");
    } catch (error) {
      console.error("❌ Error al exportar PDF:", error);
      alert("Error al generar el PDF. Por favor intenta nuevamente.");
    } finally {
      setIsExporting(false);
    }
  };

  const toggleGrupo = (clave: string) => {
    const nuevosExpandidos = new Set(gruposExpandidos);
    if (nuevosExpandidos.has(clave)) {
      nuevosExpandidos.delete(clave);
    } else {
      nuevosExpandidos.add(clave);
    }
    setGruposExpandidos(nuevosExpandidos);
  };

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case "Programada":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "En curso":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "Finalizada":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      case "Cancelada":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo) {
      case "Regular":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      case "Especial":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setSearchTerm("");
    setFiltroEstado("todos");
    setFiltroTipo("todos");
    setCurrentPage(1);
  };

  // Cálculos de paginación
  const totalPages = Math.ceil(actividadesFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const actividadesPaginadas = actividadesFiltradas.slice(startIndex, endIndex);

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando actividades...</span>
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
          <div className="flex items-center gap-2 px-4 w-full">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb className="hidden md:flex">
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Actividades</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center gap-2 ml-auto">
              <ModeToggle />
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-2 md:p-4 pt-0">
          {/* Header con título y botones - Responsivo */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Actividades
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Gestiona las actividades de la iglesia
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowExportDialog(true)}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Exportar PDF</span>
                <span className="sm:hidden">PDF</span>
              </Button>
              <Button
                onClick={() => router.push("/actividades/nueva")}
                className="flex-1 sm:flex-none"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Nueva Actividad</span>
                <span className="sm:hidden">Nueva</span>
              </Button>
            </div>
          </div>

          {/* Pestañas de vista - Mejorado para móvil */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="flex bg-muted p-1 rounded-lg w-full sm:w-auto">
              <Button
                variant={vistaActual === "proximas" ? "default" : "ghost"}
                onClick={() => setVistaActual("proximas")}
                className="flex-1 sm:flex-none text-xs sm:text-sm"
              >
                Próximas
              </Button>
              <Button
                variant={vistaActual === "historico" ? "default" : "ghost"}
                onClick={() => setVistaActual("historico")}
                className="flex-1 sm:flex-none text-xs sm:text-sm"
              >
                Histórico
              </Button>
              <Button
                variant={vistaActual === "calendario" ? "default" : "ghost"}
                onClick={() => setVistaActual("calendario")}
                className="flex-1 sm:flex-none text-xs sm:text-sm"
              >
                Calendario
              </Button>
            </div>
          </div>

          {/* Controles de búsqueda y filtros - Optimizado para móvil */}
          <div className="flex flex-col gap-3">
            {/* Barra de búsqueda principal */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar actividades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="w-full sm:w-auto"
              >
                <Filter className="h-4 w-4 mr-2" />
                <span className="sm:hidden">Filtros</span>
                <span className="hidden sm:inline">
                  {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
                </span>
              </Button>
            </div>

            {/* Panel de filtros desplegable - Mejorado para móvil */}
            {showFilters && (
              <Card className="w-full">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Estado
                      </label>
                      <Select
                        value={filtroEstado}
                        onValueChange={setFiltroEstado}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Todos los estados" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          <SelectItem value="programada">Programada</SelectItem>
                          <SelectItem value="en_progreso">
                            En Progreso
                          </SelectItem>
                          <SelectItem value="completada">Completada</SelectItem>
                          <SelectItem value="cancelada">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Tipo
                      </label>
                      <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Todos los tipos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          <SelectItem value="regular">Regular</SelectItem>
                          <SelectItem value="especial">Especial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        onClick={limpiarFiltros}
                        className="w-full"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Limpiar filtros
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Contenido principal */}
          {actividadesFiltradas.length === 0 ? (
            <Card className="mt-6">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No hay actividades
                </h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  {vistaActual === "proximas"
                    ? "No hay actividades programadas."
                    : vistaActual === "historico"
                    ? "No hay actividades en el historial."
                    : "No hay actividades en el calendario."}
                </p>
                <Button onClick={() => router.push("/actividades/nueva")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear primera actividad
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {vistaActual === "calendario" ? (
                <div className="space-y-4">
                  {actividadesAgrupadas.map((grupo) => (
                    <Card key={grupo.año} className="w-full">
                      <CardHeader
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => toggleGrupo(grupo.año.toString())}
                      >
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl font-bold">
                            {grupo.año}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {grupo.meses.reduce(
                                (total, mes) => total + mes.actividades.length,
                                0
                              )}{" "}
                              actividades
                            </Badge>
                            <ChevronRight
                              className={`h-4 w-4 transition-transform duration-200 ${
                                gruposExpandidos.has(grupo.año.toString())
                                  ? "rotate-90"
                                  : ""
                              }`}
                            />
                          </div>
                        </div>
                      </CardHeader>

                      {gruposExpandidos.has(grupo.año.toString()) && (
                        <CardContent className="space-y-4">
                          {grupo.meses.map((mes) => (
                            <Card
                              key={`${grupo.año}-${mes.mes}`}
                              className="border-l-4 border-l-blue-500"
                            >
                              <CardHeader
                                className="cursor-pointer hover:bg-muted/50 transition-colors pb-3"
                                onClick={() =>
                                  toggleGrupo(`${grupo.año}-${mes.mes}`)
                                }
                              >
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-lg font-semibold capitalize">
                                    {mes.nombreMes}
                                  </CardTitle>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary">
                                      {mes.actividades.length} actividades
                                    </Badge>
                                    <ChevronRight
                                      className={`h-4 w-4 transition-transform duration-200 ${
                                        gruposExpandidos.has(
                                          `${grupo.año}-${mes.mes}`
                                        )
                                          ? "rotate-90"
                                          : ""
                                      }`}
                                    />
                                  </div>
                                </div>
                              </CardHeader>

                              {gruposExpandidos.has(
                                `${grupo.año}-${mes.mes}`
                              ) && (
                                <CardContent className="pt-0">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {mes.actividades.map((actividad) => (
                                      <Card
                                        key={actividad.id}
                                        className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500 cursor-pointer"
                                        onClick={() =>
                                          router.push(
                                            `/actividades/${actividad.id}`
                                          )
                                        }
                                      >
                                        <CardHeader className="pb-3">
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                              <CardTitle className="text-sm md:text-base font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                                                {actividad.nombre}
                                              </CardTitle>
                                              <div className="flex flex-wrap gap-1 mt-2">
                                                <Badge
                                                  variant="secondary"
                                                  className={`text-xs ${getEstadoBadgeColor(
                                                    actividad.estado
                                                  )}`}
                                                >
                                                  {actividad.estado}
                                                </Badge>
                                                <Badge
                                                  variant="outline"
                                                  className={`text-xs ${getTipoBadgeColor(
                                                    actividad.tipoActividad.tipo
                                                  )}`}
                                                >
                                                  {
                                                    actividad.tipoActividad
                                                      .nombre
                                                  }
                                                </Badge>
                                              </div>
                                            </div>
                                            <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                  onClick={(e) =>
                                                    e.stopPropagation()
                                                  }
                                                >
                                                  <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(
                                                      `/actividades/${actividad.id}/editar`
                                                    );
                                                  }}
                                                >
                                                  <Edit className="h-4 w-4 mr-2" />
                                                  Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    compartirActividad(
                                                      actividad
                                                    );
                                                  }}
                                                >
                                                  <Share2 className="h-4 w-4 mr-2" />
                                                  Compartir
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                  className="text-destructive"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    mostrarDialogEliminar(
                                                      actividad
                                                    );
                                                  }}
                                                >
                                                  <Trash2 className="h-4 w-4 mr-2" />
                                                  Eliminar
                                                </DropdownMenuItem>
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                          </div>
                                        </CardHeader>

                                        <CardContent className="pt-0 space-y-3">
                                          {/* Fecha y hora */}
                                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                                            <span className="truncate">
                                              {formatearFechaCompleta(
                                                actividad.fecha
                                              )}
                                            </span>
                                          </div>

                                          {(actividad.horaInicio ||
                                            actividad.horaFin) && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                              <Clock className="h-4 w-4 flex-shrink-0" />
                                              <span className="truncate">
                                                {formatearHora(
                                                  actividad.horaInicio
                                                )}
                                                {actividad.horaFin &&
                                                  ` - ${formatearHora(
                                                    actividad.horaFin
                                                  )}`}
                                              </span>
                                            </div>
                                          )}

                                          {/* Ubicación */}
                                          {actividad.ubicacion && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                              <MapPin className="h-4 w-4 flex-shrink-0" />
                                              <span className="truncate">
                                                {actividad.ubicacion}
                                              </span>
                                            </div>
                                          )}

                                          {/* Asistentes */}
                                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Users className="h-4 w-4 flex-shrink-0" />
                                            <span>
                                              {actividad.historialVisitas
                                                ?.length || 0}{" "}
                                              asistentes
                                            </span>
                                          </div>

                                          {/* Ministerio */}
                                          {actividad.ministerio && (
                                            <div className="pt-2 border-t">
                                              <Badge
                                                variant="outline"
                                                className="text-xs"
                                              >
                                                {actividad.ministerio.nombre}
                                              </Badge>
                                            </div>
                                          )}

                                          {/* Descripción truncada */}
                                          {actividad.descripcion && (
                                            <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                                              {actividad.descripcion}
                                            </p>
                                          )}
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                </CardContent>
                              )}
                            </Card>
                          ))}
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {actividadesPaginadas.map((actividad) => (
                    <Card
                      key={actividad.id}
                      className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 cursor-pointer"
                      onClick={() =>
                        router.push(`/actividades/${actividad.id}`)
                      }
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-sm md:text-base font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                              {actividad.nombre}
                            </CardTitle>
                            <div className="flex flex-wrap gap-1 mt-2">
                              <Badge
                                variant="secondary"
                                className={`text-xs ${getEstadoBadgeColor(
                                  actividad.estado
                                )}`}
                              >
                                {actividad.estado}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={`text-xs ${getTipoBadgeColor(
                                  actividad.tipoActividad.tipo
                                )}`}
                              >
                                {actividad.tipoActividad.nombre}
                              </Badge>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    `/actividades/${actividad.id}/editar`
                                  );
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  compartirActividad(actividad);
                                }}
                              >
                                <Share2 className="h-4 w-4 mr-2" />
                                Compartir
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  mostrarDialogEliminar(actividad);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0 space-y-3">
                        {/* Fecha y hora */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">
                            {formatearFechaCompleta(actividad.fecha)}
                          </span>
                        </div>

                        {(actividad.horaInicio || actividad.horaFin) && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">
                              {formatearHora(actividad.horaInicio)}
                              {actividad.horaFin &&
                                ` - ${formatearHora(actividad.horaFin)}`}
                            </span>
                          </div>
                        )}

                        {/* Ubicación */}
                        {actividad.ubicacion && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">
                              {actividad.ubicacion}
                            </span>
                          </div>
                        )}

                        {/* Asistentes */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4 flex-shrink-0" />
                          <span>
                            {actividad.historialVisitas?.length || 0} asistentes
                          </span>
                        </div>

                        {/* Ministerio */}
                        {actividad.ministerio && (
                          <div className="pt-2 border-t">
                            <Badge variant="outline" className="text-xs">
                              {actividad.ministerio.nombre}
                            </Badge>
                          </div>
                        )}

                        {/* Descripción truncada */}
                        {actividad.descripcion && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                            {actividad.descripcion}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Paginación mejorada para móvil - Solo en vistas proximas/historico */}
              {vistaActual !== "calendario" && totalPages > 1 && (
                <Card className="mt-6">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      {/* Info de paginación */}
                      <div className="text-sm text-muted-foreground order-2 sm:order-1">
                        Mostrando{" "}
                        <span className="font-medium">
                          {(currentPage - 1) * itemsPerPage + 1}
                        </span>{" "}
                        a{" "}
                        <span className="font-medium">
                          {Math.min(
                            currentPage * itemsPerPage,
                            actividadesFiltradas.length
                          )}
                        </span>{" "}
                        de{" "}
                        <span className="font-medium">
                          {actividadesFiltradas.length}
                        </span>{" "}
                        actividades
                      </div>

                      {/* Controles de paginación */}
                      <div className="flex items-center gap-2 order-1 sm:order-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage <= 1}
                          className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3 sm:py-2"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span className="hidden sm:inline ml-2">
                            Anterior
                          </span>
                        </Button>

                        {/* Números de página - Simplificado para móvil */}
                        <div className="flex items-center gap-1">
                          {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }

                            return (
                              <Button
                                key={pageNum}
                                variant={
                                  currentPage === pageNum
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className="h-8 w-8 p-0 text-xs sm:text-sm"
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage >= totalPages}
                          className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3 sm:py-2"
                        >
                          <ChevronRight className="h-4 w-4" />
                          <span className="hidden sm:inline ml-2">
                            Siguiente
                          </span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Dialog de exportación PDF */}
          <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
            <DialogContent className="max-w-md mx-4">
              <DialogHeader>
                <DialogTitle>Exportar actividades a PDF</DialogTitle>
                <DialogDescription>
                  Selecciona el rango de fechas para incluir en el reporte.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Fecha de inicio
                  </label>
                  <Input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Fecha de fin
                  </label>
                  <Input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowExportDialog(false)}
                  disabled={isExporting}
                  className="w-full sm:w-auto order-2 sm:order-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={exportarAPDF}
                  disabled={isExporting || !fechaInicio || !fechaFin}
                  className="w-full sm:w-auto order-1 sm:order-2"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generando PDF...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar PDF
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog de eliminación - Sin cambios, ya es responsivo */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-md mx-4">
              <DialogHeader>
                <DialogTitle>¿Eliminar actividad?</DialogTitle>
                <DialogDescription>
                  Esta acción no se puede deshacer. Se eliminará permanentemente
                  la actividad &quot;{actividadAEliminar?.nombre}&quot; y todos
                  sus datos asociados.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={isDeleting}
                  className="w-full sm:w-auto order-2 sm:order-1"
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmarEliminacion}
                  disabled={isDeleting}
                  className="w-full sm:w-auto order-1 sm:order-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
