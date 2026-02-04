import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  handleApiError,
  requireRole,
} from "@/lib/api-utils";
import { rechazarIncidenciaSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/incidencias/[id]/rechazar - Admin rechaza incidencia
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(["ADMIN_PLATAFORMA", "ADMIN_EDIFICIO"]);
    const { id } = await params;
    const body = await request.json();

    const incidencia = await prisma.incidencia.findUnique({
      where: { id },
    });

    if (!incidencia) {
      return errorResponse("Incidencia no encontrada", 404);
    }

    // Validar transición de estado: solo desde PENDIENTE
    if (incidencia.estado !== "PENDIENTE") {
      return errorResponse(
        "Solo se pueden rechazar incidencias en estado PENDIENTE",
        400
      );
    }

    // Validar que el admin tenga acceso al edificio
    if (session.user.rol === "ADMIN_EDIFICIO") {
      const tieneAcceso = await prisma.usuarioEdificio.findFirst({
        where: {
          usuarioId: session.user.id,
          edificioId: incidencia.edificioId,
        },
      });

      if (!tieneAcceso) {
        return errorResponse("No tiene acceso a este edificio", 403);
      }
    }

    const { motivoRechazo } = rechazarIncidenciaSchema.parse(body);

    const updated = await prisma.incidencia.update({
      where: { id },
      data: {
        estado: "RECHAZADA",
        rechazadaEl: new Date(),
        motivoRechazo,
        closedAt: new Date(),
      },
      include: {
        usuario: { select: { id: true, nombre: true } },
        edificio: { select: { id: true, nombre: true } },
      },
    });

    // Crear comentario automático de rechazo (evento de auditoría)
    await prisma.comentarioIncidencia.create({
      data: {
        incidenciaId: id,
        usuarioId: session.user.id,
        contenido: `Incidencia rechazada. Motivo: ${motivoRechazo}`,
      },
    });

    // Notificar al residente que reportó la incidencia
    await prisma.notificacion.create({
      data: {
        usuarioId: incidencia.usuarioId,
        incidenciaId: incidencia.id,
        tipo: "RECHAZO",
      },
    });

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
