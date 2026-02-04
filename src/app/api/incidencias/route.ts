import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  handleApiError,
  requireAuth,
} from "@/lib/api-utils";
import { createIncidenciaSchema } from "@/lib/validations";
import { sendEmail, emailTemplates } from "@/lib/mail";

// GET /api/incidencias - Listar incidencias
// Supports pagination with ?page=1&limit=50 (optional, defaults to all results for backward compatibility)
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);

    const edificioId = searchParams.get("edificioId");
    const tipoServicio = searchParams.get("tipoServicio");
    const estado = searchParams.get("estado");
    const prioridad = searchParams.get("prioridad");
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    if (!edificioId) {
      return errorResponse("edificioId es requerido", 400);
    }

    // Verificar acceso al edificio
    const tieneAcceso = session.user.edificios.some((e) => e.id === edificioId);
    if (!tieneAcceso && session.user.rol !== "ADMIN_PLATAFORMA") {
      return errorResponse("No tiene acceso a este edificio", 403);
    }

    const where: Record<string, unknown> = { edificioId };

    if (tipoServicio) where.tipoServicio = tipoServicio;
    if (estado) where.estado = estado;
    if (prioridad) where.prioridad = prioridad;

    // Residentes solo ven sus propias incidencias
    if (session.user.rol === "RESIDENTE") {
      where.usuarioId = session.user.id;
    }

    const includeOptions = {
      usuario: {
        select: { id: true, nombre: true, email: true },
      },
      visita: {
        select: {
          id: true,
          fechaProgramada: true,
          empresa: { select: { nombre: true } },
        },
      },
    };

    const orderByOptions = [
      { prioridad: "desc" as const },
      { createdAt: "desc" as const },
    ];

    // Check if pagination is requested
    if (pageParam || limitParam) {
      const page = Math.max(1, parseInt(pageParam || "1", 10));
      const limit = Math.min(100, Math.max(1, parseInt(limitParam || "50", 10)));
      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        prisma.incidencia.findMany({
          where,
          include: includeOptions,
          orderBy: orderByOptions,
          skip,
          take: limit,
        }),
        prisma.incidencia.count({ where }),
      ]);

      return successResponse({
        items,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
      });
    }

    // No pagination - return all results (backward compatible)
    const incidencias = await prisma.incidencia.findMany({
      where,
      include: includeOptions,
      orderBy: orderByOptions,
    });

    return successResponse(incidencias);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/incidencias - Crear incidencia
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const data = createIncidenciaSchema.parse(body);

    // Verificar acceso al edificio
    const tieneAcceso = session.user.edificios.some(
      (e) => e.id === data.edificioId
    );
    if (!tieneAcceso && session.user.rol !== "ADMIN_PLATAFORMA") {
      return errorResponse("No tiene acceso a este edificio", 403);
    }

    const incidencia = await prisma.incidencia.create({
      data: {
        ...data,
        usuarioId: session.user.id,
      },
      include: {
        usuario: {
          select: { id: true, nombre: true, email: true },
        },
      },
    });

    // Si es urgente, crear notificación para admins del edificio
    if (data.prioridad === "URGENTE") {
      const admins = await prisma.usuarioEdificio.findMany({
        where: {
          edificioId: data.edificioId,
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
            tipo: "URGENCIA",
          })),
        });

        // Enviar correos a los admins
        const adminsWithEmail = await prisma.usuario.findMany({
          where: {
            id: { in: admins.map((a) => a.usuarioId) },
          },
          select: { email: true },
        });

        const template = emailTemplates.nuevaIncidencia(incidencia.id, incidencia.descripcion);
        await Promise.all(
          adminsWithEmail.map((admin) =>
            sendEmail({
              to: admin.email!,
              subject: template.subject,
              html: template.html,
            })
          )
        );
      }
    }

    return successResponse(incidencia, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
