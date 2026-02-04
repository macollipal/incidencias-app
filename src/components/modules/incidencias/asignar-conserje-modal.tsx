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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, UserPlus } from "lucide-react";
import { useAsignarConserje, useConserjes } from "@/hooks/use-incidencias";
import { toast } from "sonner";

interface AsignarConserjeModalProps {
    id: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    edificioId: string;
}

export function AsignarConserjeModal({
    id,
    open,
    onOpenChange,
    edificioId,
}: AsignarConserjeModalProps) {
    const [conserjeSeleccionado, setConserjeSeleccionado] = useState<string>("");
    const { data: conserjes, isLoading: loadingConserjes } = useConserjes(edificioId);
    const asignarMutation = useAsignarConserje();

    const handleAsignarConserje = async () => {
        if (!conserjeSeleccionado || !id) {
            toast.error("Seleccione un conserje");
            return;
        }

        try {
            await asignarMutation.mutateAsync({
                id,
                data: { asignadoAId: conserjeSeleccionado },
            });
            toast.success("Incidencia asignada correctamente");
            onOpenChange(false);
            setConserjeSeleccionado("");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al asignar incidencia");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5" />
                        Asignar a Conserje
                    </DialogTitle>
                    <DialogDescription>
                        Selecciona el personal que verificará la incidencia
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    {loadingConserjes ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Conserje</label>
                                <Select value={conserjeSeleccionado} onValueChange={setConserjeSeleccionado}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar conserje..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {conserjes?.map((conserje) => (
                                            <SelectItem key={conserje.id} value={conserje.id}>
                                                {conserje.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleAsignarConserje}
                        disabled={!conserjeSeleccionado || asignarMutation.isPending}
                    >
                        {asignarMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Asignar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
