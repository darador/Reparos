import { DashboardMetrics } from "@/lib/types/database";

interface MetricStripProps {
  metrics: DashboardMetrics;
}

export function MetricStrip({ metrics }: MetricStripProps) {
  return (
    <div className="bg-white border border-slate-200 rounded px-4 py-2.5 shadow-2xs flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-700">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-slate-900 text-sm">{metrics.totalProjects}</span>
        <span className="text-slate-500 uppercase tracking-wider text-[11px]">Proyectos</span>
        <span className="text-slate-300 font-normal">({metrics.activeProjects} en ejecución)</span>
      </div>

      <div className="h-4 w-px bg-slate-200 hidden sm:block" />

      <div className="flex items-center gap-2">
        <span className="font-semibold text-slate-900 text-sm">{metrics.totalRepairs}</span>
        <span className="text-slate-500 uppercase tracking-wider text-[11px]">Reparos Totales</span>
      </div>

      <div className="h-4 w-px bg-slate-200 hidden sm:block" />

      <div className="flex items-center gap-2">
        <span className="font-semibold text-amber-700 text-sm bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-mono">
          {metrics.pendingRepairs}
        </span>
        <span className="text-slate-700 font-medium">Pendientes</span>
      </div>

      <div className="h-4 w-px bg-slate-200 hidden sm:block" />

      <div className="flex items-center gap-2">
        <span className="font-semibold text-blue-700 text-sm bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded font-mono">
          {metrics.resolvedAwaitingVerification}
        </span>
        <span className="text-slate-700 font-medium">Verificación Resuelto</span>
      </div>

      <div className="h-4 w-px bg-slate-200 hidden sm:block" />

      <div className="flex items-center gap-2">
        <span className="font-semibold text-red-700 text-sm bg-red-50 border border-red-200 px-1.5 py-0.5 rounded font-mono">
          {metrics.reiteratedRepairs}
        </span>
        <span className="text-slate-700 font-medium">Reiterados</span>
      </div>

      <div className="h-4 w-px bg-slate-200 hidden sm:block" />

      <div className="flex items-center gap-2">
        <span className="font-semibold text-slate-700 text-sm bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded font-mono">
          {metrics.finalizedRepairs}
        </span>
        <span className="text-slate-600 font-medium">Finalizados</span>
      </div>
    </div>
  );
}
