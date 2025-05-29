"use client";

import { AppSidebar } from "../../components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  UserPlus,
  Calendar,
  Heart,
  TrendingUp,
  Activity,
} from "lucide-react";

export default function DashboardPage() {
  const stats = [
    {
      title: "Total Miembros",
      value: "248",
      description: "+12% desde el mes pasado",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Visitas Este Mes",
      value: "32",
      description: "+8 nuevas visitas",
      icon: UserPlus,
      color: "text-green-600",
    },
    {
      title: "Actividades Activas",
      value: "8",
      description: "3 esta semana",
      icon: Calendar,
      color: "text-purple-600",
    },
    {
      title: "Ministerios",
      value: "12",
      description: "156 miembros activos",
      icon: Heart,
      color: "text-red-600",
    },
  ];

  const recentActivities = [
    { name: "Culto Dominical", date: "Hoy 10:00 AM", attendees: 180 },
    { name: "Estudio Bíblico", date: "Miércoles 7:00 PM", attendees: 45 },
    { name: "Reunión de Jóvenes", date: "Viernes 7:30 PM", attendees: 32 },
    { name: "Oración Matutina", date: "Sábado 6:00 AM", attendees: 28 },
  ];

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
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Actividades Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-center">
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-purple-100">
                        <Activity className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {activity.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {activity.date}
                        </p>
                      </div>
                      <div className="ml-auto font-medium">
                        {activity.attendees} asistentes
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Crecimiento Mensual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Nuevos Miembros</p>
                      <p className="text-2xl font-bold">12</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
                      <UserPlus className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Visitas</p>
                      <p className="text-2xl font-bold">32</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Crecimiento</p>
                      <p className="text-2xl font-bold">+18%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
