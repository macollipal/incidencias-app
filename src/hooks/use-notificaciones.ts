import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type Notificacion = {
    id: string;
    usuarioId: string;
    incidenciaId: string;
    tipo: string;
    leida: boolean;
    createdAt: string;
    incidencia: {
        id: string;
        descripcion: string;
        tipoServicio: string;
        prioridad: string;
        estado: string;
        edificio?: {
            id: string;
            nombre: string;
        };
    };
};

type NotificacionesResponse = {
    success: boolean;
    data: Notificacion[];
};

type NotificacionResponse = {
    success: boolean;
    data: Notificacion;
};

type DeleteResponse = {
    success: boolean;
    data: { deleted: boolean };
};

type MarcarTodasResponse = {
    success: boolean;
    data: { count: number };
};

// Hook para listar notificaciones
export function useNotificaciones(params?: { leida?: boolean }) {
    const queryParams = new URLSearchParams();
    if (params?.leida !== undefined) {
        queryParams.set("leida", String(params.leida));
    }

    return useQuery<Notificacion[]>({
        queryKey: ["notificaciones", params],
        queryFn: async () => {
            const url = `/api/notificaciones${queryParams.toString() ? `?${queryParams}` : ""}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("Error al cargar notificaciones");
            const json: NotificacionesResponse = await res.json();
            return json.data;
        },
        refetchInterval: 30000, // Refetch cada 30 segundos
    });
}

// Hook para obtener contador de notificaciones no leídas
export function useNotificacionesNoLeidas() {
    return useQuery<number>({
        queryKey: ["notificaciones-no-leidas"],
        queryFn: async () => {
            const res = await fetch("/api/notificaciones?leida=false");
            if (!res.ok) throw new Error("Error al cargar notificaciones");
            const json: NotificacionesResponse = await res.json();
            return json.data.length;
        },
        refetchInterval: 30000, // Refetch cada 30 segundos
    });
}

// Hook para marcar notificación como leída
export function useMarcarNotificacionLeida() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, leida }: { id: string; leida: boolean }) => {
            const res = await fetch(`/api/notificaciones/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ leida }),
            });
            if (!res.ok) throw new Error("Error al actualizar notificación");
            const json: NotificacionResponse = await res.json();
            return json.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notificaciones"] });
            queryClient.invalidateQueries({ queryKey: ["notificaciones-no-leidas"] });
        },
        onError: () => {
            toast.error("Error al actualizar notificación");
        },
    });
}

// Hook para marcar todas las notificaciones como leídas
export function useMarcarTodasLeidas() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/notificaciones/marcar-todas-leidas", {
                method: "POST",
            });
            if (!res.ok) throw new Error("Error al marcar todas como leídas");
            const json: MarcarTodasResponse = await res.json();
            return json.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["notificaciones"] });
            queryClient.invalidateQueries({ queryKey: ["notificaciones-no-leidas"] });
            toast.success(`${data.count} notificaciones marcadas como leídas`);
        },
        onError: () => {
            toast.error("Error al marcar todas como leídas");
        },
    });
}

// Hook para eliminar notificación
export function useEliminarNotificacion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/notificaciones/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Error al eliminar notificación");
            const json: DeleteResponse = await res.json();
            return json.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notificaciones"] });
            queryClient.invalidateQueries({ queryKey: ["notificaciones-no-leidas"] });
            toast.success("Notificación eliminada");
        },
        onError: () => {
            toast.error("Error al eliminar notificación");
        },
    });
}
// Hook para eliminar todas las notificaciones leídas
export function useLimpiarLeidas() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/notificaciones/limpiar-leidas", {
                method: "POST",
            });
            if (!res.ok) throw new Error("Error al limpiar notificaciones leídas");
            const json: MarcarTodasResponse = await res.json();
            return json.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["notificaciones"] });
            queryClient.invalidateQueries({ queryKey: ["notificaciones-no-leidas"] });
            toast.success(`${data.count} notificaciones eliminadas`);
        },
        onError: () => {
            toast.error("Error al limpiar notificaciones leídas");
        },
    });
}
