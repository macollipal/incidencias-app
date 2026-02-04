import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  handleApiError,
  requireAuth,
  requireRole,
} from "@/lib/api-utils";
import { updateEmpresaSchema } from "@/lib/validations";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/empresas/[id] - Obtener empresa
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;

    const empresa = await prisma.empresa.findUnique({
      where: { id },
      include: {
        tiposServicio: true,
        visitas: {
          include: {
            edificio: { select: { nombre: true } },
            _count: { select: { incidencias: true } },
          },
          orderBy: { fechaProgramada: "desc" },
          take: 10,
        },
      },
    });

    if (!empresa) {
      return errorResponse("Empresa no encontrada", 404);
    }

    return successResponse({
      ...empresa,
      tiposServicio: empresa.tiposServicio.map((t) => t.tipoServicio),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/empresas/[id] - Actualizar empresa (solo admin plataforma)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN_PLATAFORMA"]);
    const { id } = await params;
    const body = await request.json();

    const empresa = await prisma.empresa.findUnique({ where: { id } });
    if (!empresa) {
      return errorResponse("Empresa no encontrada", 404);
    }

    const { tiposServicio, ...data } = updateEmpresaSchema.parse(body);

    // Actualizar empresa
    await prisma.empresa.update({
      where: { id },
      data,
    });

    // Si se enviaron tipos de servicio, actualizarlos
    if (tiposServicio) {
      // Eliminar tipos existentes
      await prisma.empresaTipoServicio.deleteMany({
        where: { empresaId: id },
      });
      // Crear nuevos
      await prisma.empresaTipoServicio.createMany({
        data: tiposServicio.map((tipo) => ({
          empresaId: id,
          tipoServicio: tipo,
        })),
      });
    }

    const result = await prisma.empresa.findUnique({
      where: { id },
      include: { tiposServicio: true },
    });

    return successResponse({
      ...result,
      tiposServicio: result?.tiposServicio.map((t) => t.tipoServicio) || [],
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/empresas/[id] - Eliminar empresa (solo admin plataforma)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN_PLATAFORMA"]);
    const { id } = await params;

    const empresa = await prisma.empresa.findUnique({ where: { id } });
    if (!empresa) {
      return errorResponse("Empresa no encontrada", 404);
    }

    await prisma.empresa.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
