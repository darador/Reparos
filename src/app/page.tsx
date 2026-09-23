'use client';

import { RepairTable } from "@/components/repairs/RepairTable";
import { LoadingState } from "@/components/shared/LoadingState";
import { MetricStrip } from "@/components/shared/MetricStrip";
import { repository } from "@/lib/store/repository";
import { DashboardMetrics, Repair } from "@/lib/types/database";
import { AlertCircle, AlertTriangle, CheckCircle2, LayoutDashboard, LogIn, UserX, Wrench } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function TableroResumenRootPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'unassigned' | 'critical' | 'reiterated' | 'verification' | 'finalized'>('all');
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [counts, setCounts] = useState({
    pending: 0,
    unassigned: 0,
    critical: 0,
    reiterated: 0,
    verification: 0,
    finalized: 0
  });
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalProjects: 0,
    activeProjects: 0,
    totalRepairs: 0,
    pendingRepairs: 0,
    reiteratedRepairs: 0,
    resolvedAwaitingVerification: 0,
    finalizedRepairs: 0
  });
  const [isLoading, setIsLoading] = useState(!repository.isLoaded);

  const loadData = () => {
    setMetrics(repository.getDashboardMetrics());

    const allRepairs = repository.getRepairs();
    const allPending = repository.getRepairs({ onlyPending: true });

    const unassignedCount = allPending.filter(r => !r.current_responsible_id).length;
    const criticalCount = allPending.filter(r => r.priority === 'Crítica' || r.priority === 'Alta').length;
    const reiteratedCount = allPending.filter(r => (r.reiteration_count || 0) > 0).length;
    const verificationCount = allRepairs.filter(r => r.current_status?.category === 'resolved' || r.current_status?.name === 'VERIFICACIÓN RESUELTO').length;
    const finalizedCount = allRepairs.filter(r => r.current_status?.category === 'closed' || r.current_status?.name === 'FINALIZADO').length;

    setCounts({
      pending: allPending.length,
      unassigned: unassignedCount,
      critical: criticalCount,
      reiterated: reiteratedCount,
      verification: verificationCount,
      finalized: finalizedCount
    });

    if (activeTab === 'verification') {
      const resolvedList = allRepairs.filter(r => r.current_status?.category === 'resolved' || r.current_status?.name === 'VERIFICACIÓN RESUELTO');
      setRepairs(resolvedList);
      return;
    }

    if (activeTab === 'finalized') {
      const finalizedList = allRepairs.filter(r => r.current_status?.category === 'closed' || r.current_status?.name === 'FINALIZADO');
      setRepairs(finalizedList);
      return;
    }

    let list = allPending;

    if (activeTab === 'unassigned') {
      list = list.filter(r => !r.current_responsible_id);
    } else if (activeTab === 'critical') {
      list = list.filter(r => r.priority === 'Crítica' || r.priority === 'Alta');
    } else if (activeTab === 'reiterated') {
      list = list.filter(r => (r.reiteration_count || 0) > 0);
    }

    setRepairs(list);
  };

  useEffect(() => {
    async function init() {
      if (!repository.isLoaded) {
        setIsLoading(true);
        await repository.ensureLoaded();
      }
      loadData();
      setIsLoading(false);
    }
    init();
  }, [activeTab]);

  if (isLoading) {
    return (
      <LoadingState
        title="Cargando Tablero Resumen..."
        message="Consultando estado de pendientes y atenciones desde la base de datos."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header bar Tablero Resumen */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded shadow-2xs">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4 text-blue-600" />
            <span>Tablero Resumen — Reparos y Atenciones</span>
            <span className="text-[11px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded font-mono font-bold">
              {counts.pending} pendientes
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Vista consolidada de resumen operacional: casos sin responsable, prioridad urgente, reiteraciones, listos para verificar y finalizados.
          </p>
        </div>

        <div className="shrink-0">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded shadow-xs transition-colors"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Iniciar Sesión</span>
          </Link>
        </div>
      </div>

      {/* Métricas Resumen */}
      <MetricStrip metrics={metrics} />

      {/* Tabs de Filtro */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 text-xs font-medium bg-white p-1.5 rounded border">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white font-semibold shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Wrench className="h-3.5 w-3.5" />
          <span>Todos los Pendientes ({counts.pending})</span>
        </button>

        <button
          onClick={() => setActiveTab('unassigned')}
          className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors ${
            activeTab === 'unassigned'
              ? 'bg-slate-900 text-white font-semibold shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserX className="h-3.5 w-3.5 text-amber-500" />
          <span>Sin Responsable ({counts.unassigned})</span>
        </button>

        <button
          onClick={() => setActiveTab('critical')}
          className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors ${
            activeTab === 'critical'
              ? 'bg-slate-900 text-white font-semibold shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertCircle className="h-3.5 w-3.5 text-red-500" />
          <span>Urgentes ({counts.critical})</span>
        </button>

        <button
          onClick={() => setActiveTab('reiterated')}
          className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors ${
            activeTab === 'reiterated'
              ? 'bg-slate-900 text-white font-semibold shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
          <span>Reiterados ({counts.reiterated})</span>
        </button>

        <button
          onClick={() => setActiveTab('verification')}
          className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors ${
            activeTab === 'verification'
              ? 'bg-slate-900 text-white font-semibold shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
          <span>Para Verificar ({counts.verification})</span>
        </button>

        <button
          onClick={() => setActiveTab('finalized')}
          className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors ${
            activeTab === 'finalized'
              ? 'bg-slate-900 text-white font-semibold shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <span>Finalizados ({counts.finalized})</span>
        </button>
      </div>

      {/* Tabla Resumen idéntica con hideActions={true} */}
      <RepairTable
        repairs={repairs}
        onRefresh={loadData}
        hideActions={true}
      />
    </div>
  );
}
