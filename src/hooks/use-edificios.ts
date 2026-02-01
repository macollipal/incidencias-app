import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateEdificioInput, UpdateEdificioInput } from "@/lib/validations";

interface Edificio {
  id: string;
  nombre: string;
  direccion: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    incidencias: number;
    usuarios: number;
  };
  urgentes: number;
}

interface EdificioStats {
  pendientes: number;
  urgentes: number;
  programadas: number;
  resueltasHoy: number;
  porTipo: Array<{ tipo: string; cantidad: number }>;
  proximasVisitas: Array<{
    id: string;
    empresa: string;
    fecha: string;
    incidencias: number;
  }>;
  incidenciasUrgentes: Array<{
    id: string;
    descripcion: string;
    tipoServicio: string;
    createdAt: string;
    reportadoPor: string;
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

export function useEdificios() {
  return useQuery({
    queryKey: ["edificios"],
    queryFn: () => fetchApi<Edificio[]>("/api/edificios"),
  });
}

export function useEdificio(id: string | null) {
  return useQuery({
    queryKey: ["edificio", id],
    queryFn: () => fetchApi<Edificio>(`/api/edificios/${id}`),
    enabled: !!id,
  });
}

export function useEdificioStats(id: string | null) {
  return useQuery({
    queryKey: ["edificio-stats", id],
    queryFn: () => fetchApi<EdificioStats>(`/api/stats/edificios/${id}`),
    enabled: !!id,
    refetchInterval: 30000, // Refrescar cada 30 segundos
  });
}

export function useCreateEdificio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEdificioInput) =>
      fetchApi<Edificio>("/api/edificios", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["edificios"] });
    },
  });
}

export function useUpdateEdificio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEdificioInput }) =>
      fetchApi<Edificio>(`/api/edificios/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["edificios"] });
      queryClient.invalidateQueries({ queryKey: ["edificio", data.id] });
    },
  });
}

export function useDeleteEdificio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<{ deleted: boolean }>(`/api/edificios/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["edificios"] });
    },
  });
}
