import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  handleApiError,
  requireAuth,
} from "@/lib/api-utils";
import { updateIncidenciaSchema } from "@/lib/validations";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/incidencias/[id] - Obtener incidencia
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const incidencia = await prisma.incidencia.findUnique({
      where: { id },
      include: {
        usuario: {
          select: { id: true, nombre: true, email: true },
        },
        edificio: {
          select: { id: true, nombre: true },
        },
        asignadoA: {
          select: { id: true, nombre: true, email: true },
        },
        visita: {
          include: {
            empresa: { select: { id: true, nombre: true, telefono: true, email: true } },
          },
        },
        comentarios: {
          include: {
            usuario: { select: { id: true, nombre: true, rol: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        notificaciones: true,
      },
    });

    if (!incidencia) {
      return errorResponse("Incidencia no encontrada", 404);
    }

    // Verificar acceso
    const tieneAcceso = session.user.edificios.some(
      (e) => e.id === incidencia.edificioId
    );
    if (!tieneAcceso && session.user.rol !== "ADMIN_PLATAFORMA") {
      return errorResponse("No tiene acceso a esta incidencia", 403);
    }

    // Residentes solo ven sus propias incidencias
    if (
      session.user.rol === "RESIDENTE" &&
      incidencia.usuarioId !== session.user.id
    ) {
      return errorResponse("No tiene acceso a esta incidencia", 403);
    }

    return successResponse(incidencia);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/incidencias/[id] - Actualizar incidencia
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const incidencia = await prisma.incidencia.findUnique({
      where: { id },
    });

    if (!incidencia) {
      return errorResponse("Incidencia no encontrada", 404);
    }

    // Verificar acceso al edificio
    const tieneAcceso = session.user.edificios.some(
      (e) => e.id === incidencia.edificioId
    );
    if (!tieneAcceso && session.user.rol !== "ADMIN_PLATAFORMA") {
      return errorResponse("No tiene acceso a esta incidencia", 403);
    }

    // Residentes solo pueden actualizar descripción de sus propias incidencias pendientes
    if (session.user.rol === "RESIDENTE") {
      if (incidencia.usuarioId !== session.user.id) {
        return errorResponse("No tiene acceso a esta incidencia", 403);
      }
      if (incidencia.estado !== "PENDIENTE") {
        return errorResponse(
          "Solo puede modificar incidencias pendientes",
          403
        );
      }
      // Residentes solo pueden cambiar descripción
      const { descripcion } = body;
      if (Object.keys(body).some((k) => k !== "descripcion")) {
        return errorResponse("Solo puede modificar la descripción", 403);
      }
      body.descripcion = descripcion;
    }

    const data = updateIncidenciaSchema.parse(body);

    // Si se marca como cerrada, agregar fecha de cierre
    const updateData: Record<string, unknown> = { ...data };
    if (data.estado === "CERRADA" || data.estado === "RESUELTA") {
      updateData.closedAt = new Date();
    }

    // Si se cambia a urgente, crear notificaciones
    if (data.prioridad === "URGENTE" && incidencia.prioridad !== "URGENTE") {
      const admins = await prisma.usuarioEdificio.findMany({
        where: {
          edificioId: incidencia.edificioId,
          usuario: {
            rol: { in: ["ADMIN_PLATAFORMA", "ADMIN_EDIFICIO"] },
          },
        },
        select: { usuarioId: true },
      });

      if (admins.length > 0) {
        await prisma.notificacion.createMany({
          data: admins.map((admin) => ({
            usuarioId: admin.usuarioId,
            incidenciaId: incidencia.id,
            tipo: "URGENCIA",
          })),
        });
      }
    }

    const updated = await prisma.incidencia.update({
      where: { id },
      data: updateData,
      include: {
        usuario: {
          select: { id: true, nombre: true, email: true },
        },
        visita: {
          select: {
            id: true,
            fechaProgramada: true,
            empresa: { select: { nombre: true } },
          },
        },
      },
    });

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/incidencias/[id] - Eliminar incidencia
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    // Solo admins pueden eliminar
    if (session.user.rol === "RESIDENTE") {
      return errorResponse("No tiene permisos para eliminar incidencias", 403);
    }

    const incidencia = await prisma.incidencia.findUnique({
      where: { id },
    });

    if (!incidencia) {
      return errorResponse("Incidencia no encontrada", 404);
    }

    // Verificar acceso al edificio
    const tieneAcceso = session.user.edificios.some(
      (e) => e.id === incidencia.edificioId
    );
    if (!tieneAcceso && session.user.rol !== "ADMIN_PLATAFORMA") {
      return errorResponse("No tiene acceso a esta incidencia", 403);
    }

    await prisma.incidencia.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
