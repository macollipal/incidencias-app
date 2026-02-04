import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  handleApiError,
  requireAuth,
} from "@/lib/api-utils";
import { getCache, setCache } from "@/lib/cache";

const STATS_CACHE_TTL = 30 * 1000; // 30 seconds

type RouteParams = { params: Promise<{ id: string }> };

interface StatsResponse {
  pendientes: number;
  urgentes: number;
  programadas: number;
  resueltasHoy: number;
  porTipo: Array<{ tipo: string; cantidad: number }>;
  proximasVisitas: Array<{
    id: string;
    empresa: string;
    fecha: Date;
    incidencias: number;
  }>;
  incidenciasUrgentes: Array<{
    id: string;
    descripcion: string;
    tipoServicio: string;
    createdAt: Date;
    reportadoPor: string;
  }>;
}

// GET /api/edificios/[id]/stats - Estadísticas del edificio
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    // Verificar acceso
    const tieneAcceso = session.user.edificios.some((e) => e.id === id);
    if (!tieneAcceso && session.user.rol !== "ADMIN_PLATAFORMA") {
      return errorResponse("No tiene acceso a este edificio", 403);
    }

    // Cache key includes user ID for residents (they see only their own data)
    const cacheKey =
      session.user.rol === "RESIDENTE"
        ? `stats:${id}:${session.user.id}`
        : `stats:${id}`;

    // Try to get from cache
    const cached = getCache<StatsResponse>(cacheKey, STATS_CACHE_TTL);
    if (cached) {
      return successResponse(cached);
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Filtro base: residentes solo ven sus propias incidencias
    const baseWhere: Record<string, unknown> = { edificioId: id };
    if (session.user.rol === "RESIDENTE") {
      baseWhere.usuarioId = session.user.id;
    }

    const [pendientes, urgentes, programadas, resueltasHoy, porTipo] =
      await Promise.all([
        // Incidencias pendientes
        prisma.incidencia.count({
          where: { ...baseWhere, estado: "PENDIENTE" },
        }),
        // Incidencias urgentes activas (excluye cerradas, resueltas y rechazadas)
        prisma.incidencia.count({
          where: {
            ...baseWhere,
            prioridad: "URGENTE",
            estado: { notIn: ["CERRADA", "RESUELTA", "RECHAZADA"] },
          },
        }),
        // Incidencias programadas
        prisma.incidencia.count({
          where: { ...baseWhere, estado: "PROGRAMADA" },
        }),
        // Resueltas hoy
        prisma.incidencia.count({
          where: {
            ...baseWhere,
            estado: { in: ["RESUELTA", "CERRADA"] },
            closedAt: { gte: hoy },
          },
        }),
        // Agrupadas por tipo de servicio (excluye estados terminales)
        prisma.incidencia.groupBy({
          by: ["tipoServicio"],
          where: {
            ...baseWhere,
            estado: { notIn: ["CERRADA", "RESUELTA", "RECHAZADA"] },
          },
          _count: true,
        }),
      ]);

    // Próximas visitas (solo para no-residentes, ya que residentes no gestionan visitas)
    let proximasVisitas: Array<{
      id: string;
      empresa: string;
      fecha: Date;
      incidencias: number;
    }> = [];

    if (session.user.rol !== "RESIDENTE") {
      const visitas = await prisma.visita.findMany({
        where: {
          edificioId: id,
          estado: "PROGRAMADA",
          fechaProgramada: { gte: new Date() },
        },
        include: {
          empresa: { select: { nombre: true } },
          _count: { select: { incidencias: true } },
        },
        orderBy: { fechaProgramada: "asc" },
        take: 5,
      });

      proximasVisitas = visitas.map((v) => ({
        id: v.id,
        empresa: v.empresa.nombre,
        fecha: v.fechaProgramada,
        incidencias: v._count.incidencias,
      }));
    }

    // Incidencias urgentes activas con detalles (excluye estados terminales)
    const incidenciasUrgentes = await prisma.incidencia.findMany({
      where: {
        ...baseWhere,
        prioridad: "URGENTE",
        estado: { notIn: ["CERRADA", "RESUELTA", "RECHAZADA"] },
      },
      include: {
        usuario: { select: { nombre: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const stats: StatsResponse = {
      pendientes,
      urgentes,
      programadas,
      resueltasHoy,
      porTipo: porTipo.map((t) => ({
        tipo: t.tipoServicio,
        cantidad: t._count,
      })),
      proximasVisitas,
      incidenciasUrgentes: incidenciasUrgentes.map((i) => ({
        id: i.id,
        descripcion: i.descripcion,
        tipoServicio: i.tipoServicio,
        createdAt: i.createdAt,
        reportadoPor: i.usuario.nombre,
      })),
    };

    // Store in cache
    setCache(cacheKey, stats);

    return successResponse(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
