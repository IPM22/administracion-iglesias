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
import { ArrowLeft, Calendar, UserPlus, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, type ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import { CloudinaryUploader } from "../../../components/CloudinaryUploader";
import { PhoneInput } from "../../../components/PhoneInput";
import { ModeToggle } from "../../../components/mode-toggle";
import PersonaSelector from "../../../components/PersonaSelector";

// Interfaces para tipado
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

interface Persona {
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
  fechaPrimeraVisita: z.string().optional(),
  estado: z.enum(["Nueva", "Recurrente"]).optional(),
  foto: z.string().optional(),
  notasAdicionales: z.string().optional(),
  // Campos para primera asistencia
  fechaAsistencia: z.string().optional(),
  tipoActividadId: z.string().optional(),
  actividadId: z.string().optional(),
  horarioId: z.string().optional(),
  invitadoPorId: z.string().optional(),
  observacionesAsistencia: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NuevaVisitaPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para primera asistencia
  const [tiposActividad, setTiposActividad] = useState<TipoActividad[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [personaSeleccionada, setPersonaSeleccionada] =
    useState<Persona | null>(null);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string>("");
  const [actividadSeleccionada, setActividadSeleccionada] =
    useState<Actividad | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [horarioSeleccionado, setHorarioSeleccionado] = useState<string>("");
  const [agregarAsistencia, setAgregarAsistencia] = useState(false);

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
      fechaPrimeraVisita: "",
      estado: undefined,
      foto: "",
      notasAdicionales: "",
      fechaAsistencia: new Date().toISOString().split("T")[0],
      tipoActividadId: "",
      actividadId: "",
      horarioId: "",
      invitadoPorId: "",
      observacionesAsistencia: "",
    },
  });

  // Cargar datos necesarios para primera asistencia
  useEffect(() => {
    const fetchDatosAsistencia = async () => {
      try {
        // Obtener tipos de actividad
        const tiposResponse = await fetch("/api/tipos-actividad");
        if (tiposResponse.ok) {
          const tiposData = await tiposResponse.json();
          setTiposActividad(tiposData);
        }

        // Cargar todas las personas de diferentes endpoints
        const personasFinales: Persona[] = [];

        // 1. Cargar miembros
        try {
          const miembrosResponse = await fetch("/api/miembros");
          if (miembrosResponse.ok) {
            const miembrosData = await miembrosResponse.json();
            const miembrosArray = Array.isArray(miembrosData)
              ? miembrosData
              : [];

            const miembrosConTipo: Persona[] = miembrosArray
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
          }
        } catch (error) {
          console.error("Error al cargar miembros:", error);
        }

        // 2. Cargar visitas
        try {
          const visitasResponse = await fetch("/api/visitas");
          if (visitasResponse.ok) {
            const visitasData = await visitasResponse.json();
            const visitasArray = Array.isArray(visitasData) ? visitasData : [];

            const visitasConTipo: Persona[] = visitasArray.map(
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
          }
        } catch (error) {
          console.error("Error al cargar visitas:", error);
        }

        // 3. Cargar niños
        try {
          const ninosResponse = await fetch("/api/ninos");
          if (ninosResponse.ok) {
            const ninosData = await ninosResponse.json();
            const ninosArray = Array.isArray(ninosData) ? ninosData : [];

            const ninosConTipo: Persona[] = ninosArray.map((nino: NinoAPI) => ({
              id: nino.id,
              nombres: nino.nombres,
              apellidos: nino.apellidos,
              foto: nino.foto,
              correo: nino.correo,
              telefono: nino.telefono,
              celular: nino.celular,
              tipo: "nino" as const,
              estado: nino.estado || "Activo",
            }));

            personasFinales.push(...ninosConTipo);
          }
        } catch (error) {
          console.error("Error al cargar niños:", error);
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

        setPersonas(personasFinales);
      } catch (error) {
        console.error("Error al cargar datos para primera asistencia:", error);
      }
    };

    fetchDatosAsistencia();
  }, []);

  // Cargar actividades cuando se selecciona un tipo especial
  useEffect(() => {
    const cargarActividades = async () => {
      if (!tipoSeleccionado) {
        setActividades([]);
        return;
      }

      const tipoActividad = tiposActividad.find(
        (tipo) => tipo.id.toString() === tipoSeleccionado
      );

      if (tipoActividad?.tipo === "Especial") {
        try {
          const response = await fetch("/api/actividades");
          if (response.ok) {
            const data = await response.json();
            const actividadesFiltradas = data.filter(
              (act: Actividad) =>
                act.tipoActividad.id.toString() === tipoSeleccionado
            );
            actividadesFiltradas.sort(
              (a: Actividad, b: Actividad) =>
                new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
            );
            setActividades(actividadesFiltradas);
          }
        } catch (error) {
          console.error("Error al cargar actividades:", error);
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

    if (agregarAsistencia) {
      cargarActividades();
    }
  }, [tipoSeleccionado, tiposActividad, form, agregarAsistencia]);

  // Actualizar fecha cuando se selecciona actividad específica
  useEffect(() => {
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

        // Limpiar selección de horario cuando cambia la actividad
        form.setValue("horarioId", "");
        setHorarioSeleccionado("");
      }
    } else {
      setActividadSeleccionada(null);
      form.setValue("horarioId", "");
      setHorarioSeleccionado("");
    }
  }, [form.watch("actividadId"), actividades, form]);

  // Función para determinar si se debe mostrar el campo de fecha
  const deberMostrarCampoFecha = () => {
    const tipoActividad = tiposActividad.find(
      (tipo) => tipo.id.toString() === tipoSeleccionado
    );
    return tipoActividad?.tipo === "Regular";
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSaving(true);
    setError(null);
    try {
      // Crear la visita primero
      const visitaResponse = await fetch("/api/visitas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombres: values.nombres,
          apellidos: values.apellidos,
          correo: values.correo,
          telefono: values.telefono,
          celular: values.celular,
          direccion: values.direccion,
          fechaNacimiento: values.fechaNacimiento,
          sexo: values.sexo,
          estadoCivil: values.estadoCivil,
          ocupacion: values.ocupacion,
          familia: values.familia,
          fechaPrimeraVisita: values.fechaPrimeraVisita,
          estado: values.estado,
          foto: values.foto,
          notasAdicionales: values.notasAdicionales,
        }),
      });

      if (!visitaResponse.ok) {
        const errorData = await visitaResponse.json();
        throw new Error(errorData.error || "Error al crear la visita");
      }

      const visitaCreada = await visitaResponse.json();

      // Si se quiere agregar primera asistencia, crearla
      if (agregarAsistencia && (values.tipoActividadId || values.actividadId)) {
        const fechaParaRegistro = actividadSeleccionada
          ? actividadSeleccionada.fecha
          : values.fechaAsistencia || new Date().toISOString().split("T")[0];

        const historialResponse = await fetch(
          `/api/visitas/${visitaCreada.id}/historial`,
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
              invitadoPorId: values.invitadoPorId
                ? parseInt(values.invitadoPorId)
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

      router.push("/visitas");
    } catch (error) {
      console.error("Error:", error);
      setError(
        error instanceof Error ? error.message : "Error al guardar la visita"
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
                  <BreadcrumbLink href="/visitas">Visitas</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Nueva Visita</BreadcrumbPage>
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
            <div className="bg-destructive/15 border border-destructive/20 rounded-md p-4">
              <p className="text-destructive">{error}</p>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Card Principal - Información de la Visita */}
              <Card>
                <CardHeader>
                  <CardTitle>Nueva Visita</CardTitle>
                  <CardDescription>
                    Registra la información de una nueva visita a la iglesia
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Sección de Datos Personales con Foto */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">
                        Datos Personales
                      </h3>
                      <div className="grid gap-6 md:grid-cols-3 md:grid-rows-3">
                        {/* Primera fila - Nombres y Apellidos */}
                        <div className="md:col-span-2">
                          <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                              control={form.control}
                              name="nombres"
                              render={({
                                field,
                              }: {
                                field: ControllerRenderProps<FormValues>;
                              }) => (
                                <FormItem>
                                  <FormLabel>Nombres</FormLabel>
                                  <FormControl>
                                    <Input placeholder="María" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="apellidos"
                              render={({
                                field,
                              }: {
                                field: ControllerRenderProps<FormValues>;
                              }) => (
                                <FormItem>
                                  <FormLabel>Apellidos</FormLabel>
                                  <FormControl>
                                    <Input placeholder="González" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {/* Columna derecha - Foto (ocupa las 3 filas desde el inicio) */}
                        <div className="md:row-span-3 flex flex-col items-center justify-center">
                          <div className="w-full bg-muted border border-border rounded-lg p-4 h-full flex flex-col justify-center">
                            <FormField
                              control={form.control}
                              name="foto"
                              render={({ field }) => (
                                <FormItem className="w-full">
                                  <FormLabel className="text-sm font-medium text-center block mb-3">
                                    Foto de la Visita
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

                        {/* Segunda fila - Fecha de nacimiento, Sexo y Estado Civil */}
                        <div className="md:col-span-2">
                          <div className="grid gap-4 md:grid-cols-4">
                            <FormField
                              control={form.control}
                              name="fechaNacimiento"
                              render={({
                                field,
                              }: {
                                field: ControllerRenderProps<FormValues>;
                              }) => (
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
                              render={({
                                field,
                              }: {
                                field: ControllerRenderProps<FormValues>;
                              }) => (
                                <FormItem>
                                  <FormLabel>Sexo</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="w-full">
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
                                      <SelectItem value="Otro">Otro</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormDescription>Opcional</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="estadoCivil"
                              render={({
                                field,
                              }: {
                                field: ControllerRenderProps<FormValues>;
                              }) => (
                                <FormItem>
                                  <FormLabel>Estado Civil</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="w-full">
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
                                  <FormDescription>Opcional</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {/* Tercera fila - Ocupación y Familia */}
                        <div className="md:col-span-2">
                          <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                              control={form.control}
                              name="ocupacion"
                              render={({
                                field,
                              }: {
                                field: ControllerRenderProps<FormValues>;
                              }) => (
                                <FormItem>
                                  <FormLabel>Ocupación</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Doctora" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="familia"
                              render={({
                                field,
                              }: {
                                field: ControllerRenderProps<FormValues>;
                              }) => (
                                <FormItem>
                                  <FormLabel>Familia</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Familia González"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sección de Datos de Contacto */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Datos de Contacto</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="correo"
                        render={({
                          field,
                        }: {
                          field: ControllerRenderProps<FormValues>;
                        }) => (
                          <FormItem>
                            <FormLabel>Correo</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="maria@ejemplo.com"
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
                        render={({
                          field,
                        }: {
                          field: ControllerRenderProps<FormValues>;
                        }) => (
                          <FormItem>
                            <FormLabel>Teléfono</FormLabel>
                            <FormControl>
                              <PhoneInput
                                value={field.value}
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
                        render={({
                          field,
                        }: {
                          field: ControllerRenderProps<FormValues>;
                        }) => (
                          <FormItem>
                            <FormLabel>Celular</FormLabel>
                            <FormControl>
                              <PhoneInput
                                value={field.value}
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
                        render={({
                          field,
                        }: {
                          field: ControllerRenderProps<FormValues>;
                        }) => (
                          <FormItem>
                            <FormLabel>Dirección</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Calle Principal 123, Ciudad"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Sección de Información de Visita */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">
                      Información de Visita
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="fechaPrimeraVisita"
                        render={({
                          field,
                        }: {
                          field: ControllerRenderProps<FormValues>;
                        }) => (
                          <FormItem>
                            <FormLabel>Fecha de Primera Visita</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormDescription>
                              Opcional - Si no se especifica, se usará la fecha
                              actual
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="estado"
                        render={({
                          field,
                        }: {
                          field: ControllerRenderProps<FormValues>;
                        }) => (
                          <FormItem>
                            <FormLabel>Estado</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona un estado" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Nueva">Nueva</SelectItem>
                                <SelectItem value="Recurrente">
                                  Recurrente
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Por defecto será Nueva
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Sección de Notas Adicionales */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">
                      Información Adicional
                    </h3>
                    <FormField
                      control={form.control}
                      name="notasAdicionales"
                      render={({
                        field,
                      }: {
                        field: ControllerRenderProps<FormValues>;
                      }) => (
                        <FormItem>
                          <FormLabel>Notas Adicionales</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Información adicional sobre la visita, cómo conoció la iglesia, etc..."
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

              {/* Card Opcional - Primera Asistencia */}
              <Card className="border-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5 text-primary" />
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
                        render={({
                          field,
                        }: {
                          field: ControllerRenderProps<FormValues>;
                        }) => (
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
                                  (tipo) => tipo.id.toString() === value
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
                                {tiposActividad.map((tipo) => (
                                  <SelectItem
                                    key={tipo.id}
                                    value={tipo.id.toString()}
                                  >
                                    {tipo.nombre} ({tipo.tipo})
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
                          render={({
                            field,
                          }: {
                            field: ControllerRenderProps<FormValues>;
                          }) => (
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
                        render={({
                          field,
                        }: {
                          field: ControllerRenderProps<FormValues>;
                        }) => (
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
                                          fechaA.getTime() !== fechaB.getTime()
                                        ) {
                                          return (
                                            fechaA.getTime() - fechaB.getTime()
                                          );
                                        }
                                        // Si es la misma fecha, ordenar por hora
                                        const horaA = a.horaInicio
                                          ? parseInt(
                                              a.horaInicio.split(":")[0]
                                            ) *
                                              60 +
                                            parseInt(a.horaInicio.split(":")[1])
                                          : 0;
                                        const horaB = b.horaInicio
                                          ? parseInt(
                                              b.horaInicio.split(":")[0]
                                            ) *
                                              60 +
                                            parseInt(b.horaInicio.split(":")[1])
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
                                                ).toLocaleDateString("es-ES", {
                                                  weekday: "short",
                                                  day: "numeric",
                                                  month: "short",
                                                })}
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
                    </div>

                    {/* Invitado por con PersonaSelector */}
                    <FormField
                      control={form.control}
                      name="invitadoPorId"
                      render={({
                        field,
                      }: {
                        field: ControllerRenderProps<FormValues>;
                      }) => (
                        <FormItem>
                          <FormLabel>Invitado por (Opcional)</FormLabel>
                          <FormControl>
                            <PersonaSelector
                              personas={personas}
                              onSeleccionar={(persona: Persona | null) => {
                                if (persona) {
                                  field.onChange(persona.id.toString());
                                  setPersonaSeleccionada(persona);
                                } else {
                                  field.onChange("");
                                  setPersonaSeleccionada(null);
                                }
                              }}
                              personaSeleccionada={personaSeleccionada}
                              placeholder="Buscar persona que invitó..."
                            />
                          </FormControl>
                          <FormDescription>
                            Busca y selecciona la persona (miembro, visita o
                            niño) que invitó a esta persona
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Observaciones */}
                    <FormField
                      control={form.control}
                      name="observacionesAsistencia"
                      render={({
                        field,
                      }: {
                        field: ControllerRenderProps<FormValues>;
                      }) => (
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
                            Opcional - Cualquier información adicional relevante
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                )}
              </Card>

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
                        agregarAsistencia
                          ? "Visita y Primera Asistencia"
                          : "Visita"
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
