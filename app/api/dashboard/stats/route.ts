import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    // Obtener el usuario autenticado
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    // Obtener la iglesia activa del usuario desde el parámetro o la primera iglesia activa
    const { searchParams } = new URL(request.url);
    const iglesiaIdParam = searchParams.get("iglesiaId");

    let iglesiaId: number;

    if (iglesiaIdParam) {
      iglesiaId = parseInt(iglesiaIdParam);
    } else {
      // Si no se proporciona iglesiaId, obtener la primera iglesia activa del usuario
      const usuarioIglesia = await prisma.usuarioIglesia.findFirst({
        where: {
          usuarioId: user.id,
          estado: "ACTIVO",
        },
        include: {
          iglesia: true,
        },
      });

      if (!usuarioIglesia) {
        return NextResponse.json(
          { error: "No tienes acceso a ninguna iglesia activa" },
          { status: 403 }
        );
      }

      iglesiaId = usuarioIglesia.iglesiaId;
    }

    // Verificar que el usuario tiene acceso a esta iglesia
    const usuarioTieneAcceso = await prisma.usuarioIglesia.findFirst({
      where: {
        usuarioId: user.id,
        iglesiaId: iglesiaId,
        estado: "ACTIVO",
      },
    });

    if (!usuarioTieneAcceso) {
      return NextResponse.json(
        { error: "No tienes acceso a esta iglesia" },
        { status: 403 }
      );
    }

    // Obtener fecha actual y hace 30 días
    const ahora = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(ahora.getDate() - 30);
    const hace60Dias = new Date();
    hace60Dias.setDate(ahora.getDate() - 60);

    // Estadísticas de miembros (CON FILTRO DE IGLESIA)
    const [
      totalMiembros,
      miembrosActivos,
      miembrosNuevos30Dias,
      miembrosNuevos60Dias,
    ] = await Promise.all([
      prisma.miembro.count({
        where: { iglesiaId },
      }),
      prisma.miembro.count({
        where: {
          iglesiaId,
          estado: "Activo",
        },
      }),
      prisma.miembro.count({
        where: {
          iglesiaId,
          createdAt: { gte: hace30Dias },
        },
      }),
      prisma.miembro.count({
        where: {
          iglesiaId,
          createdAt: { gte: hace60Dias, lt: hace30Dias },
        },
      }),
    ]);

    // Estadísticas de visitas (CON FILTRO DE IGLESIA)
    const [
      totalVisitas,
      visitasNuevas,
      visitasRecurrentes,
      visitasConvertidas,
      visitasNuevas30Dias,
      visitasNuevas60Dias,
    ] = await Promise.all([
      prisma.visita.count({
        where: { iglesiaId },
      }),
      prisma.visita.count({
        where: {
          iglesiaId,
          estado: "Nuevo",
        },
      }),
      prisma.visita.count({
        where: {
          iglesiaId,
          estado: "Recurrente",
        },
      }),
      prisma.visita.count({
        where: {
          iglesiaId,
          estado: "Convertido",
        },
      }),
      prisma.visita.count({
        where: {
          iglesiaId,
          createdAt: { gte: hace30Dias },
        },
      }),
      prisma.visita.count({
        where: {
          iglesiaId,
          createdAt: { gte: hace60Dias, lt: hace30Dias },
        },
      }),
    ]);

    // Estadísticas de familias (CON FILTRO DE IGLESIA)
    const [
      totalFamilias,
      familiasActivas,
      familiasNuevas30Dias,
      familiasNuevas60Dias,
    ] = await Promise.all([
      prisma.familia.count({
        where: { iglesiaId },
      }),
      prisma.familia.count({
        where: {
          iglesiaId,
          estado: "Activa",
        },
      }),
      prisma.familia.count({
        where: {
          iglesiaId,
          createdAt: { gte: hace30Dias },
        },
      }),
      prisma.familia.count({
        where: {
          iglesiaId,
          createdAt: { gte: hace60Dias, lt: hace30Dias },
        },
      }),
    ]);

    // Distribución por edades de miembros (CON FILTRO DE IGLESIA)
    const miembrosConEdad = await prisma.miembro.findMany({
      where: {
        iglesiaId,
        fechaNacimiento: { not: null },
        estado: "Activo",
      },
      select: {
        fechaNacimiento: true,
      },
    });

    const distribucionEdades = {
      ninos: 0, // 0-12
      jovenes: 0, // 13-25
      adultos: 0, // 26-59
      adultosMayores: 0, // 60+
    };

    miembrosConEdad.forEach((miembro) => {
      if (miembro.fechaNacimiento) {
        const edad =
          ahora.getFullYear() - new Date(miembro.fechaNacimiento).getFullYear();
        if (edad <= 12) distribucionEdades.ninos++;
        else if (edad <= 25) distribucionEdades.jovenes++;
        else if (edad <= 59) distribucionEdades.adultos++;
        else distribucionEdades.adultosMayores++;
      }
    });

    // Conversiones recientes (últimas 10) (CON FILTRO DE IGLESIA)
    const conversionesRecientes = await prisma.visita.findMany({
      where: {
        iglesiaId,
        estado: "Convertido",
        miembroConvertidoId: { not: null },
      },
      include: {
        miembroConvertido: {
          select: {
            nombres: true,
            apellidos: true,
            createdAt: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    });

    // Cálculo de porcentajes de cambio
    const calcularPorcentajeCambio = (actual: number, anterior: number) => {
      if (anterior === 0) return actual > 0 ? 100 : 0;
      return Math.round(((actual - anterior) / anterior) * 100);
    };

    // Próximas actividades reales de la base de datos (CON FILTRO DE IGLESIA)
    const proximasActividadesDB = await prisma.actividad.findMany({
      where: {
        iglesiaId,
        fecha: { gte: ahora },
        estado: { in: ["Programada", "En curso"] },
      },
      include: {
        tipoActividad: {
          select: {
            nombre: true,
            tipo: true,
          },
        },
        ministerio: {
          select: {
            nombre: true,
          },
        },
      },
      orderBy: { fecha: "asc" },
      take: 6, // Mostrar las próximas 6 actividades
    });

    // Formatear las actividades para el dashboard
    const proximasActividades = proximasActividadesDB.map((actividad) => {
      const fechaActividad = new Date(actividad.fecha);

      // Formatear la fecha para mostrar
      const fechaFormateada = fechaActividad.toLocaleDateString("es-ES", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });

      // Agregar hora si está disponible
      let fechaCompleta = fechaFormateada;
      if (actividad.horaInicio) {
        fechaCompleta += ` ${actividad.horaInicio}`;
      }

      // Estimar asistentes basado en el tipo de actividad y datos históricos
      let asistentesEsperados = Math.round(totalMiembros * 0.3); // Default 30%

      // Ajustar estimación según el tipo
      if (actividad.tipoActividad.nombre.toLowerCase().includes("culto")) {
        asistentesEsperados = Math.round(totalMiembros * 0.8);
      } else if (
        actividad.tipoActividad.nombre.toLowerCase().includes("estudio")
      ) {
        asistentesEsperados = Math.round(totalMiembros * 0.4);
      } else if (
        actividad.tipoActividad.nombre.toLowerCase().includes("joven")
      ) {
        asistentesEsperados = distribucionEdades.jovenes;
      } else if (
        actividad.tipoActividad.nombre.toLowerCase().includes("oración")
      ) {
        asistentesEsperados = Math.round(totalMiembros * 0.25);
      } else if (
        actividad.tipoActividad.nombre.toLowerCase().includes("célula")
      ) {
        asistentesEsperados = Math.round(totalMiembros * 0.3);
      }

      return {
        id: actividad.id,
        nombre: actividad.nombre,
        fecha: fechaCompleta,
        fechaCompleta: actividad.fecha.toISOString(),
        lugar: actividad.ubicacion || "Por confirmar",
        tipo: actividad.tipoActividad.nombre,
        tipoCategoria: actividad.tipoActividad.tipo, // "Regular" o "Especial"
        ministerio: actividad.ministerio?.nombre || null,
        horaInicio: actividad.horaInicio,
        horaFin: actividad.horaFin,
        descripcion: actividad.descripcion,
        estado: actividad.estado,
        asistentesEsperados,
      };
    });

    const respuesta = {
      // Estadísticas principales
      totalMiembros,
      miembrosActivos,
      totalVisitas,
      totalFamilias,
      familiasActivas,

      // Visitas por estado
      visitasPorEstado: {
        nuevas: visitasNuevas,
        recurrentes: visitasRecurrentes,
        convertidas: visitasConvertidas,
      },

      // Cambios mensuales
      cambios: {
        miembros: calcularPorcentajeCambio(
          miembrosNuevos30Dias,
          miembrosNuevos60Dias
        ),
        visitas: calcularPorcentajeCambio(
          visitasNuevas30Dias,
          visitasNuevas60Dias
        ),
        familias: calcularPorcentajeCambio(
          familiasNuevas30Dias,
          familiasNuevas60Dias
        ),
      },

      // Nuevos en los últimos 30 días
      nuevosUltimos30Dias: {
        miembros: miembrosNuevos30Dias,
        visitas: visitasNuevas30Dias,
        familias: familiasNuevas30Dias,
      },

      // Distribución por edades
      distribucionEdades,

      // Próximas actividades reales
      proximasActividades,

      // Conversiones recientes
      conversionesRecientes: conversionesRecientes.map((conversion) => ({
        nombres: conversion.nombres,
        apellidos: conversion.apellidos,
        fechaConversion: conversion.miembroConvertido?.createdAt,
        fechaOriginal: conversion.createdAt,
      })),

      // Métricas de conversión
      tasaConversion:
        totalVisitas > 0
          ? Math.round((visitasConvertidas / totalVisitas) * 100)
          : 0,

      // Promedio de personas por familia
      promedioPersonasPorFamilia:
        familiasActivas > 0
          ? Math.round((totalMiembros + totalVisitas) / familiasActivas)
          : 0,
    };

    return NextResponse.json(respuesta);
  } catch (error) {
    console.error("Error al obtener estadísticas del dashboard:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}
