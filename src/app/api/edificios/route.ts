import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  handleApiError,
  requireAuth,
  requireRole,
} from "@/lib/api-utils";
import { createEdificioSchema } from "@/lib/validations";

// GET /api/edificios - Listar edificios
export async function GET() {
  try {
    const session = await requireAuth();

    let edificios;

    if (session.user.rol === "ADMIN_PLATAFORMA") {
      // Admin de plataforma ve todos los edificios
      edificios = await prisma.edificio.findMany({
        include: {
          _count: {
            select: {
              incidencias: true,
              usuarios: true,
            },
          },
        },
        orderBy: { nombre: "asc" },
      });
    } else {
      // Otros usuarios ven solo sus edificios asignados
      const edificioIds = session.user.edificios.map((e) => e.id);
      edificios = await prisma.edificio.findMany({
        where: { id: { in: edificioIds } },
        include: {
          _count: {
            select: {
              incidencias: true,
              usuarios: true,
            },
          },
        },
        orderBy: { nombre: "asc" },
      });
    }

    // Agregar conteo de urgentes
    const edificiosConStats = await Promise.all(
      edificios.map(async (edificio) => {
        const urgentes = await prisma.incidencia.count({
          where: {
            edificioId: edificio.id,
            prioridad: "URGENTE",
            estado: { notIn: ["CERRADA", "RESUELTA"] },
          },
        });
        return {
          ...edificio,
          urgentes,
        };
      })
    );

    return successResponse(edificiosConStats);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/edificios - Crear edificio (solo admin plataforma)
export async function POST(request: NextRequest) {
  try {
    await requireRole(["ADMIN_PLATAFORMA"]);
    const body = await request.json();

    const data = createEdificioSchema.parse(body);

    const edificio = await prisma.edificio.create({
      data,
    });

    return successResponse(edificio, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
