"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEdificioStoreHydrated } from "@/hooks/use-edificio";
import { useIncidencias, useUpdateIncidencia } from "@/hooks/use-incidencias";
import { toast } from "sonner";
import { type Rol } from "@/types";

// Modular Components
import { IncidenciaFilters } from "@/components/modules/incidencias/incidencia-filters";
import { IncidenciaTable } from "@/components/modules/incidencias/incidencia-table";
import { NuevaIncidenciaModal } from "@/components/modules/incidencias/nueva-incidencia-modal";
import { IncidenciaDetailModal } from "@/components/modules/incidencias/incidencia-detail-modal";
import { AsignarConserjeModal } from "@/components/modules/incidencias/asignar-conserje-modal";
import { ProgramarVisitaModal } from "@/components/modules/incidencias/programar-visita-modal";

export default function IncidenciasPage() {
  const { data: session } = useSession();
  const { selectedEdificioId, isHydrated } = useEdificioStoreHydrated();

  // Filters State
  const [filtroTipo, setFiltroTipo] = useState<string>("all");
  const [filtroEstado, setFiltroEstado] = useState<string>("all");
  const [busqueda, setBusqueda] = useState("");

  // Modals State
  const [nuevaModalOpen, setNuevaModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [asignarModalOpen, setAsignarModalOpen] = useState(false);
  const [visitaModalOpen, setVisitaModalOpen] = useState(false);

  // Selection State
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const userRole = (session?.user?.rol as Rol) || "RESIDENTE";
  const isResidente = userRole === "RESIDENTE";
  const isAdmin = userRole === "ADMIN_PLATAFORMA" || userRole === "ADMIN_EDIFICIO";

  const filters = {
    tipoServicio: filtroTipo !== "all" ? filtroTipo : undefined,
    estado: filtroEstado !== "all" ? filtroEstado : undefined,
  };

  const { data: incidencias, isLoading } = useIncidencias(selectedEdificioId, filters);
  const updateMutation = useUpdateIncidencia();

  const handleOpenDetail = (id: string) => {
    setSelectedId(id);
    setDetailModalOpen(true);
  };

  const handleOpenAsignar = (id: string) => {
    setSelectedId(id);
    setAsignarModalOpen(true);
  };

  const handleOpenVisita = (id: string) => {
    setSelectedId(id);
    setVisitaModalOpen(true);
  };

  const handleMarkUrgent = async (id: string) => {
    try {
      await updateMutation.mutateAsync({ id, data: { prioridad: "URGENTE" } });
      toast.success("Incidencia marcada como urgente");
    } catch (error) {
      toast.error("Error al actualizar");
    }
  };

  const handleCloseIncidencia = async (id: string) => {
    try {
      await updateMutation.mutateAsync({ id, data: { estado: "CERRADA" } });
      toast.success("Incidencia cerrada");
    } catch (error) {
      toast.error("Error al cerrar");
    }
  };

  if (!isHydrated || !selectedEdificioId) {
    return (
      <div className="flex items-center justify-center h-64">
        {!isHydrated ? (
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        ) : (
          <p className="text-gray-500">Selecciona un edificio para ver las incidencias</p>
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
        <Button onClick={() => setNuevaModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Incidencia
        </Button>
      </div>

      <IncidenciaFilters
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        filtroTipo={filtroTipo}
        onFiltroTipoChange={setFiltroTipo}
        filtroEstado={filtroEstado}
        onFiltroEstadoChange={setFiltroEstado}
      />

      <IncidenciaTable
        incidencias={incidenciasFiltradas}
        isLoading={isLoading}
        isAdmin={isAdmin}
        onOpenDetail={handleOpenDetail}
        onOpenAsignar={handleOpenAsignar}
        onOpenVisita={handleOpenVisita}
        onMarkUrgent={handleMarkUrgent}
        onCloseIncidencia={handleCloseIncidencia}
        isUpdatePending={updateMutation.isPending}
      />

      {/* Modals */}
      <NuevaIncidenciaModal
        open={nuevaModalOpen}
        onOpenChange={setNuevaModalOpen}
        edificioId={selectedEdificioId}
      />

      <IncidenciaDetailModal
        id={selectedId}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedId(null);
        }}
        userRole={userRole}
        userId={session?.user?.id || ""}
      />

      <AsignarConserjeModal
        id={selectedId}
        open={asignarModalOpen}
        onOpenChange={setAsignarModalOpen}
        edificioId={selectedEdificioId}
      />

      <ProgramarVisitaModal
        incidencia={incidencias?.find(i => i.id === selectedId)}
        open={visitaModalOpen}
        onOpenChange={setVisitaModalOpen}
        edificioId={selectedEdificioId}
      />
    </div>
  );
}
