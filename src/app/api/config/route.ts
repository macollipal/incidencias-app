import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
    successResponse,
    errorResponse,
    handleApiError,
    requireRole,
} from "@/lib/api-utils";

// Claves que son públicas (se pueden leer sin ser admin, ej. para el tema)
const PUBLIC_CONFIG_KEYS = ["APP_NAME", "PRIMARY_COLOR", "THEME_MODE"];

// GET /api/config - Obtener configuraciones públicas
export async function GET() {
    try {
        const configs = await prisma.configuracion.findMany({
            where: {
                key: { in: PUBLIC_CONFIG_KEYS },
            },
        });

        // Convertir lista a objeto { key: value }
        const configMap = configs.reduce((acc, curr) => ({
            ...acc,
            [curr.key]: curr.value,
        }), {});

        return successResponse(configMap);
    } catch (error) {
        return handleApiError(error);
    }
}

// PATCH /api/config - Actualizar configuraciones (Solo ADMIN_PLATAFORMA)
export async function PATCH(request: NextRequest) {
    try {
        await requireRole(["ADMIN_PLATAFORMA"]);
        const body = await request.json();

        if (typeof body !== "object" || body === null) {
            return errorResponse("Cuerpo de solicitud inválido", 400);
        }

        // Actualizaciones en transacción
        const updates = Object.entries(body).map(([key, value]) => {
            return prisma.configuracion.upsert({
                where: { key: key.toUpperCase() },
                update: { value: String(value) },
                create: { key: key.toUpperCase(), value: String(value) },
            });
        });

        await prisma.$transaction(updates);

        return successResponse({ message: "Configuración actualizada correctamente" });
    } catch (error) {
        return handleApiError(error);
    }
}
