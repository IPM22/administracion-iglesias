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
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Eye, Users, HomeIcon, Phone } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function FamiliasPage() {
  const familias = [
    {
      id: 1,
      apellido: "González",
      direccion: "Calle Principal 123, Colonia Centro",
      telefono: "+1 234-567-8901",
      jefeFamilia: {
        nombre: "Juan González",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      miembros: [
        { nombre: "María González", parentesco: "Esposa", edad: 35, miembro: true },
        { nombre: "Carlos González", parentesco: "Hijo", edad: 15, miembro: true },
        { nombre: "Ana González", parentesco: "Hija", edad: 12, miembro: false },
      ],
      totalMiembros: 4,
      miembrosIglesia: 3,
      estado: "Activa",
      fechaRegistro: "2023-01-15",
    },
    {
      id: 2,
      apellido: "Rodríguez",
      direccion: "Av. Libertad 456, Colonia Norte",
      telefono: "+1 234-567-8902",
      jefeFamilia: {
        nombre: "Carlos Rodríguez",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      miembros: [
        { nombre: "Laura Rodríguez", parentesco: "Esposa", edad: 32, miembro: true },
        { nombre: "Pedro Rodríguez", parentesco: "Hijo", edad: 8, miembro: false },
      ],
      totalMiembros: 3,
      miembrosIglesia: 2,
      estado: "Activa",
      fechaRegistro: "2023-03-20",
    },
    {
      id: 3,
      apellido: "Martínez",
      direccion: "Calle Esperanza 789, Colonia Sur",
      telefono: "+1 234-567-8903",
      jefeFamilia: {
        nombre: "Ana Martínez",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      miembros: [
        { nombre: "Roberto Martínez", parentesco: "Hijo", edad: 22, miembro: true },
        { nombre: "Carmen Martínez", parentesco: "Hija", edad: 18, miembro: true },
      ],
      totalMiembros: 3,
      miembrosIglesia: 3,
      estado: "Activa",
      fechaRegistro: "2023-02-10",
    },
    {
      id: 4,
      apellido: "López",
      direccion: "Av. Paz 321, Colonia Este",
      telefono: "+1 234-567-8904",
      jefeFamilia: {
        nombre: "Pedro López",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      miembros: [
        { nombre: "Elena López", parentesco: "Esposa", edad: 45, miembro: false },
        { nombre: "Diego López", parentesco: "Hijo", edad: 20, miembro: true },
        { nombre: "Sofia López", parentesco: "Hija", edad: 16, miembro: false },
      ],
      totalMiembros: 4,
      miembrosIglesia: 2,
      estado: "Inactiva",
      fechaRegistro: "2022-11-05",
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
                  <BreadcrumbPage>Familias</BreadcrumbPage>
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
                  <CardTitle>Gestión de Familias</CardTitle>
                  <CardDescription>Administra los núcleos familiares de la congregación</CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Familia
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar familias..." className="pl-8" />
                </div>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros
                </Button>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {familias.map((familia) => (
                  <Card key={familia.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg flex items-center">
                            <HomeIcon className="mr-2 h-5 w-5" />
                            Familia {familia.apellido}
                          </CardTitle>
                          <CardDescription className="flex items-center">
                            <Phone className="mr-1 h-3 w-3" />
                            {familia.telefono}
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={familia.estado === "Activa" ? "default" : "secondary"}>
                            {familia.estado}
                          </Badge>
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
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-sm text-muted-foreground">{familia.direccion}</div>

                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={familia.jefeFamilia.avatar || "/placeholder.svg"} />
                            <AvatarFallback>
                              {familia.jefeFamilia.nombre
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">Jefe de Familia</p>
                            <p className="text-sm text-muted-foreground">{familia.jefeFamilia.nombre}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Miembros del Hogar</p>
                            <div className="flex items-center space-x-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{familia.totalMiembros}</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            {familia.miembros.slice(0, 3).map((miembro, index) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <div className="flex items-center space-x-2">
                                  <span>{miembro.nombre}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {miembro.parentesco}
                                  </Badge>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <span className="text-xs text-muted-foreground">{miembro.edad} años</span>
                                  {miembro.miembro && (
                                    <Badge variant="secondary" className="text-xs">
                                      Miembro
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                            {familia.miembros.length > 3 && (
                              <p className="text-xs text-muted-foreground">+{familia.totalMiembros - 3} miembros más</p>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between">
                            <div className="text-sm">
                              <span className="text-muted-foreground">Miembros de la iglesia: </span>
                              <span className="font-medium">
                                {familia.miembrosIglesia}/{familia.totalMiembros}
                              </span>
                            </div>
                            <Button size="sm" variant="outline">
                              Ver Árbol
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
