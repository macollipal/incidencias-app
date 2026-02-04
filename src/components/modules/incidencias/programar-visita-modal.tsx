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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, CalendarPlus } from "lucide-react";
import { useEmpresas } from "@/hooks/use-empresas";
import { useCreateVisita } from "@/hooks/use-visitas";
import { toast } from "sonner";

interface ProgramarVisitaModalProps {
    incidencia: { id: string; descripcion: string; tipoServicio: string } | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    edificioId: string;
}

export function ProgramarVisitaModal({
    incidencia,
    open,
    onOpenChange,
    edificioId,
}: ProgramarVisitaModalProps) {
    const [formData, setFormData] = useState({
        empresaId: "",
        fecha: "",
        hora: "09:00",
        notas: "",
    });

    const { data: empresas } = useEmpresas();
    const createVisitaMutation = useCreateVisita();

    const empresasCompatibles = empresas?.filter(e =>
        e.tiposServicio?.includes(incidencia?.tipoServicio || "")
    ) || [];

    const handleCreateVisita = async () => {
        if (!formData.empresaId || !formData.fecha || !edificioId || !incidencia) {
            toast.error("Complete todos los campos requeridos");
            return;
        }

        try {
            const fechaHora = new Date(`${formData.fecha}T${formData.hora}`);
            await createVisitaMutation.mutateAsync({
                edificioId,
                empresaId: formData.empresaId,
                fechaProgramada: fechaHora.toISOString(),
                notas: formData.notas,
                incidenciaIds: [incidencia.id],
            });
            toast.success("Visita programada correctamente");
            onOpenChange(false);
            setFormData({ empresaId: "", fecha: "", hora: "09:00", notas: "" });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al programar visita");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarPlus className="w-5 h-5" />
                        Programar Visita Técnica
                    </DialogTitle>
                    <DialogDescription>
                        Asigna una empresa externa para resolver esta incidencia
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Empresa Mantenedora ({incidencia?.tipoServicio})</Label>
                        <Select value={formData.empresaId} onValueChange={(v) => setFormData({ ...formData, empresaId: v })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar empresa..." />
                            </SelectTrigger>
                            <SelectContent>
                                {empresasCompatibles.map((empresa) => (
                                    <SelectItem key={empresa.id} value={empresa.id}>
                                        {empresa.nombre}
                                    </SelectItem>
                                ))}
                                {empresasCompatibles.length === 0 && (
                                    <SelectItem value="none" disabled>No hay empresas para este rubro</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Fecha</Label>
                            <Input
                                type="date"
                                value={formData.fecha}
                                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Hora</Label>
                            <Input
                                type="time"
                                value={formData.hora}
                                onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Notas para la empresa</Label>
                        <Textarea
                            placeholder="Indicaciones especiales, contacto, etc."
                            value={formData.notas}
                            onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleCreateVisita}
                        disabled={!formData.empresaId || !formData.fecha || createVisitaMutation.isPending}
                    >
                        {createVisitaMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Programar Visita
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
