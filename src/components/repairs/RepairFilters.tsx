'use client';

import { RepairPriority, RepairStatus, RepairType, ResponsibleParty } from "@/lib/types/database";
import { Filter, RotateCcw, Search, X } from "lucide-react";

interface RepairFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  statusId: string;
  onStatusChange: (val: string) => void;
  responsibleId: string;
  onResponsibleChange: (val: string) => void;
  priority: string;
  onPriorityChange: (val: string) => void;
  typeId: string;
  onTypeChange: (val: string) => void;
  distrito: string;
  onDistritoChange: (val: string) => void;
  central: string;
  onCentralChange: (val: string) => void;
  onlyReiterated: boolean;
  onOnlyReiteratedChange: (val: boolean) => void;
  repairStatuses: RepairStatus[];
  responsibleParties: ResponsibleParty[];
  repairTypes: RepairType[];
  distritos: string[];
  centrales: string[];
  onResetFilters: () => void;
}

export function RepairFilters({
  search,
  onSearchChange,
  statusId,
  onStatusChange,
  responsibleId,
  onResponsibleChange,
  priority,
  onPriorityChange,
  typeId,
  onTypeChange,
  distrito,
  onDistritoChange,
  central,
  onCentralChange,
  onlyReiterated,
  onOnlyReiteratedChange,
  repairStatuses,
  responsibleParties,
  repairTypes,
  distritos,
  centrales,
  onResetFilters
}: RepairFiltersProps) {
  const activeFiltersCount = 
    (search ? 1 : 0) +
    (statusId !== 'all' ? 1 : 0) +
    (responsibleId !== 'all' ? 1 : 0) +
    (priority !== 'all' ? 1 : 0) +
    (typeId !== 'all' ? 1 : 0) +
    (distrito !== 'all' ? 1 : 0) +
    (central !== 'all' ? 1 : 0) +
    (onlyReiterated ? 1 : 0);

  return (
    <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2">
        {/* Search input */}
        <div className="lg:col-span-2 relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar SIGEST, Polígono, Central, Distrito..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500"
          />
          {search && (
            <button onClick={() => onSearchChange('')} className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Distrito filter */}
        <div>
          <select
            value={distrito}
            onChange={(e) => onDistritoChange(e.target.value)}
            className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white font-medium text-slate-800"
          >
            <option value="all">Todos los Distritos</option>
            {distritos.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Central filter */}
        <div>
          <select
            value={central}
            onChange={(e) => onCentralChange(e.target.value)}
            className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white font-medium text-slate-800"
          >
            <option value="all">Todas las Centrales</option>
            {centrales.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div>
          <select
            value={statusId}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white"
          >
            <option value="all">Todos los Estados</option>
            {repairStatuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Responsible filter */}
        <div>
          <select
            value={responsibleId}
            onChange={(e) => onResponsibleChange(e.target.value)}
            className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white"
          >
            <option value="all">Todos los Responsables</option>
            <option value="unassigned">-- Sin asignar --</option>
            {responsibleParties.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* Priority filter */}
        <div>
          <select
            value={priority}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white"
          >
            <option value="all">Todas las Prioridades</option>
            <option value="Normal">Normal</option>
            <option value="Alta">Alta</option>
            <option value="Crítica">Crítica</option>
          </select>
        </div>
      </div>

      {/* Filter status bar & toggle flags */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium select-none">
            <input
              type="checkbox"
              checked={onlyReiterated}
              onChange={(e) => onOnlyReiteratedChange(e.target.checked)}
              className="rounded border-slate-300 text-red-600 focus:ring-red-500"
            />
            <span className={onlyReiterated ? "text-red-700 font-bold" : ""}>Solo Reiterados / No solucionados</span>
          </label>

          {activeFiltersCount > 0 && (
            <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1">
              <Filter className="h-3 w-3 text-blue-600" />
              {activeFiltersCount} {activeFiltersCount === 1 ? 'filtro activo' : 'filtros activos'}
            </span>
          )}
        </div>

        {activeFiltersCount > 0 && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 font-medium transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Limpiar filtros</span>
          </button>
        )}
      </div>
    </div>
  );
}
