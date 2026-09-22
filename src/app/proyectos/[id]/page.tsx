'use client';

import { ProjectFormModal } from "@/components/projects/ProjectFormModal";
import { RepairFormModal } from "@/components/repairs/RepairFormModal";
import { RepairTable } from "@/components/repairs/RepairTable";
import { ProjectStatusBadge } from "@/components/shared/Badges";
import { LoadingState } from "@/components/shared/LoadingState";
import { LogEventModal } from "@/components/timeline/LogEventModal";
import { repository } from "@/lib/store/repository";
import { Project, Repair } from "@/lib/types/database";
import { ArrowLeft, Edit3, FolderGit2, Plus, Wrench } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | undefined>(undefined);
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isNewRepairOpen, setIsNewRepairOpen] = useState(false);
  const [selectedRepairForEvent, setSelectedRepairForEvent] = useState<Repair | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProjectData = () => {
    const proj = repository.getProjectById(projectId);
    setProject(proj);
    if (proj) {
      setRepairs(repository.getRepairs({ projectId }));
    }
  };

  useEffect(() => {
    async function init() {
      if (!repository.isLoaded) {
        setIsLoading(true);
        await repository.ensureLoaded();
      }
      loadProjectData();
      setIsLoading(false);
    }
    init();
  }, [projectId]);

  if (isLoading) {
    return (
      <LoadingState
        title="Cargando Proyecto..."
        message="Obteniendo la información general del proyecto y sus reparos desde Supabase."
      />
    );
  }

  if (!project) {
    return (
      <div className="bg-white border border-slate-200 rounded p-8 text-center text-slate-500">
        <FolderGit2 className="h-8 w-8 mx-auto text-slate-400 mb-2" />
        <p className="font-semibold text-slate-800">Proyecto no encontrado</p>
        <Link href="/proyectos" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
          ← Volver a la lista de proyectos
        </Link>
      </div>
    );
  }

  const handleUpdateProject = async (data: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
    await repository.updateProject(projectId, data);
    setIsEditProjectOpen(false);
    loadProjectData();
  };

  const handleCreateRepair = async (data: any) => {
    await repository.createRepair({ ...data, project_id: projectId });
    loadProjectData();
  };

  const handleLogEvent = async (data: any) => {
    await repository.addRepairEvent(data);
    loadProjectData();
  };

  const pendingCount = repairs.filter(r => r.current_status?.category !== 'closed').length;

  return (
    <div className="space-y-4">
      {/* Back button */}
      <div>
        <Link href="/proyectos" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 font-medium">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Volver a Proyectos</span>
        </Link>
      </div>

      {/* Compact Header card */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-lg font-bold text-slate-900">SIGEST: {project.sigest}</span>
              <span className="text-slate-400">/</span>
              <span className="font-mono text-base font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                Polígono: {project.poligono}
              </span>
              <ProjectStatusBadge status={project.situacion_operativa} />
            </div>
            {project.titulo && (
              <p className="text-xs text-slate-600 font-medium">{project.titulo}</p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsEditProjectOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded border border-slate-300 font-medium transition-colors"
              title="Editar datos del proyecto"
            >
              <Edit3 className="h-3.5 w-3.5 text-slate-600" />
              <span>Editar Proyecto</span>
            </button>

            <button
              onClick={() => setIsNewRepairOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded font-medium shadow-2xs transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nuevo Reparo en este Proyecto</span>
            </button>
          </div>
        </div>

        {/* Technical Data Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs bg-slate-50/80 p-2.5 rounded border border-slate-100">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Distrito</span>
            <span className="font-semibold text-slate-800">{project.distrito || '-'}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Central</span>
            <span className="font-semibold text-slate-800">{project.central || '-'}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Equipo Ejecutor</span>
            <span className="font-semibold text-slate-800">{project.ejecutor || '-'}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">CTOs / Alimentación</span>
            <span className="font-semibold font-mono text-slate-800">
              {project.ctos_count} CTOs {project.alimentacion ? `(${project.alimentacion})` : ''}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Reparos Totales</span>
            <span className="font-bold text-slate-900 font-mono text-sm">{repairs.length}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Pendientes</span>
            <span className={`font-bold font-mono text-sm ${pendingCount > 0 ? 'text-amber-700' : 'text-slate-600'}`}>
              {pendingCount}
            </span>
          </div>
        </div>

        {project.observaciones && (
          <div className="text-xs text-slate-600 bg-amber-50/40 p-2 rounded border border-amber-100">
            <strong className="text-amber-900">Observaciones del Proyecto:</strong> {project.observaciones}
          </div>
        )}
      </div>

      {/* Repairs associated table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Wrench className="h-3.5 w-3.5 text-slate-600" />
            <span>Reparos e Incidencias del Proyecto</span>
            <span className="text-slate-400 font-normal">({repairs.length})</span>
          </h2>
        </div>

        <RepairTable
          repairs={repairs}
          onLogEventClick={(r) => setSelectedRepairForEvent(r)}
          onRefresh={loadProjectData}
        />
      </div>

      {/* Modals */}
      <ProjectFormModal
        isOpen={isEditProjectOpen}
        projectToEdit={project}
        onClose={() => setIsEditProjectOpen(false)}
        onSubmit={handleUpdateProject}
      />

      <RepairFormModal
        isOpen={isNewRepairOpen}
        onClose={() => setIsNewRepairOpen(false)}
        onSubmit={handleCreateRepair}
        projects={[project]}
        repairTypes={repository.getRepairTypes()}
        responsibleParties={repository.getResponsibleParties()}
        defaultProjectId={project.id}
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
