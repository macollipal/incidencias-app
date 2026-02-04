import { prisma } from "@/lib/prisma";
import {
    successResponse,
    handleApiError,
    requireRole,
} from "@/lib/api-utils";

// GET /api/config/admin - Obtener todas las configuraciones (ADMIN_PLATAFORMA)
export async function GET() {
    try {
        await requireRole(["ADMIN_PLATAFORMA"]);

        const configs = await prisma.configuracion.findMany();

        // Convertir a objeto { key: value }
        const configMap = configs.reduce((acc, curr) => ({
            ...acc,
            [curr.key]: curr.value,
        }), {});

        // Enmascarar keys sensibles para la UI (aunque sea admin, es buena práctica)
        const sensitiveKeys = ["RESEND_API_KEY", "DATABASE_URL"];
        const maskedMap = { ...configMap } as Record<string, string>;

        sensitiveKeys.forEach(key => {
            if (maskedMap[key]) {
                maskedMap[key] = "************" + maskedMap[key].slice(-4);
            }
        });

        return successResponse({
            configs: configMap, // El mapa real (usar con precaución en el form)
            masked: maskedMap,  // El mapa enmascarado para visualización
            env: {
                isProd: process.env.NODE_ENV === "production",
                dbSource: process.env.DATABASE_URL?.includes("neon.tech") ? "Neon (Cloud)" : "Local/Otro",
            }
        });
    } catch (error) {
        return handleApiError(error);
    }
}
