import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  handleApiError,
  requireRole,
} from "@/lib/api-utils";
import { asignarConserjeSchema } from "@/lib/validations";
import { sendEmail, emailTemplates } from "@/lib/mail";

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/incidencias/[id]/asignar - Asignar incidencia a conserje
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

    // Verificar acceso al edificio
    const tieneAcceso = session.user.edificios.some(
      (e) => e.id === incidencia.edificioId
    );
    if (!tieneAcceso && session.user.rol !== "ADMIN_PLATAFORMA") {
      return errorResponse("No tiene acceso a esta incidencia", 403);
    }

    // Solo se puede asignar si está pendiente o escalada
    if (!["PENDIENTE", "ESCALADA"].includes(incidencia.estado)) {
      return errorResponse(
        "Solo se pueden asignar incidencias pendientes o escaladas",
        400
      );
    }

    const { asignadoAId } = asignarConserjeSchema.parse(body);

    // Verificar que el conserje existe y tiene rol CONSERJE
    const conserje = await prisma.usuario.findFirst({
      where: {
        id: asignadoAId,
        rol: "CONSERJE",
        edificios: {
          some: { edificioId: incidencia.edificioId },
        },
      },
    });

    if (!conserje) {
      return errorResponse("Conserje no encontrado o no pertenece al edificio", 404);
    }

    const updated = await prisma.incidencia.update({
      where: { id },
      data: {
        asignadoAId,
        asignadoEl: new Date(),
        estado: "ASIGNADA",
      },
      include: {
        usuario: { select: { id: true, nombre: true } },
        asignadoA: { select: { id: true, nombre: true } },
      },
    });

    // Crear notificación para el conserje
    await prisma.notificacion.create({
      data: {
        usuarioId: asignadoAId,
        incidenciaId: updated.id,
        tipo: "ASIGNACION",
      },
    });

    // Enviar correo al conserje
    if (conserje.email) {
      const template = emailTemplates.incidenciaAsignada(updated.id, updated.descripcion);
      await sendEmail({
        to: conserje.email,
        subject: template.subject,
        html: template.html,
      });
    }

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
