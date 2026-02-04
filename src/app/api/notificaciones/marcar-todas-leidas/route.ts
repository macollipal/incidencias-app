import { prisma } from "@/lib/prisma";
import {
    successResponse,
    handleApiError,
    requireAuth,
} from "@/lib/api-utils";

export const dynamic = "force-dynamic";

// POST /api/notificaciones/marcar-todas-leidas - Marcar todas como leídas
export async function POST() {
    try {
        const session = await requireAuth();

        const result = await prisma.notificacion.updateMany({
            where: {
                usuarioId: session.user.id,
                leida: false,
            },
            data: {
                leida: true,
            },
        });

        return successResponse({ count: result.count });
    } catch (error) {
        return handleApiError(error);
    }
}
