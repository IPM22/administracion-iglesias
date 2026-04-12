import { NextRequest } from "next/server";
import { prisma } from "./db";

export interface UserContext {
  usuarioId: string;
  iglesiaId: number;
  rol: string;
}

export async function getUserContext(
  request: NextRequest
): Promise<UserContext | null> {
  try {
    // Obtener el ID del usuario desde los headers (inyectado por el middleware de Supabase)
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return null;
    }

    // Verificar si el cliente envía un iglesiaId específico (query param)
    const url = new URL(request.url);
    const iglesiaIdParam = url.searchParams.get("iglesiaId");
    const iglesiaIdSolicitado = iglesiaIdParam
      ? parseInt(iglesiaIdParam)
      : null;

    // Construir el filtro: si viene iglesiaId en el query param, validar que
    // el usuario pertenece a esa iglesia específica
    const whereClause = iglesiaIdSolicitado
      ? {
          usuarioId: userId,
          iglesiaId: iglesiaIdSolicitado,
          estado: "ACTIVO" as const,
        }
      : { usuarioId: userId, estado: "ACTIVO" as const };

    // Obtener la relación usuario-iglesia
    const usuarioIglesia = await prisma.usuarioIglesia.findFirst({
      where: whereClause,
      include: {
        iglesia: {
          select: {
            id: true,
            activa: true,
          },
        },
      },
    });

    if (!usuarioIglesia || !usuarioIglesia.iglesia.activa) {
      return null;
    }

    return {
      usuarioId: userId,
      iglesiaId: usuarioIglesia.iglesiaId,
      rol: usuarioIglesia.rol,
    };
  } catch (error) {
    console.error("Error obteniendo contexto del usuario:", error);
    return null;
  }
}

export function createIglesiaFilter(iglesiaId: number) {
  return { iglesiaId };
}

export function requireAuth(userContext: UserContext | null) {
  if (!userContext) {
    throw new Error("Usuario no autenticado");
  }
  return userContext;
}
