"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Building2,
  Search,
  Users,
  Heart,
  ArrowRight,
  CheckCircle,
  Loader2,
} from "lucide-react";

interface WelcomeWizardProps {
  usuario: {
    nombres: string;
    apellidos: string;
    email: string;
  };
  onComplete: () => void;
}

export function WelcomeWizard({ usuario, onComplete }: WelcomeWizardProps) {
  const [step, setStep] = useState<"welcome" | "choose" | "create" | "join">(
    "welcome"
  );
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreateChurch = () => {
    setStep("create");
  };

  const handleJoinChurch = () => {
    setStep("join");
  };

  const handleCompleteOnboarding = async () => {
    setLoading(true);
    try {
      // Marcar que el usuario ya no es primer login
      await fetch(`/api/usuarios/${usuario.email}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primerLogin: false }),
      });

      onComplete();
    } catch (error) {
      console.error("Error completando onboarding:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="max-w-2xl">
        {step === "welcome" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl text-center">
                ¡Bienvenido, {usuario.nombres}! 🎉
              </DialogTitle>
              <DialogDescription className="text-center">
                Gracias por unirte a nuestro sistema de gestión para iglesias.
                Te ayudaremos a configurar todo en unos simples pasos.
              </DialogDescription>
            </DialogHeader>

            <div className="py-6">
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-sm">Gestión de Miembros</h3>
                  <p className="text-xs text-muted-foreground">
                    Administra tu congregación fácilmente
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
                    <Heart className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-sm">
                    Seguimiento de Visitas
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Conecta con nuevas personas
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-sm">
                    Actividades y Eventos
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Organiza y programa todo
                  </p>
                </div>
              </div>

              <div className="text-center">
                <Button onClick={() => setStep("choose")} size="lg">
                  Comenzar configuración
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "choose" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl text-center">
                ¿Cómo quieres empezar?
              </DialogTitle>
              <DialogDescription className="text-center">
                Puedes crear una nueva iglesia o unirte a una existente
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 space-y-4">
              <Card
                className="cursor-pointer hover:bg-muted/50 transition-colors border-2"
                onClick={handleCreateChurch}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Crear Nueva Iglesia</h3>
                      <p className="text-sm text-muted-foreground">
                        Configura tu iglesia desde cero y conviértete en
                        administrador
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:bg-muted/50 transition-colors border-2"
                onClick={handleJoinChurch}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Search className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        Unirse a Iglesia Existente
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Busca y solicita acceso a una iglesia ya registrada
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center">
              <Button variant="outline" onClick={() => setStep("welcome")}>
                Volver
              </Button>
            </div>
          </>
        )}

        {step === "create" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl text-center">
                Crear Nueva Iglesia
              </DialogTitle>
              <DialogDescription className="text-center">
                Te redirigiremos al formulario de creación
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>

              <div>
                <h3 className="font-semibold mb-2">
                  ¡Perfecto! Serás administrador
                </h3>
                <p className="text-sm text-muted-foreground">
                  Tendrás control total sobre la gestión de tu iglesia
                </p>
              </div>

              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => setStep("choose")}>
                  Volver
                </Button>
                <Button
                  onClick={() => router.push("/onboarding/crear-iglesia")}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Building2 className="mr-2 h-4 w-4" />
                  )}
                  Crear Iglesia
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "join" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl text-center">
                Unirse a Iglesia
              </DialogTitle>
              <DialogDescription className="text-center">
                Te redirigiremos para buscar iglesias disponibles
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <Search className="h-8 w-8 text-green-600" />
              </div>

              <div>
                <h3 className="font-semibold mb-2">Buscar Iglesias</h3>
                <p className="text-sm text-muted-foreground">
                  Podrás solicitar acceso a iglesias ya registradas
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Nota:</strong> Tu solicitud será revisada por un
                  administrador de la iglesia antes de ser aprobada.
                </p>
              </div>

              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => setStep("choose")}>
                  Volver
                </Button>
                <Button
                  onClick={() => router.push("/onboarding/buscar-iglesia")}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  Buscar Iglesias
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
