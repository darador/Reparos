'use client';

import { RepairTable } from "@/components/repairs/RepairTable";
import { LogEventModal } from "@/components/timeline/LogEventModal";
import { repository } from "@/lib/store/repository";
import { Repair } from "@/lib/types/database";
import { AlertCircle, AlertTriangle, CheckCircle2, LayoutDashboard, UserX, Wrench } from "lucide-react";
import { useEffect, useState } from "react";

export default function PendingViewPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'unassigned' | 'critical' | 'reiterated' | 'verification' | 'finalized'>('all');
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [selectedRepairForEvent, setSelectedRepairForEvent] = useState<Repair | null>(null);

  const loadData = () => {
    if (activeTab === 'verification') {
      const resolvedList = repository.getRepairs().filter(r => r.current_status?.category === 'resolved' || r.current_status?.name === 'VERIFICACIÓN RESUELTO');
      setRepairs(resolvedList);
      return;
    }

    if (activeTab === 'finalized') {
      const finalizedList = repository.getRepairs().filter(r => r.current_status?.category === 'closed' || r.current_status?.name === 'FINALIZADO');
      setRepairs(finalizedList);
      return;
    }

    let list = repository.getRepairs({ onlyPending: true });

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
    loadData();
  }, [activeTab]);

  const handleLogEvent = (data: any) => {
    repository.addRepairEvent(data);
    loadData();
  };

  const allPending = repository.getRepairs({ onlyPending: true });
  const unassignedCount = allPending.filter(r => !r.current_responsible_id).length;
  const criticalCount = allPending.filter(r => r.priority === 'Crítica' || r.priority === 'Alta').length;
  const reiteratedCount = allPending.filter(r => (r.reiteration_count || 0) > 0).length;
  const verificationCount = repository.getRepairs().filter(r => r.current_status?.category === 'resolved' || r.current_status?.name === 'VERIFICACIÓN RESUELTO').length;
  const finalizedCount = repository.getRepairs().filter(r => r.current_status?.category === 'closed' || r.current_status?.name === 'FINALIZADO').length;

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded shadow-2xs">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4 text-blue-600" />
            <span>Tablero Resumen — Reparos y Atenciones</span>
            <span className="text-[11px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded font-mono font-bold">
              {allPending.length} pendientes
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Foco operacional para administradores: casos sin responsable, prioridad urgente, reiteraciones, listos para verificar y casos finalizados.
          </p>
        </div>
      </div>

      {/* Tabs */}
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
          <span>Todos los Pendientes ({allPending.length})</span>
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
          <span>Sin Responsable ({unassignedCount})</span>
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
          <span>Alta / Crítica ({criticalCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('reiterated')}
          className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors ${
            activeTab === 'reiterated'
              ? 'bg-slate-900 text-white font-semibold shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
          <span>Reiterados ({reiteratedCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('verification')}
          className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors ${
            activeTab === 'verification'
              ? 'bg-slate-900 text-white font-semibold shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-amber-500" />
          <span>Listos p/ Verificar ({verificationCount})</span>
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
          <span>Finalizados ({finalizedCount})</span>
        </button>
      </div>

      {/* Repairs Table */}
      <RepairTable
        repairs={repairs}
        onLogEventClick={(repair) => setSelectedRepairForEvent(repair)}
        onRefresh={loadData}
      />

      {selectedRepairForEvent && (
        <LogEventModal
          isOpen={!!selectedRepairForEvent}
          onClose={() => setSelectedRepairForEvent(null)}
          onSubmit={handleLogEvent}
          repair={selectedRepairForEvent}
          responsibleParties={repository.getResponsibleParties()}
          repairStatuses={repository.getRepairStatuses()}
        />
      )}
    </div>
  );
}
