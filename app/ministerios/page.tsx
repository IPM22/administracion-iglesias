import { AppSidebar } from "../../components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Eye, Users, UserPlus } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function MinisteriosPage() {
  const ministerios = [
    {
      id: 1,
      nombre: "Alabanza y Adoración",
      descripcion: "Ministerio encargado de la música y adoración en los servicios",
      lider: {
        nombre: "María González",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      miembros: [
        { nombre: "Carlos Rodríguez", rol: "Guitarrista" },
        { nombre: "Ana Martínez", rol: "Vocalista" },
        { nombre: "Pedro López", rol: "Baterista" },
        { nombre: "Laura Fernández", rol: "Pianista" },
      ],
      totalMiembros: 12,
      estado: "Activo",
      proximaReunion: "2024-01-30",
    },
    {
      id: 2,
      nombre: "Ministerio de Jóvenes",
      descripcion: "Ministerio dedicado al crecimiento espiritual de los jóvenes",
      lider: {
        nombre: "Carlos Rodríguez",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      miembros: [
        { nombre: "Roberto Silva", rol: "Co-líder" },
        { nombre: "Carmen Jiménez", rol: "Coordinadora" },
        { nombre: "Diego Morales", rol: "Voluntario" },
      ],
      totalMiembros: 8,
      estado: "Activo",
      proximaReunion: "2024-02-02",
    },
    {
      id: 3,
      nombre: "Ministerio de Niños",
      descripcion: "Ministerio enfocado en la enseñanza y cuidado de los niños",
      lider: {
        nombre: "Ana Martínez",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      miembros: [
        { nombre: "María González", rol: "Maestra" },
        { nombre: "Laura Fernández", rol: "Asistente" },
      ],
      totalMiembros: 6,
      estado: "Activo",
      proximaReunion: "2024-01-28",
    },
    {
      id: 4,
      nombre: "Ministerio de Intercesión",
      descripcion: "Ministerio dedicado a la oración e intercesión",
      lider: {
        nombre: "Pedro López",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      miembros: [
        { nombre: "Carmen Jiménez", rol: "Intercesora" },
        { nombre: "Roberto Silva", rol: "Coordinador" },
      ],
      totalMiembros: 15,
      estado: "Activo",
      proximaReunion: "2024-01-29",
    },
  ]

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
                  <BreadcrumbPage>Ministerios</BreadcrumbPage>
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
                  <CardTitle>Gestión de Ministerios</CardTitle>
                  <CardDescription>Administra los ministerios y equipos de trabajo de la iglesia</CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Ministerio
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar ministerios..." className="pl-8" />
                </div>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros
                </Button>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {ministerios.map((ministerio) => (
                  <Card key={ministerio.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{ministerio.nombre}</CardTitle>
                          <CardDescription>{ministerio.descripcion}</CardDescription>
                        </div>
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
                              <UserPlus className="mr-2 h-4 w-4" />
                              Agregar Miembro
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
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={ministerio.lider.avatar || "/placeholder.svg"} />
                              <AvatarFallback>
                                {ministerio.lider.nombre
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">Líder</p>
                              <p className="text-sm text-muted-foreground">{ministerio.lider.nombre}</p>
                            </div>
                          </div>
                          <Badge variant="secondary">{ministerio.estado}</Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Miembros Activos</p>
                            <div className="flex items-center space-x-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{ministerio.totalMiembros}</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            {ministerio.miembros.slice(0, 3).map((miembro, index) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <span>{miembro.nombre}</span>
                                <Badge variant="outline" className="text-xs">
                                  {miembro.rol}
                                </Badge>
                              </div>
                            ))}
                            {ministerio.miembros.length > 3 && (
                              <p className="text-xs text-muted-foreground">
                                +{ministerio.totalMiembros - 3} miembros más
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                              Próxima reunión: {new Date(ministerio.proximaReunion).toLocaleDateString()}
                            </p>
                            <Button size="sm" variant="outline">
                              Ver Más
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
