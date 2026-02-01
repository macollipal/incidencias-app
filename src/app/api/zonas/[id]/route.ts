import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  handleApiError,
  requireAuth,
  requireRole,
} from "@/lib/api-utils";
import { updateZonaSchema } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/zonas/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();

    const { id } = await params;

    const zona = await prisma.zonaEdificio.findUnique({
      where: { id },
      include: {
        edificio: true,
        productos: {
          include: {
            producto: true,
          },
        },
        _count: {
          select: {
            incidencias: true,
            productos: true,
          },
        },
      },
    });

    if (!zona) {
      return errorResponse("Zona no encontrada", 404);
    }

    return successResponse(zona);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/zonas/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN_PLATAFORMA", "ADMIN_EDIFICIO"]);

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateZonaSchema.parse(body);

    const zona = await prisma.zonaEdificio.update({
      where: { id },
      data: validatedData,
      include: {
        _count: {
          select: {
            incidencias: true,
            productos: true,
          },
        },
      },
    });

    return successResponse(zona);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/zonas/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN_PLATAFORMA", "ADMIN_EDIFICIO"]);

    const { id } = await params;

    await prisma.zonaEdificio.delete({
      where: { id },
    });

    return successResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
