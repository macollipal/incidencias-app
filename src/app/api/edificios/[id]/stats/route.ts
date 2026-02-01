import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  handleApiError,
  requireAuth,
} from "@/lib/api-utils";

type RouteParams = { params: Promise<{ id: string }> };

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

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const [pendientes, urgentes, programadas, resueltasHoy, porTipo] =
      await Promise.all([
        // Incidencias pendientes
        prisma.incidencia.count({
          where: { edificioId: id, estado: "PENDIENTE" },
        }),
        // Incidencias urgentes activas
        prisma.incidencia.count({
          where: {
            edificioId: id,
            prioridad: "URGENTE",
            estado: { notIn: ["CERRADA", "RESUELTA"] },
          },
        }),
        // Incidencias programadas
        prisma.incidencia.count({
          where: { edificioId: id, estado: "PROGRAMADA" },
        }),
        // Resueltas hoy
        prisma.incidencia.count({
          where: {
            edificioId: id,
            estado: { in: ["RESUELTA", "CERRADA"] },
            closedAt: { gte: hoy },
          },
        }),
        // Agrupadas por tipo de servicio
        prisma.incidencia.groupBy({
          by: ["tipoServicio"],
          where: {
            edificioId: id,
            estado: { notIn: ["CERRADA", "RESUELTA"] },
          },
          _count: true,
        }),
      ]);

    // Próximas visitas
    const proximasVisitas = await prisma.visita.findMany({
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

    // Incidencias urgentes activas con detalles
    const incidenciasUrgentes = await prisma.incidencia.findMany({
      where: {
        edificioId: id,
        prioridad: "URGENTE",
        estado: { notIn: ["CERRADA", "RESUELTA"] },
      },
      include: {
        usuario: { select: { nombre: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return successResponse({
      pendientes,
      urgentes,
      programadas,
      resueltasHoy,
      porTipo: porTipo.map((t) => ({
        tipo: t.tipoServicio,
        cantidad: t._count,
      })),
      proximasVisitas: proximasVisitas.map((v) => ({
        id: v.id,
        empresa: v.empresa.nombre,
        fecha: v.fechaProgramada,
        incidencias: v._count.incidencias,
      })),
      incidenciasUrgentes: incidenciasUrgentes.map((i) => ({
        id: i.id,
        descripcion: i.descripcion,
        tipoServicio: i.tipoServicio,
        createdAt: i.createdAt,
        reportadoPor: i.usuario.nombre,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
