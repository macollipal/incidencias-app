"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Search,
  Filter,
  Loader2,
  Eye,
  Clock,
  UserCheck,
  AlertTriangle,
  Calendar,
  CalendarPlus,
  Wrench,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Send,
  ClipboardCheck,
  ArrowUpCircle,
  UserPlus,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useEdificioStoreHydrated } from "@/hooks/use-edificio";
import {
  useIncidencias,
  useIncidencia,
  useCreateIncidencia,
  useUpdateIncidencia,
  useComentarios,
  useAddComentario,
  useResolverConserje,
  useEscalarIncidencia,
  useAsignarConserje,
  useConserjes,
} from "@/hooks/use-incidencias";
import { useEmpresas } from "@/hooks/use-empresas";
import { useCreateVisita } from "@/hooks/use-visitas";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  TIPO_SERVICIO_LABELS,
  ESTADO_INCIDENCIA_LABELS,
  ESTADO_INCIDENCIA_COLORS,
  TIPO_RESOLUCION_LABELS,
  type TipoServicio,
  type EstadoIncidencia,
  type Prioridad,
  type TipoResolucion,
  type Rol,
} from "@/types";

export default function IncidenciasPage() {
  const { data: session } = useSession();
  const { selectedEdificioId, isHydrated } = useEdificioStoreHydrated();
  const [filtroTipo, setFiltroTipo] = useState<string>("all");
  const [filtroEstado, setFiltroEstado] = useState<string>("all");
  const [busqueda, setBusqueda] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIncidenciaId, setSelectedIncidenciaId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [visitaDialogOpen, setVisitaDialogOpen] = useState(false);
  const [incidenciaParaVisita, setIncidenciaParaVisita] = useState<string | null>(null);
  const [asignarDialogOpen, setAsignarDialogOpen] = useState(false);
  const [incidenciaParaAsignar, setIncidenciaParaAsignar] = useState<string | null>(null);
  const [conserjeSeleccionado, setConserjeSeleccionado] = useState<string>("");

  const userRole = (session?.user?.rol as Rol) || "RESIDENTE";
  const isResidente = userRole === "RESIDENTE";
  const isAdmin = userRole === "ADMIN_PLATAFORMA" || userRole === "ADMIN_EDIFICIO";

  // Form state
  const [formData, setFormData] = useState({
    tipoServicio: "" as TipoServicio | "",
    descripcion: "",
    prioridad: "NORMAL" as Prioridad,
  });

  // Visit form state
  const [visitaFormData, setVisitaFormData] = useState({
    empresaId: "",
    fecha: "",
    hora: "09:00",
    notas: "",
  });

  // Conserje action form state
  const [conserjeFormData, setConserjeFormData] = useState({
    descripcionVerificada: "",
    comentarioCierre: "",
    marcarUrgente: false,
  });

  const filters = {
    tipoServicio: filtroTipo !== "all" ? filtroTipo : undefined,
    estado: filtroEstado !== "all" ? filtroEstado : undefined,
  };

  const { data: incidencias, isLoading } = useIncidencias(selectedEdificioId, filters);
  const { data: incidenciaDetalle, isLoading: loadingDetalle } = useIncidencia(selectedIncidenciaId);
  const { data: comentarios, isLoading: loadingComentarios } = useComentarios(selectedIncidenciaId);
  const { data: empresas } = useEmpresas();
  const createMutation = useCreateIncidencia();
  const updateMutation = useUpdateIncidencia();
  const addComentarioMutation = useAddComentario();
  const createVisitaMutation = useCreateVisita();
  const resolverMutation = useResolverConserje();
  const escalarMutation = useEscalarIncidencia();
  const asignarMutation = useAsignarConserje();
  const { data: conserjes, isLoading: loadingConserjes } = useConserjes(selectedEdificioId);

  // Get compatible companies for the incident
  const incidenciaParaVisitaData = incidencias?.find(i => i.id === incidenciaParaVisita);
  const empresasCompatibles = empresas?.filter(e =>
    e.tiposServicio?.includes(incidenciaParaVisitaData?.tipoServicio || "")
  ) || [];

  const handleOpenDetail = (id: string) => {
    setSelectedIncidenciaId(id);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedIncidenciaId(null);
    setNuevoComentario("");
    setConserjeFormData({
      descripcionVerificada: "",
      comentarioCierre: "",
      marcarUrgente: false,
    });
  };

  // Conserje helper functions
  const isConserje = userRole === "CONSERJE";
  const canConserjeAct = isConserje &&
    incidenciaDetalle?.estado === "ASIGNADA" &&
    incidenciaDetalle?.asignadoAId === session?.user?.id;

  const handleResolverIncidencia = async () => {
    if (!selectedIncidenciaId || !conserjeFormData.comentarioCierre.trim()) {
      toast.error("Debe indicar cómo se resolvió el problema");
      return;
    }

    try {
      await resolverMutation.mutateAsync({
        id: selectedIncidenciaId,
        data: {
          descripcionVerificada: conserjeFormData.descripcionVerificada || undefined,
          comentarioCierre: conserjeFormData.comentarioCierre.trim(),
        },
      });
      toast.success("Incidencia resuelta correctamente");
      handleCloseDetail();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al resolver incidencia");
    }
  };

  const handleEscalarIncidencia = async () => {
    if (!selectedIncidenciaId || !conserjeFormData.descripcionVerificada.trim()) {
      toast.error("Debe describir la verificación realizada (mínimo 10 caracteres)");
      return;
    }

    if (conserjeFormData.descripcionVerificada.trim().length < 10) {
      toast.error("La descripción debe tener al menos 10 caracteres");
      return;
    }

    try {
      await escalarMutation.mutateAsync({
        id: selectedIncidenciaId,
        data: {
          descripcionVerificada: conserjeFormData.descripcionVerificada.trim(),
          prioridad: conserjeFormData.marcarUrgente ? "URGENTE" : undefined,
        },
      });
      toast.success("Incidencia escalada al administrador");
      handleCloseDetail();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al escalar incidencia");
    }
  };

  const handleOpenVisitaDialog = (incidenciaId: string) => {
    setIncidenciaParaVisita(incidenciaId);
    setVisitaFormData({
      empresaId: "",
      fecha: "",
      hora: "09:00",
      notas: "",
    });
    setVisitaDialogOpen(true);
  };

  const handleCloseVisitaDialog = () => {
    setVisitaDialogOpen(false);
    setIncidenciaParaVisita(null);
  };

  const handleOpenAsignarDialog = (incidenciaId: string) => {
    setIncidenciaParaAsignar(incidenciaId);
    setConserjeSeleccionado("");
    setAsignarDialogOpen(true);
  };

  const handleCloseAsignarDialog = () => {
    setAsignarDialogOpen(false);
    setIncidenciaParaAsignar(null);
    setConserjeSeleccionado("");
  };

  const handleAsignarConserje = async () => {
    if (!conserjeSeleccionado || !incidenciaParaAsignar) {
      toast.error("Seleccione un conserje");
      return;
    }

    try {
      await asignarMutation.mutateAsync({
        id: incidenciaParaAsignar,
        data: { asignadoAId: conserjeSeleccionado },
      });
      toast.success("Incidencia asignada correctamente");
      handleCloseAsignarDialog();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al asignar incidencia");
    }
  };

  const handleCreateVisita = async () => {
    if (!visitaFormData.empresaId || !visitaFormData.fecha || !selectedEdificioId || !incidenciaParaVisita) {
      toast.error("Complete todos los campos requeridos");
      return;
    }

    try {
      const fechaHora = new Date(`${visitaFormData.fecha}T${visitaFormData.hora}`);
      await createVisitaMutation.mutateAsync({
        edificioId: selectedEdificioId,
        empresaId: visitaFormData.empresaId,
        fechaProgramada: fechaHora.toISOString(),
        notas: visitaFormData.notas,
        incidenciaIds: [incidenciaParaVisita],
      });
      toast.success("Visita programada correctamente");
      handleCloseVisitaDialog();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al programar visita");
    }
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
    } catch (error) {
      toast.error("Error al agregar comentario");
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

    // Created
    timeline.push({
      icon: <Clock className="w-4 h-4" />,
      title: "Incidencia creada",
      description: `Reportada por ${incidenciaDetalle.usuario.nombre}`,
      date: incidenciaDetalle.createdAt,
      estado: "PENDIENTE",
    });

    // Assigned
    if (incidenciaDetalle.asignadoEl) {
      timeline.push({
        icon: <UserCheck className="w-4 h-4" />,
        title: "Asignada a conserje",
        description: `Asignada a ${incidenciaDetalle.asignadoA?.nombre || "conserje"}`,
        date: incidenciaDetalle.asignadoEl,
        estado: "ASIGNADA",
      });
    }

    // Verified
    if (incidenciaDetalle.verificadoEl) {
      timeline.push({
        icon: <Eye className="w-4 h-4" />,
        title: "Verificada en terreno",
        description: incidenciaDetalle.descripcionVerificada || "Verificación completada",
        date: incidenciaDetalle.verificadoEl,
        estado: "ASIGNADA",
      });
    }

    // Escalated
    if (incidenciaDetalle.escaladaEl) {
      timeline.push({
        icon: <AlertTriangle className="w-4 h-4" />,
        title: "Escalada a administrador",
        description: "Requiere empresa externa",
        date: incidenciaDetalle.escaladaEl,
        estado: "ESCALADA",
      });
    }

    // Visit scheduled
    if (incidenciaDetalle.visita) {
      timeline.push({
        icon: <Calendar className="w-4 h-4" />,
        title: "Visita programada",
        description: `${incidenciaDetalle.visita.empresa.nombre} - ${new Date(incidenciaDetalle.visita.fechaProgramada).toLocaleDateString("es-CL")}`,
        date: incidenciaDetalle.visita.fechaProgramada,
        estado: "PROGRAMADA",
      });
    }

    // In progress
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

    // Resolved
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

    // Closed
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
          <p className="text-gray-500">
            Selecciona un edificio para ver las incidencias
          </p>
        )}
      </div>
    );
  }

  const incidenciasFiltradas = (incidencias || []).filter((inc) => {
    if (busqueda && !inc.descripcion.toLowerCase().includes(busqueda.toLowerCase())) {
      return false;
    }
    return true;
  });

  const getBadgeVariant = (estado: EstadoIncidencia) => {
    switch (estado) {
      case "PENDIENTE":
        return "secondary";
      case "PROGRAMADA":
        return "outline";
      case "EN_PROGRESO":
        return "default";
      case "RESUELTA":
      case "CERRADA":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const handleCreate = async () => {
    if (!formData.tipoServicio || !formData.descripcion || !selectedEdificioId) {
      toast.error("Complete todos los campos");
      return;
    }

    try {
      await createMutation.mutateAsync({
        edificioId: selectedEdificioId,
        tipoServicio: formData.tipoServicio,
        descripcion: formData.descripcion,
        prioridad: formData.prioridad,
      });
      toast.success("Incidencia creada correctamente");
      setDialogOpen(false);
      setFormData({ tipoServicio: "", descripcion: "", prioridad: "NORMAL" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear incidencia");
    }
  };

  const handleMarkUrgent = async (id: string) => {
    try {
      await updateMutation.mutateAsync({
        id,
        data: { prioridad: "URGENTE" },
      });
      toast.success("Incidencia marcada como urgente");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar");
    }
  };

  const handleClose = async (id: string) => {
    try {
      await updateMutation.mutateAsync({
        id,
        data: { estado: "CERRADA" },
      });
      toast.success("Incidencia cerrada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cerrar");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isResidente ? "Mis Incidencias" : "Incidencias"}
          </h1>
          <p className="text-gray-500">
            {isResidente ? "Reporta y sigue el estado de tus incidencias" : "Gestiona las incidencias del edificio"}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Incidencia
            </Button>
          </DialogTrigger>
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
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Crear Incidencia
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar incidencias..."
                className="pl-9"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
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
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
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
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Fecha</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Reportado por</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidenciasFiltradas.map((incidencia) => (
                  <TableRow key={incidencia.id}>
                    {/* Fecha - Primera columna para contexto temporal */}
                    <TableCell className="text-sm">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">
                          {new Date(incidencia.createdAt).toLocaleDateString("es-CL", { day: "2-digit", month: "short" })}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(incidencia.createdAt).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </TableCell>
                    {/* Descripción */}
                    <TableCell className="font-medium max-w-[280px] truncate">
                      {incidencia.descripcion}
                    </TableCell>
                    {/* Tipo de servicio */}
                    <TableCell>
                      <Badge variant="outline">
                        {TIPO_SERVICIO_LABELS[incidencia.tipoServicio as TipoServicio]}
                      </Badge>
                    </TableCell>
                    {/* Prioridad */}
                    <TableCell>
                      {incidencia.prioridad === "URGENTE" ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Urgente
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Normal</Badge>
                      )}
                    </TableCell>
                    {/* Estado - Con indicador visual mejorado */}
                    <TableCell>
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${ESTADO_INCIDENCIA_COLORS[incidencia.estado as EstadoIncidencia]}`}>
                        {/* Icono según estado */}
                        {incidencia.estado === "PENDIENTE" && <Clock className="w-3 h-3" />}
                        {incidencia.estado === "ASIGNADA" && <UserCheck className="w-3 h-3" />}
                        {incidencia.estado === "ESCALADA" && <AlertTriangle className="w-3 h-3" />}
                        {incidencia.estado === "PROGRAMADA" && <Calendar className="w-3 h-3" />}
                        {incidencia.estado === "EN_PROGRESO" && <Wrench className="w-3 h-3" />}
                        {incidencia.estado === "RESUELTA" && <CheckCircle2 className="w-3 h-3" />}
                        {incidencia.estado === "CERRADA" && <XCircle className="w-3 h-3" />}
                        {ESTADO_INCIDENCIA_LABELS[incidencia.estado as EstadoIncidencia]}
                      </div>
                    </TableCell>
                    {/* Reportado por */}
                    <TableCell className="text-gray-600">{incidencia.usuario.nombre}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDetail(incidencia.id)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                        {/* Botones de gestión - solo para admins */}
                        {isAdmin && (incidencia.estado === "PENDIENTE" || incidencia.estado === "ESCALADA") && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleOpenAsignarDialog(incidencia.id)}
                          >
                            <UserPlus className="w-4 h-4 mr-1" />
                            Asignar
                          </Button>
                        )}
                        {isAdmin && incidencia.estado === "ESCALADA" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenVisitaDialog(incidencia.id)}
                          >
                            <CalendarPlus className="w-4 h-4 mr-1" />
                            Programar Visita
                          </Button>
                        )}
                        {isAdmin && incidencia.prioridad !== "URGENTE" && incidencia.estado === "PENDIENTE" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkUrgent(incidencia.id)}
                            disabled={updateMutation.isPending}
                          >
                            Marcar urgente
                          </Button>
                        )}
                        {isAdmin && incidencia.estado !== "CERRADA" && incidencia.estado !== "RESUELTA" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleClose(incidencia.id)}
                            disabled={updateMutation.isPending}
                          >
                            Cerrar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {incidenciasFiltradas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No se encontraron incidencias
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={(open) => !open && handleCloseDetail()}>
        <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0 gap-0">
          {/* Header - FIJO */}
          <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
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

          {loadingDetalle ? (
            <div className="flex-1 flex justify-center items-center">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : incidenciaDetalle ? (
            <>
              {/* Contenido scrolleable - ÚNICO SCROLL */}
              <ScrollArea className="flex-1 min-h-0">
                <div className="px-6 py-4 space-y-6">
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

                  {/* Acciones del Conserje - Solo visible cuando puede actuar */}
                  {canConserjeAct && (
                    <>
                      <Separator />
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h3 className="font-semibold mb-4 flex items-center gap-2 text-blue-800">
                          <ClipboardCheck className="w-4 h-4" />
                          Acciones del Conserje
                        </h3>
                        <p className="text-sm text-blue-700 mb-4">
                          Esta incidencia está asignada a usted. Verifique en terreno y registre su análisis.
                        </p>

                        <div className="space-y-4">
                          {/* Campo de verificación */}
                          <div className="space-y-2">
                            <Label htmlFor="descripcionVerificada" className="text-sm font-medium">
                              Descripción de verificación / análisis técnico
                            </Label>
                            <Textarea
                              id="descripcionVerificada"
                              placeholder="Describa qué revisó, qué encontró y su diagnóstico técnico..."
                              value={conserjeFormData.descripcionVerificada}
                              onChange={(e) => setConserjeFormData(prev => ({
                                ...prev,
                                descripcionVerificada: e.target.value
                              }))}
                              className="min-h-[80px] bg-white"
                              rows={3}
                            />
                          </div>

                          {/* Campo de solución (para resolver) */}
                          <div className="space-y-2">
                            <Label htmlFor="comentarioCierre" className="text-sm font-medium">
                              Solución aplicada (si resolvió el problema)
                            </Label>
                            <Textarea
                              id="comentarioCierre"
                              placeholder="Describa cómo solucionó el problema..."
                              value={conserjeFormData.comentarioCierre}
                              onChange={(e) => setConserjeFormData(prev => ({
                                ...prev,
                                comentarioCierre: e.target.value
                              }))}
                              className="min-h-[60px] bg-white"
                              rows={2}
                            />
                          </div>

                          {/* Checkbox urgente (para escalar) */}
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="marcarUrgente"
                              checked={conserjeFormData.marcarUrgente}
                              onChange={(e) => setConserjeFormData(prev => ({
                                ...prev,
                                marcarUrgente: e.target.checked
                              }))}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                            <Label htmlFor="marcarUrgente" className="text-sm text-gray-700">
                              Marcar como urgente (al escalar)
                            </Label>
                          </div>

                          {/* Botones de acción */}
                          <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <Button
                              onClick={handleResolverIncidencia}
                              disabled={!conserjeFormData.comentarioCierre.trim() || resolverMutation.isPending}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              {resolverMutation.isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                              )}
                              Resolver Incidencia
                            </Button>
                            <Button
                              onClick={handleEscalarIncidencia}
                              disabled={conserjeFormData.descripcionVerificada.trim().length < 10 || escalarMutation.isPending}
                              variant="outline"
                              className="flex-1 border-amber-500 text-amber-700 hover:bg-amber-50"
                            >
                              {escalarMutation.isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <ArrowUpCircle className="w-4 h-4 mr-2" />
                              )}
                              Escalar a Administrador
                            </Button>
                          </div>

                          {/* Ayuda contextual */}
                          <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
                            <p><strong>Resolver:</strong> Use si pudo solucionar el problema. Requiere descripción de la solución.</p>
                            <p><strong>Escalar:</strong> Use si requiere empresa externa. Requiere análisis técnico (mín. 10 caracteres).</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

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
                          {/* Vertical line */}
                          {index < buildTimeline().length - 1 && (
                            <div className="absolute left-[-16px] top-6 w-0.5 h-full bg-gray-200" />
                          )}
                          {/* Dot */}
                          <div className={`absolute left-[-22px] top-1 w-4 h-4 rounded-full flex items-center justify-center ${
                            index === buildTimeline().length - 1
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 text-gray-600"
                          }`}>
                            {item.icon}
                          </div>
                          {/* Content */}
                          <div className="pb-4">
                            <div className="flex items-center gap-2 flex-wrap">
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
                      <div className="space-y-3">
                        {comentarios && comentarios.length > 0 ? (
                          comentarios.map((comentario) => (
                            <div key={comentario.id} className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
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
                  </div>
                </div>
              </ScrollArea>

              {/* Footer FIJO - Input de comentario y acciones */}
              <div className="flex-shrink-0 border-t bg-white px-6 py-4 space-y-4">
                {/* Input de nuevo comentario */}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Escribir un comentario..."
                    value={nuevoComentario}
                    onChange={(e) => setNuevoComentario(e.target.value)}
                    className="flex-1 min-h-[60px] max-h-[100px] resize-none"
                    rows={2}
                  />
                  <Button
                    onClick={handleAddComentario}
                    disabled={!nuevoComentario.trim() || addComentarioMutation.isPending}
                    className="self-end"
                  >
                    {addComentarioMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {/* Botón cerrar */}
                <div className="flex justify-end">
                  <Button variant="outline" onClick={handleCloseDetail}>
                    Cerrar
                  </Button>
                </div>
              </div>
            </>
          ) : null}

          {/* Footer para estado de carga/vacío */}
          {(loadingDetalle || !incidenciaDetalle) && (
            <DialogFooter className="flex-shrink-0 px-6 pb-6">
              <Button variant="outline" onClick={handleCloseDetail}>
                Cerrar
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Visit Dialog */}
      <Dialog open={visitaDialogOpen} onOpenChange={(open) => !open && handleCloseVisitaDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarPlus className="w-5 h-5" />
              Programar Visita Técnica
            </DialogTitle>
            <DialogDescription>
              {incidenciaParaVisitaData && (
                <span>
                  Para: {incidenciaParaVisitaData.descripcion.substring(0, 50)}
                  {incidenciaParaVisitaData.descripcion.length > 50 ? "..." : ""}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="empresa">Empresa</Label>
              <Select
                value={visitaFormData.empresaId}
                onValueChange={(v) => setVisitaFormData({ ...visitaFormData, empresaId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar empresa" />
                </SelectTrigger>
                <SelectContent>
                  {empresasCompatibles.length > 0 ? (
                    empresasCompatibles.map((empresa) => (
                      <SelectItem key={empresa.id} value={empresa.id}>
                        {empresa.nombre}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="_none" disabled>
                      No hay empresas compatibles
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {empresasCompatibles.length === 0 && empresas && empresas.length > 0 && (
                <p className="text-xs text-amber-600">
                  No hay empresas que atiendan "{TIPO_SERVICIO_LABELS[incidenciaParaVisitaData?.tipoServicio as TipoServicio]}".
                  Mostrando todas:
                </p>
              )}
              {empresasCompatibles.length === 0 && (
                <Select
                  value={visitaFormData.empresaId}
                  onValueChange={(v) => setVisitaFormData({ ...visitaFormData, empresaId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cualquier empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas?.map((empresa) => (
                      <SelectItem key={empresa.id} value={empresa.id}>
                        {empresa.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={visitaFormData.fecha}
                  onChange={(e) => setVisitaFormData({ ...visitaFormData, fecha: e.target.value })}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hora">Hora</Label>
                <Input
                  id="hora"
                  type="time"
                  value={visitaFormData.hora}
                  onChange={(e) => setVisitaFormData({ ...visitaFormData, hora: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notas">Notas (opcional)</Label>
              <Textarea
                id="notas"
                placeholder="Indicaciones adicionales para la visita..."
                value={visitaFormData.notas}
                onChange={(e) => setVisitaFormData({ ...visitaFormData, notas: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseVisitaDialog}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateVisita}
              disabled={!visitaFormData.empresaId || !visitaFormData.fecha || createVisitaMutation.isPending}
            >
              {createVisitaMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Programar Visita
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Conserje Dialog */}
      <Dialog open={asignarDialogOpen} onOpenChange={(open) => !open && handleCloseAsignarDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Asignar Conserje
            </DialogTitle>
            <DialogDescription>
              Seleccione el conserje que verificará esta incidencia en terreno
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="conserje">Conserje</Label>
              {loadingConserjes ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : conserjes && conserjes.length > 0 ? (
                <Select
                  value={conserjeSeleccionado}
                  onValueChange={setConserjeSeleccionado}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar conserje" />
                  </SelectTrigger>
                  <SelectContent>
                    {conserjes.map((conserje) => (
                      <SelectItem key={conserje.id} value={conserje.id}>
                        <div className="flex items-center justify-between w-full gap-4">
                          <span>{conserje.nombre}</span>
                          <Badge variant="outline" className="text-xs">
                            {conserje.incidenciasActivas} activas
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-amber-600 py-2">
                  No hay conserjes asignados a este edificio
                </p>
              )}
            </div>

            {conserjeSeleccionado && conserjes && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Conserje seleccionado:</strong>{" "}
                  {conserjes.find(c => c.id === conserjeSeleccionado)?.nombre}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  El conserje recibirá la incidencia y podrá verificarla en terreno.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseAsignarDialog}>
              Cancelar
            </Button>
            <Button
              onClick={handleAsignarConserje}
              disabled={!conserjeSeleccionado || asignarMutation.isPending}
            >
              {asignarMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Asignar Conserje
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
