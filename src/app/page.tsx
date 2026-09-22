'use client';

import { ProjectFormModal } from "@/components/projects/ProjectFormModal";
import { RepairFilters } from "@/components/repairs/RepairFilters";
import { RepairFormModal } from "@/components/repairs/RepairFormModal";
import { RepairTable } from "@/components/repairs/RepairTable";
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
    loadData();
  }, [search, statusId, responsibleId, priority, typeId, onlyReiterated]);

  const handleCreateProject = (data: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
    repository.createProject(data);
    loadData();
  };

  const handleCreateRepair = (data: any) => {
    repository.createRepair(data);
    loadData();
  };

  const handleLogEvent = (data: any) => {
    repository.addRepairEvent(data);
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
    <div className="space-y-5">
      {/* Top operational bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded shadow-2xs">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Vista Operacional de Reparos</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsNewProjectOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded border border-slate-300 font-medium transition-colors"
          >
            <FolderGit2 className="h-3.5 w-3.5 text-slate-600" />
            <span>+ Proyecto</span>
          </button>
          <button
            onClick={() => {
              setSelectedProjectForRepair('');
              setIsNewRepairOpen(true);
            }}
            className="inline-flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded font-medium shadow-2xs transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ Reparo</span>
          </button>
        </div>
      </div>

      {/* Metric strip */}
      <MetricStrip metrics={metrics} />

      {/* Main operational section - Full Width Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Wrench className="h-3.5 w-3.5 text-slate-600" />
            <span>Reparos e Incidencias en Seguimiento</span>
            <span className="text-slate-400 font-normal">({repairs.length})</span>
          </h2>
          <Link href="/reparos" className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1">
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

        <RepairTable
          repairs={repairs}
          onLogEventClick={(repair) => setSelectedRepairForEvent(repair)}
        />
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
