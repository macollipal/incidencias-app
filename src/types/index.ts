export type Rol = "ADMIN_PLATAFORMA" | "ADMIN_EDIFICIO" | "CONSERJE" | "RESIDENTE";

export type TipoServicio =
  | "ELECTRICIDAD"
  | "AGUA_GAS"
  | "LIMPIEZA"
  | "SEGURIDAD"
  | "INFRAESTRUCTURA"
  | "AREAS_COMUNES";

export type Prioridad = "NORMAL" | "URGENTE";

export type EstadoIncidencia =
  | "PENDIENTE"
  | "ASIGNADA"
  | "ESCALADA"
  | "PROGRAMADA"
  | "EN_PROGRESO"
  | "RESUELTA"
  | "CERRADA"
  | "RECHAZADA";

export type EstadoVisita = "PROGRAMADA" | "COMPLETADA" | "CANCELADA";

export type TipoResolucion = "CONSERJE" | "EMPRESA_EXTERNA";

export type TipoZona =
  | "PASILLO"
  | "AREA_COMUN"
  | "ESTACIONAMIENTO"
  | "BODEGA"
  | "ASCENSOR"
  | "ENTRADA"
  | "JARDIN"
  | "PISCINA"
  | "GIMNASIO"
  | "OTRO";

export type CategoriaProducto =
  | "ILUMINACION"
  | "ELECTRICIDAD"
  | "PLOMERIA"
  | "LIMPIEZA"
  | "SEGURIDAD"
  | "FERRETERIA"
  | "OTRO";

export type TipoMovimiento = "ENTRADA" | "SALIDA" | "AJUSTE";

export const TIPO_SERVICIO_LABELS: Record<TipoServicio, string> = {
  ELECTRICIDAD: "Electricidad",
  AGUA_GAS: "Agua / Gas",
  LIMPIEZA: "Limpieza",
  SEGURIDAD: "Seguridad",
  INFRAESTRUCTURA: "Infraestructura",
  AREAS_COMUNES: "Áreas Comunes",
};

export const PRIORIDAD_LABELS: Record<Prioridad, string> = {
  NORMAL: "Normal",
  URGENTE: "Urgente",
};

export const ESTADO_INCIDENCIA_LABELS: Record<EstadoIncidencia, string> = {
  PENDIENTE: "Pendiente",
  ASIGNADA: "Asignada",
  ESCALADA: "Escalada",
  PROGRAMADA: "Programada",
  EN_PROGRESO: "En Progreso",
  RESUELTA: "Resuelta",
  CERRADA: "Cerrada",
  RECHAZADA: "Rechazada",
};

export const ROL_LABELS: Record<Rol, string> = {
  ADMIN_PLATAFORMA: "Admin Plataforma",
  ADMIN_EDIFICIO: "Admin Edificio",
  CONSERJE: "Conserje",
  RESIDENTE: "Residente",
};

export const TIPO_RESOLUCION_LABELS: Record<TipoResolucion, string> = {
  CONSERJE: "Personal interno",
  EMPRESA_EXTERNA: "Empresa externa",
};

// Colores para badges de estado
export const ESTADO_INCIDENCIA_COLORS: Record<EstadoIncidencia, string> = {
  PENDIENTE: "bg-gray-100 text-gray-800",
  ASIGNADA: "bg-blue-100 text-blue-800",
  ESCALADA: "bg-orange-100 text-orange-800",
  PROGRAMADA: "bg-purple-100 text-purple-800",
  EN_PROGRESO: "bg-yellow-100 text-yellow-800",
  RESUELTA: "bg-green-100 text-green-800",
  CERRADA: "bg-gray-100 text-gray-600",
  RECHAZADA: "bg-red-100 text-red-800",
};

// Labels para inventario
export const TIPO_ZONA_LABELS: Record<TipoZona, string> = {
  PASILLO: "Pasillo",
  AREA_COMUN: "Área Común",
  ESTACIONAMIENTO: "Estacionamiento",
  BODEGA: "Bodega",
  ASCENSOR: "Ascensor",
  ENTRADA: "Entrada",
  JARDIN: "Jardín",
  PISCINA: "Piscina",
  GIMNASIO: "Gimnasio",
  OTRO: "Otro",
};

export const CATEGORIA_PRODUCTO_LABELS: Record<CategoriaProducto, string> = {
  ILUMINACION: "Iluminación",
  ELECTRICIDAD: "Electricidad",
  PLOMERIA: "Plomería",
  LIMPIEZA: "Limpieza",
  SEGURIDAD: "Seguridad",
  FERRETERIA: "Ferretería",
  OTRO: "Otro",
};

export const TIPO_MOVIMIENTO_LABELS: Record<TipoMovimiento, string> = {
  ENTRADA: "Entrada (Reposición)",
  SALIDA: "Salida (Uso)",
  AJUSTE: "Ajuste manual",
};

// Pagination types
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasMore: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}
