'use client';

import { Project } from "@/lib/types/database";
import { formatDate } from "@/lib/utils";
import { ArrowUpRight, Edit3, FolderGit2, Wrench } from "lucide-react";
import Link from "next/link";
import { ProjectStatusBadge } from "../shared/Badges";

interface ProjectTableProps {
  projects: Project[];
  onNewRepairClick?: (project: Project) => void;
  onEditProjectClick?: (project: Project) => void;
}

export function ProjectTable({ projects, onNewRepairClick, onEditProjectClick }: ProjectTableProps) {
  if (projects.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded p-8 text-center text-slate-500">
        <FolderGit2 className="h-8 w-8 mx-auto text-slate-400 mb-2" />
        <p className="font-medium text-slate-700">No se encontraron proyectos</p>
        <p className="text-xs text-slate-500 mt-1">Intente ajustar los términos de búsqueda o cree un nuevo proyecto FTTH.</p>
      </div>
    );
  }

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>SIGEST / Polígono</th>
            <th>Distrito / Central</th>
            <th>Ejecutor</th>
            <th>CTOs / Alim.</th>
            <th>Situación</th>
            <th>Reparos</th>
            <th>Creación</th>
            <th className="text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project, index) => {
            const isEven = index % 2 === 0;
            const rowBgClass = isEven ? "bg-slate-50/70 hover:bg-blue-50/30" : "bg-white hover:bg-blue-50/30";

            return (
              <tr key={project.id} className={`${rowBgClass} transition-colors border-b border-slate-100`}>
                <td>
                  <Link 
                    href={`/proyectos/${project.id}`}
                    className="group flex flex-col font-medium text-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="font-extrabold text-slate-900 text-[13px] tracking-tight group-hover:text-blue-600 transition-colors">
                        {project.sigest}
                      </span>
                      <span className="text-slate-300 font-sans text-xs">/</span>
                      <span className="font-bold text-blue-700 bg-blue-50/90 border border-blue-200/90 px-1.5 py-0.5 rounded text-xs shadow-2xs group-hover:bg-blue-100 group-hover:border-blue-300 transition-colors">
                        {project.poligono}
                      </span>
                    </div>
                    {project.titulo && (
                      <span className="text-[11px] text-slate-500 font-normal line-clamp-1 group-hover:text-slate-700 mt-0.5">
                        {project.titulo}
                      </span>
                    )}
                  </Link>
                </td>
                <td>
                  <div className="flex flex-col text-xs">
                    <span className="text-slate-800 font-medium">{project.distrito || '-'}</span>
                    <span className="text-[11px] text-slate-500">{project.central || '-'}</span>
                  </div>
                </td>
                <td className="text-slate-800 font-medium">
                  {project.ejecutor || '-'}
                </td>
                <td>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                      {project.ctos_count} CTOs
                    </span>
                    {project.alimentacion && (
                      <span className="text-[11px] text-slate-500 font-mono">
                        {project.alimentacion}
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <ProjectStatusBadge status={project.situacion_operativa} />
                </td>
                <td>
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    <span className="font-semibold text-slate-900">{project.repairs_count || 0}</span>
                    {(project.pending_repairs_count || 0) > 0 && (
                      <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] px-1 rounded font-bold">
                        {project.pending_repairs_count} pend.
                      </span>
                    )}
                  </div>
                </td>
                <td className="text-xs text-slate-600">
                  {formatDate(project.created_at)}
                </td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {onEditProjectClick && (
                      <button
                        onClick={() => onEditProjectClick(project)}
                        className="inline-flex items-center gap-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-800 px-2 py-1 rounded border border-slate-300 font-medium transition-colors"
                        title="Editar datos del proyecto (Distrito, Central, Ejecutor, CTOs, Alimentación)"
                      >
                        <Edit3 className="h-3 w-3 text-slate-600" />
                        <span>Editar</span>
                      </button>
                    )}
                    {onNewRepairClick && (
                      <button
                        onClick={() => onNewRepairClick(project)}
                        className="inline-flex items-center gap-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-800 px-2 py-1 rounded border border-slate-300 font-medium transition-colors"
                        title="Agregar Reparo a este Proyecto"
                      >
                        <Wrench className="h-3 w-3 text-slate-600" />
                        <span>+ Reparo</span>
                      </button>
                    )}
                    <Link
                      href={`/proyectos/${project.id}`}
                      className="inline-flex items-center gap-1 text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-800 px-2 py-1 rounded border border-blue-200 font-medium transition-colors"
                    >
                      <span>Ver</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
