'use client';

import React, { useState, useMemo } from 'react';
import { DashboardMetrics, PoligonoMetric } from "@/lib/types/database";
import { Check, ChevronDown, Copy, Filter, MapPin, Search, X } from "lucide-react";

export type MetricFilterKey = 'all' | 'pending' | 'resolved' | 'reiterated' | 'finalized';

interface MetricStripProps {
  metrics: DashboardMetrics;
  activeFilter?: MetricFilterKey;
  onFilterChange?: (filterKey: MetricFilterKey) => void;
  onSelectPoligono?: (poligono: string) => void;
}

export function MetricStrip({
  metrics,
  activeFilter = 'all',
  onFilterChange,
  onSelectPoligono
}: MetricStripProps) {
  const [isPoligonosOpen, setIsPoligonosOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'finalized'>('all');
  const [poligonoSearch, setPoligonoSearch] = useState('');
  const [copied, setCopied] = useState(false);

  const handleClick = (key: MetricFilterKey) => {
    if (onFilterChange) {
      if (activeFilter === key && key !== 'all') {
        onFilterChange('all');
      } else {
        onFilterChange(key);
      }
    }
  };

  const isInteractive = !!onFilterChange;
  const poligonosList = metrics.poligonosConReparos || [];
  const poligonosConReparosCount = metrics.poligonosConReparosCount ?? poligonosList.length;

  const countPending = useMemo(() => {
    return poligonosList.filter(p => p.pendingRepairs > 0).length;
  }, [poligonosList]);

  const countFinalizedOnly = useMemo(() => {
    return poligonosList.filter(p => p.pendingRepairs === 0).length;
  }, [poligonosList]);

  const filteredPoligonos = useMemo(() => {
    let list = poligonosList;
    if (filterTab === 'pending') {
      list = list.filter(p => p.pendingRepairs > 0);
    } else if (filterTab === 'finalized') {
      list = list.filter(p => p.pendingRepairs === 0);
    }

    if (poligonoSearch.trim()) {
      const q = poligonoSearch.toLowerCase().trim();
      list = list.filter(p =>
        p.poligono.toLowerCase().includes(q) ||
        (p.central && p.central.toLowerCase().includes(q)) ||
        (p.sigest && p.sigest.toLowerCase().includes(q)) ||
        (p.distrito && p.distrito.toLowerCase().includes(q))
      );
    }

    return list;
  }, [poligonosList, filterTab, poligonoSearch]);

  const handleCopy = () => {
    const text = filteredPoligonos.map(p => p.poligono).join(', ');
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePoligonoClick = (pol: string) => {
    if (onSelectPoligono) {
      onSelectPoligono(pol);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded shadow-2xs text-xs text-slate-700 overflow-hidden">
      {/* Fila principal de cantidades */}
      <div className="px-4 py-2.5 flex flex-wrap items-center gap-y-2 gap-x-3 text-xs">
        {/* Proyectos & Reparos Totales */}
        <div
          onClick={() => handleClick('all')}
          className={`flex items-center gap-2 px-2.5 py-1 rounded transition-all select-none ${
            isInteractive ? 'cursor-pointer hover:bg-slate-100/90 active:scale-98' : ''
          } ${
            activeFilter === 'all' && isInteractive ? 'bg-slate-100 ring-1 ring-slate-400/50 shadow-2xs font-bold' : ''
          }`}
          title="Haz clic para ver todos los reparos sin filtrar"
        >
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-900 text-sm">{metrics.totalProjects}</span>
            <span className="text-slate-500 uppercase tracking-wider text-[11px]">Proyectos</span>
          </div>

          <span className="text-slate-300 mx-0.5">|</span>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-900 text-sm">{metrics.totalRepairs}</span>
            <span className="text-slate-500 uppercase tracking-wider text-[11px]">Reparos Totales</span>
          </div>
        </div>

        <div className="h-4 w-px bg-slate-200 hidden sm:block" />

        {/* Polígonos con Reparos */}
        <div
          onClick={() => setIsPoligonosOpen(prev => !prev)}
          className={`flex items-center gap-2 px-2.5 py-1 rounded transition-all select-none cursor-pointer border ${
            isPoligonosOpen
              ? 'bg-indigo-50 border-indigo-300 text-indigo-950 shadow-2xs ring-1 ring-indigo-400/40'
              : 'bg-white hover:bg-indigo-50/50 border-slate-200 hover:border-indigo-200 text-slate-700'
          }`}
          title="Haz clic para ver cuántos y cuáles son los polígonos con reparos"
        >
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-indigo-600" />
            <span className="font-bold text-indigo-900 text-sm font-mono">{poligonosConReparosCount}</span>
            <span className="text-slate-500 uppercase tracking-wider text-[11px]">Polígonos c/ Reparos</span>
          </div>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors flex items-center gap-1 ${
            isPoligonosOpen ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}>
            <span>{isPoligonosOpen ? 'Ocultar' : 'Ver cuáles'}</span>
            <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isPoligonosOpen ? 'rotate-180' : ''}`} />
          </span>
        </div>

        <div className="h-4 w-px bg-slate-200 hidden sm:block" />

        {/* Pendientes */}
        <div
          onClick={() => handleClick('pending')}
          className={`flex items-center gap-2 px-2.5 py-1 rounded transition-all select-none ${
            isInteractive ? 'cursor-pointer hover:bg-amber-50/90 active:scale-98' : ''
          } ${
            activeFilter === 'pending' ? 'bg-amber-100/90 ring-2 ring-amber-500/70 shadow-2xs' : ''
          }`}
          title="Haz clic para filtrar y ver los reparos Pendientes"
        >
          <span className={`font-semibold text-sm px-1.5 py-0.5 rounded font-mono transition-colors ${
            activeFilter === 'pending'
              ? 'bg-amber-600 text-white shadow-2xs'
              : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}>
            {metrics.pendingRepairs}
          </span>
          <span className={`font-medium ${activeFilter === 'pending' ? 'text-amber-900 font-bold' : 'text-slate-700'}`}>
            Pendientes
          </span>
        </div>

        <div className="h-4 w-px bg-slate-200 hidden sm:block" />

        {/* Verificación Resuelto */}
        <div
          onClick={() => handleClick('resolved')}
          className={`flex items-center gap-2 px-2.5 py-1 rounded transition-all select-none ${
            isInteractive ? 'cursor-pointer hover:bg-blue-50/90 active:scale-98' : ''
          } ${
            activeFilter === 'resolved' ? 'bg-blue-100/90 ring-2 ring-blue-500/70 shadow-2xs' : ''
          }`}
          title="Haz clic para filtrar y ver los reparos en Verificación Resuelto"
        >
          <span className={`font-semibold text-sm px-1.5 py-0.5 rounded font-mono transition-colors ${
            activeFilter === 'resolved'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            {metrics.resolvedAwaitingVerification}
          </span>
          <span className={`font-medium ${activeFilter === 'resolved' ? 'text-blue-900 font-bold' : 'text-slate-700'}`}>
            Verificación Resuelto
          </span>
        </div>

        <div className="h-4 w-px bg-slate-200 hidden sm:block" />

        {/* Reiterados */}
        <div
          onClick={() => handleClick('reiterated')}
          className={`flex items-center gap-2 px-2.5 py-1 rounded transition-all select-none ${
            isInteractive ? 'cursor-pointer hover:bg-red-50/90 active:scale-98' : ''
          } ${
            activeFilter === 'reiterated' ? 'bg-red-100/90 ring-2 ring-red-500/70 shadow-2xs' : ''
          }`}
          title="Haz clic para filtrar y ver únicamente los reparos Reiterados"
        >
          <span className={`font-semibold text-sm px-1.5 py-0.5 rounded font-mono transition-colors ${
            activeFilter === 'reiterated'
              ? 'bg-red-600 text-white shadow-2xs'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {metrics.reiteratedRepairs}
          </span>
          <span className={`font-medium ${activeFilter === 'reiterated' ? 'text-red-900 font-bold' : 'text-slate-700'}`}>
            Reiterados
          </span>
        </div>

        <div className="h-4 w-px bg-slate-200 hidden sm:block" />

        {/* Finalizados */}
        <div
          onClick={() => handleClick('finalized')}
          className={`flex items-center gap-2 px-2.5 py-1 rounded transition-all select-none ${
            isInteractive ? 'cursor-pointer hover:bg-emerald-50/90 active:scale-98' : ''
          } ${
            activeFilter === 'finalized' ? 'bg-emerald-100/90 ring-2 ring-emerald-500/70 shadow-2xs' : ''
          }`}
          title="Haz clic para filtrar y ver los reparos Finalizados"
        >
          <span className={`font-semibold text-sm px-1.5 py-0.5 rounded font-mono transition-colors ${
            activeFilter === 'finalized'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}>
            {metrics.finalizedRepairs}
          </span>
          <span className={`font-medium ${activeFilter === 'finalized' ? 'text-emerald-900 font-bold' : 'text-slate-600'}`}>
            Finalizados
          </span>
        </div>
      </div>

      {/* Detalle desplegable de Polígonos con Reparos */}
      {isPoligonosOpen && (
        <div className="border-t border-slate-200 bg-slate-50/90 p-3.5 space-y-3 animate-in fade-in duration-150">
          {/* Cabecera del panel desplegable */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 text-white p-1 rounded">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <span>Detalle de Polígonos con Reparos</span>
                  <span className="bg-indigo-100 text-indigo-900 font-mono font-bold text-[11px] px-2 py-0.2 rounded-full border border-indigo-200">
                    {filteredPoligonos.length} de {poligonosConReparosCount}
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  {onSelectPoligono
                    ? 'Haz clic en cualquier polígono para filtrar directamente la tabla de reparos.'
                    : 'Listado consolidado de polígonos que tienen reparos asociados.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Botón copiar listado */}
              <button
                type="button"
                onClick={handleCopy}
                disabled={filteredPoligonos.length === 0}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-medium shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                title="Copiar lista de nombres de polígonos separados por coma"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600 font-bold" />
                    <span className="text-emerald-700 font-bold">¡Copiados!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 text-slate-500" />
                    <span>Copiar nombres</span>
                  </>
                )}
              </button>

              {/* Botón cerrar */}
              <button
                type="button"
                onClick={() => setIsPoligonosOpen(false)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer text-xs"
                title="Cerrar detalle de polígonos"
              >
                <X className="h-3.5 w-3.5" />
                <span>Cerrar</span>
              </button>
            </div>
          </div>

          {/* Barra de filtros internos y buscador */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Tabs rápidos */}
            <div className="flex items-center gap-1 bg-white p-0.5 rounded border border-slate-200 text-[11px]">
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                  filterTab === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Todos ({poligonosList.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('pending')}
                className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                  filterTab === 'pending'
                    ? 'bg-amber-600 text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:bg-amber-50'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />
                <span>Con pendientes ({countPending})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('finalized')}
                className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                  filterTab === 'finalized'
                    ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:bg-emerald-50'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                <span>100% Finalizados ({countFinalizedOnly})</span>
              </button>
            </div>

            {/* Buscador de polígonos en el panel */}
            <div className="relative min-w-[200px] sm:w-64">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar polígono, central, SIGEST..."
                value={poligonoSearch}
                onChange={(e) => setPoligonoSearch(e.target.value)}
                className="w-full text-xs pl-8 pr-7 py-1 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans placeholder-slate-400"
              />
              {poligonoSearch && (
                <button
                  type="button"
                  onClick={() => setPoligonoSearch('')}
                  className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Grilla / Listado de polígonos */}
          {filteredPoligonos.length === 0 ? (
            <div className="py-6 text-center text-slate-500 text-xs bg-white rounded border border-slate-200">
              <p className="font-medium">No se encontraron polígonos para este criterio de búsqueda.</p>
              {poligonoSearch && (
                <button
                  type="button"
                  onClick={() => setPoligonoSearch('')}
                  className="mt-1.5 text-indigo-600 hover:underline font-semibold text-xs cursor-pointer"
                >
                  Limpiar búsqueda interna
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-72 overflow-y-auto pr-1">
              {filteredPoligonos.map((item) => (
                <div
                  key={`${item.poligono}_${item.sigest || ''}`}
                  onClick={() => handlePoligonoClick(item.poligono)}
                  className={`p-2 rounded border bg-white flex flex-col justify-between gap-1.5 transition-all text-xs select-none ${
                    onSelectPoligono
                      ? 'cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 hover:shadow-2xs active:scale-98'
                      : 'border-slate-200'
                  }`}
                  title={onSelectPoligono ? `Haz clic para filtrar la tabla de reparos por ${item.poligono}` : undefined}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-slate-900 font-mono text-[12px] truncate" title={item.poligono}>
                      {item.poligono}
                    </span>
                    {item.pendingRepairs > 0 ? (
                      <span
                        className="bg-amber-100 text-amber-900 border border-amber-300 font-mono font-bold text-[10px] px-1.5 py-0.2 rounded-full shrink-0"
                        title={`${item.pendingRepairs} reparos pendientes`}
                      >
                        {item.pendingRepairs} pend.
                      </span>
                    ) : (
                      <span
                        className="bg-emerald-100 text-emerald-800 font-mono font-bold text-[10px] px-1 py-0.2 rounded-full shrink-0"
                        title="Todos los reparos de este polígono están finalizados"
                      >
                        ✓ 0
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100 font-sans">
                    <span className="truncate max-w-[95px] font-medium" title={item.central || item.distrito || item.sigest || '-'}>
                      {item.central || item.sigest || item.distrito || '-'}
                    </span>
                    <span className="font-mono text-slate-500 font-medium shrink-0">
                      {item.totalRepairs} {item.totalRepairs === 1 ? 'rep.' : 'rep.'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
