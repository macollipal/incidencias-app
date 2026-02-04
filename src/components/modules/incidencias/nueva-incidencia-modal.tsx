"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { TIPO_SERVICIO_LABELS, type TipoServicio, type Prioridad } from "@/types";
import { useCreateIncidencia } from "@/hooks/use-incidencias";
import { toast } from "sonner";

interface NuevaIncidenciaModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    edificioId: string;
}

export function NuevaIncidenciaModal({
    open,
    onOpenChange,
    edificioId,
}: NuevaIncidenciaModalProps) {
    const [formData, setFormData] = useState({
        tipoServicio: "" as TipoServicio | "",
        descripcion: "",
        prioridad: "NORMAL" as Prioridad,
    });

    const createMutation = useCreateIncidencia();

    const handleCreate = async () => {
        if (!formData.tipoServicio || !formData.descripcion || !edificioId) {
            toast.error("Complete todos los campos");
            return;
        }

        try {
            await createMutation.mutateAsync({
                edificioId,
                tipoServicio: formData.tipoServicio,
                descripcion: formData.descripcion,
                prioridad: formData.prioridad,
            });
            toast.success("Incidencia creada correctamente");
            onOpenChange(false);
            setFormData({ tipoServicio: "", descripcion: "", prioridad: "NORMAL" });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al crear incidencia");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nueva Incidencia</DialogTitle>
                    <DialogDescription>
                        Reporta un problema en el edificio
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="tipoServicio">Tipo de servicio</Label>
                        <Select
                            value={formData.tipoServicio}
                            onValueChange={(v) => setFormData({ ...formData, tipoServicio: v as TipoServicio })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(TIPO_SERVICIO_LABELS).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="descripcion">Descripción</Label>
                        <Textarea
                            id="descripcion"
                            placeholder="Describe el problema en detalle..."
                            value={formData.descripcion}
                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                            rows={4}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="prioridad">Prioridad</Label>
                        <Select
                            value={formData.prioridad}
                            onValueChange={(v) => setFormData({ ...formData, prioridad: v as Prioridad })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="NORMAL">Normal</SelectItem>
                                <SelectItem value="URGENTE">Urgente</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleCreate} disabled={createMutation.isPending}>
                        {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Crear Incidencia
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
