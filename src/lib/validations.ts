import { z } from "zod";

// Enums
export const tipoServicioEnum = z.enum([
  "ELECTRICIDAD",
  "AGUA_GAS",
  "LIMPIEZA",
  "SEGURIDAD",
  "INFRAESTRUCTURA",
  "AREAS_COMUNES",
]);

export const prioridadEnum = z.enum(["NORMAL", "URGENTE"]);

export const estadoIncidenciaEnum = z.enum([
  "PENDIENTE",
  "ASIGNADA",
  "ESCALADA",
  "PROGRAMADA",
  "EN_PROGRESO",
  "RESUELTA",
  "CERRADA",
]);

export const estadoVisitaEnum = z.enum(["PROGRAMADA", "EN_PROGRESO", "COMPLETADA", "CANCELADA"]);

export const rolEnum = z.enum(["ADMIN_PLATAFORMA", "ADMIN_EDIFICIO", "CONSERJE", "RESIDENTE"]);

export const tipoResolucionEnum = z.enum(["CONSERJE", "EMPRESA_EXTERNA"]);

export const tipoZonaEnum = z.enum([
  "PASILLO",
  "AREA_COMUN",
  "ESTACIONAMIENTO",
  "BODEGA",
  "ASCENSOR",
  "ENTRADA",
  "JARDIN",
  "PISCINA",
  "GIMNASIO",
  "OTRO",
]);

export const categoriaProductoEnum = z.enum([
  "ILUMINACION",
  "ELECTRICIDAD",
  "PLOMERIA",
  "LIMPIEZA",
  "SEGURIDAD",
  "FERRETERIA",
  "OTRO",
]);

export const tipoMovimientoEnum = z.enum(["ENTRADA", "SALIDA", "AJUSTE"]);

// Schemas de Incidencias
export const createIncidenciaSchema = z.object({
  edificioId: z.string().min(1, "Edificio es requerido"),
  tipoServicio: tipoServicioEnum,
  descripcion: z.string().min(10, "Descripción debe tener al menos 10 caracteres"),
  prioridad: prioridadEnum.default("NORMAL"),
});

export const updateIncidenciaSchema = z.object({
  tipoServicio: tipoServicioEnum.optional(),
  descripcion: z.string().min(10).optional(),
  prioridad: prioridadEnum.optional(),
  estado: estadoIncidenciaEnum.optional(),
  visitaId: z.string().nullable().optional(),
  // Campos para flujo de conserje
  asignadoAId: z.string().nullable().optional(),
  descripcionVerificada: z.string().optional(),
  tipoResolucion: tipoResolucionEnum.optional(),
  comentarioCierre: z.string().optional(),
});

// Schema para asignar a conserje
export const asignarConserjeSchema = z.object({
  asignadoAId: z.string().min(1, "Conserje es requerido"),
});

// Schema para que conserje resuelva
export const resolverConserjeSchema = z.object({
  descripcionVerificada: z.string().optional(),
  comentarioCierre: z.string().min(5, "Debe indicar cómo se resolvió"),
});

// Schema para escalar incidencia
export const escalarIncidenciaSchema = z.object({
  descripcionVerificada: z.string().min(10, "Describa la situación verificada"),
  prioridad: prioridadEnum.optional(),
});

// Schemas de Edificios
export const createEdificioSchema = z.object({
  nombre: z.string().min(2, "Nombre debe tener al menos 2 caracteres"),
  direccion: z.string().min(5, "Dirección debe tener al menos 5 caracteres"),
});

export const updateEdificioSchema = createEdificioSchema.partial();

// Schemas de Empresas
export const createEmpresaSchema = z.object({
  nombre: z.string().min(2, "Nombre debe tener al menos 2 caracteres"),
  telefono: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  tiposServicio: z.array(tipoServicioEnum).min(1, "Seleccione al menos un tipo de servicio"),
});

export const updateEmpresaSchema = createEmpresaSchema.partial();

// Schemas de Visitas
export const createVisitaSchema = z.object({
  edificioId: z.string().min(1, "Edificio es requerido"),
  empresaId: z.string().min(1, "Empresa es requerida"),
  fechaProgramada: z.string().datetime().or(z.date()),
  notas: z.string().optional(),
  incidenciaIds: z.array(z.string()).optional(),
});

export const updateVisitaSchema = z.object({
  fechaProgramada: z.string().datetime().or(z.date()).optional(),
  notas: z.string().optional(),
  estado: estadoVisitaEnum.optional(),
  incidenciaIds: z.array(z.string()).optional(),
});

// Schemas de Usuarios
export const createUsuarioSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Contraseña debe tener al menos 6 caracteres"),
  nombre: z.string().min(2, "Nombre debe tener al menos 2 caracteres"),
  rol: rolEnum.default("RESIDENTE"),
  edificioIds: z.array(z.string()).min(1, "Seleccione al menos un edificio"),
});

export const updateUsuarioSchema = z.object({
  nombre: z.string().min(2).optional(),
  rol: rolEnum.optional(),
  edificioIds: z.array(z.string()).optional(),
});

// Schema para comentarios
export const createComentarioSchema = z.object({
  contenido: z.string().min(1, "El comentario no puede estar vacío"),
});

// Schemas de Zonas
export const createZonaSchema = z.object({
  edificioId: z.string().min(1, "Edificio es requerido"),
  nombre: z.string().min(2, "Nombre debe tener al menos 2 caracteres"),
  tipo: tipoZonaEnum,
  descripcion: z.string().optional(),
});

export const updateZonaSchema = z.object({
  nombre: z.string().min(2).optional(),
  tipo: tipoZonaEnum.optional(),
  descripcion: z.string().nullable().optional(),
});

// Schemas de Productos
export const createProductoSchema = z.object({
  edificioId: z.string().min(1, "Edificio es requerido"),
  nombre: z.string().min(2, "Nombre debe tener al menos 2 caracteres"),
  categoria: categoriaProductoEnum,
  especificaciones: z.string().optional(),
  stockActual: z.number().int().min(0).default(0),
  stockMinimo: z.number().int().min(0).default(0),
  proveedorNombre: z.string().optional(),
  proveedorTelefono: z.string().optional(),
  proveedorUrl: z.string().url().optional().or(z.literal("")),
  zonaIds: z.array(z.string()).optional(),
});

export const updateProductoSchema = z.object({
  nombre: z.string().min(2).optional(),
  categoria: categoriaProductoEnum.optional(),
  especificaciones: z.string().nullable().optional(),
  stockMinimo: z.number().int().min(0).optional(),
  proveedorNombre: z.string().nullable().optional(),
  proveedorTelefono: z.string().nullable().optional(),
  proveedorUrl: z.string().url().nullable().optional().or(z.literal("")),
  zonaIds: z.array(z.string()).optional(),
});

// Schemas de Movimientos de Stock
export const createMovimientoStockSchema = z.object({
  productoId: z.string().min(1, "Producto es requerido"),
  incidenciaId: z.string().optional(),
  tipo: tipoMovimientoEnum,
  cantidad: z.number().int().min(1, "Cantidad debe ser al menos 1"),
  notas: z.string().optional(),
});

// Types
export type CreateIncidenciaInput = z.infer<typeof createIncidenciaSchema>;
export type UpdateIncidenciaInput = z.infer<typeof updateIncidenciaSchema>;
export type AsignarConserjeInput = z.infer<typeof asignarConserjeSchema>;
export type ResolverConserjeInput = z.infer<typeof resolverConserjeSchema>;
export type EscalarIncidenciaInput = z.infer<typeof escalarIncidenciaSchema>;
export type CreateEdificioInput = z.infer<typeof createEdificioSchema>;
export type UpdateEdificioInput = z.infer<typeof updateEdificioSchema>;
export type CreateEmpresaInput = z.infer<typeof createEmpresaSchema>;
export type UpdateEmpresaInput = z.infer<typeof updateEmpresaSchema>;
export type CreateVisitaInput = z.infer<typeof createVisitaSchema>;
export type UpdateVisitaInput = z.infer<typeof updateVisitaSchema>;
export type CreateUsuarioInput = z.infer<typeof createUsuarioSchema>;
export type UpdateUsuarioInput = z.infer<typeof updateUsuarioSchema>;
export type CreateComentarioInput = z.infer<typeof createComentarioSchema>;
export type CreateZonaInput = z.infer<typeof createZonaSchema>;
export type UpdateZonaInput = z.infer<typeof updateZonaSchema>;
export type CreateProductoInput = z.infer<typeof createProductoSchema>;
export type UpdateProductoInput = z.infer<typeof updateProductoSchema>;
export type CreateMovimientoStockInput = z.infer<typeof createMovimientoStockSchema>;
