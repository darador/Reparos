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
  responsablesList,
  centralesList,
  onResetFilters
}: MopFiltersProps) {
  const hasActiveFilters =
    search.trim() !== '' ||
    category !== 'all' ||
    responsable !== 'all' ||
    central !== 'all' ||
    estado !== 'all';

  return (
    <div className="bg-white p-3 border border-slate-200 rounded shadow-2xs space-y-2.5 text-xs">
      {/* Botones de Pestaña de origen */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-md">
        <div className="flex items-center gap-1.5 px-2 text-[11px] font-bold text-slate-600 uppercase tracking-wider shrink-0">
          <Layers className="h-4 w-4 text-blue-600" />
          <span>Pestañas:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onCategoryChange('all')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold border transition-all cursor-pointer shadow-2xs ${
              category === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs ring-2 ring-slate-800/25'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400 hover:text-slate-900 active:scale-98'
            }`}
            title="Mostrar CTOs de todas las pestañas"
          >
            <span>Todas</span>
          </button>

          {MOP_CATEGORIES.map(cat => {
            const isSelected = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onCategoryChange(cat.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-bold ring-2 ring-blue-500/30'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-blue-50/70 hover:border-blue-400 hover:text-blue-700 active:scale-98'
                }`}
                title={`Filtrar exclusivamente registros de la pestaña ${cat.label}`}
              >
                <span
                  className={`h-2 w-2 rounded-full transition-colors ${
                    isSelected ? 'bg-white' : 'bg-slate-400'
                  }`}
                />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
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

      {/* Fila secundaria: botón de reset */}
      {hasActiveFilters && (
        <div className="flex justify-end pt-1 border-t border-slate-100">
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition-colors cursor-pointer"
            title="Restablecer todos los filtros"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Limpiar filtros</span>
          </button>
        </div>
      )}
    </div>
  );
}
