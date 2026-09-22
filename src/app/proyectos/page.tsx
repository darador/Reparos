'use client';

import { ProjectFormModal } from "@/components/projects/ProjectFormModal";
import { ProjectTable } from "@/components/projects/ProjectTable";
import { RepairFormModal } from "@/components/repairs/RepairFormModal";
import { repository } from "@/lib/store/repository";
import { Project } from "@/lib/types/database";
import { FolderGit2, Plus, Search, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  const [isNewRepairOpen, setIsNewRepairOpen] = useState(false);
  const [selectedProjectForRepair, setSelectedProjectForRepair] = useState<string>('');

  const loadProjects = () => {
    setProjects(repository.getProjects({ search, status }));
  };

  useEffect(() => {
    loadProjects();
  }, [search, status]);

  const handleSaveProject = (data: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
    if (projectToEdit) {
      repository.updateProject(projectToEdit.id, data);
    } else {
      repository.createProject(data);
    }
    setProjectToEdit(null);
    setIsNewProjectOpen(false);
    loadProjects();
  };

  const handleCreateRepair = (data: any) => {
    repository.createRepair(data);
    loadProjects();
  };

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
          <span>Nuevo Proyecto FTTH</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80 relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por SIGEST, Polígono, Distrito, Ejecutor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
          <span className="text-slate-500 font-medium">Situación:</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white font-medium"
          >
            <option value="all">Todas las Situaciones</option>
            <option value="En preparación">En preparación</option>
            <option value="Asignado">Asignado</option>
            <option value="En ejecución">En ejecución</option>
            <option value="Demorado">Demorado</option>
            <option value="Rediseño">Rediseño</option>
            <option value="Finalizado">Finalizado</option>
          </select>
        </div>
      </div>

      {/* Projects Table */}
      <ProjectTable
        projects={projects}
        onEditProjectClick={(project) => {
          setProjectToEdit(project);
          setIsNewProjectOpen(true);
        }}
        onNewRepairClick={(project) => {
          setSelectedProjectForRepair(project.id);
          setIsNewRepairOpen(true);
        }}
      />

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
        onClose={() => setIsNewRepairOpen(false)}
        onSubmit={handleCreateRepair}
        projects={repository.getProjects()}
        repairTypes={repository.getRepairTypes()}
        responsibleParties={repository.getResponsibleParties()}
        defaultProjectId={selectedProjectForRepair}
      />
    </div>
  );
}
