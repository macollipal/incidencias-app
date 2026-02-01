import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  handleApiError,
  requireAuth,
  requireRole,
} from "@/lib/api-utils";
import { updateProductoSchema } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/productos/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();

    const { id } = await params;

    const producto = await prisma.producto.findUnique({
      where: { id },
      include: {
        edificio: true,
        zonas: {
          include: {
            zona: true,
          },
        },
        movimientos: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            incidencia: true,
          },
        },
        _count: {
          select: {
            movimientos: true,
          },
        },
      },
    });

    if (!producto) {
      return errorResponse("Producto no encontrado", 404);
    }

    return successResponse(producto);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/productos/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN_PLATAFORMA", "ADMIN_EDIFICIO"]);

    const { id } = await params;
    const body = await request.json();
    const { zonaIds, ...updateData } = updateProductoSchema.parse(body);

    // Update product and zones in a transaction
    const producto = await prisma.$transaction(async (tx) => {
      // Update zones if provided
      if (zonaIds !== undefined) {
        await tx.productoZona.deleteMany({
          where: { productoId: id },
        });

        if (zonaIds.length > 0) {
          await tx.productoZona.createMany({
            data: zonaIds.map((zonaId) => ({
              productoId: id,
              zonaId,
            })),
          });
        }
      }

      return tx.producto.update({
        where: { id },
        data: {
          ...updateData,
          proveedorUrl: updateData.proveedorUrl === "" ? null : updateData.proveedorUrl,
        },
        include: {
          zonas: {
            include: {
              zona: true,
            },
          },
          _count: {
            select: {
              movimientos: true,
            },
          },
        },
      });
    });

    return successResponse(producto);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/productos/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN_PLATAFORMA", "ADMIN_EDIFICIO"]);

    const { id } = await params;

    await prisma.producto.delete({
      where: { id },
    });

    return successResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
