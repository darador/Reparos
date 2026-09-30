'use client';

import { getStoredAuthUser } from "@/lib/auth";
import { Project } from "@/lib/types/database";
import { formatDate } from "@/lib/utils";
import { ArrowDown, ArrowUp, ArrowUpDown, Edit3, FolderGit2, Trash2, Wrench } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { ProjectStatusBadge } from "../shared/Badges";

interface ProjectTableProps {
  projects: Project[];
  onNewRepairClick?: (project: Project) => void;
  onEditProjectClick?: (project: Project) => void;
  onDeleteProjectClick?: (project: Project) => void;
}

type ProjectSortColumn = 'sigest' | 'central' | 'ejecutor' | 'ctos' | 'situacion' | 'reparos' | 'created_at';
type SortDirection = 'asc' | 'desc';

export function ProjectTable({ projects, onNewRepairClick, onEditProjectClick, onDeleteProjectClick }: ProjectTableProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [sortColumn, setSortColumn] = useState<ProjectSortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    setIsAuthenticated(!!getStoredAuthUser());
  }, []);

  const handleSort = (column: ProjectSortColumn) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedProjects = React.useMemo(() => {
    if (!sortColumn) return projects;

    return [...projects].sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      switch (sortColumn) {
        case 'sigest':
          valA = `${a.sigest || ''}_${a.poligono || ''}`;
          valB = `${b.sigest || ''}_${b.poligono || ''}`;
          break;
        case 'central':
          valA = `${a.distrito || ''}_${a.central || ''}`;
          valB = `${b.distrito || ''}_${b.central || ''}`;
          break;
        case 'ejecutor':
          valA = a.ejecutor || '';
          valB = b.ejecutor || '';
          break;
        case 'ctos':
          valA = a.ctos_count || 0;
          valB = b.ctos_count || 0;
          break;
        case 'situacion':
          valA = a.situacion_operativa || '';
          valB = b.situacion_operativa || '';
          break;
        case 'reparos':
          valA = a.repairs_count || 0;
          valB = b.repairs_count || 0;
          break;
        case 'created_at':
          valA = new Date(a.created_at || 0).getTime();
          valB = new Date(b.created_at || 0).getTime();
          break;
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [projects, sortColumn, sortDirection]);

  const renderSortHeader = (column: ProjectSortColumn, label: string, className: string = '') => {
    const isActive = sortColumn === column;
    return (
      <th
        onClick={() => handleSort(column)}
        className={`cursor-pointer select-none group hover:bg-slate-200/80 transition-colors ${className}`}
        title={`Ordenar por ${label}`}
      >
        <div className="flex items-center gap-1 font-semibold">
          <span>{label}</span>
          {!isActive && <ArrowUpDown className="h-3 w-3 text-slate-400 group-hover:text-slate-600 transition-colors" />}
          {isActive && sortDirection === 'asc' && <ArrowUp className="h-3.5 w-3.5 text-blue-600 font-bold" />}
          {isActive && sortDirection === 'desc' && <ArrowDown className="h-3.5 w-3.5 text-blue-600 font-bold" />}
        </div>
      </th>
    );
  };

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
            {renderSortHeader('sigest', 'SIGEST / Polígono')}
            {renderSortHeader('central', 'Distrito / Central')}
            {renderSortHeader('ejecutor', 'Ejecutor')}
            {renderSortHeader('ctos', 'CTOs / Alim.')}
            {renderSortHeader('situacion', 'Situación')}
            {renderSortHeader('reparos', 'Reparos')}
            {renderSortHeader('created_at', 'Creación')}
            <th className="text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {sortedProjects.map((project, index) => {
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
                <td className="text-right whitespace-nowrap">
                  <div className="inline-flex items-center rounded border border-slate-300 shadow-2xs overflow-hidden divide-x divide-slate-300 bg-white">
                    {onNewRepairClick && (
                      <button
                        onClick={() => onNewRepairClick(project)}
                        className="inline-flex items-center gap-1 text-[11px] bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 font-semibold transition-colors"
                        title="Agregar Reparo a este Proyecto"
                      >
                        <Wrench className="h-3 w-3" />
                        <span>+ Reparo</span>
                      </button>
                    )}
                    {onEditProjectClick && (
                      <button
                        onClick={() => onEditProjectClick(project)}
                        className="inline-flex items-center justify-center text-[11px] bg-slate-50 hover:bg-slate-100 text-slate-700 px-2 py-1 font-medium transition-colors"
                        title="Editar datos del proyecto"
                      >
                        <Edit3 className="h-3.5 w-3.5 text-slate-600" />
                      </button>
                    )}
                    {isAuthenticated && onDeleteProjectClick && (
                      <button
                        onClick={() => onDeleteProjectClick(project)}
                        className="inline-flex items-center justify-center text-[11px] bg-slate-50 hover:bg-red-50 text-slate-700 hover:text-red-600 px-2 py-1 font-medium transition-colors"
                        title="Borrar este proyecto"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </button>
                    )}
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
