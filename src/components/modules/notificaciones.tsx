"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
    useNotificaciones,
    useMarcarNotificacionLeida,
    useMarcarTodasLeidas,
    useEliminarNotificacion,
    useLimpiarLeidas,
} from "@/hooks/use-notificaciones";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Bell,
    BellOff,
    CheckCheck,
    Trash2,
    AlertTriangle,
    TrendingUp,
    Ban,
    ExternalLink,
    UserCheck,
} from "lucide-react";
import { TIPO_SERVICIO_LABELS, ESTADO_INCIDENCIA_LABELS } from "@/types";

const TIPO_NOTIFICACION_CONFIG = {
    URGENCIA: {
        label: "Urgente",
        icon: AlertTriangle,
        color: "text-red-600",
        bgColor: "bg-red-50",
    },
    ESCALADA: {
        label: "Escalada",
        icon: TrendingUp,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
    },
    RECHAZADA: {
        label: "Rechazada",
        icon: Ban,
        color: "text-gray-600",
        bgColor: "bg-gray-50",
    },
    ASIGNACION: {
        label: "Asignada",
        icon: UserCheck,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
    },
};

export default function NotificacionesPage() {
    const [filtro, setFiltro] = useState<"todas" | "no-leidas">("todas");
    const { data: notificaciones, isLoading } = useNotificaciones(
        filtro === "no-leidas" ? { leida: false } : undefined
    );
    const marcarLeida = useMarcarNotificacionLeida();
    const marcarTodasLeidas = useMarcarTodasLeidas();
    const eliminarNotificacion = useEliminarNotificacion();
    const limpiarLeidas = useLimpiarLeidas();

    const handleMarcarLeida = (id: string, leida: boolean) => {
        marcarLeida.mutate({ id, leida: !leida });
    };

    const handleVerIncidencia = (id: string, leida: boolean) => {
        if (!leida) {
            marcarLeida.mutate({ id, leida: true });
        }
    };

    const handleEliminar = (id: string) => {
        if (confirm("¿Eliminar esta notificación?")) {
            eliminarNotificacion.mutate(id);
        }
    };

    const handleMarcarTodasLeidas = () => {
        if (confirm("¿Marcar todas las notificaciones como leídas?")) {
            marcarTodasLeidas.mutate();
        }
    };

    const handleLimpiarLeidas = () => {
        if (confirm("¿Eliminar todas las notificaciones leídas?")) {
            limpiarLeidas.mutate();
        }
    };

    const notificacionesNoLeidas = notificaciones?.filter((n) => !n.leida) || [];

    return (
        <div className="p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Notificaciones</h1>
                        <p className="text-gray-500 mt-1">
                            Mantente al día con las actualizaciones de incidencias
                        </p>
                    </div>
                    {notificacionesNoLeidas.length > 0 && (
                        <Button
                            variant="outline"
                            onClick={handleMarcarTodasLeidas}
                            disabled={marcarTodasLeidas.isPending}
                        >
                            <CheckCheck className="w-4 h-4 mr-2" />
                            Marcar todas como leídas
                        </Button>
                    )}
                    {notificaciones?.some(n => n.leida) && (
                        <Button
                            variant="ghost"
                            onClick={handleLimpiarLeidas}
                            disabled={limpiarLeidas.isPending}
                            className="text-gray-500 hover:text-red-600"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Limpiar leídas
                        </Button>
                    )}
                </div>

                {/* Tabs */}
                <Tabs value={filtro} onValueChange={(v) => setFiltro(v as typeof filtro)}>
                    <TabsList>
                        <TabsTrigger value="todas">
                            Todas
                            {notificaciones && (
                                <Badge variant="secondary" className="ml-2">
                                    {notificaciones.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="no-leidas">
                            No leídas
                            {notificacionesNoLeidas.length > 0 && (
                                <Badge className="ml-2 bg-blue-600">
                                    {notificacionesNoLeidas.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value={filtro} className="mt-6">
                        {isLoading ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500">Cargando notificaciones...</p>
                            </div>
                        ) : !notificaciones || notificaciones.length === 0 ? (
                            <Card className="p-12 text-center">
                                <BellOff className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    {filtro === "no-leidas"
                                        ? "No tienes notificaciones sin leer"
                                        : "No tienes notificaciones"}
                                </h3>
                                <p className="text-gray-500">
                                    {filtro === "no-leidas"
                                        ? "¡Estás al día con todas tus notificaciones!"
                                        : "Las notificaciones aparecerán aquí cuando haya actualizaciones"}
                                </p>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {notificaciones.map((notificacion) => {
                                    const config =
                                        TIPO_NOTIFICACION_CONFIG[
                                        notificacion.tipo as keyof typeof TIPO_NOTIFICACION_CONFIG
                                        ] || TIPO_NOTIFICACION_CONFIG.URGENCIA;
                                    const Icon = config.icon;

                                    return (
                                        <Card
                                            key={notificacion.id}
                                            className={`p-4 transition-colors ${!notificacion.leida
                                                ? "bg-blue-50 border-blue-200"
                                                : "bg-white"
                                                }`}
                                        >
                                            <div className="flex gap-4">
                                                {/* Indicador visual */}
                                                <div className="flex-shrink-0">
                                                    <div
                                                        className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center`}
                                                    >
                                                        <Icon className={`w-5 h-5 ${config.color}`} />
                                                    </div>
                                                </div>

                                                {/* Contenido */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-4 mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className={config.color}>
                                                                {config.label}
                                                            </Badge>
                                                            <Badge variant="secondary">
                                                                {
                                                                    TIPO_SERVICIO_LABELS[
                                                                    notificacion.incidencia
                                                                        .tipoServicio as keyof typeof TIPO_SERVICIO_LABELS
                                                                    ]
                                                                }
                                                            </Badge>
                                                            {!notificacion.leida && (
                                                                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-gray-500 whitespace-nowrap">
                                                            {formatDistanceToNow(new Date(notificacion.createdAt), {
                                                                addSuffix: true,
                                                                locale: es,
                                                            })}
                                                        </span>
                                                    </div>

                                                    <p className="text-sm text-gray-900 mb-2 line-clamp-2">
                                                        {notificacion.incidencia.descripcion}
                                                    </p>

                                                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                                        {notificacion.incidencia.edificio && (
                                                            <>
                                                                <span>{notificacion.incidencia.edificio.nombre}</span>
                                                                <span>•</span>
                                                            </>
                                                        )}
                                                        <Badge variant="outline" className="text-xs">
                                                            {
                                                                ESTADO_INCIDENCIA_LABELS[
                                                                notificacion.incidencia
                                                                    .estado as keyof typeof ESTADO_INCIDENCIA_LABELS
                                                                ]
                                                            }
                                                        </Badge>
                                                    </div>

                                                    {/* Acciones */}
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            asChild
                                                            onClick={() => handleVerIncidencia(notificacion.id, notificacion.leida)}
                                                        >
                                                            <Link href={`/incidencias?id=${notificacion.incidenciaId}`}>
                                                                <ExternalLink className="w-3 h-3 mr-1" />
                                                                Ver incidencia
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleMarcarLeida(notificacion.id, notificacion.leida)
                                                            }
                                                            disabled={marcarLeida.isPending}
                                                        >
                                                            {notificacion.leida ? (
                                                                <>
                                                                    <Bell className="w-3 h-3 mr-1" />
                                                                    Marcar como no leída
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <CheckCheck className="w-3 h-3 mr-1" />
                                                                    Marcar como leída
                                                                </>
                                                            )}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEliminar(notificacion.id)}
                                                            disabled={eliminarNotificacion.isPending}
                                                        >
                                                            <Trash2 className="w-3 h-3 mr-1" />
                                                            Eliminar
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
