
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  handleApiError,
  requireAuth,
} from "@/lib/api-utils";

export const dynamic = "force-dynamic";

// GET /api/notificaciones - Listar notificaciones del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const leidaParam = searchParams.get("leida");

    // Construir filtro
    const where: Record<string, unknown> = {
      usuarioId: session.user.id,
    };

    // Filtrar por leída/no leída si se especifica
    if (leidaParam !== null) {
      where.leida = leidaParam === "true";
    }

    const notificaciones = await prisma.notificacion.findMany({
      where,
      include: {
        incidencia: {
          select: {
            id: true,
            descripcion: true,
            tipoServicio: true,
            prioridad: true,
            estado: true,
            edificio: {
              select: { id: true, nombre: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(notificaciones);
  } catch (error) {
    return handleApiError(error);
  }
}
