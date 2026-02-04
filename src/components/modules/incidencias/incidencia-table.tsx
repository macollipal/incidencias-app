"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Eye,
    Clock,
    UserCheck,
    AlertTriangle,
    Calendar,
    Wrench,
    CheckCircle2,
    XCircle,
    UserPlus,
    CalendarPlus
} from "lucide-react";
import {
    TIPO_SERVICIO_LABELS,
    ESTADO_INCIDENCIA_LABELS,
    ESTADO_INCIDENCIA_COLORS,
    type TipoServicio,
    type EstadoIncidencia
} from "@/types";
import { type Incidencia } from "@/hooks/use-incidencias";

interface IncidenciaTableProps {
    incidencias: Incidencia[];
    isLoading: boolean;
    isAdmin: boolean;
    onOpenDetail: (id: string) => void;
    onOpenAsignar: (id: string) => void;
    onOpenVisita: (id: string) => void;
    onMarkUrgent: (id: string) => void;
    onCloseIncidencia: (id: string) => void;
    isUpdatePending: boolean;
}

export function IncidenciaTable({
    incidencias,
    isLoading,
    isAdmin,
    onOpenDetail,
    onOpenAsignar,
    onOpenVisita,
    onMarkUrgent,
    onCloseIncidencia,
    isUpdatePending,
}: IncidenciaTableProps) {
    if (isLoading) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[100px]">Fecha</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Reportado por</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {incidencias.map((incidencia) => (
                    <TableRow key={incidencia.id}>
                        <TableCell className="text-sm">
                            <div className="flex flex-col">
                                <span className="font-medium text-gray-900">
                                    {new Date(incidencia.createdAt).toLocaleDateString("es-CL", { day: "2-digit", month: "short" })}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {new Date(incidencia.createdAt).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                            </div>
                        </TableCell>
                        <TableCell className="font-medium max-w-[280px] truncate">
                            {incidencia.descripcion}
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline">
                                {TIPO_SERVICIO_LABELS[incidencia.tipoServicio as TipoServicio]}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            {incidencia.prioridad === "URGENTE" ? (
                                <Badge variant="destructive" className="gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    Urgente
                                </Badge>
                            ) : (
                                <Badge variant="secondary">Normal</Badge>
                            )}
                        </TableCell>
                        <TableCell>
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${ESTADO_INCIDENCIA_COLORS[incidencia.estado as EstadoIncidencia]}`}>
                                {incidencia.estado === "PENDIENTE" && <Clock className="w-3 h-3" />}
                                {incidencia.estado === "ASIGNADA" && <UserCheck className="w-3 h-3" />}
                                {incidencia.estado === "ESCALADA" && <AlertTriangle className="w-3 h-3" />}
                                {incidencia.estado === "PROGRAMADA" && <Calendar className="w-3 h-3" />}
                                {incidencia.estado === "EN_PROGRESO" && <Wrench className="w-3 h-3" />}
                                {incidencia.estado === "RESUELTA" && <CheckCircle2 className="w-3 h-3" />}
                                {incidencia.estado === "CERRADA" && <XCircle className="w-3 h-3" />}
                                {ESTADO_INCIDENCIA_LABELS[incidencia.estado as EstadoIncidencia]}
                            </div>
                        </TableCell>
                        <TableCell className="text-gray-600">{incidencia.usuario.nombre}</TableCell>
                        <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onOpenDetail(incidencia.id)}
                                >
                                    <Eye className="w-4 h-4 mr-1" />
                                    Ver
                                </Button>
                                {isAdmin && (incidencia.estado === "PENDIENTE" || incidencia.estado === "ESCALADA") && (
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => onOpenAsignar(incidencia.id)}
                                    >
                                        <UserPlus className="w-4 h-4 mr-1" />
                                        Asignar
                                    </Button>
                                )}
                                {isAdmin && incidencia.estado === "ESCALADA" && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onOpenVisita(incidencia.id)}
                                    >
                                        <CalendarPlus className="w-4 h-4 mr-1" />
                                        Programar Visita
                                    </Button>
                                )}
                                {isAdmin && incidencia.prioridad !== "URGENTE" && incidencia.estado === "PENDIENTE" && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onMarkUrgent(incidencia.id)}
                                        disabled={isUpdatePending}
                                    >
                                        Marcar urgente
                                    </Button>
                                )}
                                {isAdmin && incidencia.estado !== "CERRADA" && incidencia.estado !== "RESUELTA" && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onCloseIncidencia(incidencia.id)}
                                        disabled={isUpdatePending}
                                    >
                                        Cerrar
                                    </Button>
                                )}
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
                {incidencias.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                            No se encontraron incidencias
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}

// Missing import fix
import { Loader2 } from "lucide-react";
