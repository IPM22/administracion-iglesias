"use client";

import { memo } from "react";
import { AppSidebar } from "../../components/app-sidebar";
import { useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Share2,
  MapPin,
  CalendarIcon,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Actividad {
  id: number;
  nombre: string;
  descripcion: string;
  fecha: string;
  hora: string;
  lugar: string;
  ubicacion: string;
  banner: string;
  estado: string;
  asistentesEsperados: number;
  responsable: string;
}

interface ActividadCardProps {
  actividad: Actividad;
  getEstadoBadgeColor: (estado: string) => string;
  onVerDetalles: (id: number) => void;
  onCompartir: (actividad: Actividad) => void;
  onEditar: (id: number) => void;
  onEliminar: (id: number) => void;
  onPromocionar: (id: number) => void;
}

export default function ActividadesPage() {
  const router = useRouter();

  const actividades = [
    {
      id: 1,
      nombre: "Culto Dominical",
      descripcion: "Servicio principal de adoración y predicación",
      fecha: "2024-01-28",
      hora: "10:00",
      lugar: "Santuario Principal",
      ubicacion: "Av. Principal 123, Ciudad",
      banner: "/placeholder.svg?height=200&width=400",
      estado: "Programada",
      asistentesEsperados: 200,
      responsable: "Pastor Juan",
    },
    {
      id: 2,
      nombre: "Estudio Bíblico",
      descripcion: "Estudio profundo de las Escrituras",
      fecha: "2024-01-31",
      hora: "19:00",
      lugar: "Aula 1",
      ubicacion: "Av. Principal 123, Ciudad",
      banner: "/placeholder.svg?height=200&width=400",
      estado: "Programada",
      asistentesEsperados: 50,
      responsable: "Pastor Miguel",
    },
    {
      id: 3,
      nombre: "Reunión de Jóvenes",
      descripcion: "Encuentro especial para jóvenes y adolescentes",
      fecha: "2024-02-02",
      hora: "19:30",
      lugar: "Salón de Jóvenes",
      ubicacion: "Av. Principal 123, Ciudad",
      banner: "/placeholder.svg?height=200&width=400",
      estado: "Programada",
      asistentesEsperados: 40,
      responsable: "Pastor Carlos",
    },
    {
      id: 4,
      nombre: "Conferencia Especial",
      descripcion: "Conferencia con invitado especial",
      fecha: "2024-02-10",
      hora: "18:00",
      lugar: "Auditorio",
      ubicacion: "Centro de Convenciones, Ciudad",
      banner: "/placeholder.svg?height=200&width=400",
      estado: "En Promoción",
      asistentesEsperados: 500,
      responsable: "Pastor Juan",
    },
  ];

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case "Programada":
        return "bg-blue-100 text-blue-800";
      case "En Promoción":
        return "bg-green-100 text-green-800";
      case "Completada":
        return "bg-gray-100 text-gray-800";
      case "Cancelada":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleVerDetalles = (id: number) => {
    router.push(`/actividades/${id}`);
  };

  const handleCompartir = (actividad: Actividad) => {
    if (navigator.share) {
      navigator
        .share({
          title: actividad.nombre,
          text: actividad.descripcion,
          url: window.location.origin + `/actividades/${actividad.id}`,
        })
        .catch((error) => console.log("Error compartiendo:", error));
    } else {
      // Fallback para navegadores que no soportan Web Share API
      const url = window.location.origin + `/actividades/${actividad.id}`;
      navigator.clipboard.writeText(url);
      alert("Enlace copiado al portapapeles");
    }
  };

  const handleEditar = (id: number) => {
    router.push(`/actividades/${id}/editar`);
  };

  const handleEliminar = async (id: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta actividad?")) {
      // Aquí iría la llamada a la API para eliminar
      console.log("Eliminando actividad:", id);
      // Después de eliminar, refrescar la lista
      router.refresh();
    }
  };

  const handlePromocionar = (id: number) => {
    router.push(`/actividades/${id}/promocion`);
  };

  const handleNuevaActividad = () => {
    router.push("/actividades/nueva");
  };

  // Componente de actividad memoizado
  const ActividadCard = memo(
    ({
      actividad,
      getEstadoBadgeColor,
      onVerDetalles,
      onCompartir,
      onEditar,
      onEliminar,
      onPromocionar,
    }: ActividadCardProps) => {
      const formatDate = (date: string) => {
        return new Date(date).toISOString().split("T")[0];
      };

      return (
        <Card className="overflow-hidden">
          <div className="aspect-video relative">
            <img
              src={actividad.banner || "/placeholder.svg"}
              alt={actividad.nombre}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute top-2 right-2">
              <Badge className={getEstadoBadgeColor(actividad.estado)}>
                {actividad.estado}
              </Badge>
            </div>
          </div>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg">{actividad.nombre}</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onVerDetalles(actividad.id)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Detalles
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onCompartir(actividad)}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Compartir Enlace
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEditar(actividad.id)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => onEliminar(actividad.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <CardDescription className="text-sm">
              {actividad.descripcion}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-muted-foreground">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDate(actividad.fecha)}
              </div>
              <div className="flex items-center text-muted-foreground">
                <Clock className="mr-2 h-4 w-4" />
                {actividad.hora}
              </div>
              <div className="flex items-center text-muted-foreground">
                <MapPin className="mr-2 h-4 w-4" />
                {actividad.lugar}
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {actividad.asistentesEsperados} esperados
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPromocionar(actividad.id)}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Promocionar
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }
  );

  ActividadCard.displayName = "ActividadCard";

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
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Actividades</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gestión de Actividades</CardTitle>
                  <CardDescription>
                    Administra y promociona las actividades de la iglesia
                  </CardDescription>
                </div>
                <Button onClick={handleNuevaActividad}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Actividad
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar actividades..." className="pl-8" />
                </div>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros
                </Button>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {actividades.map((actividad) => (
                  <ActividadCard
                    key={actividad.id}
                    actividad={actividad}
                    getEstadoBadgeColor={getEstadoBadgeColor}
                    onVerDetalles={handleVerDetalles}
                    onCompartir={handleCompartir}
                    onEditar={handleEditar}
                    onEliminar={handleEliminar}
                    onPromocionar={handlePromocionar}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
