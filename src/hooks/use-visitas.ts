import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateVisitaInput, UpdateVisitaInput } from "@/lib/validations";
import { PaginatedResponse } from "@/types";

interface Visita {
  id: string;
  edificioId: string;
  empresaId: string;
  fechaProgramada: string;
  notas: string | null;
  estado: string;
  createdAt: string;
  updatedAt: string;
  empresa: {
    id: string;
    nombre: string;
    telefono?: string;
    email?: string;
  };
  incidencias: Array<{
    id: string;
    descripcion: string;
    tipoServicio: string;
    prioridad?: string;
    estado?: string;
  }>;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const json: ApiResponse<T> = await res.json();

  if (!json.success) {
    throw new Error(json.error || "Error en la solicitud");
  }

  return json.data as T;
}

export function useVisitas(
  edificioId: string | null,
  filters?: {
    estado?: string;
    desde?: string;
    hasta?: string;
  }
) {
  return useQuery({
    queryKey: ["visitas", edificioId, filters],
    queryFn: () => {
      if (!edificioId) return [];

      const params = new URLSearchParams({ edificioId });
      if (filters?.estado) params.set("estado", filters.estado);
      if (filters?.desde) params.set("desde", filters.desde);
      if (filters?.hasta) params.set("hasta", filters.hasta);

      return fetchApi<Visita[]>(`/api/visitas?${params}`);
    },
    enabled: !!edificioId,
  });
}

export interface VisitasPaginatedOptions {
  page?: number;
  limit?: number;
  filters?: {
    estado?: string;
    desde?: string;
    hasta?: string;
  };
}

export function useVisitasPaginated(
  edificioId: string | null,
  options: VisitasPaginatedOptions = {}
) {
  const { page = 1, limit = 25, filters = {} } = options;

  return useQuery({
    queryKey: ["visitas", "paginated", edificioId, page, limit, filters],
    queryFn: () => {
      if (!edificioId) {
        return {
          items: [],
          pagination: { page: 1, limit, total: 0, pages: 0, hasMore: false },
        };
      }

      const params = new URLSearchParams({
        edificioId,
        page: page.toString(),
        limit: limit.toString(),
      });
      if (filters.estado) params.set("estado", filters.estado);
      if (filters.desde) params.set("desde", filters.desde);
      if (filters.hasta) params.set("hasta", filters.hasta);

      return fetchApi<PaginatedResponse<Visita>>(`/api/visitas?${params}`);
    },
    enabled: !!edificioId,
  });
}

export function useVisita(id: string | null) {
  return useQuery({
    queryKey: ["visita", id],
    queryFn: () => fetchApi<Visita>(`/api/visitas/${id}`),
    enabled: !!id,
  });
}

export function useCreateVisita() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateVisitaInput) =>
      fetchApi<Visita>("/api/visitas", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["visitas", variables.edificioId],
      });
      queryClient.invalidateQueries({
        queryKey: ["incidencias", variables.edificioId],
      });
      queryClient.invalidateQueries({
        queryKey: ["edificio-stats", variables.edificioId],
      });
    },
  });
}

export function useUpdateVisita() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVisitaInput }) =>
      fetchApi<Visita>(`/api/visitas/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["visitas", data.edificioId],
      });
      queryClient.invalidateQueries({
        queryKey: ["visita", data.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["incidencias", data.edificioId],
      });
      queryClient.invalidateQueries({
        queryKey: ["edificio-stats", data.edificioId],
      });
    },
  });
}

export function useDeleteVisita() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<{ deleted: boolean }>(`/api/visitas/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visitas"] });
      queryClient.invalidateQueries({ queryKey: ["incidencias"] });
      queryClient.invalidateQueries({ queryKey: ["edificio-stats"] });
    },
  });
}
