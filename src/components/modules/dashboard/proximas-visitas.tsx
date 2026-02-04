"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface ProximasVisitasProps {
    visitas: Array<{
        id: string;
        empresa: string;
        incidencias: number;
        fecha: string;
    }> | undefined;
    onOpenDetail: (id: string) => void;
}

export function ProximasVisitas({ visitas, onOpenDetail }: ProximasVisitasProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Próximas Visitas</CardTitle>
            </CardHeader>
            <CardContent>
                {visitas && visitas.length > 0 ? (
                    <div className="space-y-3">
                        {visitas.map((visita) => (
                            <div
                                key={visita.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                                <div className="flex-1 min-w-0 mr-3">
                                    <p className="font-medium text-gray-900">{visita.empresa}</p>
                                    <p className="text-sm text-gray-500">
                                        {visita.incidencias} incidencia(s) asignada(s)
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">
                                            {new Date(visita.fecha).toLocaleDateString("es-CL", {
                                                weekday: "short",
                                                day: "numeric",
                                                month: "short",
                                            })}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(visita.fecha).toLocaleTimeString("es-CL", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onOpenDetail(visita.id)}
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
                        No hay visitas programadas
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
