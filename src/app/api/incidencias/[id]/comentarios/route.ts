import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  handleApiError,
  requireAuth,
} from "@/lib/api-utils";
import { createComentarioSchema } from "@/lib/validations";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/incidencias/[id]/comentarios - Obtener comentarios
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const incidencia = await prisma.incidencia.findUnique({
      where: { id },
      select: { edificioId: true, usuarioId: true },
    });

    if (!incidencia) {
      return errorResponse("Incidencia no encontrada", 404);
    }

    // Verificar acceso
    const tieneAcceso = session.user.edificios.some(
      (e) => e.id === incidencia.edificioId
    );
    if (!tieneAcceso && session.user.rol !== "ADMIN_PLATAFORMA") {
      return errorResponse("No tiene acceso a esta incidencia", 403);
    }

    // Residentes solo ven comentarios de sus propias incidencias
    if (
      session.user.rol === "RESIDENTE" &&
      incidencia.usuarioId !== session.user.id
    ) {
      return errorResponse("No tiene acceso a esta incidencia", 403);
    }

    const comentarios = await prisma.comentarioIncidencia.findMany({
      where: { incidenciaId: id },
      include: {
        usuario: {
          select: { id: true, nombre: true, rol: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return successResponse(comentarios);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/incidencias/[id]/comentarios - Agregar comentario
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const incidencia = await prisma.incidencia.findUnique({
      where: { id },
      select: { edificioId: true, usuarioId: true, estado: true },
    });

    if (!incidencia) {
      return errorResponse("Incidencia no encontrada", 404);
    }

    // Verificar acceso
    const tieneAcceso = session.user.edificios.some(
      (e) => e.id === incidencia.edificioId
    );
    if (!tieneAcceso && session.user.rol !== "ADMIN_PLATAFORMA") {
      return errorResponse("No tiene acceso a esta incidencia", 403);
    }

    // Residentes solo pueden comentar sus propias incidencias
    if (
      session.user.rol === "RESIDENTE" &&
      incidencia.usuarioId !== session.user.id
    ) {
      return errorResponse("No tiene acceso a esta incidencia", 403);
    }

    // No se puede comentar incidencias cerradas
    if (incidencia.estado === "CERRADA") {
      return errorResponse("No se puede comentar una incidencia cerrada", 400);
    }

    const { contenido } = createComentarioSchema.parse(body);

    const comentario = await prisma.comentarioIncidencia.create({
      data: {
        incidenciaId: id,
        usuarioId: session.user.id,
        contenido,
      },
      include: {
        usuario: {
          select: { id: true, nombre: true, rol: true },
        },
      },
    });

    return successResponse(comentario, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
