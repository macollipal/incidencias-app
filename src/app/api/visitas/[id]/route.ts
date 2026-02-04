import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  handleApiError,
  requireAuth,
  requireRole,
} from "@/lib/api-utils";
import { updateVisitaSchema } from "@/lib/validations";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/visitas/[id] - Obtener visita
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const visita = await prisma.visita.findUnique({
      where: { id },
      include: {
        edificio: { select: { id: true, nombre: true } },
        empresa: {
          select: { id: true, nombre: true, telefono: true, email: true },
        },
        incidencias: {
          include: {
            usuario: { select: { nombre: true } },
          },
        },
      },
    });

    if (!visita) {
      return errorResponse("Visita no encontrada", 404);
    }

    // Verificar acceso al edificio
    const tieneAcceso = session.user.edificios.some(
      (e) => e.id === visita.edificioId
    );
    if (!tieneAcceso && session.user.rol !== "ADMIN_PLATAFORMA") {
      return errorResponse("No tiene acceso a esta visita", 403);
    }

    return successResponse(visita);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/visitas/[id] - Actualizar visita (solo admins)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(["ADMIN_PLATAFORMA", "ADMIN_EDIFICIO"]);
    const { id } = await params;
    const body = await request.json();

    const visita = await prisma.visita.findUnique({ where: { id } });
    if (!visita) {
      return errorResponse("Visita no encontrada", 404);
    }

    // Verificar acceso al edificio
    const tieneAcceso = session.user.edificios.some(
      (e) => e.id === visita.edificioId
    );
    if (!tieneAcceso && session.user.rol !== "ADMIN_PLATAFORMA") {
      return errorResponse("No tiene acceso a esta visita", 403);
    }

    const { incidenciaIds, ...data } = updateVisitaSchema.parse(body);

    const updateData: Record<string, unknown> = { ...data };
    if (data.fechaProgramada) {
      updateData.fechaProgramada = new Date(data.fechaProgramada);
    }

    await prisma.visita.update({
      where: { id },
      data: updateData,
    });

    // Si se completó la visita, actualizar estado de incidencias
    if (data.estado === "COMPLETADA") {
      await prisma.incidencia.updateMany({
        where: { visitaId: id },
        data: { estado: "RESUELTA", closedAt: new Date() },
      });
    }

    // Si se canceló la visita, liberar incidencias
    if (data.estado === "CANCELADA") {
      await prisma.incidencia.updateMany({
        where: { visitaId: id },
        data: { estado: "PENDIENTE", visitaId: null },
      });
    }

    // Actualizar incidencias asignadas si se especificaron
    if (incidenciaIds !== undefined) {
      // Quitar visita de incidencias actuales
      await prisma.incidencia.updateMany({
        where: { visitaId: id },
        data: { visitaId: null, estado: "PENDIENTE" },
      });

      // Asignar nuevas incidencias
      if (incidenciaIds.length > 0) {
        await prisma.incidencia.updateMany({
          where: { id: { in: incidenciaIds } },
          data: { visitaId: id, estado: "PROGRAMADA" },
        });
      }
    }

    const result = await prisma.visita.findUnique({
      where: { id },
      include: {
        empresa: { select: { id: true, nombre: true } },
        incidencias: {
          select: {
            id: true,
            descripcion: true,
            tipoServicio: true,
            estado: true,
          },
        },
      },
    });

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/visitas/[id] - Eliminar visita (solo admins)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(["ADMIN_PLATAFORMA", "ADMIN_EDIFICIO"]);
    const { id } = await params;

    const visita = await prisma.visita.findUnique({ where: { id } });
    if (!visita) {
      return errorResponse("Visita no encontrada", 404);
    }

    // Verificar acceso al edificio
    const tieneAcceso = session.user.edificios.some(
      (e) => e.id === visita.edificioId
    );
    if (!tieneAcceso && session.user.rol !== "ADMIN_PLATAFORMA") {
      return errorResponse("No tiene acceso a esta visita", 403);
    }

    // Liberar incidencias asignadas
    await prisma.incidencia.updateMany({
      where: { visitaId: id },
      data: { visitaId: null, estado: "PENDIENTE" },
    });

    await prisma.visita.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
