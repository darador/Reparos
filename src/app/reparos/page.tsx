'use client';

import { RepairFilters } from "@/components/repairs/RepairFilters";
import { RepairFormModal } from "@/components/repairs/RepairFormModal";
import { RepairTable } from "@/components/repairs/RepairTable";
import { LoadingState } from "@/components/shared/LoadingState";
import { LogEventModal } from "@/components/timeline/LogEventModal";
import { repository } from "@/lib/store/repository";
import { Repair } from "@/lib/types/database";
import { Plus, Wrench } from "lucide-react";
import { useEffect, useState } from "react";

export default function RepairsPage() {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [isLoading, setIsLoading] = useState(!repository.isLoaded);
  const [isNewRepairOpen, setIsNewRepairOpen] = useState(false);
  const [selectedRepairForEvent, setSelectedRepairForEvent] = useState<Repair | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusId, setStatusId] = useState('all');
  const [responsibleId, setResponsibleId] = useState('all');
  const [priority, setPriority] = useState('all');
  const [typeId, setTypeId] = useState('all');
  const [onlyReiterated, setOnlyReiterated] = useState(false);

  const loadRepairs = () => {
    setRepairs(repository.getRepairs({
      search,
      statusId,
      responsibleId,
      priority,
      typeId,
      onlyReiterated
    }));
  };

  useEffect(() => {
    async function init() {
      if (!repository.isLoaded) {
        setIsLoading(true);
        await repository.ensureLoaded();
      }
      loadRepairs();
      setIsLoading(false);
    }
    init();
  }, [search, statusId, responsibleId, priority, typeId, onlyReiterated]);

  const handleCreateRepair = async (data: any) => {
    await repository.createRepair(data);
    loadRepairs();
  };

  const handleLogEvent = async (data: any) => {
    await repository.addRepairEvent(data);
    loadRepairs();
  };

  const resetFilters = () => {
    setSearch('');
    setStatusId('all');
    setResponsibleId('all');
    setPriority('all');
    setTypeId('all');
    setOnlyReiterated(false);
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded shadow-2xs">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Wrench className="h-4 w-4 text-amber-600" />
            <span>Registro Global de Reparos e Incidencias</span>
            <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-medium">
              {repairs.length} {repairs.length === 1 ? 'reparo' : 'reparos'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Búsqueda, trazabilidad y control de problemas técnicos detectados en campo.
          </p>
        </div>

        <button
          onClick={() => setIsNewRepairOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded font-medium shadow-2xs transition-colors shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Nuevo Reparo</span>
        </button>
      </div>

      {/* Advanced Filters */}
      <RepairFilters
        search={search}
        onSearchChange={setSearch}
        statusId={statusId}
        onStatusChange={setStatusId}
        responsibleId={responsibleId}
        onResponsibleChange={setResponsibleId}
        priority={priority}
        onPriorityChange={setPriority}
        typeId={typeId}
        onTypeChange={setTypeId}
        onlyReiterated={onlyReiterated}
        onOnlyReiteratedChange={setOnlyReiterated}
        repairStatuses={repository.getRepairStatuses()}
        responsibleParties={repository.getResponsibleParties()}
        repairTypes={repository.getRepairTypes()}
        onResetFilters={resetFilters}
      />

      {/* Table or Loading State */}
      {isLoading ? (
        <LoadingState
          title="Cargando Reparos e Incidencias..."
          message="Obteniendo incidencias y trazabilidad de eventos desde la base de datos de Supabase."
        />
      ) : (
        <RepairTable
          repairs={repairs}
          onLogEventClick={(repair) => setSelectedRepairForEvent(repair)}
          onRefresh={loadRepairs}
        />
      )}

      {/* Modals */}
      <RepairFormModal
        isOpen={isNewRepairOpen}
        onClose={() => setIsNewRepairOpen(false)}
        onSubmit={handleCreateRepair}
        projects={repository.getProjects()}
        repairTypes={repository.getRepairTypes()}
        responsibleParties={repository.getResponsibleParties()}
      />

      {selectedRepairForEvent && (
        <LogEventModal
          isOpen={!!selectedRepairForEvent}
          onClose={() => setSelectedRepairForEvent(null)}
          onSubmit={handleLogEvent}
          repair={selectedRepairForEvent}
          responsibleParties={repository.getResponsibleParties()}
          repairStatuses={repository.getRepairStatuses()}
        />
      )}
    </div>
  );
}
