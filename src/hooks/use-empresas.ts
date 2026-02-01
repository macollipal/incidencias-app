import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateEmpresaInput, UpdateEmpresaInput } from "@/lib/validations";

interface Empresa {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  createdAt: string;
  updatedAt: string;
  tiposServicio: string[];
  _count: {
    visitas: number;
  };
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

export function useEmpresas(tipoServicio?: string) {
  return useQuery({
    queryKey: ["empresas", tipoServicio],
    queryFn: () => {
      const params = new URLSearchParams();
      if (tipoServicio) params.set("tipoServicio", tipoServicio);
      const query = params.toString();
      return fetchApi<Empresa[]>(`/api/empresas${query ? `?${query}` : ""}`);
    },
  });
}

export function useEmpresa(id: string | null) {
  return useQuery({
    queryKey: ["empresa", id],
    queryFn: () => fetchApi<Empresa>(`/api/empresas/${id}`),
    enabled: !!id,
  });
}

export function useCreateEmpresa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEmpresaInput) =>
      fetchApi<Empresa>("/api/empresas", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresas"] });
    },
  });
}

export function useUpdateEmpresa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmpresaInput }) =>
      fetchApi<Empresa>(`/api/empresas/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["empresas"] });
      queryClient.invalidateQueries({ queryKey: ["empresa", data.id] });
    },
  });
}

export function useDeleteEmpresa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<{ deleted: boolean }>(`/api/empresas/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresas"] });
    },
  });
}
