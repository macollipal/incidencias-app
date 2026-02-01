import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  handleApiError,
  requireRole,
} from "@/lib/api-utils";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/edificios/[id]/conserjes - Obtener conserjes del edificio
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(["ADMIN_PLATAFORMA", "ADMIN_EDIFICIO"]);
    const { id } = await params;

    // Verificar acceso al edificio
    const tieneAcceso = session.user.edificios.some((e) => e.id === id);
    if (!tieneAcceso && session.user.rol !== "ADMIN_PLATAFORMA") {
      return errorResponse("No tiene acceso a este edificio", 403);
    }

    const conserjes = await prisma.usuario.findMany({
      where: {
        rol: "CONSERJE",
        edificios: {
          some: { edificioId: id },
        },
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        _count: {
          select: {
            incidenciasAsignadas: {
              where: {
                estado: "ASIGNADA",
              },
            },
          },
        },
      },
    });

    return successResponse(
      conserjes.map((c) => ({
        id: c.id,
        nombre: c.nombre,
        email: c.email,
        incidenciasActivas: c._count.incidenciasAsignadas,
      }))
    );
  } catch (error) {
    return handleApiError(error);
  }
}
