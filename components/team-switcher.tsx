"use client";

import * as React from "react";
import { ChevronsUpDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function TeamSwitcher({
  teams,
}: {
  teams: {
    name: string;
    logo: React.ElementType;
    plan: string;
  }[];
}) {
  const { isMobile } = useSidebar();
  const { usuarioCompleto, iglesiaActiva, cambiarIglesia } = useAuth();
  const router = useRouter();

  const activeTeam = teams[0];

  if (!activeTeam) {
    return null;
  }

  // Obtener todas las iglesias disponibles del usuario
  const iglesiasDisponibles =
    usuarioCompleto?.iglesias.filter((ui) => ui.estado === "ACTIVO") || [];

  const handleIglesiaChange = (iglesiaId: number) => {
    const iglesia = iglesiasDisponibles.find(
      (ui) => ui.iglesia.id === iglesiaId
    );
    if (iglesia) {
      cambiarIglesia({
        id: iglesia.iglesia.id,
        nombre: iglesia.iglesia.nombre,
        logoUrl: iglesia.iglesia.logoUrl,
        rol: iglesia.rol,
        estado: iglesia.estado,
      });
    }
  };

  const handleCrearIglesia = () => {
    router.push("/onboarding/crear-iglesia");
  };

  const handleBuscarIglesia = () => {
    router.push("/onboarding/buscar-iglesia");
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <activeTeam.logo className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {activeTeam.name}
                </span>
                <span className="truncate text-xs">{activeTeam.plan}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            {iglesiasDisponibles.length > 0 && (
              <>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Mis Iglesias
                </DropdownMenuLabel>
                {iglesiasDisponibles.map((ui) => (
                  <DropdownMenuItem
                    key={ui.iglesia.id}
                    onClick={() => handleIglesiaChange(ui.iglesia.id)}
                    className="gap-2 p-2"
                    disabled={iglesiaActiva?.id === ui.iglesia.id}
                  >
                    <div className="flex size-6 items-center justify-center rounded-sm border">
                      <activeTeam.logo className="size-4 shrink-0" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm">{ui.iglesia.nombre}</span>
                      <span className="text-xs text-muted-foreground">
                        {ui.rol}
                      </span>
                    </div>
                    {iglesiaActiva?.id === ui.iglesia.id && (
                      <DropdownMenuShortcut>✓</DropdownMenuShortcut>
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={handleCrearIglesia}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">
                Crear Iglesia
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={handleBuscarIglesia}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">
                Buscar Iglesia
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
