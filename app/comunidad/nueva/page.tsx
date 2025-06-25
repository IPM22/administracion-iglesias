"use client";

import { AppSidebar } from "../../../components/app-sidebar";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Heart,
  UserPlus,
  Baby,
  Calendar,
  Plus,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect, Suspense } from "react";
import { CloudinaryUploader } from "../../../components/CloudinaryUploader";
import { PhoneInput } from "../../../components/PhoneInput";
import { ModeToggle } from "../../../components/mode-toggle";
import PersonaSelector from "../../../components/PersonaSelector";

// Interfaces para primera asistencia
interface TipoActividad {
  id: number;
  nombre: string;
  tipo: string;
}

interface Actividad {
  id: number;
  nombre: string;
  descripcion?: string;
  fecha: string;
  horaInicio?: string;
  horaFin?: string;
  ubicacion?: string;
  estado: string;
  tipoActividad: TipoActividad;
  horarios?: Array<{
    id: number;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    notas?: string;
  }>;
}

interface PersonaInvitador {
  id: number;
  nombres: string;
  apellidos: string;
  foto?: string;
  correo?: string;
  telefono?: string;
  celular?: string;
  tipo: "miembro" | "visita" | "nino";
  estado: string;
}

interface MiembroAPI {
  id: number;
  nombres: string;
  apellidos: string;
  foto?: string;
  correo?: string;
  telefono?: string;
  celular?: string;
  estado?: string;
  rol: string;
}

interface VisitaAPI {
  id: number;
  nombres: string;
  apellidos: string;
  foto?: string;
  correo?: string;
  telefono?: string;
  celular?: string;
  estado?: string;
}

interface NinoAPI {
  id: number;
  nombres: string;
  apellidos: string;
  foto?: string;
  correo?: string;
  telefono?: string;
  celular?: string;
  estado?: string;
}

const tiposPersona = {
  miembro: {
    titulo: "Nuevo Miembro",
    descripcion: "Registra un nuevo miembro de la iglesia",
    icono: Heart,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  visita: {
    titulo: "Nueva Visita",
    descripcion: "Registra una nueva visita a la iglesia",
    icono: UserPlus,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  nino: {
    titulo: "Nuevo Niño",
    descripcion: "Registra un nuevo niño en las actividades",
    icono: Baby,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
};

// Esquema simplificado y unificado
const formSchema = z.object({
  nombres: z.string().min(2, "Los nombres deben tener al menos 2 caracteres"),
  apellidos: z
    .string()
    .min(2, "Los apellidos deben tener al menos 2 caracteres"),
  correo: z
    .union([z.string().email("Correo inválido"), z.literal("")])
    .optional(),
  telefono: z.string().optional(),
  celular: z.string().optional(),
  direccion: z.string().optional(),
  fechaNacimiento: z.string().optional(),
  sexo: z.enum(["Masculino", "Femenino", "Otro"]).optional(),
  estadoCivil: z
    .enum(["Soltero/a", "Casado/a", "Viudo/a", "Divorciado/a"])
    .optional(),
  ocupacion: z.string().optional(),
  familia: z.string().optional(),
  familiaId: z.string().optional(),
  parentescoFamiliar: z.string().optional(),
  fechaIngreso: z.string().optional(),
  fechaBautismo: z.string().optional(),
  fechaPrimeraVisita: z.string().optional(),
  estado: z.string().optional(),
  foto: z.string().optional(),
  notasAdicionales: z.string().optional(),
  invitadoPor: z.string().optional(),
  idPersonaInvita: z.number().optional(),
  tutorLegal: z.string().optional(),
  telefonoTutor: z.string().optional(),
  // Campos para primera asistencia (solo para visitas)
  fechaAsistencia: z.string().optional(),
  tipoActividadId: z.string().optional(),
  actividadId: z.string().optional(),
  horarioId: z.string().optional(),
  invitadoPorAsistenciaId: z.string().optional(),
  observacionesAsistencia: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function ComunidadNuevaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para primera asistencia (solo para visitas)
  const [tiposActividad, setTiposActividad] = useState<TipoActividad[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [personasInvitadores, setPersonasInvitadores] = useState<
    PersonaInvitador[]
  >([]);
  const [personaInvitadorSeleccionada, setPersonaInvitadorSeleccionada] =
    useState<PersonaInvitador | null>(null);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string>("");
  const [actividadSeleccionada, setActividadSeleccionada] =
    useState<Actividad | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [horarioSeleccionado, setHorarioSeleccionado] = useState<string>("");
  const [agregarAsistencia, setAgregarAsistencia] = useState(false);

  const tipo = searchParams.get("tipo") || "miembro";
  const tipoInfo =
    tiposPersona[tipo as keyof typeof tiposPersona] || tiposPersona.miembro;
  const Icono = tipoInfo.icono;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombres: "",
      apellidos: "",
      correo: "",
      telefono: "",
      celular: "",
      direccion: "",
      fechaNacimiento: "",
      sexo: undefined,
      estadoCivil: undefined,
      ocupacion: "",
      familia: "",
      familiaId: undefined,
      parentescoFamiliar: "",
      fechaIngreso: "",
      fechaBautismo: "",
      fechaPrimeraVisita: "",
      estado: "",
      foto: "",
      notasAdicionales: "",
      invitadoPor: "",
      idPersonaInvita: undefined,
      tutorLegal: "",
      telefonoTutor: "",
      fechaAsistencia: new Date().toISOString().split("T")[0],
      tipoActividadId: "",
      actividadId: "",
      horarioId: "",
      invitadoPorAsistenciaId: "",
      observacionesAsistencia: "",
    },
  });

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      // Si es visita, cargar también datos para primera asistencia
      if (tipo === "visita") {
        await cargarDatosAsistencia();
      }
    };
    cargarDatos();

    // Establecer valores por defecto según el tipo
    if (tipo === "visita") {
      const hoy = new Date().toISOString().split("T")[0];
      form.setValue("fechaPrimeraVisita", hoy);
      form.setValue("estado", "Nueva");
    } else if (tipo === "miembro") {
      const hoy = new Date().toISOString().split("T")[0];
      form.setValue("fechaIngreso", hoy);
      form.setValue("estado", "Activo");
    } else if (tipo === "nino") {
      form.setValue("estado", "Activo");
    }
  }, [tipo, form]);

  // Cargar datos necesarios para primera asistencia (solo para visitas)
  const cargarDatosAsistencia = async () => {
    try {
      console.log("🔄 Cargando datos para primera asistencia...");

      // Obtener tipos de actividad
      const tiposResponse = await fetch("/api/tipos-actividad");
      if (tiposResponse.ok) {
        const tiposData = await tiposResponse.json();
        console.log("✅ Tipos de actividad cargados:", tiposData.length);
        setTiposActividad(tiposData);
      } else {
        console.error(
          "❌ Error al cargar tipos de actividad:",
          tiposResponse.status
        );
      }

      // Cargar todas las personas de diferentes endpoints
      const personasFinales: PersonaInvitador[] = [];

      // 1. Cargar miembros
      try {
        const miembrosResponse = await fetch("/api/miembros");
        if (miembrosResponse.ok) {
          const miembrosData = await miembrosResponse.json();
          const miembrosArray = Array.isArray(miembrosData) ? miembrosData : [];

          const miembrosConTipo: PersonaInvitador[] = miembrosArray
            .filter((persona: MiembroAPI) => persona.rol === "MIEMBRO")
            .map((miembro: MiembroAPI) => ({
              id: miembro.id,
              nombres: miembro.nombres,
              apellidos: miembro.apellidos,
              foto: miembro.foto,
              correo: miembro.correo,
              telefono: miembro.telefono,
              celular: miembro.celular,
              tipo: "miembro" as const,
              estado: miembro.estado || "Activo",
            }));

          personasFinales.push(...miembrosConTipo);
          console.log("✅ Miembros cargados:", miembrosConTipo.length);
        }
      } catch (error) {
        console.error("❌ Error al cargar miembros:", error);
      }

      // 2. Cargar visitas
      try {
        const visitasResponse = await fetch("/api/visitas");
        if (visitasResponse.ok) {
          const visitasData = await visitasResponse.json();
          const visitasArray = Array.isArray(visitasData) ? visitasData : [];

          const visitasConTipo: PersonaInvitador[] = visitasArray.map(
            (visita: VisitaAPI) => ({
              id: visita.id,
              nombres: visita.nombres,
              apellidos: visita.apellidos,
              foto: visita.foto,
              correo: visita.correo,
              telefono: visita.telefono,
              celular: visita.celular,
              tipo: "visita" as const,
              estado: visita.estado || "Nueva",
            })
          );

          personasFinales.push(...visitasConTipo);
          console.log("✅ Visitas cargadas:", visitasConTipo.length);
        }
      } catch (error) {
        console.error("❌ Error al cargar visitas:", error);
      }

      // 3. Cargar niños
      try {
        const ninosResponse = await fetch("/api/ninos");
        if (ninosResponse.ok) {
          const ninosData = await ninosResponse.json();
          const ninosArray = Array.isArray(ninosData) ? ninosData : [];

          const ninosConTipo: PersonaInvitador[] = ninosArray.map(
            (nino: NinoAPI) => ({
              id: nino.id,
              nombres: nino.nombres,
              apellidos: nino.apellidos,
              foto: nino.foto,
              correo: nino.correo,
              telefono: nino.telefono,
              celular: nino.celular,
              tipo: "nino" as const,
              estado: nino.estado || "Activo",
            })
          );

          personasFinales.push(...ninosConTipo);
          console.log("✅ Niños cargados:", ninosConTipo.length);
        }
      } catch (error) {
        console.error("❌ Error al cargar niños:", error);
      }

      // Ordenar por rol (miembros primero, luego visitas, luego niños) y después por apellido
      personasFinales.sort((a, b) => {
        const ordenRol = { miembro: 1, visita: 2, nino: 3 };
        const orderA = ordenRol[a.tipo] || 4;
        const orderB = ordenRol[b.tipo] || 4;

        if (orderA !== orderB) {
          return orderA - orderB;
        }

        // Si tienen el mismo rol, ordenar por apellido
        const apellidoCompare = a.apellidos.localeCompare(b.apellidos);
        if (apellidoCompare !== 0) return apellidoCompare;
        return a.nombres.localeCompare(b.nombres);
      });

      console.log(
        "✅ Total personas cargadas para invitadores:",
        personasFinales.length,
        "- Miembros:",
        personasFinales.filter((p) => p.tipo === "miembro").length,
        "- Visitas:",
        personasFinales.filter((p) => p.tipo === "visita").length,
        "- Niños:",
        personasFinales.filter((p) => p.tipo === "nino").length
      );

      setPersonasInvitadores(personasFinales);
    } catch (error) {
      console.error("💥 Error al cargar datos para primera asistencia:", error);
    }
  };

  // Cargar actividades cuando se selecciona un tipo especial (solo para visitas)
  useEffect(() => {
    const cargarActividades = async () => {
      if (!tipoSeleccionado || tipo !== "visita") {
        setActividades([]);
        return;
      }

      const tipoActividad = tiposActividad.find(
        (tipoAct) => tipoAct.id.toString() === tipoSeleccionado
      );

      if (tipoActividad?.tipo === "Especial") {
        try {
          console.log("🔄 Cargando actividades especiales...");
          const response = await fetch("/api/actividades");

          if (!response.ok) {
            const errorText = await response.text();
            console.error(
              "❌ Error al cargar actividades:",
              response.status,
              errorText
            );
            throw new Error(`Error ${response.status}: ${errorText}`);
          }

          const data = await response.json();
          console.log("✅ Actividades recibidas:", data);

          const actividadesArray = Array.isArray(data)
            ? data
            : data.actividades || [];
          const actividadesFiltradas = actividadesArray.filter(
            (act: Actividad) =>
              act.tipoActividad.id.toString() === tipoSeleccionado
          );

          actividadesFiltradas.sort(
            (a: Actividad, b: Actividad) =>
              new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
          );

          console.log("✅ Actividades filtradas:", actividadesFiltradas.length);
          setActividades(actividadesFiltradas);

          // Auto-selección inteligente de actividad y horario según el momento actual
          const ahora = new Date();
          const hoy = ahora.toISOString().split("T")[0];
          const horaActual = ahora.getHours() * 60 + ahora.getMinutes(); // minutos desde medianoche

          // Buscar actividades de hoy primero
          const actividadesHoy = actividadesFiltradas.filter(
            (act: Actividad) => act.fecha.split("T")[0] === hoy
          );

          let actividadParaSeleccionar: Actividad | null = null;
          let horarioParaSeleccionar: string = "";

          if (actividadesHoy.length > 0) {
            // Si hay actividades hoy, buscar la más apropiada
            for (const actividad of actividadesHoy) {
              if (actividad.horarios && actividad.horarios.length > 0) {
                // Si tiene horarios múltiples, buscar el más apropiado
                const horariosOrdenados = [...actividad.horarios].sort(
                  (a, b) => {
                    const horaA = a.horaInicio
                      ? parseInt(a.horaInicio.split(":")[0]) * 60 +
                        parseInt(a.horaInicio.split(":")[1])
                      : 0;
                    const horaB = b.horaInicio
                      ? parseInt(b.horaInicio.split(":")[0]) * 60 +
                        parseInt(b.horaInicio.split(":")[1])
                      : 0;
                    return horaA - horaB;
                  }
                );

                // Buscar horario actual o próximo
                let horarioEncontrado = false;
                for (const horario of horariosOrdenados) {
                  if (horario.horaInicio && horario.horaFin) {
                    const inicioMinutos =
                      parseInt(horario.horaInicio.split(":")[0]) * 60 +
                      parseInt(horario.horaInicio.split(":")[1]);
                    const finMinutos =
                      parseInt(horario.horaFin.split(":")[0]) * 60 +
                      parseInt(horario.horaFin.split(":")[1]);

                    // Si estamos dentro del horario o es el próximo horario
                    if (
                      horaActual >= inicioMinutos &&
                      horaActual <= finMinutos
                    ) {
                      // Actividad en curso
                      actividadParaSeleccionar = actividad;
                      horarioParaSeleccionar = horario.id.toString();
                      horarioEncontrado = true;
                      console.log(
                        "🎯 Auto-seleccionando actividad en curso:",
                        actividad.nombre,
                        "horario:",
                        horario.horaInicio
                      );
                      break;
                    } else if (horaActual < inicioMinutos) {
                      // Próxima actividad del día
                      actividadParaSeleccionar = actividad;
                      horarioParaSeleccionar = horario.id.toString();
                      horarioEncontrado = true;
                      console.log(
                        "🎯 Auto-seleccionando próxima actividad:",
                        actividad.nombre,
                        "horario:",
                        horario.horaInicio
                      );
                      break;
                    }
                  }
                }

                if (horarioEncontrado) break;
              } else if (actividad.horaInicio) {
                // Si solo tiene horario único, verificar si es apropiado
                const inicioMinutos =
                  parseInt(actividad.horaInicio.split(":")[0]) * 60 +
                  parseInt(actividad.horaInicio.split(":")[1]);
                const finMinutos = actividad.horaFin
                  ? parseInt(actividad.horaFin.split(":")[0]) * 60 +
                    parseInt(actividad.horaFin.split(":")[1])
                  : inicioMinutos + 120;

                if (horaActual >= inicioMinutos && horaActual <= finMinutos) {
                  actividadParaSeleccionar = actividad;
                  console.log(
                    "🎯 Auto-seleccionando actividad única en curso:",
                    actividad.nombre
                  );
                  break;
                } else if (horaActual < inicioMinutos) {
                  actividadParaSeleccionar = actividad;
                  console.log(
                    "🎯 Auto-seleccionando próxima actividad única:",
                    actividad.nombre
                  );
                  break;
                }
              }
            }
          }

          // Si no encontramos actividad hoy, buscar la próxima actividad futura
          if (!actividadParaSeleccionar) {
            const actividadesFuturas = actividadesFiltradas
              .filter((act: Actividad) => new Date(act.fecha) > ahora)
              .sort(
                (a: Actividad, b: Actividad) =>
                  new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
              );

            if (actividadesFuturas.length > 0) {
              actividadParaSeleccionar = actividadesFuturas[0];
              if (
                actividadParaSeleccionar?.horarios &&
                actividadParaSeleccionar.horarios.length > 0
              ) {
                // Seleccionar el primer horario de la actividad futura
                const primerHorario = actividadParaSeleccionar.horarios.sort(
                  (a, b) => {
                    const horaA = a.horaInicio
                      ? parseInt(a.horaInicio.split(":")[0]) * 60 +
                        parseInt(a.horaInicio.split(":")[1])
                      : 0;
                    const horaB = b.horaInicio
                      ? parseInt(b.horaInicio.split(":")[0]) * 60 +
                        parseInt(b.horaInicio.split(":")[1])
                      : 0;
                    return horaA - horaB;
                  }
                )[0];
                horarioParaSeleccionar = primerHorario.id.toString();
              }
              console.log(
                "🎯 Auto-seleccionando próxima actividad futura:",
                actividadParaSeleccionar?.nombre
              );
            }
          }

          // Aplicar selección automática si encontramos algo
          if (actividadParaSeleccionar) {
            form.setValue(
              "actividadId",
              actividadParaSeleccionar.id.toString()
            );
            setActividadSeleccionada(actividadParaSeleccionar);

            if (horarioParaSeleccionar) {
              form.setValue("horarioId", horarioParaSeleccionar);
              setHorarioSeleccionado(horarioParaSeleccionar);
            }
          }
        } catch (error) {
          console.error("💥 Error al cargar actividades:", error);
          setError(
            "Error al cargar las actividades: " +
              (error instanceof Error ? error.message : "Error desconocido")
          );
        }
      } else {
        setActividades([]);
        if (tipoActividad?.tipo === "Regular") {
          form.setValue(
            "fechaAsistencia",
            new Date().toISOString().split("T")[0]
          );
        }
      }
    };

    if (agregarAsistencia && tipo === "visita") {
      cargarActividades();
    }
  }, [tipoSeleccionado, tiposActividad, form, agregarAsistencia, tipo]);

  // Actualizar fecha cuando se selecciona actividad específica (solo para visitas)
  useEffect(() => {
    if (tipo !== "visita") return;

    const actividadIdSeleccionada = form.watch("actividadId");

    if (actividadIdSeleccionada && actividades.length > 0) {
      const actividadSeleccionada = actividades.find(
        (act) => act.id.toString() === actividadIdSeleccionada
      );

      if (actividadSeleccionada) {
        setActividadSeleccionada(actividadSeleccionada);
        const fechaActividad = new Date(actividadSeleccionada.fecha)
          .toISOString()
          .split("T")[0];
        form.setValue("fechaAsistencia", fechaActividad);
      }
    } else {
      setActividadSeleccionada(null);
    }
  }, [form.watch("actividadId"), actividades, form, tipo]);

  // Función para determinar si se debe mostrar el campo de fecha (solo para visitas)
  const deberMostrarCampoFecha = () => {
    if (tipo !== "visita") return false;
    const tipoActividad = tiposActividad.find(
      (tipoAct) => tipoAct.id.toString() === tipoSeleccionado
    );
    return tipoActividad?.tipo === "Regular";
  };

  async function onSubmit(values: FormValues) {
    setSaving(true);
    setError(null);
    try {
      // Determinar endpoint según el tipo
      const endpoint =
        tipo === "visita"
          ? "/api/visitas"
          : tipo === "nino"
          ? "/api/ninos" // Usar API específica para niños
          : "/api/miembros";

      // Preparar datos con tipo y rol correctos según el parámetro de la URL
      const dataToSend = {
        ...values,
        tipo: tipo, // Pasar el tipo de la URL
        rol:
          tipo === "visita" ? "visita" : tipo === "nino" ? "nino" : "miembro", // Determinar rol
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `Error al crear ${
              tipo === "visita"
                ? "la visita"
                : tipo === "nino"
                ? "el niño"
                : "el miembro"
            }`
        );
      }

      const personaCreada = await response.json();

      // Si es visita y se quiere agregar primera asistencia, crearla
      if (
        tipo === "visita" &&
        agregarAsistencia &&
        (values.tipoActividadId || values.actividadId)
      ) {
        const fechaParaRegistro = actividadSeleccionada
          ? actividadSeleccionada.fecha
          : values.fechaAsistencia || new Date().toISOString().split("T")[0];

        const historialResponse = await fetch(
          `/api/visitas/${personaCreada.id}/historial`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fecha: fechaParaRegistro,
              tipoActividadId: values.tipoActividadId
                ? parseInt(values.tipoActividadId)
                : null,
              actividadId: values.actividadId
                ? parseInt(values.actividadId)
                : null,
              horarioId: values.horarioId ? parseInt(values.horarioId) : null,
              invitadoPorId: values.invitadoPorAsistenciaId
                ? parseInt(values.invitadoPorAsistenciaId)
                : null,
              observaciones: values.observacionesAsistencia || null,
            }),
          }
        );

        if (!historialResponse.ok) {
          const errorData = await historialResponse.json();
          console.error(
            "Error al registrar primera asistencia:",
            historialResponse.status,
            errorData
          );
          // Mostrar el error específico al usuario
          setError(
            `La visita se creó correctamente, pero hubo un error al registrar la primera asistencia: ${
              errorData.error || "Error desconocido"
            }`
          );
          return; // No redirigir si hay error
        } else {
          console.log("✅ Primera asistencia registrada exitosamente");
        }
      }

      // Redirigir según el tipo con el parámetro correcto
      if (tipo === "visita") {
        router.push("/comunidad?tipo=visita");
      } else {
        router.push("/comunidad");
      }
    } catch (error) {
      console.error("Error:", error);
      setError(
        error instanceof Error
          ? error.message
          : `Error al guardar ${
              tipo === "visita"
                ? "la visita"
                : tipo === "nino"
                ? "el niño"
                : "el miembro"
            }`
      );
    } finally {
      setSaving(false);
    }
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
                <BreadcrumbItem>
                  <BreadcrumbLink href="/comunidad">Comunidad</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{tipoInfo.titulo}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="px-4">
            <ModeToggle />
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </div>

          {error && (
            <div
              className={`${tipoInfo.bgColor} border ${tipoInfo.borderColor} rounded-md p-4`}
            >
              <p className={tipoInfo.color}>{error}</p>
            </div>
          )}

          {/* Header del tipo de persona */}
          <div
            className={`${tipoInfo.bgColor} border ${tipoInfo.borderColor} rounded-md p-4`}
          >
            <div className="flex items-center gap-3">
              <Icono className={`h-6 w-6 ${tipoInfo.color}`} />
              <div>
                <h3 className={`font-semibold ${tipoInfo.color}`}>
                  {tipoInfo.titulo}
                </h3>
                <p className="text-sm text-gray-600">{tipoInfo.descripcion}</p>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Card Principal - Información de la Persona */}
              <Card>
                <CardHeader>
                  <CardTitle>{tipoInfo.titulo}</CardTitle>
                  <CardDescription>{tipoInfo.descripcion}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Sección de Datos Personales con Foto */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">
                        Datos Personales
                      </h3>
                      <div className="grid gap-6 md:grid-cols-3">
                        {/* Columna izquierda - Datos principales */}
                        <div className="md:col-span-2 space-y-4">
                          {/* Nombres y Apellidos */}
                          <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                              control={form.control}
                              name="nombres"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nombres *</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder={
                                        tipo === "nino"
                                          ? "María José"
                                          : "Juan Carlos"
                                      }
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="apellidos"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Apellidos *</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder={
                                        tipo === "nino" ? "González" : "Pérez"
                                      }
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Datos específicos según tipo */}
                          {tipo === "visita" ? (
                            // Para visitas: solo ocupación
                            <div className="grid gap-4 md:grid-cols-1">
                              <FormField
                                control={form.control}
                                name="ocupacion"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Ocupación</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Doctora, Ingeniera, etc."
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormDescription>Opcional</FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          ) : (
                            // Para miembros y niños: campos más completos
                            <div className="grid gap-4 md:grid-cols-4">
                              <FormField
                                control={form.control}
                                name="fechaNacimiento"
                                render={({ field }) => (
                                  <FormItem className="md:col-span-2">
                                    <FormLabel>Fecha de Nacimiento</FormLabel>
                                    <FormControl>
                                      <Input type="date" {...field} />
                                    </FormControl>
                                    <FormDescription>Opcional</FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="sexo"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Sexo</FormLabel>
                                    <Select
                                      onValueChange={field.onChange}
                                      defaultValue={field.value || ""}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Selecciona" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="Masculino">
                                          Masculino
                                        </SelectItem>
                                        <SelectItem value="Femenino">
                                          Femenino
                                        </SelectItem>
                                        <SelectItem value="Otro">
                                          Otro
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormDescription>Opcional</FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              {tipo !== "nino" && (
                                <FormField
                                  control={form.control}
                                  name="estadoCivil"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Estado Civil</FormLabel>
                                      <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value || ""}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Selecciona" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="Soltero/a">
                                            Soltero/a
                                          </SelectItem>
                                          <SelectItem value="Casado/a">
                                            Casado/a
                                          </SelectItem>
                                          <SelectItem value="Viudo/a">
                                            Viudo/a
                                          </SelectItem>
                                          <SelectItem value="Divorciado/a">
                                            Divorciado/a
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormDescription>
                                        Opcional
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              )}

                              {/* Solo para miembros y niños: ocupación */}
                              <FormField
                                control={form.control}
                                name="ocupacion"
                                render={({ field }) => (
                                  <FormItem
                                    className={
                                      tipo === "nino" ? "md:col-span-2" : ""
                                    }
                                  >
                                    <FormLabel>
                                      {tipo === "nino"
                                        ? "Grado Escolar"
                                        : "Ocupación"}
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder={
                                          tipo === "nino"
                                            ? "3er grado, Kinder, etc."
                                            : "Ingeniero, Doctor, etc."
                                        }
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormDescription>Opcional</FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          )}
                        </div>

                        {/* Columna derecha - Foto */}
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-full bg-muted border border-border rounded-lg p-4 h-full min-h-[200px] flex flex-col justify-center">
                            <FormField
                              control={form.control}
                              name="foto"
                              render={({ field }) => (
                                <FormItem className="w-full">
                                  <FormLabel className="text-sm font-medium text-center block mb-3">
                                    Foto{" "}
                                    {tipo === "visita"
                                      ? "de la Visita"
                                      : tipo === "nino"
                                      ? "del Niño"
                                      : "del Miembro"}
                                  </FormLabel>
                                  <FormControl>
                                    <CloudinaryUploader
                                      value={field.value}
                                      onChange={field.onChange}
                                      onRemove={() => field.onChange("")}
                                    />
                                  </FormControl>
                                  <FormDescription className="text-xs text-center text-muted-foreground mt-2">
                                    Opcional - Máximo 5MB
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card de Datos de Contacto y Información Adicional */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {tipo === "visita"
                      ? "Información de Contacto"
                      : tipo === "nino"
                      ? "Datos de Contacto y Tutores"
                      : "Datos de Contacto y Ministeriales"}
                  </CardTitle>
                  <CardDescription>
                    {tipo === "visita"
                      ? "Información de contacto de la visita"
                      : tipo === "nino"
                      ? "Datos de contacto del niño y sus tutores"
                      : "Información de contacto y datos ministeriales del miembro"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Sección de Datos de Contacto */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Datos de Contacto</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="correo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Correo</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder={
                                  tipo === "nino"
                                    ? "correo@padres.com"
                                    : "correo@ejemplo.com"
                                }
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>Opcional</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="telefono"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teléfono</FormLabel>
                            <FormControl>
                              <PhoneInput
                                value={field.value || ""}
                                onChange={field.onChange}
                                placeholder="809-699-7909"
                              />
                            </FormControl>
                            <FormDescription>Opcional</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="celular"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Celular</FormLabel>
                            <FormControl>
                              <PhoneInput
                                value={field.value || ""}
                                onChange={field.onChange}
                                placeholder="809-699-7909"
                              />
                            </FormControl>
                            <FormDescription>Opcional</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="direccion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dirección</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Calle Principal 123, Ciudad"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>Opcional</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Sección específica para miembros */}
                  {tipo === "miembro" && (
                    <>
                      {/* Ocupación y Familia */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">
                          Información Personal
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="ocupacion"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ocupación</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Ingeniero, Doctor, etc."
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>Opcional</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="familia"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Familia</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Nombre de la familia"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Opcional - Se puede asignar más tarde
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="parentescoFamiliar"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Parentesco Familiar</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value || ""}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecciona parentesco" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Cabeza de Familia">
                                      Cabeza de Familia
                                    </SelectItem>
                                    <SelectItem value="Esposo/a">
                                      Esposo/a
                                    </SelectItem>
                                    <SelectItem value="Hijo/a">
                                      Hijo/a
                                    </SelectItem>
                                    <SelectItem value="Padre/Madre">
                                      Padre/Madre
                                    </SelectItem>
                                    <SelectItem value="Abuelo/a">
                                      Abuelo/a
                                    </SelectItem>
                                    <SelectItem value="Hermano/a">
                                      Hermano/a
                                    </SelectItem>
                                    <SelectItem value="Tío/a">Tío/a</SelectItem>
                                    <SelectItem value="Sobrino/a">
                                      Sobrino/a
                                    </SelectItem>
                                    <SelectItem value="Primo/a">
                                      Primo/a
                                    </SelectItem>
                                    <SelectItem value="Cuñado/a">
                                      Cuñado/a
                                    </SelectItem>
                                    <SelectItem value="Yerno/Nuera">
                                      Yerno/Nuera
                                    </SelectItem>
                                    <SelectItem value="Suegro/a">
                                      Suegro/a
                                    </SelectItem>
                                    <SelectItem value="Nieto/a">
                                      Nieto/a
                                    </SelectItem>
                                    <SelectItem value="Otro">Otro</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Opcional - Define la relación con el cabeza de
                                  familia
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Datos Ministeriales */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">
                          Datos Ministeriales
                        </h3>
                        <div className="grid gap-4 md:grid-cols-3">
                          <FormField
                            control={form.control}
                            name="fechaIngreso"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Fecha de Ingreso</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Fecha en que se unió a la iglesia
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="fechaBautismo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Fecha de Bautismo</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormDescription>Opcional</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="estado"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Estado</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value || ""}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecciona estado" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Activo">
                                      Activo
                                    </SelectItem>
                                    <SelectItem value="Inactivo">
                                      Inactivo
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Estado actual del miembro
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Sección específica para niños */}
                  {tipo === "nino" && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">
                        Información del Tutor
                      </h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="tutorLegal"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tutor Legal</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Nombre del padre/madre/tutor"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>Opcional</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="telefonoTutor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Teléfono del Tutor</FormLabel>
                              <FormControl>
                                <PhoneInput
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                  placeholder="809-699-7909"
                                />
                              </FormControl>
                              <FormDescription>Opcional</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  {/* Notas Adicionales para todos */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">
                      {tipo === "visita"
                        ? "Información Adicional"
                        : tipo === "nino"
                        ? "Notas sobre el Niño"
                        : "Información Adicional"}
                    </h3>
                    <FormField
                      control={form.control}
                      name="notasAdicionales"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notas Adicionales</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={
                                tipo === "visita"
                                  ? "Información adicional sobre la visita, cómo conoció la iglesia, etc..."
                                  : tipo === "nino"
                                  ? "Información sobre alergias, necesidades especiales, etc..."
                                  : "Información adicional sobre el miembro, ministerios de interés, etc..."
                              }
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Opcional</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Card Opcional - Primera Asistencia (solo para visitas) */}
              {tipo === "visita" && (
                <Card className="border-primary/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        <CardTitle className="text-primary">
                          Registrar Primera Asistencia
                        </CardTitle>
                      </div>
                      <Button
                        type="button"
                        variant={agregarAsistencia ? "default" : "outline"}
                        size="sm"
                        onClick={() => setAgregarAsistencia(!agregarAsistencia)}
                      >
                        {agregarAsistencia ? (
                          <>
                            <X className="mr-2 h-4 w-4" />
                            Quitar
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Agregar
                          </>
                        )}
                      </Button>
                    </div>
                    <CardDescription>
                      Opcional: Registra la primera asistencia de esta persona a
                      una actividad de la iglesia en el mismo proceso
                    </CardDescription>
                  </CardHeader>

                  {agregarAsistencia && (
                    <CardContent className="space-y-6">
                      {/* Actividad: Tipo y campos relacionados */}
                      <div className="space-y-4">
                        {/* Tipo de Actividad */}
                        <FormField
                          control={form.control}
                          name="tipoActividadId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Actividad</FormLabel>
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  setTipoSeleccionado(value);
                                  // Limpiar selección de actividad específica
                                  form.setValue("actividadId", "");
                                  setActividadSeleccionada(null);

                                  // Si es actividad regular, establecer fecha actual
                                  const tipoActividad = tiposActividad.find(
                                    (tipoAct) => tipoAct.id.toString() === value
                                  );
                                  if (tipoActividad?.tipo === "Regular") {
                                    form.setValue(
                                      "fechaAsistencia",
                                      new Date().toISOString().split("T")[0]
                                    );
                                  } else {
                                    form.setValue("fechaAsistencia", "");
                                  }
                                }}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona el tipo" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {tiposActividad.map((tipoAct) => (
                                    <SelectItem
                                      key={tipoAct.id}
                                      value={tipoAct.id.toString()}
                                    >
                                      {tipoAct.nombre} ({tipoAct.tipo})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Regular (culto, estudio) o especial
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Fecha de la asistencia - Solo para actividades regulares */}
                        {deberMostrarCampoFecha() && (
                          <FormField
                            control={form.control}
                            name="fechaAsistencia"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Fecha de la Asistencia</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Fecha en que la persona asistió
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {/* Actividad Específica - Solo para actividades especiales */}
                        <FormField
                          control={form.control}
                          name="actividadId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Actividad Específica</FormLabel>
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  if (value && actividades.length > 0) {
                                    const actividad = actividades.find(
                                      (act) => act.id.toString() === value
                                    );
                                    if (actividad) {
                                      setActividadSeleccionada(actividad);
                                      const fechaActividad = new Date(
                                        actividad.fecha
                                      )
                                        .toISOString()
                                        .split("T")[0];
                                      form.setValue(
                                        "fechaAsistencia",
                                        fechaActividad
                                      );
                                    }
                                  } else {
                                    setActividadSeleccionada(null);
                                  }
                                }}
                                value={field.value}
                                disabled={
                                  !tipoSeleccionado ||
                                  tiposActividad.find(
                                    (t) => t.id.toString() === tipoSeleccionado
                                  )?.tipo !== "Especial"
                                }
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue
                                      placeholder={
                                        !tipoSeleccionado
                                          ? "Primero selecciona el tipo"
                                          : tiposActividad.find(
                                              (t) =>
                                                t.id.toString() ===
                                                tipoSeleccionado
                                            )?.tipo !== "Especial"
                                          ? "Solo para actividades especiales"
                                          : "Selecciona la actividad"
                                      }
                                    />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {actividades.map((actividad) => (
                                    <SelectItem
                                      key={actividad.id}
                                      value={actividad.id.toString()}
                                    >
                                      <div className="flex flex-col">
                                        <span>{actividad.nombre}</span>
                                        <span className="text-xs text-muted-foreground">
                                          {new Date(
                                            actividad.fecha
                                          ).toLocaleDateString()}
                                          {actividad.horaInicio &&
                                            ` - ${actividad.horaInicio}`}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Opcional - Solo para eventos especiales
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Información de fecha automática para actividades especiales */}
                        {actividadSeleccionada && (
                          <div className="rounded-lg border p-4 bg-muted/50">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="h-4 w-4 text-primary" />
                              <span className="font-medium">
                                Fecha de la Actividad
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              La fecha se tomará automáticamente de la actividad
                              específica:
                            </p>
                            <p className="font-medium mt-1">
                              {new Date(
                                actividadSeleccionada.fecha
                              ).toLocaleDateString("es-ES", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                              {actividadSeleccionada.horaInicio && (
                                <span className="text-muted-foreground">
                                  {" "}
                                  a las {actividadSeleccionada.horaInicio}
                                </span>
                              )}
                            </p>
                          </div>
                        )}

                        {/* Selector de Horario Específico - Solo si la actividad tiene múltiples horarios */}
                        {actividadSeleccionada &&
                          actividadSeleccionada.horarios &&
                          actividadSeleccionada.horarios.length > 0 && (
                            <FormField
                              control={form.control}
                              name="horarioId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Horario Específico</FormLabel>
                                  <Select
                                    onValueChange={(value) => {
                                      field.onChange(value);
                                      setHorarioSeleccionado(value);
                                    }}
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecciona el horario al que asistió" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {actividadSeleccionada.horarios
                                        ?.sort((a, b) => {
                                          // Ordenar por fecha y luego por hora
                                          const fechaA = new Date(a.fecha);
                                          const fechaB = new Date(b.fecha);
                                          if (
                                            fechaA.getTime() !==
                                            fechaB.getTime()
                                          ) {
                                            return (
                                              fechaA.getTime() -
                                              fechaB.getTime()
                                            );
                                          }
                                          // Si es la misma fecha, ordenar por hora
                                          const horaA = a.horaInicio
                                            ? parseInt(
                                                a.horaInicio.split(":")[0]
                                              ) *
                                                60 +
                                              parseInt(
                                                a.horaInicio.split(":")[1]
                                              )
                                            : 0;
                                          const horaB = b.horaInicio
                                            ? parseInt(
                                                b.horaInicio.split(":")[0]
                                              ) *
                                                60 +
                                              parseInt(
                                                b.horaInicio.split(":")[1]
                                              )
                                            : 0;
                                          return horaA - horaB;
                                        })
                                        .map((horario) => (
                                          <SelectItem
                                            key={horario.id}
                                            value={horario.id.toString()}
                                          >
                                            <div className="flex flex-col">
                                              <div className="flex items-center gap-2">
                                                <span className="font-medium">
                                                  {new Date(
                                                    horario.fecha
                                                  ).toLocaleDateString(
                                                    "es-ES",
                                                    {
                                                      weekday: "short",
                                                      day: "numeric",
                                                      month: "short",
                                                    }
                                                  )}
                                                </span>
                                                <span className="text-primary">
                                                  {horario.horaInicio} -{" "}
                                                  {horario.horaFin}
                                                </span>
                                              </div>
                                              {horario.notas && (
                                                <span className="text-xs text-muted-foreground">
                                                  {horario.notas}
                                                </span>
                                              )}
                                            </div>
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                  <FormDescription>
                                    Selecciona el horario específico al que la
                                    persona asistió
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                      </div>

                      {/* Invitado por con PersonaSelector */}
                      <FormField
                        control={form.control}
                        name="invitadoPorAsistenciaId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Invitado por (Opcional)</FormLabel>
                            <FormControl>
                              <PersonaSelector
                                personas={personasInvitadores}
                                onSeleccionar={(
                                  persona: PersonaInvitador | null
                                ) => {
                                  if (persona) {
                                    field.onChange(persona.id.toString());
                                    setPersonaInvitadorSeleccionada(persona);
                                  } else {
                                    field.onChange("");
                                    setPersonaInvitadorSeleccionada(null);
                                  }
                                }}
                                personaSeleccionada={
                                  personaInvitadorSeleccionada
                                }
                                placeholder="Buscar persona que invitó..."
                              />
                            </FormControl>
                            <FormDescription>
                              Busca y selecciona la persona (miembro, visita o
                              niño) que invitó a esta persona a esta actividad
                              específica
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Observaciones */}
                      <FormField
                        control={form.control}
                        name="observacionesAsistencia"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Observaciones</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Notas sobre esta asistencia, cómo se sintió, si mostró interés, etc..."
                                className="min-h-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Opcional - Cualquier información adicional
                              relevante
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  )}
                </Card>
              )}

              {/* Botones de acción */}
              <div className="flex justify-end space-x-4">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => router.back()}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving
                    ? "Guardando..."
                    : `Guardar ${
                        tipo === "visita" && agregarAsistencia
                          ? "Visita y Primera Asistencia"
                          : tipo === "visita"
                          ? "Visita"
                          : tipo === "nino"
                          ? "Niño"
                          : "Miembro"
                      }`}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function ComunidadNuevaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Cargando página...</p>
          </div>
        </div>
      }
    >
      <ComunidadNuevaContent />
    </Suspense>
  );
}
