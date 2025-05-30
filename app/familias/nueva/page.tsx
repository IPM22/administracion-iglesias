"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import MiembroSelector from "../../../components/MiembroSelector";

interface Miembro {
  id: number;
  nombres: string;
  apellidos: string;
  foto?: string;
  correo?: string;
  telefono?: string;
  celular?: string;
  estado: string;
}

export default function NuevaFamiliaPage() {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cabezaFamiliaSeleccionado, setCabezaFamiliaSeleccionado] =
    useState<Miembro | null>(null);

  const [formData, setFormData] = useState({
    apellido: "",
    nombre: "",
    estado: "Activa",
    notas: "",
  });

  // Cargar miembros para el selector
  useEffect(() => {
    cargarMiembros();
  }, []);

  const cargarMiembros = async () => {
    try {
      const response = await fetch("/api/miembros");
      if (response.ok) {
        const data = await response.json();
        setMiembros(data);
      } else {
        console.error("Error al cargar miembros");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.apellido.trim()) {
      setError("El apellido familiar es requerido");
      return;
    }

    try {
      setCargando(true);
      setError(null);

      const dataToSend = {
        ...formData,
        jefeFamiliaId: cabezaFamiliaSeleccionado?.id?.toString() || "",
      };

      const response = await fetch("/api/familias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        // Redirigir a la página de familias
        router.push("/familias");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Error al crear la familia");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Error al crear la familia");
    } finally {
      setCargando(false);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/familias">Familias</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Nueva Familia</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
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
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Nueva Familia</CardTitle>
              <CardDescription>
                Registra una nueva familia en la congregación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-4 text-red-600 bg-red-50 border border-red-200 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="apellido">Apellido Familiar *</Label>
                    <Input
                      id="apellido"
                      value={formData.apellido}
                      onChange={(e) =>
                        handleInputChange("apellido", e.target.value)
                      }
                      placeholder="González, Rodríguez, etc."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre de la Familia</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) =>
                        handleInputChange("nombre", e.target.value)
                      }
                      placeholder="Familia González, Los García, etc."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cabezaFamilia">Cabeza de Familia</Label>
                    <MiembroSelector
                      miembros={miembros}
                      onSeleccionar={setCabezaFamiliaSeleccionado}
                      miembroSeleccionado={cabezaFamiliaSeleccionado}
                      placeholder="Buscar y seleccionar cabeza de familia..."
                      disabled={cargando}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Select
                      value={formData.estado}
                      onValueChange={(value) =>
                        handleInputChange("estado", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Activa">Activa</SelectItem>
                        <SelectItem value="Inactiva">Inactiva</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notas">Notas Adicionales</Label>
                  <Textarea
                    id="notas"
                    value={formData.notas}
                    onChange={(e) => handleInputChange("notas", e.target.value)}
                    placeholder="Información adicional sobre la familia..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={cargando}>
                    {cargando && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Familia
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
