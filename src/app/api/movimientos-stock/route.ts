import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  handleApiError,
  requireAuth,
} from "@/lib/api-utils";
import { createMovimientoStockSchema } from "@/lib/validations";

// GET /api/movimientos-stock?productoId=xxx&edificioId=xxx
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const productoId = searchParams.get("productoId");
    const edificioId = searchParams.get("edificioId");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = {};

    if (productoId) {
      where.productoId = productoId;
    }

    if (edificioId) {
      where.producto = {
        edificioId,
      };
    }

    const movimientos = await prisma.movimientoStock.findMany({
      where,
      include: {
        producto: true,
        incidencia: {
          select: {
            id: true,
            descripcion: true,
            estado: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return successResponse(movimientos);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/movimientos-stock
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const validatedData = createMovimientoStockSchema.parse(body);

    const producto = await prisma.producto.findUnique({
      where: { id: validatedData.productoId },
    });

    if (!producto) {
      return errorResponse("Producto no encontrado", 404);
    }

    let stockNuevo: number;
    const stockAnterior = producto.stockActual;

    switch (validatedData.tipo) {
      case "ENTRADA":
        stockNuevo = stockAnterior + validatedData.cantidad;
        break;
      case "SALIDA":
        if (stockAnterior < validatedData.cantidad) {
          return errorResponse("Stock insuficiente", 400);
        }
        stockNuevo = stockAnterior - validatedData.cantidad;
        break;
      case "AJUSTE":
        stockNuevo = validatedData.cantidad;
        break;
      default:
        return errorResponse("Tipo de movimiento inválido", 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const movimiento = await tx.movimientoStock.create({
        data: {
          productoId: validatedData.productoId,
          incidenciaId: validatedData.incidenciaId || null,
          tipo: validatedData.tipo,
          cantidad: validatedData.cantidad,
          stockAnterior,
          stockNuevo,
          notas: validatedData.notas,
        },
        include: {
          producto: true,
          incidencia: {
            select: {
              id: true,
              descripcion: true,
              estado: true,
            },
          },
        },
      });

      await tx.producto.update({
        where: { id: validatedData.productoId },
        data: { stockActual: stockNuevo },
      });

      return movimiento;
    });

    return successResponse(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
