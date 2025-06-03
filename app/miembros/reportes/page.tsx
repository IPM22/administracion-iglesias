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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Filter,
  Users,
  UserCheck,
  UserX,
  Calendar,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Miembro } from "@prisma/client";
import { calcularEdad, formatDate } from "@/lib/date-utils";

export default function ReportesPage() {
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [miembrosFiltrados, setMiembrosFiltrados] = useState<Miembro[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroSexo, setFiltroSexo] = useState("todos");
  const [filtroEdadMin, setFiltroEdadMin] = useState("");
  const [filtroEdadMax, setFiltroEdadMax] = useState("");

  useEffect(() => {
    const fetchMiembros = async () => {
      try {
        const response = await fetch("/api/miembros");
        if (response.ok) {
          const data = await response.json();
          setMiembros(data);
          setMiembrosFiltrados(data);
        }
      } catch (error) {
        console.error("Error al cargar miembros:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMiembros();
  }, []);

  useEffect(() => {
    const aplicarFiltros = () => {
      let filtrados = [...miembros];

      // Filtrar por estado
      if (filtroEstado !== "todos") {
        filtrados = filtrados.filter(
          (miembro) => miembro.estado === filtroEstado
        );
      }

      // Filtrar por sexo
      if (filtroSexo !== "todos") {
        filtrados = filtrados.filter((miembro) => miembro.sexo === filtroSexo);
      }

      // Filtrar por edad
      if (filtroEdadMin || filtroEdadMax) {
        filtrados = filtrados.filter((miembro) => {
          if (!miembro.fechaNacimiento) return false;

          const edad = calcularEdad(miembro.fechaNacimiento);
          if (edad === null) return false;

          const edadMin = filtroEdadMin ? parseInt(filtroEdadMin) : 0;
          const edadMax = filtroEdadMax ? parseInt(filtroEdadMax) : 999;

          return edad >= edadMin && edad <= edadMax;
        });
      }

      setMiembrosFiltrados(filtrados);
    };

    aplicarFiltros();
  }, [miembros, filtroEstado, filtroSexo, filtroEdadMin, filtroEdadMax]);

  const limpiarFiltros = () => {
    setFiltroEstado("todos");
    setFiltroSexo("todos");
    setFiltroEdadMin("");
    setFiltroEdadMax("");
  };

  const exportarCSV = () => {
    const headers = [
      "Nombres",
      "Apellidos",
      "Correo",
      "Teléfono",
      "Celular",
      "Sexo",
      "Edad",
      "Estado Civil",
      "Ocupación",
      "Familia",
      "Estado",
      "Fecha Ingreso",
      "Fecha Bautismo",
    ];

    const csvContent = [
      headers.join(","),
      ...miembrosFiltrados.map((miembro) =>
        [
          miembro.nombres,
          miembro.apellidos,
          miembro.correo || "",
          miembro.telefono || "",
          miembro.celular || "",
          miembro.sexo || "",
          miembro.fechaNacimiento ? calcularEdad(miembro.fechaNacimiento) : "",
          miembro.estadoCivil || "",
          miembro.ocupacion || "",
          miembro.familia || "",
          miembro.estado || "",
          formatDate(miembro.fechaIngreso),
          formatDate(miembro.fechaBautismo),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "reporte-miembros.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Estadísticas
  const totalMiembros = miembros.length;
  const miembrosActivos = miembros.filter((m) => m.estado === "Activo").length;
  const miembrosInactivos = miembros.filter(
    (m) => m.estado === "Inactivo"
  ).length;
  const miembrosBautizados = miembros.filter((m) => m.fechaBautismo).length;

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
                  <BreadcrumbLink href="/miembros">Miembros</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Reportes</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Reportes de Miembros</h1>
              <p className="text-muted-foreground">
                Genera y visualiza reportes estadísticos de los miembros
              </p>
            </div>
            <Button onClick={exportarCSV}>
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          </div>

          {/* Estadísticas */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Miembros
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalMiembros}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Miembros Activos
                </CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {miembrosActivos}
                </div>
                <p className="text-xs text-muted-foreground">
                  {totalMiembros > 0
                    ? Math.round((miembrosActivos / totalMiembros) * 100)
                    : 0}
                  % del total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Miembros Inactivos
                </CardTitle>
                <UserX className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {miembrosInactivos}
                </div>
                <p className="text-xs text-muted-foreground">
                  {totalMiembros > 0
                    ? Math.round((miembrosInactivos / totalMiembros) * 100)
                    : 0}
                  % del total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Miembros Bautizados
                </CardTitle>
                <Calendar className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {miembrosBautizados}
                </div>
                <p className="text-xs text-muted-foreground">
                  {totalMiembros > 0
                    ? Math.round((miembrosBautizados / totalMiembros) * 100)
                    : 0}
                  % del total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros de Reporte
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="Activo">Activo</SelectItem>
                      <SelectItem value="Inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sexo">Sexo</Label>
                  <Select value={filtroSexo} onValueChange={setFiltroSexo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Femenino">Femenino</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edadMin">Edad Mínima</Label>
                  <Input
                    id="edadMin"
                    type="number"
                    value={filtroEdadMin}
                    onChange={(e) => setFiltroEdadMin(e.target.value)}
                    placeholder="0"
                    min="0"
                    max="120"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edadMax">Edad Máxima</Label>
                  <Input
                    id="edadMax"
                    type="number"
                    value={filtroEdadMax}
                    onChange={(e) => setFiltroEdadMax(e.target.value)}
                    placeholder="120"
                    min="0"
                    max="120"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <Button variant="outline" onClick={limpiarFiltros}>
                  Limpiar Filtros
                </Button>
                <span className="text-sm text-muted-foreground">
                  Mostrando {miembrosFiltrados.length} de {totalMiembros}{" "}
                  miembros
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Tabla de Resultados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Resultados del Reporte
              </CardTitle>
              <CardDescription>
                Lista detallada de miembros según los filtros aplicados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre Completo</TableHead>
                      <TableHead>Edad</TableHead>
                      <TableHead>Sexo</TableHead>
                      <TableHead>Estado Civil</TableHead>
                      <TableHead>Ocupación</TableHead>
                      <TableHead>Familia</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Bautizado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          Cargando datos...
                        </TableCell>
                      </TableRow>
                    ) : miembrosFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          No se encontraron miembros con los filtros aplicados
                        </TableCell>
                      </TableRow>
                    ) : (
                      miembrosFiltrados.map((miembro) => (
                        <TableRow key={miembro.id}>
                          <TableCell className="font-medium">
                            {miembro.nombres} {miembro.apellidos}
                          </TableCell>
                          <TableCell>
                            {miembro.fechaNacimiento
                              ? `${calcularEdad(miembro.fechaNacimiento)} años`
                              : "N/A"}
                          </TableCell>
                          <TableCell>{miembro.sexo || "N/A"}</TableCell>
                          <TableCell>{miembro.estadoCivil || "N/A"}</TableCell>
                          <TableCell>{miembro.ocupacion || "N/A"}</TableCell>
                          <TableCell>{miembro.familia || "N/A"}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                miembro.estado === "Activo"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {miembro.estado || "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                miembro.fechaBautismo ? "default" : "outline"
                              }
                            >
                              {miembro.fechaBautismo ? "Sí" : "No"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
