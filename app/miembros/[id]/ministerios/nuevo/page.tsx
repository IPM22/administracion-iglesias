"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Users, Save, Loader2 } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";

interface Ministerio {
  id: number;
  nombre: string;
  descripcion?: string;
}

interface Miembro {
  id: number;
  nombres: string;
  apellidos: string;
}

export default function AsignarMinisterioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [miembro, setMiembro] = useState<Miembro | null>(null);
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [formData, setFormData] = useState({
    ministerioId: "",
    rol: "",
    fechaInicio: new Date().toISOString().split("T")[0],
    esLider: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener datos del miembro
        const miembroResponse = await fetch(`/api/miembros/${id}`);
        if (!miembroResponse.ok) {
          throw new Error("Error al obtener datos del miembro");
        }
        const miembroData = await miembroResponse.json();
        setMiembro(miembroData);

        // Obtener lista de ministerios
        const ministeriosResponse = await fetch("/api/ministerios");
        if (!ministeriosResponse.ok) {
          throw new Error("Error al obtener ministerios");
        }
        const ministeriosData = await ministeriosResponse.json();
        setMinisterios(ministeriosData);
      } catch (error) {
        console.error("Error:", error);
        alert("Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.ministerioId) {
      alert("Por favor selecciona un ministerio");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/miembros/${id}/ministerios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ministerioId: parseInt(formData.ministerioId),
          rol: formData.rol || null,
          fechaInicio: formData.fechaInicio,
          esLider: formData.esLider,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al asignar ministerio");
      }

      router.push(`/miembros/${id}`);
    } catch (error) {
      console.error("Error:", error);
      alert(
        error instanceof Error ? error.message : "Error al asignar ministerio"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando...</span>
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
                <BreadcrumbItem>
                  <BreadcrumbLink href="/miembros">Miembros</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/miembros/${id}`}>
                    {miembro
                      ? `${miembro.nombres} ${miembro.apellidos}`
                      : "..."}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Asignar Ministerio</BreadcrumbPage>
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

          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Asignar Ministerio
              </CardTitle>
              <CardDescription>
                Asignar un ministerio a{" "}
                {miembro ? `${miembro.nombres} ${miembro.apellidos}` : "..."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="ministerio">Ministerio *</Label>
                  <Select
                    value={formData.ministerioId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, ministerioId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un ministerio" />
                    </SelectTrigger>
                    <SelectContent>
                      {ministerios.map((ministerio) => (
                        <SelectItem
                          key={ministerio.id}
                          value={ministerio.id.toString()}
                        >
                          {ministerio.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rol">Rol en el Ministerio</Label>
                  <Input
                    id="rol"
                    value={formData.rol}
                    onChange={(e) =>
                      setFormData({ ...formData, rol: e.target.value })
                    }
                    placeholder="Ej: Líder, Colaborador, Miembro..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fechaInicio">Fecha de Inicio *</Label>
                  <Input
                    id="fechaInicio"
                    type="date"
                    value={formData.fechaInicio}
                    onChange={(e) =>
                      setFormData({ ...formData, fechaInicio: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="esLider"
                    checked={formData.esLider}
                    onChange={(e) =>
                      setFormData({ ...formData, esLider: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="esLider">Es líder del ministerio</Label>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={saving} className="flex-1">
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Asignando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Asignar Ministerio
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancelar
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
