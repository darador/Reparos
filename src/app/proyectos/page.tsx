'use client';

import { ProjectFormModal } from "@/components/projects/ProjectFormModal";
import { ProjectTable } from "@/components/projects/ProjectTable";
import { RepairFormModal } from "@/components/repairs/RepairFormModal";
import { ConfirmDeleteModal } from "@/components/shared/ConfirmDeleteModal";
import { LoadingState } from "@/components/shared/LoadingState";
import { MetricStrip } from "@/components/shared/MetricStrip";
import { repository } from "@/lib/store/repository";
import { DashboardMetrics, Project } from "@/lib/types/database";
import { FolderGit2, Plus, Search, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function ProjectsPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalProjects: 0,
    activeProjects: 0,
    totalRepairs: 0,
    pendingRepairs: 0,
    reiteratedRepairs: 0,
    resolvedAwaitingVerification: 0,
    finalizedRepairs: 0
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [distrito, setDistrito] = useState('all');
  const [central, setCentral] = useState('all');
  const [isLoading, setIsLoading] = useState(!repository.isLoaded);

  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const [isNewRepairOpen, setIsNewRepairOpen] = useState(false);
  const [selectedProjectForRepair, setSelectedProjectForRepair] = useState<string>('');

  const loadProjects = () => {
    setMetrics(repository.getDashboardMetrics());
    setProjects(repository.getProjects({ search, status, distrito, central }));
  };

  useEffect(() => {
    async function init() {
      if (!repository.isLoaded) {
        setIsLoading(true);
        await repository.ensureLoaded();
      }
      loadProjects();
      setIsLoading(false);
    }
    init();
  }, [search, status, distrito, central]);

  const handleSaveProject = async (data: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
    if (projectToEdit) {
      await repository.updateProject(projectToEdit.id, data);
    } else {
      await repository.createProject(data);
    }
    setProjectToEdit(null);
    setIsNewProjectOpen(false);
    loadProjects();
  };

  const handleCreateRepair = async (data: any) => {
    await repository.createRepair(data);
    loadProjects();
  };

  const distritos = repository.getDistritos();
  const centrales = repository.getCentrales();

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded shadow-2xs">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FolderGit2 className="h-4 w-4 text-blue-600" />
            <span>Despliegues y Proyectos FTTH</span>
            <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-medium">
              {projects.length} {projects.length === 1 ? 'proyecto' : 'proyectos'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralización de proyectos FTTH identificados por la combinación única <strong className="text-slate-700">SIGEST + Polígono</strong>.
          </p>
        </div>

        <button
          onClick={() => {
            setProjectToEdit(null);
            setIsNewProjectOpen(true);
          }}
          className="inline-flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded font-medium shadow-2xs transition-colors shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Nuevo Proyecto</span>
        </button>
      </div>

      {/* Primary KPI Metric Strip */}
      <MetricStrip metrics={metrics} />

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 border border-slate-200 rounded shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por SIGEST, Polígono, Distrito o Ejecutor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-8 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Distrito Filter */}
          <select
            value={distrito}
            onChange={(e) => setDistrito(e.target.value)}
            className="border border-slate-300 rounded px-2.5 py-1.5 bg-white text-xs font-medium text-slate-800"
          >
            <option value="all">Todos los Distritos</option>
            {distritos.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Central Filter */}
          <select
            value={central}
            onChange={(e) => setCentral(e.target.value)}
            className="border border-slate-300 rounded px-2.5 py-1.5 bg-white text-xs font-medium text-slate-800"
          >
            <option value="all">Todas las Centrales</option>
            {centrales.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Situación Operativa Filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-slate-300 rounded px-2.5 py-1.5 bg-white text-xs font-medium"
          >
            <option value="all">Todas las situaciones</option>
            <option value="Demorado">Demorado</option>
            <option value="En ejecución">En ejecución</option>
            <option value="Finalizado">Finalizado</option>
            <option value="Con Reparación Pendiente">Con Reparación Pendiente</option>
          </select>
        </div>
      </div>

      {/* Table or Loading State */}
      {isLoading ? (
        <LoadingState
          title="Cargando Proyectos FTTH..."
          message="Conectando con la base de datos de Supabase para obtener la lista actualizada de proyectos y polígonos."
        />
      ) : (
        <ProjectTable
          projects={projects}
          onNewRepairClick={(proj) => {
            setSelectedProjectForRepair(proj.id);
            setIsNewRepairOpen(true);
          }}
          onEditProjectClick={(proj) => {
            setProjectToEdit(proj);
            setIsNewProjectOpen(true);
          }}
          onDeleteProjectClick={(proj) => {
            setProjectToDelete(proj);
          }}
        />
      )}

      {/* Modals */}
      <ProjectFormModal
        isOpen={isNewProjectOpen}
        projectToEdit={projectToEdit}
        onClose={() => {
          setIsNewProjectOpen(false);
          setProjectToEdit(null);
        }}
        onSubmit={handleSaveProject}
      />

      <RepairFormModal
        isOpen={isNewRepairOpen}
        onClose={() => {
          setIsNewRepairOpen(false);
          setSelectedProjectForRepair('');
        }}
        onSubmit={handleCreateRepair}
        projects={projects}
        repairTypes={repository.getRepairTypes()}
        responsibleParties={repository.getResponsibleParties()}
        defaultProjectId={selectedProjectForRepair}
      />

      {/* Delete Project Confirmation Modal */}
      {projectToDelete && (
        <ConfirmDeleteModal
          isOpen={!!projectToDelete}
          title="Confirmar eliminación de proyecto"
          description={
            <div className="space-y-2">
              <p>
                ¿Estás seguro de que deseas eliminar permanentemente el proyecto{" "}
                <strong className="text-slate-900 font-mono">
                  SIGEST {projectToDelete.sigest} / Polígono {projectToDelete.poligono}
                </strong>?
              </p>
              {(projectToDelete.repairs_count || 0) > 0 ? (
                <p className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded font-medium">
                  ⚠️ Atención: Este proyecto contiene {projectToDelete.repairs_count} reparo(s) asociado(s). Al eliminar el proyecto, también se borrarán todos sus reparos y su historial.
                </p>
              ) : (
                <p className="text-slate-500">
                  Esta acción eliminará el proyecto de la base de datos. No se puede deshacer.
                </p>
              )}
            </div>
          }
          confirmText="Eliminar Proyecto"
          onConfirm={async () => {
            await repository.deleteProject(projectToDelete.id);
            setProjectToDelete(null);
            loadProjects();
          }}
          onClose={() => setProjectToDelete(null)}
        />
      )}
    </div>
  );
}
