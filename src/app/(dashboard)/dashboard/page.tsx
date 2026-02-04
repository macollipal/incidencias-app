"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEdificioStoreHydrated } from "@/hooks/use-edificio";
import { useEdificioStats } from "@/hooks/use-edificios";
import { StatsCards } from "@/components/modules/dashboard/stats-cards";
import { UrgenciasList } from "@/components/modules/dashboard/urgencias-list";
import { ProximasVisitas } from "@/components/modules/dashboard/proximas-visitas";
import { IncidenciasPorTipo } from "@/components/modules/dashboard/incidencias-por-tipo";
import { IncidenciaDetailModal } from "@/components/modules/dashboard/incidencia-detail-modal";
import { VisitaDetailModal } from "@/components/modules/dashboard/visita-detail-modal";
import { type Rol } from "@/types";

export default function DashboardPage() {
  const { data: session } = useSession();
  const { selectedEdificioId, isHydrated } = useEdificioStoreHydrated();
  const { data: stats, isLoading, error } = useEdificioStats(selectedEdificioId);

  const userRole = (session?.user?.rol as Rol) || "RESIDENTE";
  const isResidente = userRole === "RESIDENTE";

  // State for modals
  const [selectedIncidenciaId, setSelectedIncidenciaId] = useState<string | null>(null);
  const [incidenciaDetailOpen, setIncidenciaDetailOpen] = useState(false);
  const [selectedVisitaId, setSelectedVisitaId] = useState<string | null>(null);
  const [visitaDetailOpen, setVisitaDetailOpen] = useState(false);

  const handleOpenIncidenciaDetail = (id: string) => {
    setSelectedIncidenciaId(id);
    setIncidenciaDetailOpen(true);
  };

  const handleOpenVisitaDetail = (id: string) => {
    setSelectedVisitaId(id);
    setVisitaDetailOpen(true);
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

      <StatsCards stats={stats} isResidente={isResidente} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UrgenciasList
          incidencias={stats?.incidenciasUrgentes}
          onOpenDetail={handleOpenIncidenciaDetail}
          isResidente={isResidente}
        />

        {!isResidente && (
          <ProximasVisitas
            visitas={stats?.proximasVisitas}
            onOpenDetail={handleOpenVisitaDetail}
          />
        )}
      </div>

      <IncidenciasPorTipo stats={stats?.porTipo} />

      {/* Modals */}
      <IncidenciaDetailModal
        id={selectedIncidenciaId}
        open={incidenciaDetailOpen}
        onClose={() => {
          setIncidenciaDetailOpen(false);
          setSelectedIncidenciaId(null);
        }}
        isResidente={isResidente}
      />

      <VisitaDetailModal
        id={selectedVisitaId}
        open={visitaDetailOpen}
        onClose={() => {
          setVisitaDetailOpen(false);
          setSelectedVisitaId(null);
        }}
      />
    </div>
  );
}
