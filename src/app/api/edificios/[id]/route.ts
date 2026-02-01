import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  handleApiError,
  requireAuth,
  requireRole,
} from "@/lib/api-utils";
import { updateEdificioSchema } from "@/lib/validations";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/edificios/[id] - Obtener edificio
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const edificio = await prisma.edificio.findUnique({
      where: { id },
      include: {
        usuarios: {
          include: {
            usuario: {
              select: { id: true, nombre: true, email: true, rol: true },
            },
          },
        },
        _count: {
          select: {
            incidencias: true,
            visitas: true,
          },
        },
      },
    });

    if (!edificio) {
      return errorResponse("Edificio no encontrado", 404);
    }

    // Verificar acceso
    const tieneAcceso = session.user.edificios.some((e) => e.id === id);
    if (!tieneAcceso && session.user.rol !== "ADMIN_PLATAFORMA") {
      return errorResponse("No tiene acceso a este edificio", 403);
    }

    return successResponse(edificio);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/edificios/[id] - Actualizar edificio (solo admin plataforma)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN_PLATAFORMA"]);
    const { id } = await params;
    const body = await request.json();

    const edificio = await prisma.edificio.findUnique({ where: { id } });
    if (!edificio) {
      return errorResponse("Edificio no encontrado", 404);
    }

    const data = updateEdificioSchema.parse(body);

    const updated = await prisma.edificio.update({
      where: { id },
      data,
    });

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/edificios/[id] - Eliminar edificio (solo admin plataforma)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN_PLATAFORMA"]);
    const { id } = await params;

    const edificio = await prisma.edificio.findUnique({ where: { id } });
    if (!edificio) {
      return errorResponse("Edificio no encontrado", 404);
    }

    await prisma.edificio.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
