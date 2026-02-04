"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
    Loader2,
    Clock,
    UserCheck,
    Eye,
    AlertTriangle,
    Calendar,
    Wrench,
    CheckCircle2,
    XCircle,
    MessageSquare,
    Send
} from "lucide-react";
import {
    useIncidencia,
    useComentarios,
    useAddComentario,
    useUpdateIncidencia
} from "@/hooks/use-incidencias";
import {
    TIPO_SERVICIO_LABELS,
    ESTADO_INCIDENCIA_LABELS,
    ESTADO_INCIDENCIA_COLORS,
    TIPO_RESOLUCION_LABELS,
    type TipoServicio,
    type EstadoIncidencia,
    type TipoResolucion
} from "@/types";
import { toast } from "sonner";

interface IncidenciaDetailModalProps {
    id: string | null;
    open: boolean;
    onClose: () => void;
    isResidente: boolean;
}

export function IncidenciaDetailModal({ id, open, onClose, isResidente }: IncidenciaDetailModalProps) {
    const [nuevoComentario, setNuevoComentario] = useState("");

    const { data: incidencia, isLoading: loadingIncidencia } = useIncidencia(id);
    const { data: comentarios, isLoading: loadingComentarios } = useComentarios(id);
    const addComentarioMutation = useAddComentario();
    const updateIncidenciaMutation = useUpdateIncidencia();

    const handleAddComentario = async () => {
        if (!nuevoComentario.trim() || !id) return;
        try {
            await addComentarioMutation.mutateAsync({
                incidenciaId: id,
                contenido: nuevoComentario.trim(),
            });
            setNuevoComentario("");
            toast.success("Comentario agregado");
        } catch {
            toast.error("Error al agregar comentario");
        }
    };

    const handleResolverIncidencia = async () => {
        if (!id) return;
        try {
            await updateIncidenciaMutation.mutateAsync({
                id: id,
                data: { estado: "RESUELTA", tipoResolucion: "CONSERJE" },
            });
            toast.success("Incidencia marcada como resuelta");
            onClose();
        } catch {
            toast.error("Error al resolver incidencia");
        }
    };

    const buildTimeline = () => {
        if (!incidencia) return [];
        const timeline: Array<{
            icon: React.ReactNode;
            title: string;
            description: string;
            date: string;
            estado: string;
        }> = [];

        timeline.push({
            icon: <Clock className="w-4 h-4" />,
            title: "Incidencia creada",
            description: `Reportada por ${incidencia.usuario.nombre}`,
            date: incidencia.createdAt,
            estado: "PENDIENTE",
        });

        if (incidencia.asignadoEl) {
            timeline.push({
                icon: <UserCheck className="w-4 h-4" />,
                title: "Asignada a conserje",
                description: `Asignada a ${incidencia.asignadoA?.nombre || "conserje"}`,
                date: incidencia.asignadoEl,
                estado: "ASIGNADA",
            });
        }

        if (incidencia.verificadoEl) {
            timeline.push({
                icon: <Eye className="w-4 h-4" />,
                title: "Verificada en terreno",
                description: incidencia.descripcionVerificada || "Verificación completada",
                date: incidencia.verificadoEl,
                estado: "ASIGNADA",
            });
        }

        if (incidencia.escaladaEl) {
            timeline.push({
                icon: <AlertTriangle className="w-4 h-4" />,
                title: "Escalada a administrador",
                description: "Requiere empresa externa",
                date: incidencia.escaladaEl,
                estado: "ESCALADA",
            });
        }

        if (incidencia.visita) {
            timeline.push({
                icon: <Calendar className="w-4 h-4" />,
                title: "Visita programada",
                description: `${incidencia.visita.empresa.nombre} - ${new Date(incidencia.visita.fechaProgramada).toLocaleDateString("es-CL")}`,
                date: incidencia.visita.fechaProgramada,
                estado: "PROGRAMADA",
            });
        }

        if (incidencia.estado === "EN_PROGRESO" || incidencia.tipoResolucion === "EMPRESA_EXTERNA") {
            if (incidencia.visita) {
                timeline.push({
                    icon: <Wrench className="w-4 h-4" />,
                    title: "Trabajo en progreso",
                    description: `${incidencia.visita.empresa.nombre} trabajando`,
                    date: incidencia.updatedAt,
                    estado: "EN_PROGRESO",
                });
            }
        }

        if (incidencia.estado === "RESUELTA" || incidencia.estado === "CERRADA") {
            timeline.push({
                icon: <CheckCircle2 className="w-4 h-4" />,
                title: "Resuelta",
                description: incidencia.tipoResolucion
                    ? `${TIPO_RESOLUCION_LABELS[incidencia.tipoResolucion as TipoResolucion]}${incidencia.comentarioCierre ? `: ${incidencia.comentarioCierre}` : ""}`
                    : incidencia.comentarioCierre || "Incidencia resuelta",
                date: incidencia.updatedAt,
                estado: "RESUELTA",
            });
        }

        if (incidencia.estado === "CERRADA" && incidencia.closedAt) {
            timeline.push({
                icon: <XCircle className="w-4 h-4" />,
                title: "Cerrada",
                description: "Incidencia cerrada definitivamente",
                date: incidencia.closedAt,
                estado: "CERRADA",
            });
        }

        return timeline;
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        Detalle de Incidencia
                        {incidencia && (
                            <Badge className={ESTADO_INCIDENCIA_COLORS[incidencia.estado as EstadoIncidencia]}>
                                {ESTADO_INCIDENCIA_LABELS[incidencia.estado as EstadoIncidencia]}
                            </Badge>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        Tracking completo de la incidencia
                    </DialogDescription>
                </DialogHeader>

                {loadingIncidencia ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    </div>
                ) : incidencia ? (
                    <ScrollArea className="flex-1 min-h-0 max-h-[60vh] pr-4">
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="text-sm text-gray-500">Tipo de Servicio</p>
                                    <p className="font-medium">{TIPO_SERVICIO_LABELS[incidencia.tipoServicio as TipoServicio]}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Prioridad</p>
                                    <Badge variant={incidencia.prioridad === "URGENTE" ? "destructive" : "secondary"}>
                                        {incidencia.prioridad}
                                    </Badge>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-sm text-gray-500">Descripción</p>
                                    <p className="font-medium">{incidencia.descripcion}</p>
                                </div>
                                {incidencia.asignadoA && (
                                    <div>
                                        <p className="text-sm text-gray-500">Asignado a</p>
                                        <p className="font-medium">{incidencia.asignadoA.nombre}</p>
                                    </div>
                                )}
                                {incidencia.tipoResolucion && (
                                    <div>
                                        <p className="text-sm text-gray-500">Tipo de Resolución</p>
                                        <p className="font-medium">{TIPO_RESOLUCION_LABELS[incidencia.tipoResolucion as TipoResolucion]}</p>
                                    </div>
                                )}
                            </div>

                            <Separator />

                            <div>
                                <h3 className="font-semibold mb-4 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Timeline / Tracking
                                </h3>
                                <div className="relative pl-6 space-y-4">
                                    {buildTimeline().map((item, index) => (
                                        <div key={index} className="relative">
                                            {index < buildTimeline().length - 1 && (
                                                <div className="absolute left-[-16px] top-6 w-0.5 h-full bg-gray-200" />
                                            )}
                                            <div className={`absolute left-[-22px] top-1 w-4 h-4 rounded-full flex items-center justify-center ${index === buildTimeline().length - 1
                                                    ? "bg-blue-500 text-white"
                                                    : "bg-gray-200 text-gray-600"
                                                }`}>
                                                {item.icon}
                                            </div>
                                            <div className="pb-4">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium">{item.title}</p>
                                                    <Badge variant="outline" className="text-xs">
                                                        {ESTADO_INCIDENCIA_LABELS[item.estado as EstadoIncidencia]}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-600">{item.description}</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {new Date(item.date).toLocaleString("es-CL", {
                                                        dateStyle: "medium",
                                                        timeStyle: "short",
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <h3 className="font-semibold mb-4 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    Comentarios ({comentarios?.length || 0})
                                </h3>

                                {loadingComentarios ? (
                                    <div className="flex justify-center py-4">
                                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                    </div>
                                ) : (
                                    <div className="space-y-3 mb-4">
                                        {comentarios && comentarios.length > 0 ? (
                                            comentarios.map((comentario) => (
                                                <div key={comentario.id} className="p-3 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="font-medium text-sm">{comentario.usuario.nombre}</p>
                                                        <p className="text-xs text-gray-400">
                                                            {new Date(comentario.createdAt).toLocaleString("es-CL", {
                                                                dateStyle: "short",
                                                                timeStyle: "short",
                                                            })}
                                                        </p>
                                                    </div>
                                                    <p className="text-sm text-gray-700">{comentario.contenido}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 text-sm text-center py-4">
                                                No hay comentarios aún
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <Textarea
                                        placeholder="Escribir un comentario..."
                                        value={nuevoComentario}
                                        onChange={(e) => setNuevoComentario(e.target.value)}
                                        className="flex-1"
                                        rows={2}
                                    />
                                    <Button
                                        onClick={handleAddComentario}
                                        disabled={!nuevoComentario.trim() || addComentarioMutation.isPending}
                                        size="icon"
                                        className="h-auto"
                                    >
                                        {addComentarioMutation.isPending ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Send className="w-4 h-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                ) : null}

                <DialogFooter className="gap-2">
                    {!isResidente && incidencia && incidencia.estado !== "RESUELTA" && incidencia.estado !== "CERRADA" && (
                        <Button
                            variant="default"
                            onClick={handleResolverIncidencia}
                            disabled={updateIncidenciaMutation.isPending}
                        >
                            {updateIncidenciaMutation.isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                            )}
                            Marcar Resuelta
                        </Button>
                    )}
                    <Button variant="outline" onClick={onClose}>
                        Cerrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
