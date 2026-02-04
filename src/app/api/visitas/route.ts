import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  handleApiError,
  requireAuth,
  requireRole,
} from "@/lib/api-utils";
import { createVisitaSchema } from "@/lib/validations";
import { sendEmail, emailTemplates } from "@/lib/mail";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// GET /api/visitas - Listar visitas
// Supports pagination with ?page=1&limit=25 (optional, defaults to all results for backward compatibility)
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);

    const edificioId = searchParams.get("edificioId");
    const estado = searchParams.get("estado");
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");
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

    if (estado) where.estado = estado;
    if (desde || hasta) {
      where.fechaProgramada = {};
      if (desde) (where.fechaProgramada as Record<string, Date>).gte = new Date(desde);
      if (hasta) (where.fechaProgramada as Record<string, Date>).lte = new Date(hasta);
    }

    const includeOptions = {
      empresa: {
        select: { id: true, nombre: true, telefono: true, email: true },
      },
      incidencias: {
        select: {
          id: true,
          descripcion: true,
          tipoServicio: true,
          prioridad: true,
          estado: true,
        },
      },
    };

    // Check if pagination is requested
    if (pageParam || limitParam) {
      const page = Math.max(1, parseInt(pageParam || "1", 10));
      const limit = Math.min(100, Math.max(1, parseInt(limitParam || "25", 10)));
      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        prisma.visita.findMany({
          where,
          include: includeOptions,
          orderBy: { fechaProgramada: "asc" },
          skip,
          take: limit,
        }),
        prisma.visita.count({ where }),
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
    const visitas = await prisma.visita.findMany({
      where,
      include: includeOptions,
      orderBy: { fechaProgramada: "asc" },
    });

    return successResponse(visitas);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/visitas - Crear visita (solo admins)
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["ADMIN_PLATAFORMA", "ADMIN_EDIFICIO"]);
    const body = await request.json();

    const { incidenciaIds, ...data } = createVisitaSchema.parse(body);

    // Verificar acceso al edificio
    const tieneAcceso = session.user.edificios.some(
      (e) => e.id === data.edificioId
    );
    if (!tieneAcceso && session.user.rol !== "ADMIN_PLATAFORMA") {
      return errorResponse("No tiene acceso a este edificio", 403);
    }

    // Verificar que la empresa tenga el tipo de servicio adecuado si hay incidencias
    if (incidenciaIds && incidenciaIds.length > 0) {
      const incidencias = await prisma.incidencia.findMany({
        where: { id: { in: incidenciaIds } },
        select: { tipoServicio: true },
      });

      const tiposRequeridos = [...new Set(incidencias.map((i) => i.tipoServicio))];

      const empresa = await prisma.empresa.findUnique({
        where: { id: data.empresaId },
        include: { tiposServicio: true },
      });

      const tiposEmpresa = empresa?.tiposServicio.map((t) => t.tipoServicio) || [];

      const tiposFaltantes = tiposRequeridos.filter(
        (t) => !tiposEmpresa.includes(t)
      );

      if (tiposFaltantes.length > 0) {
        return errorResponse(
          `La empresa no atiende los siguientes tipos de servicio: ${tiposFaltantes.join(", ")}`,
          400
        );
      }
    }

    const visita = await prisma.visita.create({
      data: {
        ...data,
        fechaProgramada: new Date(data.fechaProgramada),
      },
      include: {
        empresa: { select: { id: true, nombre: true } },
      },
    });

    // Asignar incidencias a la visita
    if (incidenciaIds && incidenciaIds.length > 0) {
      await prisma.incidencia.updateMany({
        where: { id: { in: incidenciaIds } },
        data: {
          visitaId: visita.id,
          estado: "PROGRAMADA",
        },
      });
    }

    const result = await prisma.visita.findUnique({
      where: { id: visita.id },
      include: {
        empresa: { select: { id: true, nombre: true } },
        incidencias: {
          select: {
            id: true,
            descripcion: true,
            tipoServicio: true,
            usuario: { select: { email: true } },
            asignadoA: { select: { email: true } },
          },
        },
      },
    });

    // --- Notificaciones por Email ---
    if (result && result.incidencias.length > 0) {
      const fechaFormateada = format(new Date(result.fechaProgramada), "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es });

      const emailTasks = result.incidencias.flatMap((inc) => {
        const tasks = [];
        const template = emailTemplates.visitaProgramada(inc.id, fechaFormateada, result.empresa.nombre);

        // Notificar al residente
        if (inc.usuario.email) {
          tasks.push(sendEmail({
            to: inc.usuario.email,
            subject: template.subject,
            html: template.html,
          }));
        }

        // Notificar al conserje si hay uno asignado
        if (inc.asignadoA?.email) {
          tasks.push(sendEmail({
            to: inc.asignadoA.email,
            subject: template.subject,
            html: template.html,
          }));
        }

        return tasks;
      });

      // No esperamos al envío de correos para responder al cliente
      Promise.all(emailTasks).catch(err => console.error("Error enviando correos de visita:", err));
    }

    return successResponse(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
