"use client";

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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    Loader2,
    Calendar,
    Building2,
    Phone,
    Mail,
    AlertCircle,
    PlayCircle,
    CheckCircle2,
    X
} from "lucide-react";
import { useVisita, useUpdateVisita } from "@/hooks/use-visitas";
import { TIPO_SERVICIO_LABELS, type TipoServicio } from "@/types";
import { toast } from "sonner";

interface VisitaDetailModalProps {
    id: string | null;
    open: boolean;
    onClose: () => void;
}

export function VisitaDetailModal({ id, open, onClose }: VisitaDetailModalProps) {
    const { data: visita, isLoading: loadingVisita } = useVisita(id);
    const updateVisitaMutation = useUpdateVisita();

    const handleUpdateVisitaEstado = async (estado: "PROGRAMADA" | "EN_PROGRESO" | "COMPLETADA" | "CANCELADA") => {
        if (!id) return;
        try {
            await updateVisitaMutation.mutateAsync({
                id: id,
                data: { estado },
            });
            toast.success(`Visita ${estado === "COMPLETADA" ? "completada" : estado === "EN_PROGRESO" ? "iniciada" : "cancelada"}`);
            if (estado === "COMPLETADA" || estado === "CANCELADA") {
                onClose();
            }
        } catch {
            toast.error("Error al actualizar visita");
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Detalle de Visita
                        {visita && (
                            <Badge variant={
                                visita.estado === "COMPLETADA" ? "default" :
                                    visita.estado === "EN_PROGRESO" ? "secondary" :
                                        visita.estado === "CANCELADA" ? "destructive" : "outline"
                            }>
                                {visita.estado}
                            </Badge>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        Gestiona la visita técnica programada
                    </DialogDescription>
                </DialogHeader>

                {loadingVisita ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    </div>
                ) : visita ? (
                    <div className="space-y-6">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white rounded-lg shadow-sm">
                                    <Building2 className="w-6 h-6 text-gray-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg">{visita.empresa.nombre}</h3>
                                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                                        {visita.empresa.telefono && (
                                            <span className="flex items-center gap-1">
                                                <Phone className="w-4 h-4" />
                                                {visita.empresa.telefono}
                                            </span>
                                        )}
                                        {visita.empresa.email && (
                                            <span className="flex items-center gap-1">
                                                <Mail className="w-4 h-4" />
                                                {visita.empresa.email}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-600 font-medium">Fecha Programada</p>
                                <p className="text-lg font-semibold mt-1">
                                    {new Date(visita.fechaProgramada).toLocaleDateString("es-CL", {
                                        weekday: "long",
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                    })}
                                </p>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-600 font-medium">Hora</p>
                                <p className="text-lg font-semibold mt-1">
                                    {new Date(visita.fechaProgramada).toLocaleTimeString("es-CL", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </p>
                            </div>
                        </div>

                        {visita.notas && (
                            <div>
                                <Label className="text-sm text-gray-500">Notas</Label>
                                <p className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">{visita.notas}</p>
                            </div>
                        )}

                        <Separator />

                        <div>
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                Incidencias Asignadas ({visita.incidencias?.length || 0})
                            </h3>
                            <div className="space-y-2">
                                {visita.incidencias && visita.incidencias.length > 0 ? (
                                    visita.incidencias.map((inc) => (
                                        <div key={inc.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-sm">{inc.descripcion}</p>
                                                <p className="text-xs text-gray-500">
                                                    {TIPO_SERVICIO_LABELS[inc.tipoServicio as TipoServicio]}
                                                </p>
                                            </div>
                                            {inc.prioridad === "URGENTE" && (
                                                <Badge variant="destructive">Urgente</Badge>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-sm text-center py-4">
                                        No hay incidencias asignadas
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ) : null}

                <DialogFooter className="gap-2 mt-4">
                    {visita && visita.estado === "PROGRAMADA" && (
                        <>
                            <Button
                                variant="default"
                                onClick={() => handleUpdateVisitaEstado("EN_PROGRESO")}
                                disabled={updateVisitaMutation.isPending}
                            >
                                {updateVisitaMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <PlayCircle className="w-4 h-4 mr-2" />
                                )}
                                Iniciar Visita
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => handleUpdateVisitaEstado("CANCELADA")}
                                disabled={updateVisitaMutation.isPending}
                            >
                                <X className="w-4 h-4 mr-2" />
                                Cancelar Visita
                            </Button>
                        </>
                    )}
                    {visita && visita.estado === "EN_PROGRESO" && (
                        <Button
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleUpdateVisitaEstado("COMPLETADA")}
                            disabled={updateVisitaMutation.isPending}
                        >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Completar Visita
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
