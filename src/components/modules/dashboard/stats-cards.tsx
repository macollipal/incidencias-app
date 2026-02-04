"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, AlertCircle, Calendar, CheckCircle } from "lucide-react";

interface StatsCardsProps {
    stats: {
        pendientes: number;
        urgentes: number;
        programadas: number;
        resueltasHoy: number;
    } | undefined;
    isResidente: boolean;
}

export function StatsCards({ stats, isResidente }: StatsCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                        {isResidente ? "Mis Pendientes" : "Pendientes"}
                    </CardTitle>
                    <Clock className="w-4 h-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats?.pendientes || 0}</div>
                    <p className="text-xs text-gray-500 mt-1">
                        {isResidente ? "Incidencias pendientes" : "Incidencias sin asignar"}
                    </p>
                </CardContent>
            </Card>

            <Card className={stats?.urgentes ? "border-red-200 bg-red-50" : ""}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className={`text-sm font-medium ${stats?.urgentes ? "text-red-600" : "text-gray-600"}`}>
                        Urgentes
                    </CardTitle>
                    <AlertCircle className={`w-4 h-4 ${stats?.urgentes ? "text-red-500" : "text-gray-400"}`} />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${stats?.urgentes ? "text-red-700" : ""}`}>
                        {stats?.urgentes || 0}
                    </div>
                    <p className={`text-xs mt-1 ${stats?.urgentes ? "text-red-600" : "text-gray-500"}`}>
                        Requieren atención inmediata
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                        Programadas
                    </CardTitle>
                    <Calendar className="w-4 h-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats?.programadas || 0}</div>
                    <p className="text-xs text-gray-500 mt-1">
                        Con visita agendada
                    </p>
                </CardContent>
            </Card>

            <Card className={stats?.resueltasHoy ? "border-green-200 bg-green-50" : ""}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className={`text-sm font-medium ${stats?.resueltasHoy ? "text-green-600" : "text-gray-600"}`}>
                        Resueltas hoy
                    </CardTitle>
                    <CheckCircle className={`w-4 h-4 ${stats?.resueltasHoy ? "text-green-500" : "text-gray-400"}`} />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${stats?.resueltasHoy ? "text-green-700" : ""}`}>
                        {stats?.resueltasHoy || 0}
                    </div>
                    <p className={`text-xs mt-1 ${stats?.resueltasHoy ? "text-green-600" : "text-gray-500"}`}>
                        Cerradas en el día
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
