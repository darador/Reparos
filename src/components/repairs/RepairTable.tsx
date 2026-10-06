'use client';

import { getStoredAuthUser } from "@/lib/auth";
import { repository } from "@/lib/store/repository";
import { Repair, RepairEvent } from "@/lib/types/database";
import { formatDate, formatDateTime, formatDaysAgoLabel } from "@/lib/utils";
import { AlertCircle, AlertTriangle, ArrowDown, ArrowRight, ArrowUp, ArrowUpDown, ArrowUpRight, Building2, ChevronDown, ChevronUp, Edit, History, Plus, Trash2, Wrench } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { RepairFormModal, RESPONSABLES_INICIALES_LIST } from "./RepairFormModal";
import { StatusBadge } from "../shared/Badges";
import { ConfirmDeleteModal } from "../shared/ConfirmDeleteModal";
import { EditEventModal } from "../timeline/EditEventModal";
import { LogBulkEventModal } from "../timeline/LogBulkEventModal";

interface RepairTableProps {
  repairs: Repair[];
  onLogEventClick?: (repair: Repair) => void;
  onRefresh?: () => void;
  hideActions?: boolean;
}

const GROUP_THEMES = [
  { border: "border-l-indigo-600", badge: "bg-indigo-100 text-indigo-900 border-indigo-300" },
  { border: "border-l-emerald-600", badge: "bg-emerald-100 text-emerald-900 border-emerald-300" },
  { border: "border-l-violet-600", badge: "bg-violet-100 text-violet-900 border-violet-300" },
  { border: "border-l-amber-500", badge: "bg-amber-100 text-amber-900 border-amber-300" },
  { border: "border-l-teal-600", badge: "bg-teal-100 text-teal-900 border-teal-300" },
  { border: "border-l-rose-500", badge: "bg-rose-100 text-rose-900 border-rose-300" },
  { border: "border-l-cyan-600", badge: "bg-cyan-100 text-cyan-900 border-cyan-300" },
  { border: "border-l-blue-600", badge: "bg-blue-100 text-blue-900 border-blue-300" },
];

type SortColumn = 'project' | 'cumplimiento' | 'central' | 'tipo' | 'description' | 'responsible' | 'status' | 'reiteros' | 'reclamos' | 'informado';
type HitoSortColumn = 'fecha' | 'hito' | 'responsable' | 'estado' | 'usuario' | 'observacion';
type SortDirection = 'asc' | 'desc';

export function RepairTable({
  repairs,
  onLogEventClick,
  onRefresh,
  hideActions = false
}: RepairTableProps) {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);
  const [repairToEdit, setRepairToEdit] = useState<Repair | null>(null);
  const [repairToDelete, setRepairToDelete] = useState<Repair | null>(null);
  const [eventToEdit, setEventToEdit] = useState<RepairEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<RepairEvent | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Selection handlers
  const toggleSelectRow = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === sortedRepairs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedRepairs.map(r => r.id));
    }
  };

  const selectedRepairs = repairs.filter(r => selectedIds.includes(r.id));

  // Sorting states
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const [hitoSortColumn, setHitoSortColumn] = useState<HitoSortColumn | null>(null);
  const [hitoSortDirection, setHitoSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    setIsAuthenticated(!!getStoredAuthUser());
  }, []);

  const activeParties = repository.getResponsibleParties();
  const partyNames = React.useMemo(() => {
    return Array.from(new Set([
      ...RESPONSABLES_INICIALES_LIST,
      ...(activeParties || []).map(p => p.name)
    ]));
  }, [activeParties]);

  const projectCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    (repairs || []).forEach(r => {
      if (!r) return;
      const sigest = r.project?.sigest || '';
      const poligono = r.project?.poligono || '';
      const key = r.project_id || (sigest && poligono ? `${sigest}_${poligono}` : undefined);
      if (key) {
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    return counts;
  }, [repairs]);

  const projectGroupIndexMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    let counter = 0;
    (repairs || []).forEach(r => {
      if (!r) return;
      const sigest = r.project?.sigest || '';
      const poligono = r.project?.poligono || '';
      const key = r.project_id || (sigest && poligono ? `${sigest}_${poligono}` : undefined);
      if (key && map[key] === undefined) {
        map[key] = counter++;
      }
    });
    return map;
  }, [repairs]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleResponsibleChange = async (repairId: string, value: string) => {
    let finalResponsibleId: string | undefined = undefined;

    if (value && value !== '__UNASSIGNED__') {
      const activeParties = repository.getResponsibleParties();
      const existing = activeParties.find(r => r.name.toLowerCase() === value.trim().toLowerCase());
      if (existing) {
        finalResponsibleId = existing.id;
      } else {
        const newParty = await repository.addResponsibleParty(value.trim(), 'contractor');
        finalResponsibleId = newParty.id;
      }
    }

    await repository.updateRepairResponsible(repairId, finalResponsibleId);
    if (onRefresh) {
      onRefresh();
    } else {
      setExpandedIds(prev => ({ ...prev }));
    }
  };

  const handleUpdateRepair = async (data: any) => {
    if (repairToEdit) {
      await repository.updateRepair(repairToEdit.id, data);
      setRepairToEdit(null);
      if (onRefresh) onRefresh();
    }
  };

  const handleDeleteEvent = async () => {
    if (eventToDelete) {
      await repository.deleteRepairEvent(eventToDelete.id);
      setEventToDelete(null);
      if (onRefresh) onRefresh();
      else setExpandedIds(prev => ({ ...prev }));
    }
  };

  const handleUpdateEvent = async (eventId: string, data: any) => {
    await repository.updateRepairEvent(eventId, data);
    setEventToEdit(null);
    if (onRefresh) onRefresh();
    else setExpandedIds(prev => ({ ...prev }));
  };

  const handleSort = (column: SortColumn) => {
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

  const handleHitoSort = (column: HitoSortColumn) => {
    if (hitoSortColumn === column) {
      if (hitoSortDirection === 'asc') {
        setHitoSortDirection('desc');
      } else {
        setHitoSortColumn(null);
        setHitoSortDirection('asc');
      }
    } else {
      setHitoSortColumn(column);
      setHitoSortDirection('asc');
    }
  };

  const sortedRepairs = React.useMemo(() => {
    if (!sortColumn) return repairs;

    return [...repairs].sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      switch (sortColumn) {
        case 'project':
          valA = `${a.project?.sigest || ''}_${a.project?.poligono || ''}`;
          valB = `${b.project?.sigest || ''}_${b.project?.poligono || ''}`;
          break;
        case 'cumplimiento':
          valA = a.project?.porcentaje_cumplimiento ?? -1;
          valB = b.project?.porcentaje_cumplimiento ?? -1;
          break;
        case 'central':
          valA = `${a.project?.distrito || ''}_${a.project?.central || ''}`;
          valB = `${b.project?.distrito || ''}_${b.project?.central || ''}`;
          break;
        case 'tipo':
          valA = a.repair_type?.name || '';
          valB = b.repair_type?.name || '';
          break;
        case 'description':
          valA = `${a.description || ''}_${a.solicitante || ''}`;
          valB = `${b.description || ''}_${b.solicitante || ''}`;
          break;
        case 'responsible':
          valA = a.current_responsible?.name || '';
          valB = b.current_responsible?.name || '';
          break;
        case 'status':
          valA = a.current_status?.name || '';
          valB = b.current_status?.name || '';
          break;
        case 'reiteros':
          valA = a.reiteration_count || 0;
          valB = b.reiteration_count || 0;
          break;
        case 'reclamos':
          valA = a.reclaim_count || 0;
          valB = b.reclaim_count || 0;
          break;
        case 'informado':
          valA = new Date(a.fecha_informado || 0).getTime();
          valB = new Date(b.fecha_informado || 0).getTime();
          break;
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [repairs, sortColumn, sortDirection]);

  const sortEvents = (rawEvents: RepairEvent[]) => {
    if (!hitoSortColumn) return rawEvents;

    return [...rawEvents].sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      switch (hitoSortColumn) {
        case 'fecha':
          valA = new Date(a.created_at || 0).getTime();
          valB = new Date(b.created_at || 0).getTime();
          break;
        case 'hito':
          valA = a.event_type || '';
          valB = b.event_type || '';
          break;
        case 'responsable':
          valA = a.new_responsible?.name || '';
          valB = b.new_responsible?.name || '';
          break;
        case 'estado':
          valA = a.new_status?.name || '';
          valB = b.new_status?.name || '';
          break;
        case 'usuario':
          valA = a.created_by || '';
          valB = b.created_by || '';
          break;
        case 'observacion':
          valA = a.notes || '';
          valB = b.notes || '';
          break;
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return hitoSortDirection === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return hitoSortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  };

  const renderSortHeader = (column: SortColumn, label: string, className: string = '') => {
    const isActive = sortColumn === column;
    return (
      <th
        onClick={() => handleSort(column)}
        className={`cursor-pointer select-none group hover:bg-slate-200/80 transition-colors ${className}`}
        title={`Ordenar por ${label}`}
      >
        <div className="flex items-center gap-1">
          <span>{label}</span>
          {!isActive && <ArrowUpDown className="h-3 w-3 text-slate-400 group-hover:text-slate-600 transition-colors" />}
          {isActive && sortDirection === 'asc' && <ArrowUp className="h-3.5 w-3.5 text-blue-600 font-bold" />}
          {isActive && sortDirection === 'desc' && <ArrowDown className="h-3.5 w-3.5 text-blue-600 font-bold" />}
        </div>
      </th>
    );
  };

  const renderHitoSortHeader = (column: HitoSortColumn, label: string, className: string = '') => {
    const isActive = hitoSortColumn === column;
    return (
      <th
        onClick={() => handleHitoSort(column)}
        className={`cursor-pointer select-none group hover:bg-slate-200/80 transition-colors py-1 px-2 font-semibold ${className}`}
        title={`Ordenar hitos por ${label}`}
      >
        <div className="flex items-center gap-1">
          <span>{label}</span>
          {!isActive && <ArrowUpDown className="h-2.5 w-2.5 text-slate-400 group-hover:text-slate-600" />}
          {isActive && hitoSortDirection === 'asc' && <ArrowUp className="h-3 w-3 text-blue-600 font-bold" />}
          {isActive && hitoSortDirection === 'desc' && <ArrowDown className="h-3 w-3 text-blue-600 font-bold" />}
        </div>
      </th>
    );
  };

  if (repairs.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded p-8 text-center text-slate-500 shadow-2xs">
        <Wrench className="h-8 w-8 mx-auto text-slate-400 mb-2" />
        <p className="font-bold text-slate-800 text-sm">no posee reparos para resolver.</p>
        <p className="text-xs text-slate-500 mt-1 font-mono">
          No hay reparos o atenciones pendientes asociadas al criterio seleccionado.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Sticky Bulk Action Banner */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-900 text-white p-2.5 rounded flex items-center justify-between shadow-md text-xs animate-in fade-in duration-100">
          <div className="flex items-center gap-2 font-medium">
            <span className="bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded-full font-mono text-[11px]">
              {selectedIds.length}
            </span>
            <span>{selectedIds.length === 1 ? 'reparo seleccionado' : 'reparos seleccionados'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded font-bold transition-colors shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Acción Masiva ({selectedIds.length})</span>
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-slate-400 hover:text-white underline px-2 py-1 font-medium"
            >
              Deseleccionar todos
            </button>
          </div>
        </div>
      )}

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-12 px-1 text-center whitespace-nowrap">
                <div className="flex items-center gap-1 justify-center">
                  <input
                    type="checkbox"
                    checked={sortedRepairs.length > 0 && selectedIds.length === sortedRepairs.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-3.5 w-3.5"
                    title="Seleccionar / deseleccionar todos los reparos"
                  />
                </div>
              </th>
              {renderSortHeader('project', 'SIGEST / POLÍGONO', 'whitespace-nowrap px-1.5')}
              {renderSortHeader('cumplimiento', '% CUMPL.', 'whitespace-nowrap px-1 justify-center text-center')}
              {renderSortHeader('central', 'CENTRAL', 'whitespace-nowrap px-1.5')}
              {renderSortHeader('tipo', 'TIPO', 'whitespace-nowrap px-1.5')}
              {renderSortHeader('description', 'DESCRIPCIÓN / SOLICITANTE', 'min-w-[140px] max-w-[240px] px-1.5')}
              {renderSortHeader('responsible', 'RESPONSABLE', 'min-w-[110px] max-w-[145px] px-1')}
              {renderSortHeader('status', 'ESTADO', 'whitespace-nowrap px-1.5')}
              {renderSortHeader('reiteros', 'REITEROS', 'whitespace-nowrap justify-center text-center px-1')}
              {renderSortHeader('reclamos', 'RECLAMOS', 'whitespace-nowrap justify-center text-center px-1')}
              {renderSortHeader('informado', 'INFORMADO', 'whitespace-nowrap px-1.5')}
              {!hideActions && <th className="text-right whitespace-nowrap px-1.5">ACCIONES</th>}
            </tr>
          </thead>
          <tbody>
            {sortedRepairs.map((repair, index) => {
              const hasReiterations = (repair.reiteration_count || 0) > 0;
              const isExpanded = !!expandedIds[repair.id];
              const isSelected = selectedIds.includes(repair.id);
              const events = isExpanded ? repository.getRepairEvents(repair.id) : [];
              const isEven = index % 2 === 0;

              const pKey = repair.project_id || `${repair.project?.sigest}_${repair.project?.poligono}`;
              const totalInProject = projectCounts[pKey] || 1;
              const isMultipleInProject = totalInProject > 1;

              const groupIndex = projectGroupIndexMap[pKey] ?? 0;
              const groupTheme = GROUP_THEMES[groupIndex % GROUP_THEMES.length];

              const prevPKey = index > 0 ? (repairs[index - 1].project_id || `${repairs[index - 1].project?.sigest}_${repairs[index - 1].project?.poligono}`) : null;
              const isFirstRowOfGroup = index > 0 && pKey !== prevPKey;

              const rowBgClass = isSelected
                ? "bg-blue-100/90 hover:bg-blue-100"
                : hasReiterations
                ? "bg-amber-50/70 hover:bg-amber-100/70"
                : isExpanded
                ? "bg-blue-50/50"
                : isMultipleInProject
                ? "bg-slate-50/80 hover:bg-blue-50/40"
                : isEven
                ? "bg-slate-50 hover:bg-blue-50/40"
                : "bg-white hover:bg-blue-50/40";

              const topBorderClass = isFirstRowOfGroup ? "border-t-2 border-slate-400/80" : "border-b border-slate-200/80";

              const borderClass = isMultipleInProject
                ? `border-l-4 ${groupTheme.border} ${topBorderClass}`
                : `border-l-2 border-l-slate-300 ${topBorderClass}`;

              const currentRespName = repair.current_responsible?.name || '__UNASSIGNED__';

              return (
                <React.Fragment key={repair.id}>
                  <tr className={`${rowBgClass} ${borderClass} transition-colors`}>
                    <td className="px-1 py-1 text-center whitespace-nowrap">
                      <div className="flex items-center gap-1 justify-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(repair.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-3.5 w-3.5"
                          title="Seleccionar este reparo"
                        />
                        <button
                          onClick={() => toggleExpand(repair.id)}
                          className="p-0.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200/80 rounded transition-colors"
                          title={isExpanded ? "Ocultar hitos del historial" : "Desplegar hitos del historial"}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5 text-blue-600 font-bold" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-1.5 py-1">
                      {repair.project ? (
                        <div className="flex flex-col gap-0.5 items-start">
                          <Link
                            href={`/proyectos/${repair.project.id}`}
                            className="inline-flex items-center gap-1 font-mono group"
                            title={`Ver proyecto SIGEST: ${repair.project.sigest} | Polígono: ${repair.project.poligono}`}
                          >
                            <span className="font-black text-slate-900 text-xs tracking-tight group-hover:text-blue-600 transition-colors">
                              {repair.project.sigest}
                            </span>
                            <span className="text-slate-400 font-sans text-xs">/</span>
                            <span className="font-bold text-blue-700 bg-blue-50/90 border border-blue-200/90 px-1 py-0.2 rounded text-xs shadow-2xs group-hover:bg-blue-100 group-hover:border-blue-300 transition-colors">
                              {repair.project.poligono}
                            </span>
                          </Link>

                          {isMultipleInProject && (
                            <span
                              className={`inline-flex items-center gap-0.5 text-[9px] font-bold ${groupTheme.badge} px-1 py-0.2 rounded font-mono shadow-2xs`}
                              title={`Este polígono tiene ${totalInProject} reparos registrados`}
                            >
                              <span>📂 {totalInProject} en polígono</span>
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono text-xs">-</span>
                      )}
                    </td>

                    {/* Columna % CUMPL. */}
                    <td className="whitespace-nowrap text-center px-1 py-1">
                      {repair.project?.porcentaje_cumplimiento !== undefined && repair.project?.porcentaje_cumplimiento !== null ? (
                        <span className="font-mono font-bold text-blue-900 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded text-[10px]">
                          {repair.project.porcentaje_cumplimiento}%
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-xs">-</span>
                      )}
                    </td>

                    {/* Columna CENTRAL */}
                    <td className="whitespace-nowrap px-1.5 py-1">
                      {repair.project?.central ? (
                        <span className="font-bold text-slate-800 bg-slate-100 border border-slate-200/90 px-1.5 py-0.2 rounded text-[10px] font-mono">
                          {repair.project.central}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-xs">-</span>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-1.5 py-1">
                      <span className="font-medium text-slate-900 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 text-[10px]">
                        {repair.repair_type?.name || 'Otro'}
                      </span>
                    </td>
                    
                    {/* Columna DESCRIPCION destacada */}
                    <td className="min-w-[140px] max-w-[240px] py-1 px-1.5">
                      <Link
                        href={`/reparos/${repair.id}`}
                        className="font-semibold text-slate-900 hover:text-blue-700 text-[11px] leading-snug block transition-colors break-words"
                      >
                        {repair.description}
                      </Link>
                      {repair.solicitante && (
                        <div className="text-[9px] text-slate-500 mt-0.5 font-sans flex items-center gap-1">
                          <span className="text-slate-400">Sol:</span>
                          <span className="font-semibold text-slate-800 bg-slate-100/80 px-1 py-0.2 rounded border border-slate-200/60 truncate max-w-[180px]">
                            {repair.solicitante}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Columna RESPONSABLE en 2 renglones */}
                    <td className="min-w-[110px] max-w-[145px] align-top py-1 px-1">
                      {(() => {
                        const name = repair.current_responsible?.name;
                        const renderTwoLines = () => {
                          if (!name || !name.trim()) {
                            return <em className="text-slate-400 font-normal text-[10px] px-1">Sin asignar</em>;
                          }
                          const trimmed = name.trim();
                          if (trimmed.includes('/')) {
                            const slashIndex = trimmed.indexOf('/');
                            const area = trimmed.substring(0, slashIndex + 1).trim();
                            const person = trimmed.substring(slashIndex + 1).trim();
                            return (
                              <div className="flex flex-col text-[10px] leading-tight px-1 py-0.2">
                                <span className="text-[9px] text-slate-500 font-semibold font-mono whitespace-nowrap">{area}</span>
                                <span className="font-bold text-slate-900 text-[10px] leading-snug whitespace-normal break-words">{person}</span>
                              </div>
                            );
                          }
                          return (
                            <div className="flex flex-col text-[10px] leading-tight px-1 py-0.2">
                              <span className="font-bold text-slate-900 text-[10px] leading-snug whitespace-normal break-words">{trimmed}</span>
                            </div>
                          );
                        };

                        if (hideActions) {
                          return renderTwoLines();
                        }

                        return (
                          <div className="relative group/resp bg-white border border-slate-300 hover:border-blue-500 rounded shadow-2xs transition-colors cursor-pointer">
                            <div className="flex items-center justify-between gap-0.5 pr-0.5">
                              {renderTwoLines()}
                              <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
                            </div>
                            <select
                              value={partyNames.includes(currentRespName) ? currentRespName : (repair.current_responsible ? '__CUSTOM_EXISTING__' : '__UNASSIGNED__')}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '__PROMPT_NEW__') {
                                  const newName = prompt('Ingrese el nombre del nuevo Responsable:');
                                  if (newName && newName.trim()) {
                                    handleResponsibleChange(repair.id, newName.trim());
                                  }
                                } else {
                                  handleResponsibleChange(repair.id, val);
                                }
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-[10px]"
                              title="Haz clic para cambiar el responsable"
                            >
                              <option value="__UNASSIGNED__">-- Sin asignar --</option>
                              {partyNames.map((n) => (
                                <option key={n} value={n}>
                                  {n}
                                </option>
                              ))}
                              {repair.current_responsible && !partyNames.includes(currentRespName) && (
                                <option value="__CUSTOM_EXISTING__">{currentRespName}</option>
                              )}
                              <option value="__PROMPT_NEW__">✍️ Escribir otro responsable...</option>
                            </select>
                          </div>
                        );
                      })()}
                    </td>

                    <td className="whitespace-nowrap px-1.5 py-1">
                      <StatusBadge 
                        name={repair.current_status?.name} 
                        category={repair.current_status?.category} 
                      />
                    </td>
                    <td className="whitespace-nowrap px-1 py-1 text-center">
                      {hasReiterations ? (
                        <div className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 px-1 py-0.2 rounded text-[10px] font-mono font-bold">
                          <AlertTriangle className="h-2.5 w-2.5 text-red-600 shrink-0" />
                          <span>{repair.reiteration_count}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs font-mono">0</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-1 py-1 text-center">
                      {(repair.reclaim_count || 0) > 0 ? (
                        <div className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 border border-amber-200 px-1 py-0.2 rounded text-[10px] font-mono font-bold">
                          <AlertCircle className="h-2.5 w-2.5 text-amber-600 shrink-0" />
                          <span>{repair.reclaim_count}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs font-mono">0</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-1.5 py-1 text-xs text-slate-600">
                      <div className="flex flex-col text-[10px] leading-tight">
                        <span className="font-semibold text-slate-800 font-mono">{formatDate(repair.fecha_informado)}</span>
                        <span className="text-[9px] text-slate-500 font-mono">
                          {formatDaysAgoLabel(repair.fecha_informado)}
                        </span>
                      </div>
                    </td>
                    {!hideActions && (
                      <td className="text-right whitespace-nowrap px-1.5 py-1">
                        <div className="inline-flex items-center rounded border border-slate-300 shadow-2xs overflow-hidden divide-x divide-slate-300 bg-white">
                          {onLogEventClick && (
                            <button
                              onClick={() => onLogEventClick(repair)}
                              className="inline-flex items-center gap-1 text-[10px] bg-blue-600 hover:bg-blue-700 text-white px-1.5 py-0.5 font-semibold transition-colors"
                              title="Registrar Acción / Evento"
                            >
                              <Plus className="h-3 w-3" />
                              <span>+ Acción</span>
                            </button>
                          )}

                          <button
                            onClick={() => setRepairToEdit(repair)}
                            className="inline-flex items-center justify-center text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-700 px-1.5 py-0.5 font-medium transition-colors"
                            title="Editar datos del reparo"
                          >
                            <Edit className="h-3.5 w-3.5 text-slate-600" />
                          </button>

                          {isAuthenticated && (
                            <button
                              onClick={() => setRepairToDelete(repair)}
                              className="inline-flex items-center justify-center text-[11px] bg-slate-50 hover:bg-red-50 text-slate-700 hover:text-red-600 px-2 py-1 font-medium transition-colors"
                              title="Borrar este reparo"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>

                  {/* Desplegable de Hitos (Expanded Row) */}
                  {isExpanded && (
                    <tr className="bg-slate-50/90 border-b border-slate-300">
                      <td colSpan={11 + (hideActions ? 0 : 1)} className="p-3">
                        <div className="bg-white border border-slate-300 rounded p-3 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                            <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                              <History className="h-3.5 w-3.5 text-blue-600" />
                              <span>Hitos del Historial del Reparo ({events.length} eventos)</span>
                            </span>
                            <Link
                              href={`/reparos/${repair.id}`}
                              className="text-[11px] text-blue-600 hover:underline font-medium"
                            >
                              Ver trazabilidad completa →
                            </Link>
                          </div>

                          {events.length === 0 ? (
                            <div className="text-slate-400 text-xs italic py-2 text-center">
                              Sin hitos o eventos registrados aún.
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-mono bg-slate-100/70">
                                    {renderHitoSortHeader('fecha', 'Fecha y Hora')}
                                    {renderHitoSortHeader('hito', 'Hito / Acción')}
                                    {renderHitoSortHeader('responsable', 'Responsable')}
                                    {renderHitoSortHeader('estado', 'Estado')}
                                    {renderHitoSortHeader('usuario', 'Usuario')}
                                    {renderHitoSortHeader('observacion', 'Observación / Nota')}
                                    {isAuthenticated && <th className="py-1 px-2 text-right font-semibold">Acciones</th>}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                                  {sortEvents(events).map((ev) => (
                                    <tr key={ev.id} className="hover:bg-slate-50">
                                      <td className="py-1.5 px-2 text-slate-600 whitespace-nowrap">
                                        {formatDateTime(ev.created_at)}
                                      </td>
                                      <td className="py-1.5 px-2 font-sans font-semibold text-slate-900 whitespace-nowrap">
                                        {ev.event_type === 'creation' && 'Reparo Creado'}
                                        {ev.event_type === 'assignment' && 'Asignación / Reasignación'}
                                        {ev.event_type === 'reclaim' && 'Reclamo Registrado'}
                                        {ev.event_type === 'response' && 'Respuesta Recibida'}
                                        {ev.event_type === 'follow_up' && 'Seguimiento Operativo'}
                                        {ev.event_type === 'derivation' && 'Derivación'}
                                        {ev.event_type === 'verification' && `Verificación (${ev.verification_result || 'registrada'})`}
                                        {ev.event_type === 'reiteration' && 'Reiteración'}
                                        {ev.event_type === 'resolution' && 'Reparo Resuelto'}
                                        {ev.event_type === 'closure' && 'Caso Cerrado'}
                                      </td>
                                      <td className="py-1.5 px-2 font-sans text-slate-800 whitespace-nowrap">
                                        {ev.new_responsible ? (
                                          <span className="flex items-center gap-1">
                                            {ev.previous_responsible && ev.previous_responsible.id !== ev.new_responsible.id && (
                                              <>
                                                <span className="text-slate-400 line-through">{ev.previous_responsible.name}</span>
                                                <ArrowRight className="h-3 w-3 text-slate-400" />
                                              </>
                                            )}
                                            <strong className="text-slate-900">{ev.new_responsible.name}</strong>
                                          </span>
                                        ) : (
                                          <em className="text-slate-400">Sin cambiar</em>
                                        )}
                                      </td>
                                      <td className="py-1.5 px-2 whitespace-nowrap">
                                        {ev.new_status ? (
                                          <StatusBadge name={ev.new_status.name} category={ev.new_status.category} />
                                        ) : (
                                          <em className="text-slate-400">Sin cambiar</em>
                                        )}
                                      </td>
                                      <td className="py-1.5 px-2 text-slate-600 whitespace-nowrap">
                                        {ev.created_by || 'Usuario Sistema'}
                                      </td>
                                      <td className="py-1.5 px-2 text-slate-700 font-sans max-w-[280px]">
                                        {ev.notes || '-'}
                                      </td>
                                      {isAuthenticated && (
                                        <td className="py-1.5 px-2 text-right whitespace-nowrap">
                                          <button
                                            onClick={() => setEventToEdit(ev)}
                                            className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                                            title="Editar este hito"
                                          >
                                            <Edit className="h-3.5 w-3.5" />
                                          </button>
                                          <button
                                            onClick={() => setEventToDelete(ev)}
                                            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors ml-1"
                                            title="Borrar este hito"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                        </td>
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit Repair Modal from Table */}
      {repairToEdit && (
        <RepairFormModal
          isOpen={!!repairToEdit}
          onClose={() => setRepairToEdit(null)}
          onSubmit={handleUpdateRepair}
          projects={repository.getProjects()}
          repairTypes={repository.getRepairTypes()}
          responsibleParties={repository.getResponsibleParties()}
          repairToEdit={repairToEdit}
        />
      )}

      {/* Edit Event Modal */}
      {eventToEdit && (
        <EditEventModal
          isOpen={!!eventToEdit}
          onClose={() => setEventToEdit(null)}
          onSave={handleUpdateEvent}
          event={eventToEdit}
          responsibleParties={repository.getResponsibleParties()}
          repairStatuses={repository.getRepairStatuses()}
        />
      )}

      {/* Delete Event Confirmation Modal */}
      {eventToDelete && (
        <ConfirmDeleteModal
          isOpen={!!eventToDelete}
          title="Borrar Hito del Historial"
          description={
            <div className="space-y-2">
              <p>
                ¿Está seguro de que deseas eliminar permanentemente este hito (
                <strong className="text-slate-900 font-mono">
                  {eventToDelete.event_type}
                </strong>
                ) del historial?
              </p>
              {eventToDelete.notes && (
                <p className="p-2 bg-slate-100 rounded text-slate-700 italic border border-slate-200 text-xs">
                  "{eventToDelete.notes}"
                </p>
              )}
              <p className="text-red-600 font-medium text-xs">
                Esta acción recalculará el historial y el estado del reparo. No se puede deshacer.
              </p>
            </div>
          }
          confirmText="Eliminar Hito"
          onConfirm={handleDeleteEvent}
          onClose={() => setEventToDelete(null)}
        />
      )}

      {/* Delete Repair Confirmation Modal */}
      {repairToDelete && (
        <ConfirmDeleteModal
          isOpen={!!repairToDelete}
          title="Confirmar eliminación de reparo"
          description={
            <div className="space-y-2">
              <p>
                ¿Estás seguro de que deseas eliminar permanentemente este reparo del proyecto{" "}
                <strong className="text-slate-900 font-mono">
                  SIGEST {repairToDelete.project?.sigest || ''} / {repairToDelete.project?.poligono || ''}
                </strong>?
              </p>
              {repairToDelete.description && (
                <p className="p-2 bg-slate-100 rounded text-slate-700 italic border border-slate-200">
                  "{repairToDelete.description}"
                </p>
              )}
              <p className="text-red-600 font-medium">
                Esta acción eliminará el reparo y todo su historial de eventos. No se puede deshacer.
              </p>
            </div>
          }
          confirmText="Eliminar Reparo"
          onConfirm={async () => {
            await repository.deleteRepair(repairToDelete.id);
            setRepairToDelete(null);
            if (onRefresh) onRefresh();
          }}
          onClose={() => setRepairToDelete(null)}
        />
      )}

      {/* Log Bulk Event Modal */}
      {isBulkModalOpen && selectedRepairs.length > 0 && (
        <LogBulkEventModal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          onSubmit={async (data) => {
            for (const rId of data.repair_ids) {
              await repository.addRepairEvent({
                repair_id: rId,
                event_type: data.event_type,
                new_responsible_id: data.new_responsible_id,
                new_status_id: data.new_status_id,
                verification_result: data.verification_result,
                notes: data.notes
              });
            }
            setSelectedIds([]);
            setIsBulkModalOpen(false);
            if (onRefresh) onRefresh();
          }}
          repairs={selectedRepairs}
          responsibleParties={repository.getResponsibleParties()}
          repairStatuses={repository.getRepairStatuses()}
        />
      )}
    </div>
  );
}
