import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  handleApiError,
  requireAuth,
} from "@/lib/api-utils";

// GET /api/productos/recomendar?zonaId=xxx&tipoServicio=xxx
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const zonaId = searchParams.get("zonaId");
    const tipoServicio = searchParams.get("tipoServicio");
    const edificioId = searchParams.get("edificioId");

    if (!edificioId) {
      return errorResponse("edificioId es requerido", 400);
    }

    // Map tipoServicio to product categories
    const categoriaMap: Record<string, string[]> = {
      ELECTRICIDAD: ["ILUMINACION", "ELECTRICIDAD"],
      AGUA_GAS: ["PLOMERIA"],
      LIMPIEZA: ["LIMPIEZA"],
      SEGURIDAD: ["SEGURIDAD"],
      INFRAESTRUCTURA: ["FERRETERIA", "ELECTRICIDAD"],
      AREAS_COMUNES: ["LIMPIEZA", "ILUMINACION"],
    };

    const where: Record<string, unknown> = { edificioId };

    // Filter by zone if provided
    if (zonaId) {
      where.zonas = {
        some: { zonaId },
      };
    }

    // Filter by related categories if tipoServicio is provided
    if (tipoServicio && categoriaMap[tipoServicio]) {
      where.categoria = {
        in: categoriaMap[tipoServicio],
      };
    }

    const productos = await prisma.producto.findMany({
      where,
      include: {
        zonas: {
          include: {
            zona: true,
          },
        },
      },
      orderBy: [
        { stockActual: "desc" },
        { nombre: "asc" },
      ],
    });

    // Add stock status to each product
    const result = productos.map((p) => ({
      ...p,
      stockStatus:
        p.stockActual === 0
          ? "SIN_STOCK"
          : p.stockActual <= p.stockMinimo
          ? "STOCK_BAJO"
          : "DISPONIBLE",
      disponible: p.stockActual > 0,
    }));

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
