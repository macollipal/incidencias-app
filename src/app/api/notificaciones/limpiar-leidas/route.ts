import { prisma } from "@/lib/prisma";
import {
    successResponse,
    handleApiError,
    requireAuth,
} from "@/lib/api-utils";

export const dynamic = "force-dynamic";

// POST /api/notificaciones/limpiar-leidas - Eliminar todas las notificaciones leídas
export async function POST() {
    try {
        const session = await requireAuth();

        const result = await prisma.notificacion.deleteMany({
            where: {
                usuarioId: session.user.id,
                leida: true,
            },
        });

        return successResponse({ count: result.count });
    } catch (error) {
        return handleApiError(error);
    }
}
