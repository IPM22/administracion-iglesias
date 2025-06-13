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
    // Obtener el ID del usuario desde las headers (implementar según tu sistema de auth)
    const userId =
      request.headers.get("x-user-id") ||
      "e18db95b-71ae-441f-b18b-c1eefd48e95a"; // ID temporal para testing

    if (!userId) {
      return null;
    }

    // Obtener la relación usuario-iglesia
    const usuarioIglesia = await prisma.usuarioIglesia.findFirst({
      where: {
        usuarioId: userId,
        estado: "ACTIVO",
      },
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
