"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TIPO_SERVICIO_LABELS, type TipoServicio } from "@/types";

interface IncidenciasPorTipoProps {
    stats: Array<{
        tipo: string;
        cantidad: number;
    }> | undefined;
}

export function IncidenciasPorTipo({ stats }: IncidenciasPorTipoProps) {
    if (!stats || stats.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Incidencias por Tipo de Servicio</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {stats.map((tipo) => (
                        <div key={tipo.tipo} className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-900">{tipo.cantidad}</div>
                            <div className="text-xs text-gray-500 mt-1">
                                {TIPO_SERVICIO_LABELS[tipo.tipo as TipoServicio]}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
