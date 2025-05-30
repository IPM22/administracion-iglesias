"use client";

import type * as React from "react";
import {
  Users,
  UserPlus,
  Calendar,
  Heart,
  HomeIcon,
  Settings,
  BarChart3,
} from "lucide-react";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";
import { ModeToggle } from "./mode-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

// Datos del sistema de iglesia
const data = {
  user: {
    name: "Pastor Juan",
    email: "pastor@iglesia.com",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  teams: [
    {
      name: "Iglesia Central",
      logo: HomeIcon,
      plan: "Principal",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: BarChart3,
      isActive: true,
    },
    {
      title: "Miembros",
      url: "/miembros",
      icon: Users,
      items: [
        {
          title: "Lista de Miembros",
          url: "/miembros",
        },
        {
          title: "Nuevo Miembro",
          url: "/miembros/nuevo",
        },
        {
          title: "Reportes",
          url: "/miembros/reportes",
        },
      ],
    },
    {
      title: "Visitas",
      url: "/visitas",
      icon: UserPlus,
      items: [
        {
          title: "Lista de Visitas",
          url: "/visitas",
        },
        {
          title: "Nueva Visita",
          url: "/visitas/nueva",
        },
        {
          title: "Seguimiento",
          url: "/visitas/seguimiento",
        },
      ],
    },
    {
      title: "Actividades",
      url: "/actividades",
      icon: Calendar,
      items: [
        {
          title: "Próximas Actividades",
          url: "/actividades",
        },
        {
          title: "Nueva Actividad",
          url: "/actividades/nueva",
        },
        {
          title: "Historial",
          url: "/actividades/historial",
        },
      ],
    },
    {
      title: "Ministerios",
      url: "/ministerios",
      icon: Heart,
      items: [
        {
          title: "Lista de Ministerios",
          url: "/ministerios",
        },
        {
          title: "Nuevo Ministerio",
          url: "/ministerios/nuevo",
        },
        {
          title: "Asignaciones",
          url: "/ministerios/asignaciones",
        },
      ],
    },
    {
      title: "Familias",
      url: "/familias",
      icon: HomeIcon,
      items: [
        {
          title: "Núcleos Familiares",
          url: "/familias",
        },
        {
          title: "Nueva Familia",
          url: "/familias/nueva",
        },
      ],
    },
    {
      title: "Configuración",
      url: "/configuracion",
      icon: Settings,
      items: [
        {
          title: "General",
          url: "/configuracion/general",
        },
        {
          title: "Usuarios",
          url: "/configuracion/usuarios",
        },
        {
          title: "Respaldos",
          url: "/configuracion/respaldos",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-center p-2">
          <ModeToggle />
        </div>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
