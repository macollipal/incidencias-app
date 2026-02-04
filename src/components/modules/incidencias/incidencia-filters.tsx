"use client";

import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import { TIPO_SERVICIO_LABELS, ESTADO_INCIDENCIA_LABELS } from "@/types";

interface IncidenciaFiltersProps {
    busqueda: string;
    onBusquedaChange: (v: string) => void;
    filtroTipo: string;
    onFiltroTipoChange: (v: string) => void;
    filtroEstado: string;
    onFiltroEstadoChange: (v: string) => void;
}

export function IncidenciaFilters({
    busqueda,
    onBusquedaChange,
    filtroTipo,
    onFiltroTipoChange,
    filtroEstado,
    onFiltroEstadoChange,
}: IncidenciaFiltersProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                    placeholder="Buscar incidencias..."
                    className="pl-9"
                    value={busqueda}
                    onChange={(e) => onBusquedaChange(e.target.value)}
                />
            </div>
            <div className="flex gap-2">
                <Select value={filtroTipo} onValueChange={onFiltroTipoChange}>
                    <SelectTrigger className="w-[180px]">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los tipos</SelectItem>
                        {Object.entries(TIPO_SERVICIO_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={filtroEstado} onValueChange={onFiltroEstadoChange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        {Object.entries(ESTADO_INCIDENCIA_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
