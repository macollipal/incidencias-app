import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  handleApiError,
  requireAuth,
  requireRole,
} from "@/lib/api-utils";
import { createZonaSchema } from "@/lib/validations";

// GET /api/zonas?edificioId=xxx
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const edificioId = searchParams.get("edificioId");

    if (!edificioId) {
      return errorResponse("edificioId es requerido", 400);
    }

    const zonas = await prisma.zonaEdificio.findMany({
      where: { edificioId },
      include: {
        _count: {
          select: {
            incidencias: true,
            productos: true,
          },
        },
      },
      orderBy: { nombre: "asc" },
    });

    return successResponse(zonas);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/zonas
export async function POST(request: NextRequest) {
  try {
    await requireRole(["ADMIN_PLATAFORMA", "ADMIN_EDIFICIO"]);

    const body = await request.json();
    const validatedData = createZonaSchema.parse(body);

    const zona = await prisma.zonaEdificio.create({
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

    return successResponse(zona, 201);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return errorResponse("Ya existe una zona con ese nombre en este edificio", 400);
    }
    return handleApiError(error);
  }
}
