import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  handleApiError,
  requireAuth,
  requireRole,
} from "@/lib/api-utils";
import { createEmpresaSchema } from "@/lib/validations";

// GET /api/empresas - Listar empresas
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const tipoServicio = searchParams.get("tipoServicio");

    const where: Record<string, unknown> = {};

    if (tipoServicio) {
      where.tiposServicio = {
        some: { tipoServicio },
      };
    }

    const empresas = await prisma.empresa.findMany({
      where,
      include: {
        tiposServicio: true,
        _count: {
          select: { visitas: true },
        },
      },
      orderBy: { nombre: "asc" },
    });

    return successResponse(
      empresas.map((e) => ({
        ...e,
        tiposServicio: e.tiposServicio.map((t) => t.tipoServicio),
      }))
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/empresas - Crear empresa (solo admin plataforma)
export async function POST(request: NextRequest) {
  try {
    await requireRole(["ADMIN_PLATAFORMA"]);
    const body = await request.json();

    const { tiposServicio, ...data } = createEmpresaSchema.parse(body);

    const empresa = await prisma.empresa.create({
      data: {
        ...data,
        tiposServicio: {
          create: tiposServicio.map((tipo) => ({ tipoServicio: tipo })),
        },
      },
      include: {
        tiposServicio: true,
      },
    });

    return successResponse(
      {
        ...empresa,
        tiposServicio: empresa.tiposServicio.map((t) => t.tipoServicio),
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
