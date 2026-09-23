'use client';

import { ProjectFormModal } from "@/components/projects/ProjectFormModal";
import { RepairFilters } from "@/components/repairs/RepairFilters";
import { RepairFormModal } from "@/components/repairs/RepairFormModal";
import { RepairReportModal } from "@/components/repairs/RepairReportModal";
import { RepairTable } from "@/components/repairs/RepairTable";
import { LoadingState } from "@/components/shared/LoadingState";
import { MetricStrip } from "@/components/shared/MetricStrip";
import { LogEventModal } from "@/components/timeline/LogEventModal";
import { repository } from "@/lib/store/repository";
import { DashboardMetrics, Repair } from "@/lib/types/database";
import { FileText, FolderGit2, Plus, Wrench } from "lucide-react";
import { useEffect, useState } from "react";

export default function RepairsPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalProjects: 0,
    activeProjects: 0,
    totalRepairs: 0,
    pendingRepairs: 0,
    reiteratedRepairs: 0,
    resolvedAwaitingVerification: 0,
    finalizedRepairs: 0
  });
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [isLoading, setIsLoading] = useState(!repository.isLoaded);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isNewRepairOpen, setIsNewRepairOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedRepairForEvent, setSelectedRepairForEvent] = useState<Repair | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusId, setStatusId] = useState('all');
  const [responsibleId, setResponsibleId] = useState('all');
  const [solicitante, setSolicitante] = useState('all');
  const [priority, setPriority] = useState('all');
  const [typeId, setTypeId] = useState('all');
  const [distrito, setDistrito] = useState('all');
  const [central, setCentral] = useState('all');
  const [onlyReiterated, setOnlyReiterated] = useState(false);

  const loadRepairs = () => {
    setMetrics(repository.getDashboardMetrics());
    setRepairs(repository.getRepairs({
      search,
      statusId,
      responsibleId,
      solicitante,
      priority,
      typeId,
      distrito,
      central,
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
  }, [search, statusId, responsibleId, solicitante, priority, typeId, distrito, central, onlyReiterated]);

  const handleCreateProject = async (data: any) => {
    await repository.createProject(data);
    setIsNewProjectOpen(false);
    loadRepairs();
  };

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
    setSolicitante('all');
    setPriority('all');
    setTypeId('all');
    setDistrito('all');
    setCentral('all');
    setOnlyReiterated(false);
  };

  const getActiveFiltersList = () => {
    const active: string[] = [];
    if (search.trim()) active.push(`Búsqueda: "${search.trim()}"`);
    if (statusId !== 'all') {
      const st = repository.getRepairStatuses().find(s => s.id === statusId);
      if (st) active.push(`Estado: ${st.name}`);
    }
    if (responsibleId !== 'all') {
      if (responsibleId.startsWith('sector:')) {
        active.push(`Sector: ${responsibleId.replace('sector:', '')}`);
      } else {
        const resp = repository.getResponsibleParties().find(r => r.id === responsibleId);
        if (resp) active.push(`Responsable: ${resp.name}`);
      }
    }
    if (solicitante !== 'all') {
      active.push(`Solicitante: ${solicitante}`);
    }
    if (priority !== 'all') active.push(`Prioridad: ${priority}`);
    if (typeId !== 'all') {
      const tp = repository.getRepairTypes().find(t => t.id === typeId);
      if (tp) active.push(`Tipo: ${tp.name}`);
    }
    if (distrito !== 'all') active.push(`Distrito: ${distrito}`);
    if (central !== 'all') active.push(`Central: ${central}`);
    if (onlyReiterated) active.push(`Solo Reiterados`);
    return active;
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

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsReportOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded font-semibold border border-slate-300 shadow-2xs transition-colors"
            title="Generar vista previa y reporte en texto para copiar y pegar en mail / Outlook"
          >
            <FileText className="h-3.5 w-3.5 text-slate-600" />
            <span>Generar reporte</span>
          </button>

          <button
            onClick={() => setIsNewProjectOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-1.5 rounded font-medium shadow-2xs transition-colors"
            title="Registrar un nuevo proyecto FTTH"
          >
            <FolderGit2 className="h-3.5 w-3.5 text-blue-400" />
            <span>+ Agregar Proyecto</span>
          </button>

          <button
            onClick={() => setIsNewRepairOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded font-medium shadow-2xs transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ Nuevo Reparo</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metric Strip */}
      <MetricStrip metrics={metrics} />

      {/* Advanced Filters */}
      <RepairFilters
        search={search}
        onSearchChange={setSearch}
        statusId={statusId}
        onStatusChange={setStatusId}
        responsibleId={responsibleId}
        onResponsibleChange={setResponsibleId}
        solicitante={solicitante}
        onSolicitanteChange={setSolicitante}
        solicitantes={repository.getSolicitantes()}
        priority={priority}
        onPriorityChange={setPriority}
        typeId={typeId}
        onTypeChange={setTypeId}
        distrito={distrito}
        onDistritoChange={setDistrito}
        central={central}
        onCentralChange={setCentral}
        onlyReiterated={onlyReiterated}
        onOnlyReiteratedChange={setOnlyReiterated}
        repairStatuses={repository.getRepairStatuses()}
        responsibleParties={repository.getResponsibleParties()}
        repairTypes={repository.getRepairTypes()}
        distritos={repository.getDistritos()}
        centrales={repository.getCentrales()}
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
      <ProjectFormModal
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        onSubmit={handleCreateProject}
      />

      <RepairFormModal
        isOpen={isNewRepairOpen}
        onClose={() => setIsNewRepairOpen(false)}
        onSubmit={handleCreateRepair}
        projects={repository.getProjects()}
        repairTypes={repository.getRepairTypes()}
        responsibleParties={repository.getResponsibleParties()}
      />

      <RepairReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        repairs={repairs}
        activeFilters={getActiveFiltersList()}
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
