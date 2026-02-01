import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
  successResponse,
  errorResponse,
  handleApiError,
  requireRole,
} from "@/lib/api-utils";
import { createUsuarioSchema } from "@/lib/validations";

// GET /api/usuarios - Listar usuarios
export async function GET() {
  try {
    await requireRole(["ADMIN_PLATAFORMA", "ADMIN_EDIFICIO"]);

    const usuarios = await prisma.usuario.findMany({
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
      orderBy: { nombre: "asc" },
    });

    return successResponse(
      usuarios.map((u) => ({
        ...u,
        edificios: u.edificios.map((ue) => ue.edificio),
      }))
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/usuarios - Crear usuario
export async function POST(request: NextRequest) {
  try {
    await requireRole(["ADMIN_PLATAFORMA"]);
    const body = await request.json();

    const { edificioIds, password, ...data } = createUsuarioSchema.parse(body);

    // Verificar que el email no exista
    const existingUser = await prisma.usuario.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return errorResponse("El email ya está registrado", 400);
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    const usuario = await prisma.usuario.create({
      data: {
        ...data,
        passwordHash,
        edificios: {
          create: edificioIds.map((edificioId) => ({ edificioId })),
        },
      },
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

    return successResponse(
      {
        ...usuario,
        edificios: usuario.edificios.map((ue) => ue.edificio),
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
