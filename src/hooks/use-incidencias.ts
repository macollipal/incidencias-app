import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateIncidenciaInput, UpdateIncidenciaInput, AsignarConserjeInput, ResolverConserjeInput, EscalarIncidenciaInput, RechazarIncidenciaInput } from "@/lib/validations";
import { PaginatedResponse } from "@/types";

interface Usuario {
  id: string;
  nombre: string;
  email?: string;
  rol?: string;
}

interface Comentario {
  id: string;
  contenido: string;
  createdAt: string;
  usuario: Usuario;
}

export interface Incidencia {
  id: string;
  edificioId: string;
  usuarioId: string;
  tipoServicio: string;
  descripcion: string;
  prioridad: string;
  estado: string;
  visitaId: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  // Campos del flujo de conserje
  asignadoAId: string | null;
  asignadoEl: string | null;
  verificadoEl: string | null;
  descripcionVerificada: string | null;
  escaladaEl: string | null;
  tipoResolucion: string | null;
  comentarioCierre: string | null;
  // Campos del flujo de rechazo
  rechazadaEl: string | null;
  motivoRechazo: string | null;
  usuario: Usuario;
  asignadoA?: Usuario | null;
  visita?: {
    id: string;
    fechaProgramada: string;
    empresa: { nombre: string };
  } | null;
  comentarios?: Comentario[];
}

interface Conserje {
  id: string;
  nombre: string;
  email: string;
  incidenciasActivas: number;
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

export function useIncidencias(edificioId: string | null, filters?: {
  tipoServicio?: string;
  estado?: string;
  prioridad?: string;
}) {
  return useQuery({
    queryKey: ["incidencias", edificioId, filters],
    queryFn: () => {
      if (!edificioId) return [];

      const params = new URLSearchParams({ edificioId });
      if (filters?.tipoServicio) params.set("tipoServicio", filters.tipoServicio);
      if (filters?.estado) params.set("estado", filters.estado);
      if (filters?.prioridad) params.set("prioridad", filters.prioridad);

      return fetchApi<Incidencia[]>(`/api/incidencias?${params}`);
    },
    enabled: !!edificioId,
  });
}

export interface IncidenciasPaginatedOptions {
  page?: number;
  limit?: number;
  filters?: {
    tipoServicio?: string;
    estado?: string;
    prioridad?: string;
  };
}

export function useIncidenciasPaginated(
  edificioId: string | null,
  options: IncidenciasPaginatedOptions = {}
) {
  const { page = 1, limit = 50, filters = {} } = options;

  return useQuery({
    queryKey: ["incidencias", "paginated", edificioId, page, limit, filters],
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
      if (filters.tipoServicio) params.set("tipoServicio", filters.tipoServicio);
      if (filters.estado) params.set("estado", filters.estado);
      if (filters.prioridad) params.set("prioridad", filters.prioridad);

      return fetchApi<PaginatedResponse<Incidencia>>(`/api/incidencias?${params}`);
    },
    enabled: !!edificioId,
  });
}

export function useIncidencia(id: string | null) {
  return useQuery({
    queryKey: ["incidencia", id],
    queryFn: () => fetchApi<Incidencia>(`/api/incidencias/${id}`),
    enabled: !!id,
  });
}

export function useConserjes(edificioId: string | null) {
  return useQuery({
    queryKey: ["conserjes", edificioId],
    queryFn: () => fetchApi<Conserje[]>(`/api/edificios/${edificioId}/conserjes`),
    enabled: !!edificioId,
  });
}

export function useCreateIncidencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateIncidenciaInput) =>
      fetchApi<Incidencia>("/api/incidencias", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["incidencias", variables.edificioId],
      });
      queryClient.invalidateQueries({
        queryKey: ["edificio-stats", variables.edificioId],
      });
    },
  });
}

export function useUpdateIncidencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIncidenciaInput }) =>
      fetchApi<Incidencia>(`/api/incidencias/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["incidencias", data.edificioId],
      });
      queryClient.invalidateQueries({
        queryKey: ["incidencia", data.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["edificio-stats", data.edificioId],
      });
    },
  });
}

export function useDeleteIncidencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<{ deleted: boolean }>(`/api/incidencias/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidencias"] });
      queryClient.invalidateQueries({ queryKey: ["edificio-stats"] });
    },
  });
}

// Workflow: Asignar a conserje
export function useAsignarConserje() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AsignarConserjeInput }) =>
      fetchApi<Incidencia>(`/api/incidencias/${id}/asignar`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["incidencias", data.edificioId] });
      queryClient.invalidateQueries({ queryKey: ["incidencia", data.id] });
      queryClient.invalidateQueries({ queryKey: ["edificio-stats", data.edificioId] });
      queryClient.invalidateQueries({ queryKey: ["conserjes", data.edificioId] });
    },
  });
}

// Workflow: Conserje resuelve
export function useResolverConserje() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ResolverConserjeInput }) =>
      fetchApi<Incidencia>(`/api/incidencias/${id}/resolver`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["incidencias", data.edificioId] });
      queryClient.invalidateQueries({ queryKey: ["incidencia", data.id] });
      queryClient.invalidateQueries({ queryKey: ["edificio-stats", data.edificioId] });
      queryClient.invalidateQueries({ queryKey: ["conserjes", data.edificioId] });
    },
  });
}

// Workflow: Conserje escala
export function useEscalarIncidencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EscalarIncidenciaInput }) =>
      fetchApi<Incidencia>(`/api/incidencias/${id}/escalar`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["incidencias", data.edificioId] });
      queryClient.invalidateQueries({ queryKey: ["incidencia", data.id] });
      queryClient.invalidateQueries({ queryKey: ["edificio-stats", data.edificioId] });
      queryClient.invalidateQueries({ queryKey: ["conserjes", data.edificioId] });
    },
  });
}

// Workflow: Admin rechaza incidencia
export function useRechazarIncidencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RechazarIncidenciaInput }) =>
      fetchApi<Incidencia>(`/api/incidencias/${id}/rechazar`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["incidencias", data.edificioId] });
      queryClient.invalidateQueries({ queryKey: ["incidencia", data.id] });
      queryClient.invalidateQueries({ queryKey: ["edificio-stats", data.edificioId] });
    },
  });
}

// Comentarios
export function useComentarios(incidenciaId: string | null) {
  return useQuery({
    queryKey: ["comentarios", incidenciaId],
    queryFn: () => fetchApi<Comentario[]>(`/api/incidencias/${incidenciaId}/comentarios`),
    enabled: !!incidenciaId,
  });
}

export function useAddComentario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ incidenciaId, contenido }: { incidenciaId: string; contenido: string }) =>
      fetchApi<Comentario>(`/api/incidencias/${incidenciaId}/comentarios`, {
        method: "POST",
        body: JSON.stringify({ contenido }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comentarios", variables.incidenciaId] });
      queryClient.invalidateQueries({ queryKey: ["incidencia", variables.incidenciaId] });
    },
  });
}
