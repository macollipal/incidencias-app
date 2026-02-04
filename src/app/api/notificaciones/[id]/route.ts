import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
    successResponse,
    errorResponse,
    handleApiError,
    requireAuth,
} from "@/lib/api-utils";
import { z } from "zod";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

const marcarLeidaSchema = z.object({
    leida: z.boolean(),
});

// PATCH /api/notificaciones/[id] - Marcar como leída/no leída
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await requireAuth();
        const { id } = await params;
        const body = await request.json();

        // Validar que la notificación existe y pertenece al usuario
        const notificacion = await prisma.notificacion.findUnique({
            where: { id },
        });

        if (!notificacion) {
            return errorResponse("Notificación no encontrada", 404);
        }

        if (notificacion.usuarioId !== session.user.id) {
            return errorResponse("No tiene acceso a esta notificación", 403);
        }

        const data = marcarLeidaSchema.parse(body);

        const updated = await prisma.notificacion.update({
            where: { id },
            data: { leida: data.leida },
            include: {
                incidencia: {
                    select: {
                        id: true,
                        descripcion: true,
                        tipoServicio: true,
                        prioridad: true,
                        estado: true,
                    },
                },
            },
        });

        return successResponse(updated);
    } catch (error) {
        return handleApiError(error);
    }
}

// DELETE /api/notificaciones/[id] - Eliminar notificación
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await requireAuth();
        const { id } = await params;

        // Validar que la notificación existe y pertenece al usuario
        const notificacion = await prisma.notificacion.findUnique({
            where: { id },
        });

        if (!notificacion) {
            return errorResponse("Notificación no encontrada", 404);
        }

        if (notificacion.usuarioId !== session.user.id) {
            return errorResponse("No tiene acceso a esta notificación", 403);
        }

        await prisma.notificacion.delete({ where: { id } });

        return successResponse({ deleted: true });
    } catch (error) {
        return handleApiError(error);
    }
}
