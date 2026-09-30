import { DashboardMetrics } from "@/lib/types/database";

export type MetricFilterKey = 'all' | 'pending' | 'resolved' | 'reiterated' | 'finalized';

interface MetricStripProps {
  metrics: DashboardMetrics;
  activeFilter?: MetricFilterKey;
  onFilterChange?: (filterKey: MetricFilterKey) => void;
}

export function MetricStrip({ metrics, activeFilter = 'all', onFilterChange }: MetricStripProps) {
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

  return (
    <div className="bg-white border border-slate-200 rounded px-4 py-2.5 shadow-2xs flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-700">
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
          <span className="text-slate-400 font-normal">({metrics.activeProjects} en ejec.)</span>
        </div>

        <span className="text-slate-300 mx-0.5">|</span>

        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-900 text-sm">{metrics.totalRepairs}</span>
          <span className="text-slate-500 uppercase tracking-wider text-[11px]">Reparos Totales</span>
        </div>
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
  );
}
