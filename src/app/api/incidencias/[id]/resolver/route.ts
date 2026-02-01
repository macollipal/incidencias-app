import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  handleApiError,
  requireRole,
} from "@/lib/api-utils";
import { resolverConserjeSchema } from "@/lib/validations";

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/incidencias/[id]/resolver - Conserje resuelve incidencia
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(["CONSERJE"]);
    const { id } = await params;
    const body = await request.json();

    const incidencia = await prisma.incidencia.findUnique({
      where: { id },
    });

    if (!incidencia) {
      return errorResponse("Incidencia no encontrada", 404);
    }

    // Verificar que está asignada a este conserje
    if (incidencia.asignadoAId !== session.user.id) {
      return errorResponse("Esta incidencia no está asignada a usted", 403);
    }

    // Solo se puede resolver si está asignada
    if (incidencia.estado !== "ASIGNADA") {
      return errorResponse("Solo se pueden resolver incidencias asignadas", 400);
    }

    const { descripcionVerificada, comentarioCierre } = resolverConserjeSchema.parse(body);

    const updated = await prisma.incidencia.update({
      where: { id },
      data: {
        estado: "RESUELTA",
        verificadoEl: new Date(),
        descripcionVerificada: descripcionVerificada || incidencia.descripcion,
        tipoResolucion: "CONSERJE",
        comentarioCierre,
        closedAt: new Date(),
      },
      include: {
        usuario: { select: { id: true, nombre: true } },
        asignadoA: { select: { id: true, nombre: true } },
      },
    });

    // Crear comentario automático de cierre
    await prisma.comentarioIncidencia.create({
      data: {
        incidenciaId: id,
        usuarioId: session.user.id,
        contenido: `Incidencia resuelta por conserje: ${comentarioCierre}`,
      },
    });

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
