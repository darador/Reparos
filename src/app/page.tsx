'use client';

import { ProjectFormModal } from "@/components/projects/ProjectFormModal";
import { RepairFilters } from "@/components/repairs/RepairFilters";
import { RepairFormModal } from "@/components/repairs/RepairFormModal";
import { RepairTable } from "@/components/repairs/RepairTable";
import { LoadingState } from "@/components/shared/LoadingState";
import { MetricStrip } from "@/components/shared/MetricStrip";
import { LogEventModal } from "@/components/timeline/LogEventModal";
import { repository } from "@/lib/store/repository";
import { Project, Repair } from "@/lib/types/database";
import { ArrowRight, FolderGit2, Plus, Wrench } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function OperationalDashboard() {
  const [metrics, setMetrics] = useState(repository.getDashboardMetrics());
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(!repository.isLoaded);

  // Modals state
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isNewRepairOpen, setIsNewRepairOpen] = useState(false);
  const [selectedProjectForRepair, setSelectedProjectForRepair] = useState<string>('');
  const [selectedRepairForEvent, setSelectedRepairForEvent] = useState<Repair | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusId, setStatusId] = useState('all');
  const [responsibleId, setResponsibleId] = useState('all');
  const [priority, setPriority] = useState('all');
  const [typeId, setTypeId] = useState('all');
  const [onlyReiterated, setOnlyReiterated] = useState(false);

  const loadData = () => {
    setMetrics(repository.getDashboardMetrics());
    setProjects(repository.getProjects());
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
      loadData();
      setIsLoading(false);
    }
    init();
  }, [search, statusId, responsibleId, priority, typeId, onlyReiterated]);

  const handleCreateProject = async (data: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
    await repository.createProject(data);
    loadData();
  };

  const handleCreateRepair = async (data: any) => {
    await repository.createRepair(data);
    loadData();
  };

  const handleLogEvent = async (data: any) => {
    await repository.addRepairEvent(data);
    loadData();
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
      {/* Top Banner Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded shadow-2xs">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">
            Control de Proyectos e Incidencias
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión operacional de despliegues FTTH, atenciones y trazabilidad en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewProjectOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded font-medium shadow-2xs transition-colors"
          >
            <FolderGit2 className="h-3.5 w-3.5 text-blue-400" />
            <span>+ Proyecto</span>
          </button>
          <button
            onClick={() => {
              setSelectedProjectForRepair('');
              setIsNewRepairOpen(true);
            }}
            className="inline-flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded font-medium shadow-2xs transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ Reparo</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metric Strip */}
      <MetricStrip metrics={metrics} />

      {/* Main Table View */}
      <div className="bg-white border border-slate-200 rounded shadow-2xs p-3 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-amber-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Listado de Reparos Activos
            </h2>
            <span className="text-[11px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded">
              {repairs.length} registros
            </span>
          </div>

          <Link
            href="/reparos"
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
          >
            <span>Ver todos los reparos</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

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

        {isLoading ? (
          <LoadingState
            title="Cargando Panel de Control..."
            message="Conectando con Supabase para sincronizar proyectos, métricas e incidencias."
          />
        ) : (
          <RepairTable
            repairs={repairs}
            onLogEventClick={(repair) => setSelectedRepairForEvent(repair)}
            onRefresh={loadData}
          />
        )}
      </div>

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
        projects={projects}
        repairTypes={repository.getRepairTypes()}
        responsibleParties={repository.getResponsibleParties()}
        defaultProjectId={selectedProjectForRepair}
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
