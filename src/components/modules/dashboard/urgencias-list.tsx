"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { TIPO_SERVICIO_LABELS, type TipoServicio } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface UrgenciasListProps {
    incidencias: Array<{
        id: string;
        descripcion: string;
        tipoServicio: string;
        createdAt: string;
    }> | undefined;
    onOpenDetail: (id: string) => void;
    isResidente: boolean;
}

export function UrgenciasList({ incidencias, onOpenDetail, isResidente }: UrgenciasListProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Incidencias Urgentes</CardTitle>
            </CardHeader>
            <CardContent>
                {incidencias && incidencias.length > 0 ? (
                    <div className="space-y-3">
                        {incidencias.map((incidencia) => (
                            <div
                                key={incidencia.id}
                                className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100"
                            >
                                <div className="flex-1 min-w-0 mr-3">
                                    <p className="font-medium text-gray-900 truncate">{incidencia.descripcion}</p>
                                    <p className="text-sm text-gray-500">
                                        {TIPO_SERVICIO_LABELS[incidencia.tipoServicio as TipoServicio]} ·
                                        Reportado {formatDistanceToNow(new Date(incidencia.createdAt), { addSuffix: true, locale: es })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="destructive">Urgente</Badge>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onOpenDetail(incidencia.id)}
                                    >
                                        <Eye className="w-4 h-4 mr-1" />
                                        Ver
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-8">
                        {isResidente ? "No tienes incidencias urgentes" : "No hay incidencias urgentes"}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
