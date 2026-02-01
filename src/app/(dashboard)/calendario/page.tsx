"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, ChevronLeft, ChevronRight, Loader2, Clock, Trash2 } from "lucide-react";
import { useEdificioStoreHydrated } from "@/hooks/use-edificio";
import { useVisitas, useCreateVisita, useUpdateVisita } from "@/hooks/use-visitas";
import { useEmpresas } from "@/hooks/use-empresas";
import { useIncidencias } from "@/hooks/use-incidencias";
import { toast } from "sonner";
import { TIPO_SERVICIO_LABELS, type TipoServicio } from "@/types";
import { format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";

export default function CalendarioPage() {
  const { selectedEdificioId, isHydrated } = useEdificioStoreHydrated();
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [month, setMonth] = useState<Date | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVisita, setSelectedVisita] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    empresaId: "",
    fechaProgramada: undefined as Date | undefined,
    hora: "09:00",
    notas: "",
    incidenciaIds: [] as string[],
  });

  // Initialize dates on client side to avoid hydration mismatch
  useEffect(() => {
    const now = new Date();
    setDate(now);
    setMonth(now);
    setFormData((prev) => ({ ...prev, fechaProgramada: now }));
  }, []);

  const { data: visitas, isLoading: loadingVisitas } = useVisitas(selectedEdificioId);
  const { data: empresas } = useEmpresas();
  const { data: incidencias } = useIncidencias(selectedEdificioId, { estado: "PENDIENTE" });
  const createMutation = useCreateVisita();
  const updateMutation = useUpdateVisita();

  // Fechas con visitas para marcar en el calendario
  const fechasConVisitas = useMemo(() => {
    if (!visitas) return [];
    return visitas.map((v) => new Date(v.fechaProgramada));
  }, [visitas]);

  // Visitas del día seleccionado
  const visitasDelDia = useMemo(() => {
    if (!visitas || !date) return [];
    return visitas.filter((v) => isSameDay(new Date(v.fechaProgramada), date));
  }, [visitas, date]);

  // Empresa seleccionada para filtrar incidencias
  const empresaSeleccionada = empresas?.find((e) => e.id === formData.empresaId);
  const tiposEmpresa = empresaSeleccionada?.tiposServicio || [];

  // Incidencias compatibles con la empresa seleccionada
  const incidenciasCompatibles = useMemo(() => {
    if (!incidencias || tiposEmpresa.length === 0) return [];
    return incidencias.filter((i) => tiposEmpresa.includes(i.tipoServicio));
  }, [incidencias, tiposEmpresa]);

  if (!isHydrated || !selectedEdificioId) {
    return (
      <div className="flex items-center justify-center h-64">
        {!isHydrated ? (
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        ) : (
          <p className="text-gray-500">
            Selecciona un edificio para ver el calendario
          </p>
        )}
      </div>
    );
  }

  const handleIncidenciaToggle = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      incidenciaIds: prev.incidenciaIds.includes(id)
        ? prev.incidenciaIds.filter((i) => i !== id)
        : [...prev.incidenciaIds, id],
    }));
  };

  const handleCreate = async () => {
    if (!formData.empresaId || !selectedEdificioId || !formData.fechaProgramada) {
      toast.error("Seleccione una empresa y fecha");
      return;
    }

    try {
      const [hours, minutes] = formData.hora.split(":").map(Number);
      const fechaHora = new Date(formData.fechaProgramada);
      fechaHora.setHours(hours, minutes, 0, 0);

      await createMutation.mutateAsync({
        edificioId: selectedEdificioId,
        empresaId: formData.empresaId,
        fechaProgramada: fechaHora.toISOString(),
        notas: formData.notas || undefined,
        incidenciaIds: formData.incidenciaIds.length > 0 ? formData.incidenciaIds : undefined,
      });

      toast.success("Visita programada correctamente");
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear visita");
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await updateMutation.mutateAsync({
        id,
        data: { estado: "COMPLETADA" },
      });
      toast.success("Visita marcada como completada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar");
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await updateMutation.mutateAsync({
        id,
        data: { estado: "CANCELADA" },
      });
      toast.success("Visita cancelada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cancelar");
    }
  };

  const resetForm = () => {
    setFormData({
      empresaId: "",
      fechaProgramada: date || new Date(),
      hora: "09:00",
      notas: "",
      incidenciaIds: [],
    });
  };

  const openNewVisitaDialog = () => {
    setFormData((prev) => ({
      ...prev,
      fechaProgramada: date || new Date(),
    }));
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
          <p className="text-gray-500">Programa y gestiona visitas técnicas</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewVisitaDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Visita
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Programar Visita Técnica</DialogTitle>
              <DialogDescription>
                Selecciona una empresa y asigna incidencias a resolver
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Calendar
                    mode="single"
                    selected={formData.fechaProgramada}
                    onSelect={(d) => d && setFormData({ ...formData, fechaProgramada: d })}
                    className="rounded-md border"
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Hora</Label>
                    <Select
                      value={formData.hora}
                      onValueChange={(v) => setFormData({ ...formData, hora: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 8).map((hour) => (
                          <SelectItem key={hour} value={`${hour.toString().padStart(2, "0")}:00`}>
                            {hour.toString().padStart(2, "0")}:00
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Empresa</Label>
                    <Select
                      value={formData.empresaId}
                      onValueChange={(v) => setFormData({ ...formData, empresaId: v, incidenciaIds: [] })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        {empresas?.map((empresa) => (
                          <SelectItem key={empresa.id} value={empresa.id}>
                            {empresa.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {empresaSeleccionada && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {empresaSeleccionada.tiposServicio.map((tipo) => (
                          <Badge key={tipo} variant="outline" className="text-xs">
                            {TIPO_SERVICIO_LABELS[tipo as TipoServicio]}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Notas (opcional)</Label>
                    <Textarea
                      placeholder="Instrucciones adicionales..."
                      value={formData.notas}
                      onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {formData.empresaId && (
                <div className="space-y-2">
                  <Label>Incidencias a resolver ({formData.incidenciaIds.length} seleccionadas)</Label>
                  <div className="border rounded-lg max-h-48 overflow-y-auto">
                    {incidenciasCompatibles.length > 0 ? (
                      <div className="divide-y">
                        {incidenciasCompatibles.map((inc) => (
                          <div
                            key={inc.id}
                            className="flex items-center gap-3 p-3 hover:bg-gray-50"
                          >
                            <Checkbox
                              id={inc.id}
                              checked={formData.incidenciaIds.includes(inc.id)}
                              onCheckedChange={() => handleIncidenciaToggle(inc.id)}
                            />
                            <label htmlFor={inc.id} className="flex-1 cursor-pointer">
                              <p className="text-sm font-medium">{inc.descripcion}</p>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {TIPO_SERVICIO_LABELS[inc.tipoServicio as TipoServicio]}
                                </Badge>
                                {inc.prioridad === "URGENTE" && (
                                  <Badge variant="destructive" className="text-xs">
                                    Urgente
                                  </Badge>
                                )}
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 p-4 text-center">
                        No hay incidencias pendientes compatibles con esta empresa
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Programar Visita
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="capitalize">
                {month ? format(month, "MMMM yyyy", { locale: es }) : "Cargando..."}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => month && setMonth(new Date(month.getFullYear(), month.getMonth() - 1))}
                  disabled={!month}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => month && setMonth(new Date(month.getFullYear(), month.getMonth() + 1))}
                  disabled={!month}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              month={month}
              onMonthChange={setMonth}
              className="rounded-md border w-full"
              modifiers={{
                hasVisita: fechasConVisitas,
              }}
              modifiersStyles={{
                hasVisita: {
                  fontWeight: "bold",
                  backgroundColor: "rgb(219 234 254)",
                  borderRadius: "50%",
                },
              }}
              classNames={{
                months: "w-full",
                month: "w-full",
                table: "w-full",
                head_row: "flex w-full",
                head_cell: "flex-1 text-center text-sm font-medium text-gray-500",
                row: "flex w-full mt-2",
                cell: "flex-1 text-center p-0",
                day: "h-10 w-10 mx-auto rounded-full hover:bg-gray-100 flex items-center justify-center",
                day_selected: "bg-blue-600 text-white hover:bg-blue-700",
                day_today: "border border-blue-600",
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {date
                ? format(date, "EEEE d 'de' MMMM", { locale: es })
                : "Selecciona una fecha"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingVisitas ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : visitasDelDia.length > 0 ? (
              <div className="space-y-3">
                {visitasDelDia.map((visita) => (
                  <div
                    key={visita.id}
                    className={`p-3 rounded-lg border ${
                      visita.estado === "COMPLETADA"
                        ? "bg-green-50 border-green-200"
                        : visita.estado === "CANCELADA"
                        ? "bg-gray-100 border-gray-200"
                        : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">
                            {format(new Date(visita.fechaProgramada), "HH:mm")}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900 mt-1">
                          {visita.empresa.nombre}
                        </p>
                        <p className="text-sm text-gray-500">
                          {visita.incidencias.length} incidencia(s)
                        </p>
                      </div>
                      <Badge
                        variant={
                          visita.estado === "COMPLETADA"
                            ? "default"
                            : visita.estado === "CANCELADA"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {visita.estado === "PROGRAMADA"
                          ? "Programada"
                          : visita.estado === "COMPLETADA"
                          ? "Completada"
                          : "Cancelada"}
                      </Badge>
                    </div>
                    {visita.estado === "PROGRAMADA" && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleComplete(visita.id)}
                          disabled={updateMutation.isPending}
                        >
                          Completar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCancel(visita.id)}
                          disabled={updateMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    {visita.incidencias.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-gray-500 mb-2">Incidencias:</p>
                        <div className="space-y-1">
                          {visita.incidencias.map((inc) => (
                            <p key={inc.id} className="text-xs text-gray-600 truncate">
                              • {inc.descripcion}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">
                  No hay visitas para este día
                </p>
                <Button variant="outline" size="sm" onClick={openNewVisitaDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  Programar visita
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximas Visitas</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingVisitas ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-3">
              {visitas
                ?.filter((v) => v.estado === "PROGRAMADA" && new Date(v.fechaProgramada) >= new Date())
                .sort((a, b) => new Date(a.fechaProgramada).getTime() - new Date(b.fechaProgramada).getTime())
                .slice(0, 5)
                .map((visita) => (
                  <div
                    key={visita.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      setDate(new Date(visita.fechaProgramada));
                      setMonth(new Date(visita.fechaProgramada));
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[60px]">
                        <p className="text-2xl font-bold text-gray-900">
                          {format(new Date(visita.fechaProgramada), "d")}
                        </p>
                        <p className="text-xs text-gray-500 uppercase">
                          {format(new Date(visita.fechaProgramada), "MMM", { locale: es })}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{visita.empresa.nombre}</p>
                        <p className="text-sm text-gray-500">
                          {visita.incidencias.length} incidencia(s) · {format(new Date(visita.fechaProgramada), "HH:mm")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Programada</Badge>
                    </div>
                  </div>
                ))}
              {(!visitas || visitas.filter((v) => v.estado === "PROGRAMADA").length === 0) && (
                <p className="text-center text-gray-500 py-8">
                  No hay visitas programadas
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
