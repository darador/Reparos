'use client';

import { RepairFilters } from "@/components/repairs/RepairFilters";
import { RepairTable } from "@/components/repairs/RepairTable";
import { LoadingState } from "@/components/shared/LoadingState";
import { LogEventModal } from "@/components/timeline/LogEventModal";
import { repository } from "@/lib/store/repository";
import { Repair } from "@/lib/types/database";
import { AlertCircle, AlertTriangle, CheckCircle2, LayoutDashboard, UserX, Wrench } from "lucide-react";
import { useEffect, useState } from "react";

export default function PendingViewPage() {
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
  const [isLoading, setIsLoading] = useState(!repository.isLoaded);
  const [selectedRepairForEvent, setSelectedRepairForEvent] = useState<Repair | null>(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [statusId, setStatusId] = useState('all');
  const [responsibleId, setResponsibleId] = useState('all');
  const [solicitante, setSolicitante] = useState('all');
  const [priority, setPriority] = useState('all');
  const [typeId, setTypeId] = useState('all');
  const [distrito, setDistrito] = useState('all');
  const [central, setCentral] = useState('all');
  const [onlyReiterated, setOnlyReiterated] = useState(false);
  const [selectedCumplimientos, setSelectedCumplimientos] = useState<number[]>([]);
  const [hideFinalizedProjects, setHideFinalizedProjects] = useState(true);

  const resetFilters = () => {
    setSearch('');
    setStatusId('all');
    setResponsibleId('all');
    setSolicitante('all');
    setPriority('all');
    setTypeId('all');
    setDistrito('all');
    setCentral('all');
    setOnlyReiterated(false);
    setSelectedCumplimientos([]);
    setHideFinalizedProjects(true);
  };

  const toggleCumplimiento = (val: number) => {
    setSelectedCumplimientos(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  };

  const loadData = () => {
    const allRepairsRaw = repository.getRepairs();
    const allPendingRaw = repository.getRepairs({ onlyPending: true });

    setCounts({
      pending: allPendingRaw.length,
      unassigned: allPendingRaw.filter(r => !r.current_responsible_id).length,
      critical: allPendingRaw.filter(r => r.priority === 'Crítica' || r.priority === 'Alta').length,
      reiterated: allPendingRaw.filter(r => (r.reiteration_count || 0) > 0).length,
      verification: allRepairsRaw.filter(r => r.current_status?.category === 'resolved' || r.current_status?.name === 'VERIFICACIÓN RESUELTO').length,
      finalized: allRepairsRaw.filter(r => r.current_status?.category === 'closed' || r.current_status?.name === 'FINALIZADO').length
    });

    // Si hay un término de búsqueda en la lupa, busca en el listado total sin restringir por pestaña ni filtros
    if (search.trim()) {
      const allMatching = repository.getRepairs({ search: search.trim() });
      setRepairs(allMatching);
      return;
    }

    const filteredBase = repository.getRepairs({
      statusId,
      responsibleId,
      solicitante,
      priority,
      typeId,
      distrito,
      central,
      onlyReiterated,
      cumplimiento: selectedCumplimientos,
      excludeFinalizedProjects: hideFinalizedProjects && activeTab !== 'finalized' && !selectedCumplimientos.includes(100)
    });

    if (activeTab === 'verification') {
      const resolvedList = filteredBase.filter(r => r.current_status?.category === 'resolved' || r.current_status?.name === 'VERIFICACIÓN RESUELTO');
      setRepairs(resolvedList);
      return;
    }

    if (activeTab === 'finalized') {
      const finalizedList = filteredBase.filter(r => r.current_status?.category === 'closed' || r.current_status?.name === 'FINALIZADO');
      setRepairs(finalizedList);
      return;
    }

    let list = filteredBase.filter(r => r.current_status?.category === 'pending' || r.current_status?.category === 'in_progress');

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
  }, [activeTab, search, statusId, responsibleId, solicitante, priority, typeId, distrito, central, onlyReiterated, selectedCumplimientos, hideFinalizedProjects]);

  const handleLogEvent = async (data: any) => {
    await repository.addRepairEvent(data);
    loadData();
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
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
            Foco operacional para administradores: casos sin responsable, prioridad urgente, reiteraciones, listos para verificar y casos finalizados.
          </p>
        </div>
      </div>

      {/* Filtros avanzados */}
      <RepairFilters
        search={search}
        onSearchChange={setSearch}
        statusId={statusId}
        onStatusChange={setStatusId}
        responsibleId={responsibleId}
        onResponsibleChange={setResponsibleId}
        solicitante={solicitante}
        onSolicitanteChange={setSolicitante}
        solicitantes={repository.getSolicitantes()}
        priority={priority}
        onPriorityChange={setPriority}
        typeId={typeId}
        onTypeChange={setTypeId}
        distrito={distrito}
        onDistritoChange={setDistrito}
        central={central}
        onCentralChange={setCentral}
        onlyReiterated={onlyReiterated}
        onOnlyReiteratedChange={setOnlyReiterated}
        selectedCumplimientos={selectedCumplimientos}
        onCumplimientoToggle={toggleCumplimiento}
        hideFinalizedProjects={hideFinalizedProjects}
        onHideFinalizedProjectsChange={setHideFinalizedProjects}
        repairStatuses={repository.getRepairStatuses()}
        responsibleParties={repository.getResponsibleParties()}
        repairTypes={repository.getRepairTypes()}
        distritos={repository.getDistritos()}
        centrales={repository.getCentrales()}
        onResetFilters={resetFilters}
      />

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 text-xs font-medium bg-white p-1.5 rounded border">
        <button
          onClick={() => {
            setSearch('');
            setActiveTab('all');
          }}
          className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors ${
            activeTab === 'all' && !search.trim()
              ? 'bg-slate-900 text-white font-semibold shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Wrench className="h-3.5 w-3.5" />
          <span>Pendientes ({counts.pending})</span>
        </button>

        <button
          onClick={() => {
            setSearch('');
            setActiveTab('unassigned');
          }}
          className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors ${
            activeTab === 'unassigned' && !search.trim()
              ? 'bg-slate-900 text-white font-semibold shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserX className="h-3.5 w-3.5 text-amber-500" />
          <span>Sin Responsable ({counts.unassigned})</span>
        </button>

        <button
          onClick={() => {
            setSearch('');
            setActiveTab('critical');
          }}
          className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors ${
            activeTab === 'critical' && !search.trim()
              ? 'bg-slate-900 text-white font-semibold shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertCircle className="h-3.5 w-3.5 text-red-500" />
          <span>Urgentes ({counts.critical})</span>
        </button>

        <button
          onClick={() => {
            setSearch('');
            setActiveTab('reiterated');
          }}
          className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors ${
            activeTab === 'reiterated' && !search.trim()
              ? 'bg-slate-900 text-white font-semibold shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
          <span>Reiterados ({counts.reiterated})</span>
        </button>

        <button
          onClick={() => {
            setSearch('');
            setActiveTab('verification');
          }}
          className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors ${
            activeTab === 'verification' && !search.trim()
              ? 'bg-slate-900 text-white font-semibold shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
          <span>Para Verificar ({counts.verification})</span>
        </button>

        <button
          onClick={() => {
            setSearch('');
            setActiveTab('finalized');
          }}
          className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors ${
            activeTab === 'finalized' && !search.trim()
              ? 'bg-slate-900 text-white font-semibold shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <span>Finalizados ({counts.finalized})</span>
        </button>
      </div>

      {/* Banner de búsqueda en listado total */}
      {search.trim() && (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 px-3 py-2 rounded flex items-center justify-between text-xs animate-in fade-in duration-100">
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-950">🔍 Búsqueda en el listado total:</span>
            <span className="font-mono bg-blue-100 px-1.5 py-0.5 rounded text-blue-900 font-semibold">"{search.trim()}"</span>
            <span className="bg-blue-600 text-white font-mono font-bold px-2 py-0.5 rounded-full text-[11px]">
              {repairs.length} {repairs.length === 1 ? 'reparo encontrado' : 'reparos encontrados'}
            </span>
          </div>
          <button
            onClick={() => setSearch('')}
            className="text-blue-700 hover:text-blue-950 font-semibold underline text-xs cursor-pointer"
          >
            Quitar búsqueda y ver pestañas
          </button>
        </div>
      )}

      {/* Repairs Table or Loading State */}
      {isLoading ? (
        <LoadingState
          title="Cargando Tablero Resumen..."
          message="Consultando estado de pendientes y atenciones desde la base de datos."
        />
      ) : (
        <RepairTable
          repairs={repairs}
          onRefresh={loadData}
          hideActions={true}
        />
      )}

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

