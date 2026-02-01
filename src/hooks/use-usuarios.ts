import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateUsuarioInput, UpdateUsuarioInput } from "@/lib/validations";

interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  createdAt: string;
  edificios: Array<{ id: string; nombre: string }>;
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

export function useUsuarios() {
  return useQuery({
    queryKey: ["usuarios"],
    queryFn: () => fetchApi<Usuario[]>("/api/usuarios"),
  });
}

export function useUsuario(id: string | null) {
  return useQuery({
    queryKey: ["usuario", id],
    queryFn: () => fetchApi<Usuario>(`/api/usuarios/${id}`),
    enabled: !!id,
  });
}

export function useCreateUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUsuarioInput) =>
      fetchApi<Usuario>("/api/usuarios", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });
}

export function useUpdateUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUsuarioInput }) =>
      fetchApi<Usuario>(`/api/usuarios/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      queryClient.invalidateQueries({ queryKey: ["usuario", data.id] });
    },
  });
}

export function useDeleteUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<{ deleted: boolean }>(`/api/usuarios/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });
}
