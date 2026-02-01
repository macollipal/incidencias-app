import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  handleApiError,
  requireAuth,
  requireRole,
} from "@/lib/api-utils";
import { createProductoSchema } from "@/lib/validations";

// GET /api/productos?edificioId=xxx&categoria=xxx&stockBajo=true
// Supports pagination with ?page=1&limit=25 (optional, defaults to all results for backward compatibility)
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const edificioId = searchParams.get("edificioId");
    const categoria = searchParams.get("categoria");
    const stockBajo = searchParams.get("stockBajo") === "true";
    const zonaId = searchParams.get("zonaId");
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    if (!edificioId) {
      return errorResponse("edificioId es requerido", 400);
    }

    const where: Record<string, unknown> = { edificioId };

    if (categoria) {
      where.categoria = categoria;
    }

    if (zonaId) {
      where.zonas = {
        some: { zonaId },
      };
    }

    const includeOptions = {
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
    };

    // Check if pagination is requested
    if (pageParam || limitParam) {
      const page = Math.max(1, parseInt(pageParam || "1", 10));
      const limit = Math.min(100, Math.max(1, parseInt(limitParam || "25", 10)));
      const skip = (page - 1) * limit;

      // For stockBajo filter, we need to filter after fetching
      // This is a trade-off for simplicity; for large datasets, consider a raw query
      if (stockBajo) {
        const allProducts = await prisma.producto.findMany({
          where,
          include: includeOptions,
          orderBy: { nombre: "asc" },
        });

        const filtered = allProducts.filter((p) => p.stockActual <= p.stockMinimo);
        const total = filtered.length;
        const items = filtered.slice(skip, skip + limit);

        return successResponse({
          items,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            hasMore: page * limit < total,
          },
        });
      }

      const [items, total] = await Promise.all([
        prisma.producto.findMany({
          where,
          include: includeOptions,
          orderBy: { nombre: "asc" },
          skip,
          take: limit,
        }),
        prisma.producto.count({ where }),
      ]);

      return successResponse({
        items,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
      });
    }

    // No pagination - return all results (backward compatible)
    const productos = await prisma.producto.findMany({
      where,
      include: includeOptions,
      orderBy: { nombre: "asc" },
    });

    // Filter for low stock if requested
    const result = stockBajo
      ? productos.filter((p) => p.stockActual <= p.stockMinimo)
      : productos;

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/productos
export async function POST(request: NextRequest) {
  try {
    await requireRole(["ADMIN_PLATAFORMA", "ADMIN_EDIFICIO"]);

    const body = await request.json();
    const { zonaIds, ...productData } = createProductoSchema.parse(body);

    const producto = await prisma.producto.create({
      data: {
        ...productData,
        proveedorUrl: productData.proveedorUrl || null,
        zonas: zonaIds?.length
          ? {
              create: zonaIds.map((zonaId) => ({ zonaId })),
            }
          : undefined,
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

    return successResponse(producto, 201);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return errorResponse("Ya existe un producto con ese nombre en este edificio", 400);
    }
    return handleApiError(error);
  }
}
