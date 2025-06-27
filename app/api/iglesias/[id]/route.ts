import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const iglesia = await prisma.iglesia.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        direccion: true,
        telefono: true,
        correo: true,
        sitioWeb: true,
        logoUrl: true,
        configuracion: true,
        activa: true,
        createdAt: true,
        _count: {
          select: {
            usuarios: {
              where: { estado: "ACTIVO" },
            },
            personas: {
              where: { rol: "MIEMBRO" },
            },
          },
        },
      },
    });

    if (!iglesia) {
      return NextResponse.json(
        { error: "Iglesia no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(iglesia);
  } catch (error) {
    console.error("Error obteniendo iglesia:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    // Verificar que la iglesia existe
    const iglesiaExistente = await prisma.iglesia.findUnique({
      where: { id: parseInt(id) },
    });

    if (!iglesiaExistente) {
      return NextResponse.json(
        { error: "Iglesia no encontrada" },
        { status: 404 }
      );
    }

    // Preparar datos de actualización
    const updateData: {
      nombre?: string;
      descripcion?: string;
      direccion?: string;
      telefono?: string;
      correo?: string;
      sitioWeb?: string;
      logoUrl?: string;
      configuracion?: object;
      updatedAt: Date;
    } = {
      nombre: data.nombre?.trim() || iglesiaExistente.nombre,
      descripcion: data.descripcion?.trim() || iglesiaExistente.descripcion,
      direccion: data.direccion?.trim() || iglesiaExistente.direccion,
      telefono: data.telefono?.trim() || iglesiaExistente.telefono,
      correo: data.correo?.trim() || iglesiaExistente.correo,
      sitioWeb: data.sitioWeb?.trim() || iglesiaExistente.sitioWeb,
      logoUrl: data.logoUrl || iglesiaExistente.logoUrl,
      updatedAt: new Date(),
    };

    // Si se envía configuración, actualizar o combinar con la existente
    if (data.configuracion) {
      const configuracionExistente = iglesiaExistente.configuracion || {};
      updateData.configuracion = {
        ...(typeof configuracionExistente === "object"
          ? configuracionExistente
          : {}),
        ...data.configuracion,
      };
    }

    // Actualizar la iglesia
    const iglesiaActualizada = await prisma.iglesia.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        direccion: true,
        telefono: true,
        correo: true,
        sitioWeb: true,
        logoUrl: true,
        configuracion: true,
        activa: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      iglesia: iglesiaActualizada,
      message: "Iglesia actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error actualizando iglesia:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
