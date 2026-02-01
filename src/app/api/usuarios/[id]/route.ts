import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  handleApiError,
  requireRole,
} from "@/lib/api-utils";
import { updateUsuarioSchema } from "@/lib/validations";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/usuarios/[id] - Obtener usuario
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN_PLATAFORMA", "ADMIN_EDIFICIO"]);
    const { id } = await params;

    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        createdAt: true,
        edificios: {
          include: {
            edificio: {
              select: { id: true, nombre: true },
            },
          },
        },
      },
    });

    if (!usuario) {
      return errorResponse("Usuario no encontrado", 404);
    }

    return successResponse({
      ...usuario,
      edificios: usuario.edificios.map((ue) => ue.edificio),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/usuarios/[id] - Actualizar usuario
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN_PLATAFORMA"]);
    const { id } = await params;
    const body = await request.json();

    const usuario = await prisma.usuario.findUnique({ where: { id } });
    if (!usuario) {
      return errorResponse("Usuario no encontrado", 404);
    }

    const { edificioIds, ...data } = updateUsuarioSchema.parse(body);

    // Actualizar usuario
    await prisma.usuario.update({
      where: { id },
      data,
    });

    // Si se enviaron edificios, actualizarlos
    if (edificioIds) {
      // Eliminar asignaciones existentes
      await prisma.usuarioEdificio.deleteMany({
        where: { usuarioId: id },
      });
      // Crear nuevas asignaciones
      await prisma.usuarioEdificio.createMany({
        data: edificioIds.map((edificioId) => ({
          usuarioId: id,
          edificioId,
        })),
      });
    }

    const result = await prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        createdAt: true,
        edificios: {
          include: {
            edificio: {
              select: { id: true, nombre: true },
            },
          },
        },
      },
    });

    return successResponse({
      ...result,
      edificios: result?.edificios.map((ue) => ue.edificio) || [],
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/usuarios/[id] - Eliminar usuario
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN_PLATAFORMA"]);
    const { id } = await params;

    const usuario = await prisma.usuario.findUnique({ where: { id } });
    if (!usuario) {
      return errorResponse("Usuario no encontrado", 404);
    }

    await prisma.usuario.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
