'use client';

import React from 'react';
import { MopCategory, MopStatus } from '@/lib/types/database';
import { Layers, RotateCcw, Search } from 'lucide-react';

export const MOP_CATEGORIES: { id: MopCategory; label: string }[] = [
  { id: 'Certifcar', label: 'Certifcar' },
  { id: 'Instalar y Certificar', label: 'Instalar y Certificar' },
  { id: 'Adelantar', label: 'Adelantar' },
  { id: 'Dem Trab Ter', label: 'Dem Trab Ter' },
  { id: 'Demorado', label: 'Demorado' }
];

export const MOP_STATUSES: { id: MopStatus; label: string }[] = [
  { id: 'PENDIENTE', label: 'PENDIENTE' },
  { id: 'COMPLETADO', label: 'COMPLETADO' },
  { id: 'CON REPARO', label: 'CON REPARO' }
];

interface MopFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  category: string;
  onCategoryChange: (val: string) => void;
  responsable: string;
  onResponsableChange: (val: string) => void;
  central: string;
  onCentralChange: (val: string) => void;
  estado: string;
  onEstadoChange: (val: string) => void;
  isAusenteFilter: boolean;
  onIsAusenteFilterToggle: (val: boolean) => void;
  responsablesList: string[];
  centralesList: string[];
  onResetFilters: () => void;
}

export function MopFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  responsable,
  onResponsableChange,
  central,
  onCentralChange,
  estado,
  onEstadoChange,
  isAusenteFilter,
  onIsAusenteFilterToggle,
  responsablesList,
  centralesList,
  onResetFilters
}: MopFiltersProps) {
  const hasActiveFilters =
    search.trim() !== '' ||
    category !== 'all' ||
    responsable !== 'all' ||
    central !== 'all' ||
    estado !== 'all' ||
    isAusenteFilter;

  return (
    <div className="bg-white p-3 border border-slate-200 rounded shadow-2xs space-y-2.5 text-xs">
      {/* Botones de Pestaña de origen (en reemplazo del combo) */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-50 border border-slate-200 rounded">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2 flex items-center gap-1">
          <Layers className="h-3.5 w-3.5 text-slate-400" />
          <span>Pestañas:</span>
        </span>

        <button
          type="button"
          onClick={() => onCategoryChange('all')}
          className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
            category === 'all'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
          }`}
        >
          Todas
        </button>

        {MOP_CATEGORIES.map(cat => {
          const isSelected = category === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategoryChange(cat.id)}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-blue-700 hover:bg-slate-200/70'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Barra de búsqueda y Selectores de Responsable, Central y Estado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
        {/* Buscador de Sigest CTO, Polígono o CTO */}
        <div className="relative sm:col-span-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar Sigest CTO, Polígono o CTO..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 bg-white"
          />
        </div>

        {/* Responsable CTO */}
        <div>
          <select
            value={responsable}
            onChange={(e) => onResponsableChange(e.target.value)}
            className={`w-full py-1.5 px-2 border rounded text-xs focus:ring-1 focus:ring-blue-500 bg-white ${
              responsable !== 'all' ? 'border-blue-500 font-semibold text-blue-900 bg-blue-50/50' : 'border-slate-300 text-slate-700'
            }`}
          >
            <option value="all">Responsable: Todos</option>
            {responsablesList.map(resp => (
              <option key={resp} value={resp}>
                {resp}
              </option>
            ))}
          </select>
        </div>

        {/* Central */}
        <div>
          <select
            value={central}
            onChange={(e) => onCentralChange(e.target.value)}
            className={`w-full py-1.5 px-2 border rounded text-xs focus:ring-1 focus:ring-blue-500 bg-white ${
              central !== 'all' ? 'border-blue-500 font-semibold text-blue-900 bg-blue-50/50' : 'border-slate-300 text-slate-700'
            }`}
          >
            <option value="all">Central: Todas</option>
            {centralesList.map(cent => (
              <option key={cent} value={cent}>
                {cent}
              </option>
            ))}
          </select>
        </div>

        {/* Estado */}
        <div>
          <select
            value={estado}
            onChange={(e) => onEstadoChange(e.target.value)}
            className={`w-full py-1.5 px-2 border rounded text-xs focus:ring-1 focus:ring-blue-500 bg-white ${
              estado !== 'all' ? 'border-blue-500 font-semibold text-blue-900 bg-blue-50/50' : 'border-slate-300 text-slate-700'
            }`}
          >
            <option value="all">Estado: Todos</option>
            {MOP_STATUSES.map(st => (
              <option key={st.id} value={st.id}>
                {st.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Fila secundaria: filtro de ausentes y reset */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
        <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isAusenteFilter}
            onChange={(e) => onIsAusenteFilterToggle(e.target.checked)}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
          />
          <span className={isAusenteFilter ? 'font-bold text-slate-900' : ''}>
            Ver únicamente registros ausentes en la última actualización
          </span>
        </label>

        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors cursor-pointer"
            title="Restablecer todos los filtros"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Limpiar filtros</span>
          </button>
        )}
      </div>
    </div>
  );
}
