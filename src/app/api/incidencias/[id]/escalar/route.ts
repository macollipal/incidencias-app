import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  handleApiError,
  requireRole,
} from "@/lib/api-utils";
import { escalarIncidenciaSchema } from "@/lib/validations";
import { sendEmail, emailTemplates } from "@/lib/mail";

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/incidencias/[id]/escalar - Conserje escala incidencia a admin
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

    // Solo se puede escalar si está asignada
    if (incidencia.estado !== "ASIGNADA") {
      return errorResponse("Solo se pueden escalar incidencias asignadas", 400);
    }

    const { descripcionVerificada, prioridad } = escalarIncidenciaSchema.parse(body);

    const updated = await prisma.incidencia.update({
      where: { id },
      data: {
        estado: "ESCALADA",
        verificadoEl: new Date(),
        descripcionVerificada,
        escaladaEl: new Date(),
        prioridad: prioridad || incidencia.prioridad,
      },
      include: {
        usuario: { select: { id: true, nombre: true } },
        asignadoA: { select: { id: true, nombre: true } },
      },
    });

    // Crear comentario automático de escalamiento
    await prisma.comentarioIncidencia.create({
      data: {
        incidenciaId: id,
        usuarioId: session.user.id,
        contenido: `Incidencia escalada a administrador. Verificación: ${descripcionVerificada}`,
      },
    });

    // Notificar a admins del edificio
    const admins = await prisma.usuarioEdificio.findMany({
      where: {
        edificioId: incidencia.edificioId,
        usuario: {
          rol: { in: ["ADMIN_PLATAFORMA", "ADMIN_EDIFICIO"] },
        },
      },
      select: { usuarioId: true },
    });

    if (admins.length > 0) {
      await prisma.notificacion.createMany({
        data: admins.map((admin) => ({
          usuarioId: admin.usuarioId,
          incidenciaId: incidencia.id,
          tipo: prioridad === "URGENTE" ? "URGENCIA" : "RECORDATORIO",
        })),
      });

      // Enviar correos a los admins
      const adminsWithEmail = await prisma.usuario.findMany({
        where: {
          id: { in: admins.map((a) => a.usuarioId) },
        },
        select: { email: true },
      });

      const template = emailTemplates.incidenciaEscalada(incidencia.id, incidencia.descripcion);
      await Promise.all(
        adminsWithEmail.map((admin) =>
          sendEmail({
            to: admin.email,
            subject: template.subject,
            html: template.html,
          })
        )
      );
    }

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
