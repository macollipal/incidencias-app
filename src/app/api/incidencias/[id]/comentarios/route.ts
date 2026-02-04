import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  handleApiError,
  requireAuth,
} from "@/lib/api-utils";
import { createComentarioSchema } from "@/lib/validations";
import { sendEmail, emailTemplates } from "@/lib/mail";

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
      select: {
        id: true,
        edificioId: true,
        usuarioId: true,
        asignadoAId: true,
        estado: true,
        descripcion: true
      },
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

    // --- Lógica de Notificaciones ---
    const targets = new Set<string>();

    // 1. Notificar al creador de la incidencia si no es el autor del comentario
    if (incidencia.usuarioId !== session.user.id) {
      targets.add(incidencia.usuarioId);
    }

    // 2. Notificar al conserje asignado si no es el autor
    if (incidencia.asignadoAId && incidencia.asignadoAId !== session.user.id) {
      targets.add(incidencia.asignadoAId);
    }

    // 3. Si un residente comenta, notificar a los admins del edificio
    if (session.user.rol === "RESIDENTE") {
      const admins = await prisma.usuarioEdificio.findMany({
        where: {
          edificioId: incidencia.edificioId,
          usuario: {
            rol: { in: ["ADMIN_PLATAFORMA", "ADMIN_EDIFICIO"] },
          },
        },
        select: { usuarioId: true },
      });
      admins.forEach((a) => targets.add(a.usuarioId));
    }

    if (targets.size > 0) {
      const targetIds = Array.from(targets);

      // Crear notificaciones en DB
      await prisma.notificacion.createMany({
        data: targetIds.map((userId) => ({
          usuarioId: userId,
          incidenciaId: id,
          tipo: "COMENTARIO",
        })),
      });

      // Enviar correos
      const usersWithEmail = await prisma.usuario.findMany({
        where: { id: { in: targetIds } },
        select: { email: true },
      });

      const template = emailTemplates.nuevoComentario(incidencia.id, incidencia.descripcion, contenido);
      await Promise.all(
        usersWithEmail.map((u) =>
          sendEmail({
            to: u.email,
            subject: template.subject,
            html: template.html,
          })
        )
      );
    }

    return successResponse(comentario, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
