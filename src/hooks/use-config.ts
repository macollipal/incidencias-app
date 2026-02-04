import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface SystemConfig {
    APP_NAME?: string;
    PRIMARY_COLOR?: string;
    THEME_MODE?: string;
    RESEND_API_KEY?: string;
    [key: string]: string | undefined;
}

export interface AdminConfigResponse {
    configs: SystemConfig;
    masked: Record<string, string>;
    env: {
        isProd: boolean;
        dbSource: string;
    };
}

// Hook para configuraciones públicas
export function usePublicConfig() {
    return useQuery<Record<string, string>>({
        queryKey: ["system-config", "public"],
        queryFn: async () => {
            const res = await fetch("/api/config");
            if (!res.ok) throw new Error("Error cargando configuración");
            return res.json();
        },
        staleTime: 1000 * 60 * 5, // 5 minutos
    });
}

// Hook para configuraciones de admin
export function useAdminConfig() {
    return useQuery<AdminConfigResponse>({
        queryKey: ["system-config", "admin"],
        queryFn: async () => {
            const res = await fetch("/api/config/admin");
            if (!res.ok) throw new Error("No tiene permisos para ver esta configuración");
            return res.json();
        },
    });
}

// Hook para actualizar configuraciones
export function useUpdateConfig() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Record<string, string>) => {
            const res = await fetch("/api/config", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Error al actualizar configuración");
            }

            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["system-config"] });
            toast.success("Configuración actualizada correctamente");
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });
}
