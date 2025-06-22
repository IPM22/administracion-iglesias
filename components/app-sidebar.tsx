"use client";

import type * as React from "react";
import {
  Users,
  Calendar,
  Heart,
  HomeIcon,
  Settings,
  BarChart3,
  Building2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

// Navegación principal del sistema
const navMainItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: BarChart3,
    isActive: true,
  },
  {
    title: "Comunidad",
    url: "/comunidad",
    icon: Users,
    items: [
      {
        title: "Miembros",
        url: "/comunidad?tab=miembros",
      },
      {
        title: "Visitas",
        url: "/comunidad?tab=visitas",
      },
      {
        title: "Niños y Adolescentes",
        url: "/comunidad?tab=ninos",
      },
      {
        title: "Nueva Persona",
        url: "/comunidad/nueva",
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
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { usuarioCompleto, iglesiaActiva, initializing } = useAuth();

  // Datos del usuario
  const userData = usuarioCompleto
    ? {
        name: `${usuarioCompleto.nombres} ${usuarioCompleto.apellidos}`,
        email: usuarioCompleto.email,
        avatar: usuarioCompleto.avatar || "/placeholder.svg?height=32&width=32",
        rol: iglesiaActiva?.rol || "MIEMBRO",
      }
    : {
        name: "Cargando...",
        email: "",
        avatar: "/placeholder.svg?height=32&width=32",
        rol: "MIEMBRO",
      };

  // Datos de la iglesia - Evitar mostrar "Sin iglesia" mientras se inicializa
  const teamsData = initializing
    ? [
        {
          name: "Cargando...",
          logo: Building2,
          plan: "Iniciando...",
        },
      ]
    : iglesiaActiva
    ? [
        {
          name: iglesiaActiva.nombre,
          logo: Building2,
          plan:
            iglesiaActiva.rol === "ADMIN"
              ? "Administrador"
              : iglesiaActiva.rol === "PASTOR"
              ? "Pastor"
              : iglesiaActiva.rol === "LIDER"
              ? "Líder"
              : iglesiaActiva.rol === "SECRETARIO"
              ? "Secretario"
              : "Miembro",
        },
      ]
    : [
        {
          name: "Sin iglesia",
          logo: Building2,
          plan: "Sin acceso",
        },
      ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teamsData} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
