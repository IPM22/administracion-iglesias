import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
  getUserContext,
  requireAuth,
  createIglesiaFilter,
} from "../../../lib/auth-utils";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Obtener contexto del usuario autenticado
    const userContext = await getUserContext(request);
    const { iglesiaId } = requireAuth(userContext);

    console.log("🔍 Obteniendo personas para iglesia ID:", iglesiaId);

    // Obtener miembros
    const miembros = await prisma.miembro.findMany({
      where: createIglesiaFilter(iglesiaId),
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        correo: true,
        telefono: true,
        celular: true,
        foto: true,
        estado: true,
        fechaBautismo: true,
      },
      orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
    });

    // Obtener visitas que no han sido convertidas a miembros
    const visitas = await prisma.visita.findMany({
      where: {
        ...createIglesiaFilter(iglesiaId),
        estado: { not: "Convertido" },
      },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        correo: true,
        telefono: true,
        celular: true,
        foto: true,
        estado: true,
        fechaPrimeraVisita: true,
      },
      orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
    });

    // Combinar y formatear las personas
    const personas = [
      ...miembros.map((miembro) => ({
        id: miembro.id,
        nombres: miembro.nombres || "",
        apellidos: miembro.apellidos || "",
        correo: miembro.correo || null,
        telefono: miembro.telefono || null,
        celular: miembro.celular || null,
        foto: miembro.foto || null,
        estado: miembro.estado || "Activo",
        tipo: "miembro" as const,
        fechaBautismo: miembro.fechaBautismo,
      })),
      ...visitas.map((visita) => ({
        id: visita.id,
        nombres: visita.nombres || "",
        apellidos: visita.apellidos || "",
        correo: visita.correo || null,
        telefono: visita.telefono || null,
        celular: visita.celular || null,
        foto: visita.foto || null,
        estado: visita.estado || "Nuevo",
        tipo: "visita" as const,
        fechaBautismo: null,
      })),
    ];

    // Ordenar por apellido y nombre
    personas.sort((a, b) => {
      const apellidoCompare = a.apellidos.localeCompare(b.apellidos);
      if (apellidoCompare !== 0) return apellidoCompare;
      return a.nombres.localeCompare(b.nombres);
    });

    console.log(
      `✅ Se encontraron ${personas.length} personas para esta iglesia`
    );

    return NextResponse.json(personas);
  } catch (error) {
    console.error("Error al obtener personas:", error);

    if (error instanceof Error && error.message === "Usuario no autenticado") {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
