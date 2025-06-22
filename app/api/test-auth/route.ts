import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "../../../lib/db";

export async function GET() {
  try {
    console.log("🔍 Iniciando diagnóstico de autenticación...");

    // 1. Verificar configuración de Supabase
    let supabaseConfigured = false;
    let userAuthenticated = false;
    let databaseConnected = false;
    let user = null;
    let usuarioIglesia = null;

    try {
      const supabase = await createClient();
      supabaseConfigured = true;
      console.log("✅ Cliente de Supabase creado exitosamente");

      // 2. Verificar autenticación del usuario
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.log("❌ Error de autenticación:", authError.message);
      } else if (authUser) {
        userAuthenticated = true;
        user = {
          id: authUser.id,
          email: authUser.email,
        };
        console.log("✅ Usuario autenticado:", authUser.email);

        // 3. Verificar relación usuario-iglesia
        usuarioIglesia = await prisma.usuarioIglesia.findFirst({
          where: {
            usuarioId: authUser.id,
            estado: "ACTIVO",
          },
          include: {
            iglesia: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        });

        if (usuarioIglesia) {
          console.log(
            "✅ Usuario tiene iglesia activa:",
            usuarioIglesia.iglesia.nombre
          );
        } else {
          console.log("❌ Usuario no tiene iglesia activa");
        }
      } else {
        console.log("❌ Usuario no autenticado");
      }
    } catch (error) {
      console.log("❌ Error de configuración Supabase:", error);
    }

    // 4. Verificar conexión a la base de datos
    try {
      await prisma.$queryRaw`SELECT 1`;
      databaseConnected = true;
      console.log("✅ Conexión a la base de datos exitosa");
    } catch (error) {
      console.log("❌ Error de conexión a la base de datos:", error);
    }

    // 5. Intentar obtener actividades (simulando el endpoint real)
    let actividades = [];
    let activitiesError = null;

    if (userAuthenticated && usuarioIglesia && databaseConnected) {
      try {
        actividades = await prisma.actividad.findMany({
          where: {
            iglesiaId: usuarioIglesia.iglesiaId,
          },
          include: {
            tipoActividad: true,
          },
          take: 5, // Solo las primeras 5 para el test
        });
        console.log(
          "✅ Actividades cargadas exitosamente:",
          actividades.length
        );
      } catch (error) {
        activitiesError = error;
        console.log("❌ Error al cargar actividades:", error);
      }
    }

    return NextResponse.json({
      diagnostico: {
        supabaseConfigured,
        userAuthenticated,
        databaseConnected,
        hasActiveChurch: !!usuarioIglesia,
        activitiesCount: actividades.length,
      },
      detalles: {
        user,
        iglesia: usuarioIglesia?.iglesia,
        activitiesError:
          activitiesError instanceof Error ? activitiesError.message : null,
      },
      recomendaciones: getRecommendations({
        supabaseConfigured,
        userAuthenticated,
        databaseConnected,
        hasActiveChurch: !!usuarioIglesia,
      }),
    });
  } catch (error) {
    console.error("💥 Error en diagnóstico:", error);
    return NextResponse.json(
      {
        error: "Error en diagnóstico",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

function getRecommendations(status: {
  supabaseConfigured: boolean;
  userAuthenticated: boolean;
  databaseConnected: boolean;
  hasActiveChurch: boolean;
}) {
  const recommendations = [];

  if (!status.supabaseConfigured) {
    recommendations.push(
      "Verificar variables de entorno de Supabase en .env.local"
    );
  }

  if (!status.userAuthenticated) {
    recommendations.push("Iniciar sesión en la aplicación");
  }

  if (!status.databaseConnected) {
    recommendations.push("Verificar conexión a la base de datos");
  }

  if (!status.hasActiveChurch) {
    recommendations.push(
      "Verificar que el usuario tenga una iglesia activa asignada"
    );
  }

  if (recommendations.length === 0) {
    recommendations.push("Todo parece estar configurado correctamente");
  }

  return recommendations;
}
