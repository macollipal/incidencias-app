"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  Clock,
  CheckCircle,
  Calendar,
  Loader2,
  Eye,
  UserCheck,
  AlertTriangle,
  Wrench,
  XCircle,
  MessageSquare,
  Send,
  Phone,
  Mail,
  Building2,
  PlayCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useEdificioStoreHydrated } from "@/hooks/use-edificio";
import { useEdificioStats } from "@/hooks/use-edificios";
import {
  useIncidencia,
  useComentarios,
  useAddComentario,
  useUpdateIncidencia,
} from "@/hooks/use-incidencias";
import { useVisita, useUpdateVisita } from "@/hooks/use-visitas";
import {
  TIPO_SERVICIO_LABELS,
  ESTADO_INCIDENCIA_LABELS,
  ESTADO_INCIDENCIA_COLORS,
  TIPO_RESOLUCION_LABELS,
  type TipoServicio,
  type EstadoIncidencia,
  type TipoResolucion,
  type Rol,
} from "@/types";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

export default function DashboardPage() {
  const { data: session } = useSession();
  const { selectedEdificioId, isHydrated } = useEdificioStoreHydrated();
  const { data: stats, isLoading, error } = useEdificioStats(selectedEdificioId);

  const userRole = (session?.user?.rol as Rol) || "RESIDENTE";
  const isResidente = userRole === "RESIDENTE";

  // State for incident detail dialog
  const [selectedIncidenciaId, setSelectedIncidenciaId] = useState<string | null>(null);
  const [incidenciaDetailOpen, setIncidenciaDetailOpen] = useState(false);
  const [nuevoComentario, setNuevoComentario] = useState("");

  // State for visit detail dialog
  const [selectedVisitaId, setSelectedVisitaId] = useState<string | null>(null);
  const [visitaDetailOpen, setVisitaDetailOpen] = useState(false);

  // Hooks for incident details
  const { data: incidenciaDetalle, isLoading: loadingIncidencia } = useIncidencia(selectedIncidenciaId);
  const { data: comentarios, isLoading: loadingComentarios } = useComentarios(selectedIncidenciaId);
  const addComentarioMutation = useAddComentario();
  const updateIncidenciaMutation = useUpdateIncidencia();

  // Hooks for visit details
  const { data: visitaDetalle, isLoading: loadingVisita } = useVisita(selectedVisitaId);
  const updateVisitaMutation = useUpdateVisita();

  // Handlers for incident dialog
  const handleOpenIncidenciaDetail = (id: string) => {
    setSelectedIncidenciaId(id);
    setIncidenciaDetailOpen(true);
  };

  const handleCloseIncidenciaDetail = () => {
    setIncidenciaDetailOpen(false);
    setSelectedIncidenciaId(null);
    setNuevoComentario("");
  };

  const handleAddComentario = async () => {
    if (!nuevoComentario.trim() || !selectedIncidenciaId) return;
    try {
      await addComentarioMutation.mutateAsync({
        incidenciaId: selectedIncidenciaId,
        contenido: nuevoComentario.trim(),
      });
      setNuevoComentario("");
      toast.success("Comentario agregado");
    } catch {
      toast.error("Error al agregar comentario");
    }
  };

  const handleResolverIncidencia = async () => {
    if (!selectedIncidenciaId) return;
    try {
      await updateIncidenciaMutation.mutateAsync({
        id: selectedIncidenciaId,
        data: { estado: "RESUELTA", tipoResolucion: "CONSERJE" },
      });
      toast.success("Incidencia marcada como resuelta");
      handleCloseIncidenciaDetail();
    } catch {
      toast.error("Error al resolver incidencia");
    }
  };

  // Handlers for visit dialog
  const handleOpenVisitaDetail = (id: string) => {
    setSelectedVisitaId(id);
    setVisitaDetailOpen(true);
  };

  const handleCloseVisitaDetail = () => {
    setVisitaDetailOpen(false);
    setSelectedVisitaId(null);
  };

  const handleUpdateVisitaEstado = async (estado: "PROGRAMADA" | "EN_PROGRESO" | "COMPLETADA" | "CANCELADA") => {
    if (!selectedVisitaId) return;
    try {
      await updateVisitaMutation.mutateAsync({
        id: selectedVisitaId,
        data: { estado },
      });
      toast.success(`Visita ${estado === "COMPLETADA" ? "completada" : estado === "EN_PROGRESO" ? "iniciada" : "cancelada"}`);
      if (estado === "COMPLETADA" || estado === "CANCELADA") {
        handleCloseVisitaDetail();
      }
    } catch {
      toast.error("Error al actualizar visita");
    }
  };

  // Build timeline from incident data
  const buildTimeline = () => {
    if (!incidenciaDetalle) return [];
    const timeline: Array<{
      icon: React.ReactNode;
      title: string;
      description: string;
      date: string;
      estado: string;
    }> = [];

    timeline.push({
      icon: <Clock className="w-4 h-4" />,
      title: "Incidencia creada",
      description: `Reportada por ${incidenciaDetalle.usuario.nombre}`,
      date: incidenciaDetalle.createdAt,
      estado: "PENDIENTE",
    });

    if (incidenciaDetalle.asignadoEl) {
      timeline.push({
        icon: <UserCheck className="w-4 h-4" />,
        title: "Asignada a conserje",
        description: `Asignada a ${incidenciaDetalle.asignadoA?.nombre || "conserje"}`,
        date: incidenciaDetalle.asignadoEl,
        estado: "ASIGNADA",
      });
    }

    if (incidenciaDetalle.verificadoEl) {
      timeline.push({
        icon: <Eye className="w-4 h-4" />,
        title: "Verificada en terreno",
        description: incidenciaDetalle.descripcionVerificada || "Verificación completada",
        date: incidenciaDetalle.verificadoEl,
        estado: "ASIGNADA",
      });
    }

    if (incidenciaDetalle.escaladaEl) {
      timeline.push({
        icon: <AlertTriangle className="w-4 h-4" />,
        title: "Escalada a administrador",
        description: "Requiere empresa externa",
        date: incidenciaDetalle.escaladaEl,
        estado: "ESCALADA",
      });
    }

    if (incidenciaDetalle.visita) {
      timeline.push({
        icon: <Calendar className="w-4 h-4" />,
        title: "Visita programada",
        description: `${incidenciaDetalle.visita.empresa.nombre} - ${new Date(incidenciaDetalle.visita.fechaProgramada).toLocaleDateString("es-CL")}`,
        date: incidenciaDetalle.visita.fechaProgramada,
        estado: "PROGRAMADA",
      });
    }

    if (incidenciaDetalle.estado === "EN_PROGRESO" || incidenciaDetalle.tipoResolucion === "EMPRESA_EXTERNA") {
      if (incidenciaDetalle.visita) {
        timeline.push({
          icon: <Wrench className="w-4 h-4" />,
          title: "Trabajo en progreso",
          description: `${incidenciaDetalle.visita.empresa.nombre} trabajando`,
          date: incidenciaDetalle.updatedAt,
          estado: "EN_PROGRESO",
        });
      }
    }

    if (incidenciaDetalle.estado === "RESUELTA" || incidenciaDetalle.estado === "CERRADA") {
      timeline.push({
        icon: <CheckCircle2 className="w-4 h-4" />,
        title: "Resuelta",
        description: incidenciaDetalle.tipoResolucion
          ? `${TIPO_RESOLUCION_LABELS[incidenciaDetalle.tipoResolucion as TipoResolucion]}${incidenciaDetalle.comentarioCierre ? `: ${incidenciaDetalle.comentarioCierre}` : ""}`
          : incidenciaDetalle.comentarioCierre || "Incidencia resuelta",
        date: incidenciaDetalle.updatedAt,
        estado: "RESUELTA",
      });
    }

    if (incidenciaDetalle.estado === "CERRADA" && incidenciaDetalle.closedAt) {
      timeline.push({
        icon: <XCircle className="w-4 h-4" />,
        title: "Cerrada",
        description: "Incidencia cerrada definitivamente",
        date: incidenciaDetalle.closedAt,
        estado: "CERRADA",
      });
    }

    return timeline;
  };

  if (!isHydrated || !selectedEdificioId) {
    return (
      <div className="flex items-center justify-center h-64">
        {!isHydrated ? (
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        ) : (
          <p className="text-gray-500">Selecciona un edificio para ver el dashboard</p>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">Error al cargar datos: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">
          {isResidente ? "Resumen de tus incidencias" : "Resumen de incidencias del edificio"}
        </p>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Incidencias Urgentes</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.incidenciasUrgentes && stats.incidenciasUrgentes.length > 0 ? (
              <div className="space-y-3">
                {stats.incidenciasUrgentes.map((incidencia) => (
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
                        onClick={() => handleOpenIncidenciaDetail(incidencia.id)}
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

        {/* Próximas Visitas - Solo visible para no residentes */}
        {!isResidente && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Próximas Visitas</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.proximasVisitas && stats.proximasVisitas.length > 0 ? (
                <div className="space-y-3">
                  {stats.proximasVisitas.map((visita) => (
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
                          onClick={() => handleOpenVisitaDetail(visita.id)}
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
        )}
      </div>

      {stats?.porTipo && stats.porTipo.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Incidencias por Tipo de Servicio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {stats.porTipo.map((tipo) => (
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
      )}

      {/* Incident Detail Dialog */}
      <Dialog open={incidenciaDetailOpen} onOpenChange={(open) => !open && handleCloseIncidenciaDetail()}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              Detalle de Incidencia
              {incidenciaDetalle && (
                <Badge className={ESTADO_INCIDENCIA_COLORS[incidenciaDetalle.estado as EstadoIncidencia]}>
                  {ESTADO_INCIDENCIA_LABELS[incidenciaDetalle.estado as EstadoIncidencia]}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Tracking completo de la incidencia
            </DialogDescription>
          </DialogHeader>

          {loadingIncidencia ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : incidenciaDetalle ? (
            <ScrollArea className="flex-1 min-h-0 max-h-[60vh] pr-4">
              <div className="space-y-6">
                {/* Info Section */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Tipo de Servicio</p>
                    <p className="font-medium">{TIPO_SERVICIO_LABELS[incidenciaDetalle.tipoServicio as TipoServicio]}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Prioridad</p>
                    <Badge variant={incidenciaDetalle.prioridad === "URGENTE" ? "destructive" : "secondary"}>
                      {incidenciaDetalle.prioridad}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Descripción</p>
                    <p className="font-medium">{incidenciaDetalle.descripcion}</p>
                  </div>
                  {incidenciaDetalle.asignadoA && (
                    <div>
                      <p className="text-sm text-gray-500">Asignado a</p>
                      <p className="font-medium">{incidenciaDetalle.asignadoA.nombre}</p>
                    </div>
                  )}
                  {incidenciaDetalle.tipoResolucion && (
                    <div>
                      <p className="text-sm text-gray-500">Tipo de Resolución</p>
                      <p className="font-medium">{TIPO_RESOLUCION_LABELS[incidenciaDetalle.tipoResolucion as TipoResolucion]}</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Timeline Section */}
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Timeline / Tracking
                  </h3>
                  <div className="relative pl-6 space-y-4">
                    {buildTimeline().map((item, index) => (
                      <div key={index} className="relative">
                        {index < buildTimeline().length - 1 && (
                          <div className="absolute left-[-16px] top-6 w-0.5 h-full bg-gray-200" />
                        )}
                        <div className={`absolute left-[-22px] top-1 w-4 h-4 rounded-full flex items-center justify-center ${
                          index === buildTimeline().length - 1
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}>
                          {item.icon}
                        </div>
                        <div className="pb-4">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{item.title}</p>
                            <Badge variant="outline" className="text-xs">
                              {ESTADO_INCIDENCIA_LABELS[item.estado as EstadoIncidencia]}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{item.description}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(item.date).toLocaleString("es-CL", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Comments Section */}
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Comentarios ({comentarios?.length || 0})
                  </h3>

                  {loadingComentarios ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <div className="space-y-3 mb-4">
                      {comentarios && comentarios.length > 0 ? (
                        comentarios.map((comentario) => (
                          <div key={comentario.id} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-sm">{comentario.usuario.nombre}</p>
                              <p className="text-xs text-gray-400">
                                {new Date(comentario.createdAt).toLocaleString("es-CL", {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })}
                              </p>
                            </div>
                            <p className="text-sm text-gray-700">{comentario.contenido}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm text-center py-4">
                          No hay comentarios aún
                        </p>
                      )}
                    </div>
                  )}

                  {/* Add comment */}
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Escribir un comentario..."
                      value={nuevoComentario}
                      onChange={(e) => setNuevoComentario(e.target.value)}
                      className="flex-1"
                      rows={2}
                    />
                    <Button
                      onClick={handleAddComentario}
                      disabled={!nuevoComentario.trim() || addComentarioMutation.isPending}
                      size="icon"
                      className="h-auto"
                    >
                      {addComentarioMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          ) : null}

          <DialogFooter className="gap-2">
            {/* Solo mostrar botón "Marcar Resuelta" para no-residentes */}
            {!isResidente && incidenciaDetalle && incidenciaDetalle.estado !== "RESUELTA" && incidenciaDetalle.estado !== "CERRADA" && (
              <Button
                variant="default"
                onClick={handleResolverIncidencia}
                disabled={updateIncidenciaMutation.isPending}
              >
                {updateIncidenciaMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Marcar Resuelta
              </Button>
            )}
            <Button variant="outline" onClick={handleCloseIncidenciaDetail}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Visit Detail Dialog */}
      <Dialog open={visitaDetailOpen} onOpenChange={(open) => !open && handleCloseVisitaDetail()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Detalle de Visita
              {visitaDetalle && (
                <Badge variant={
                  visitaDetalle.estado === "COMPLETADA" ? "default" :
                  visitaDetalle.estado === "EN_PROGRESO" ? "secondary" :
                  visitaDetalle.estado === "CANCELADA" ? "destructive" : "outline"
                }>
                  {visitaDetalle.estado}
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
          ) : visitaDetalle ? (
            <div className="space-y-6">
              {/* Company Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <Building2 className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{visitaDetalle.empresa.nombre}</h3>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                      {visitaDetalle.empresa.telefono && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {visitaDetalle.empresa.telefono}
                        </span>
                      )}
                      {visitaDetalle.empresa.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {visitaDetalle.empresa.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Schedule Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Fecha Programada</p>
                  <p className="text-lg font-semibold mt-1">
                    {new Date(visitaDetalle.fechaProgramada).toLocaleDateString("es-CL", {
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
                    {new Date(visitaDetalle.fechaProgramada).toLocaleTimeString("es-CL", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {visitaDetalle.notas && (
                <div>
                  <Label className="text-sm text-gray-500">Notas</Label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">{visitaDetalle.notas}</p>
                </div>
              )}

              <Separator />

              {/* Related Incidents */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Incidencias Asignadas ({visitaDetalle.incidencias?.length || 0})
                </h3>
                <div className="space-y-2">
                  {visitaDetalle.incidencias && visitaDetalle.incidencias.length > 0 ? (
                    visitaDetalle.incidencias.map((inc) => (
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
            {visitaDetalle && visitaDetalle.estado === "PROGRAMADA" && (
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
            {visitaDetalle && visitaDetalle.estado === "EN_PROGRESO" && (
              <Button
                variant="default"
                onClick={() => handleUpdateVisitaEstado("COMPLETADA")}
                disabled={updateVisitaMutation.isPending}
              >
                {updateVisitaMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Marcar Completada
              </Button>
            )}
            <Button variant="outline" onClick={handleCloseVisitaDetail}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
