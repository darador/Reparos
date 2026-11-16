'use client';

import React from 'react';
import { MopMetrics } from '@/lib/types/database';
import { AlertCircle, AlertTriangle, CheckCircle2, Clock, EyeOff, Radio } from 'lucide-react';

export type MopMetricFilterKey = 'all' | 'pendientes' | 'completadas' | 'con_reparo' | 'ausentes';

interface MopMetricStripProps {
  metrics: MopMetrics;
  activeFilter?: MopMetricFilterKey;
  onFilterChange?: (filterKey: MopMetricFilterKey) => void;
}

export function MopMetricStrip({
  metrics,
  activeFilter = 'all',
  onFilterChange
}: MopMetricStripProps) {
  const handleClick = (key: MopMetricFilterKey) => {
    if (onFilterChange) {
      if (activeFilter === key && key !== 'all') {
        onFilterChange('all');
      } else {
        onFilterChange(key);
      }
    }
  };

  const isInteractive = !!onFilterChange;

  return (
    <div className="bg-white border border-slate-200 rounded px-4 py-2.5 shadow-2xs flex flex-wrap items-center gap-y-2 gap-x-3 text-xs text-slate-700">
      {/* Total CTO */}
      <div
        onClick={() => handleClick('all')}
        className={`flex items-center gap-2 px-2.5 py-1 rounded transition-all select-none ${
          isInteractive ? 'cursor-pointer hover:bg-slate-100/90 active:scale-98' : ''
        } ${
          activeFilter === 'all' && isInteractive ? 'bg-slate-100 ring-1 ring-slate-400/50 shadow-2xs font-bold' : ''
        }`}
        title="Haz clic para ver todas las CTO sin filtrar por estado"
      >
        <Radio className="h-3.5 w-3.5 text-blue-600" />
        <span className="font-semibold text-slate-900 text-sm font-mono">{metrics.total}</span>
        <span className="text-slate-500 uppercase tracking-wider text-[11px]">Total CTO</span>
      </div>

      <div className="h-4 w-px bg-slate-200 hidden sm:block" />

      {/* Pendientes */}
      <div
        onClick={() => handleClick('pendientes')}
        className={`flex items-center gap-2 px-2.5 py-1 rounded transition-all select-none ${
          isInteractive ? 'cursor-pointer hover:bg-amber-50/90 active:scale-98' : ''
        } ${
          activeFilter === 'pendientes' ? 'bg-amber-100/90 ring-2 ring-amber-500/70 shadow-2xs' : ''
        }`}
        title="Haz clic para filtrar y ver las CTOs en estado PENDIENTE"
      >
        <span
          className={`font-semibold text-sm px-1.5 py-0.5 rounded font-mono transition-colors ${
            activeFilter === 'pendientes'
              ? 'bg-amber-600 text-white shadow-2xs'
              : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}
        >
          {metrics.pendientes}
        </span>
        <span className={`font-medium ${activeFilter === 'pendientes' ? 'text-amber-900 font-bold' : 'text-slate-700'}`}>
          Pendientes
        </span>
      </div>

      <div className="h-4 w-px bg-slate-200 hidden sm:block" />

      {/* Completadas */}
      <div
        onClick={() => handleClick('completadas')}
        className={`flex items-center gap-2 px-2.5 py-1 rounded transition-all select-none ${
          isInteractive ? 'cursor-pointer hover:bg-emerald-50/90 active:scale-98' : ''
        } ${
          activeFilter === 'completadas' ? 'bg-emerald-100/90 ring-2 ring-emerald-500/70 shadow-2xs' : ''
        }`}
        title="Haz clic para filtrar y ver las CTOs en estado COMPLETADO"
      >
        <span
          className={`font-semibold text-sm px-1.5 py-0.5 rounded font-mono transition-colors ${
            activeFilter === 'completadas'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          {metrics.completadas}
        </span>
        <span className={`font-medium ${activeFilter === 'completadas' ? 'text-emerald-900 font-bold' : 'text-slate-700'}`}>
          Completadas
        </span>
      </div>

      <div className="h-4 w-px bg-slate-200 hidden sm:block" />

      {/* Con reparo */}
      <div
        onClick={() => handleClick('con_reparo')}
        className={`flex items-center gap-2 px-2.5 py-1 rounded transition-all select-none ${
          isInteractive ? 'cursor-pointer hover:bg-rose-50/90 active:scale-98' : ''
        } ${
          activeFilter === 'con_reparo' ? 'bg-rose-100/90 ring-2 ring-rose-500/70 shadow-2xs' : ''
        }`}
        title="Haz clic para filtrar y ver las CTOs en estado CON REPARO"
      >
        <span
          className={`font-semibold text-sm px-1.5 py-0.5 rounded font-mono transition-colors ${
            activeFilter === 'con_reparo'
              ? 'bg-rose-600 text-white shadow-2xs'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {metrics.conReparo}
        </span>
        <span className={`font-medium ${activeFilter === 'con_reparo' ? 'text-rose-900 font-bold' : 'text-slate-700'}`}>
          Con Reparo
        </span>
      </div>

      <div className="h-4 w-px bg-slate-200 hidden sm:block" />

      {/* Ausentes en última actualización */}
      <div
        onClick={() => handleClick('ausentes')}
        className={`flex items-center gap-2 px-2.5 py-1 rounded transition-all select-none ${
          isInteractive ? 'cursor-pointer hover:bg-slate-100 active:scale-98' : ''
        } ${
          activeFilter === 'ausentes' ? 'bg-slate-200/90 ring-2 ring-slate-500/70 shadow-2xs' : ''
        }`}
        title="CTOs registradas previamente que no aparecieron en el último archivo importado"
      >
        <EyeOff className="h-3.5 w-3.5 text-slate-500" />
        <span
          className={`font-semibold text-sm px-1.5 py-0.5 rounded font-mono transition-colors ${
            activeFilter === 'ausentes'
              ? 'bg-slate-700 text-white shadow-2xs'
              : 'bg-slate-100 text-slate-700 border border-slate-300'
          }`}
        >
          {metrics.ausentes}
        </span>
        <span className={`font-medium ${activeFilter === 'ausentes' ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
          Ausentes en actualización
        </span>
      </div>
    </div>
  );
}
