"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CreateZonaInput,
  UpdateZonaInput,
  CreateProductoInput,
  UpdateProductoInput,
  CreateMovimientoStockInput,
} from "@/lib/validations";
import { PaginatedResponse } from "@/types";

// Types
interface ZonaEdificio {
  id: string;
  edificioId: string;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    incidencias: number;
    productos: number;
  };
}

interface ProductoZona {
  id: string;
  productoId: string;
  zonaId: string;
  zona: ZonaEdificio;
}

interface Producto {
  id: string;
  edificioId: string;
  nombre: string;
  categoria: string;
  especificaciones: string | null;
  stockActual: number;
  stockMinimo: number;
  proveedorNombre: string | null;
  proveedorTelefono: string | null;
  proveedorUrl: string | null;
  createdAt: string;
  updatedAt: string;
  zonas?: ProductoZona[];
  stockStatus?: "SIN_STOCK" | "STOCK_BAJO" | "DISPONIBLE";
  disponible?: boolean;
  _count?: {
    movimientos: number;
  };
}

interface MovimientoStock {
  id: string;
  productoId: string;
  incidenciaId: string | null;
  tipo: string;
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  notas: string | null;
  createdAt: string;
  producto?: Producto;
  incidencia?: {
    id: string;
    descripcion: string;
    estado: string;
  };
}

// ============ ZONAS ============

export function useZonas(edificioId: string | null) {
  return useQuery<ZonaEdificio[]>({
    queryKey: ["zonas", edificioId],
    queryFn: async () => {
      if (!edificioId) return [];
      const res = await fetch(`/api/zonas?edificioId=${edificioId}`);
      if (!res.ok) throw new Error("Error al obtener zonas");
      return res.json();
    },
    enabled: !!edificioId,
  });
}

export function useZona(zonaId: string | null) {
  return useQuery<ZonaEdificio>({
    queryKey: ["zona", zonaId],
    queryFn: async () => {
      const res = await fetch(`/api/zonas/${zonaId}`);
      if (!res.ok) throw new Error("Error al obtener zona");
      return res.json();
    },
    enabled: !!zonaId,
  });
}

export function useCreateZona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateZonaInput) => {
      const res = await fetch("/api/zonas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al crear zona");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["zonas", variables.edificioId] });
    },
  });
}

export function useUpdateZona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateZonaInput }) => {
      const res = await fetch(`/api/zonas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al actualizar zona");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zonas"] });
    },
  });
}

export function useDeleteZona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/zonas/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al eliminar zona");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zonas"] });
    },
  });
}

// ============ PRODUCTOS ============

interface ProductosFilters {
  edificioId: string | null;
  categoria?: string;
  stockBajo?: boolean;
  zonaId?: string;
}

export function useProductos(filters: ProductosFilters) {
  return useQuery<Producto[]>({
    queryKey: ["productos", filters],
    queryFn: async () => {
      if (!filters.edificioId) return [];
      const params = new URLSearchParams({ edificioId: filters.edificioId });
      if (filters.categoria) params.append("categoria", filters.categoria);
      if (filters.stockBajo) params.append("stockBajo", "true");
      if (filters.zonaId) params.append("zonaId", filters.zonaId);

      const res = await fetch(`/api/productos?${params}`);
      if (!res.ok) throw new Error("Error al obtener productos");
      return res.json();
    },
    enabled: !!filters.edificioId,
  });
}

export interface ProductosPaginatedOptions {
  page?: number;
  limit?: number;
  filters?: {
    categoria?: string;
    stockBajo?: boolean;
    zonaId?: string;
  };
}

export function useProductosPaginated(
  edificioId: string | null,
  options: ProductosPaginatedOptions = {}
) {
  const { page = 1, limit = 25, filters = {} } = options;

  return useQuery<PaginatedResponse<Producto>>({
    queryKey: ["productos", "paginated", edificioId, page, limit, filters],
    queryFn: async () => {
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
      if (filters.categoria) params.append("categoria", filters.categoria);
      if (filters.stockBajo) params.append("stockBajo", "true");
      if (filters.zonaId) params.append("zonaId", filters.zonaId);

      const res = await fetch(`/api/productos?${params}`);
      if (!res.ok) throw new Error("Error al obtener productos");
      return res.json();
    },
    enabled: !!edificioId,
  });
}

export function useProducto(productoId: string | null) {
  return useQuery<Producto>({
    queryKey: ["producto", productoId],
    queryFn: async () => {
      const res = await fetch(`/api/productos/${productoId}`);
      if (!res.ok) throw new Error("Error al obtener producto");
      return res.json();
    },
    enabled: !!productoId,
  });
}

export function useProductosRecomendados(params: {
  edificioId: string | null;
  zonaId?: string;
  tipoServicio?: string;
}) {
  return useQuery<Producto[]>({
    queryKey: ["productos-recomendados", params],
    queryFn: async () => {
      if (!params.edificioId) return [];
      const searchParams = new URLSearchParams({ edificioId: params.edificioId });
      if (params.zonaId) searchParams.append("zonaId", params.zonaId);
      if (params.tipoServicio) searchParams.append("tipoServicio", params.tipoServicio);

      const res = await fetch(`/api/productos/recomendar?${searchParams}`);
      if (!res.ok) throw new Error("Error al obtener productos recomendados");
      return res.json();
    },
    enabled: !!params.edificioId,
  });
}

export function useCreateProducto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProductoInput) => {
      const res = await fetch("/api/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al crear producto");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
    },
  });
}

export function useUpdateProducto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProductoInput }) => {
      const res = await fetch(`/api/productos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al actualizar producto");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      queryClient.invalidateQueries({ queryKey: ["producto"] });
    },
  });
}

export function useDeleteProducto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/productos/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al eliminar producto");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
    },
  });
}

// ============ MOVIMIENTOS DE STOCK ============

interface MovimientosFilters {
  productoId?: string;
  edificioId?: string;
  limit?: number;
}

export function useMovimientosStock(filters: MovimientosFilters) {
  return useQuery<MovimientoStock[]>({
    queryKey: ["movimientos-stock", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.productoId) params.append("productoId", filters.productoId);
      if (filters.edificioId) params.append("edificioId", filters.edificioId);
      if (filters.limit) params.append("limit", filters.limit.toString());

      const res = await fetch(`/api/movimientos-stock?${params}`);
      if (!res.ok) throw new Error("Error al obtener movimientos");
      return res.json();
    },
    enabled: !!(filters.productoId || filters.edificioId),
  });
}

export function useRegistrarMovimiento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMovimientoStockInput) => {
      const res = await fetch("/api/movimientos-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al registrar movimiento");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["movimientos-stock"] });
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      queryClient.invalidateQueries({ queryKey: ["producto", data.productoId] });
    },
  });
}
