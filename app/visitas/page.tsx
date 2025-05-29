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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Phone,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function VisitasPage() {
  const visitas = [
    {
      id: 1,
      nombre: "Laura Fernández",
      email: "laura@email.com",
      telefono: "+1 234-567-8905",
      invitadoPor: "María González",
      actividad: "Culto Dominical",
      fechaVisita: "2024-01-20",
      estado: "Primera Visita",
      seguimiento: "Pendiente",
    },
    {
      id: 2,
      nombre: "Roberto Silva",
      email: "roberto@email.com",
      telefono: "+1 234-567-8906",
      invitadoPor: "Carlos Rodríguez",
      actividad: "Estudio Bíblico",
      fechaVisita: "2024-01-18",
      estado: "Segunda Visita",
      seguimiento: "Contactado",
    },
    {
      id: 3,
      nombre: "Carmen Jiménez",
      email: "carmen@email.com",
      telefono: "+1 234-567-8907",
      invitadoPor: "Ana Martínez",
      actividad: "Reunión de Jóvenes",
      fechaVisita: "2024-01-15",
      estado: "Visitante Regular",
      seguimiento: "En Proceso",
    },
    {
      id: 4,
      nombre: "Diego Morales",
      email: "diego@email.com",
      telefono: "+1 234-567-8908",
      invitadoPor: "Pedro López",
      actividad: "Conferencia Especial",
      fechaVisita: "2024-01-10",
      estado: "Primera Visita",
      seguimiento: "Completado",
    },
  ];

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case "Primera Visita":
        return "bg-blue-100 text-blue-800";
      case "Segunda Visita":
        return "bg-yellow-100 text-yellow-800";
      case "Visitante Regular":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSeguimientoBadgeColor = (seguimiento: string) => {
    switch (seguimiento) {
      case "Pendiente":
        return "bg-red-100 text-red-800";
      case "Contactado":
        return "bg-yellow-100 text-yellow-800";
      case "En Proceso":
        return "bg-blue-100 text-blue-800";
      case "Completado":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toISOString().split("T")[0];
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
                  <BreadcrumbPage>Visitas</BreadcrumbPage>
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
                  <CardTitle>Gestión de Visitas</CardTitle>
                  <CardDescription>
                    Administra y da seguimiento a las visitas de la iglesia
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Visita
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar visitas..." className="pl-8" />
                </div>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Visitante</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Invitado Por</TableHead>
                      <TableHead>Actividad</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Seguimiento</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visitas.map((visita) => (
                      <TableRow key={visita.id}>
                        <TableCell className="font-medium">
                          {visita.nombre}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{visita.email}</div>
                            <div className="text-muted-foreground">
                              {visita.telefono}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{visita.invitadoPor}</TableCell>
                        <TableCell>{visita.actividad}</TableCell>
                        <TableCell>{formatDate(visita.fechaVisita)}</TableCell>
                        <TableCell>
                          <Badge className={getEstadoBadgeColor(visita.estado)}>
                            {visita.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={getSeguimientoBadgeColor(
                              visita.seguimiento
                            )}
                          >
                            {visita.seguimiento}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalles
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Phone className="mr-2 h-4 w-4" />
                                Contactar
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
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
