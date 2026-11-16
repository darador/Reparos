'use client';

import { RepairFilters } from "@/components/repairs/RepairFilters";
import { RepairReportModal } from "@/components/repairs/RepairReportModal";
import { RepairTable } from "@/components/repairs/RepairTable";
import { LoadingState } from "@/components/shared/LoadingState";
import { MetricFilterKey, MetricStrip } from "@/components/shared/MetricStrip";
import { getStoredAuthUser } from "@/lib/auth";
import { repository } from "@/lib/store/repository";
import { DashboardMetrics, Repair } from "@/lib/types/database";
import { AlertCircle, AlertTriangle, Building2, CheckCircle2, FileText, LayoutDashboard, LogIn, MapPin, UserX, Wrench } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function TableroResumenRootPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'unassigned' | 'critical' | 'reiterated' | 'verification' | 'finalized' | 'poligonos_pending'>('all');
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [counts, setCounts] = useState({
    pending: 0,
    unassigned: 0,
    critical: 0,
    reiterated: 0,
    verification: 0,
    finalized: 0,
    poligonosPending: 0
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);

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

  useEffect(() => {
    setIsAuthenticated(!!getStoredAuthUser());
  }, []);

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
    const dashboardMetrics = repository.getDashboardMetrics();
    setMetrics(dashboardMetrics);

    const allRepairsRaw = repository.getRepairs();
    const allPendingRaw = repository.getRepairs({ onlyPending: true });

    setCounts({
      pending: allPendingRaw.length,
      unassigned: allPendingRaw.filter(r => !r.current_responsible_id).length,
      critical: allPendingRaw.filter(r => r.priority === 'Crítica' || r.priority === 'Alta').length,
      reiterated: allPendingRaw.filter(r => (r.reiteration_count || 0) > 0).length,
      verification: allRepairsRaw.filter(r => r.current_status?.category === 'resolved' || r.current_status?.name === 'VERIFICACIÓN RESUELTO').length,
      finalized: allRepairsRaw.filter(r => r.current_status?.category === 'closed' || r.current_status?.name === 'FINALIZADO').length,
      poligonosPending: dashboardMetrics.poligonosConReparosPendientesCount ?? 0
    });

    // Si hay un término de búsqueda en la lupa, busca en el listado total sin restringir por pestaña ni filtros
    if (search.trim()) {
      const searchResults = repository.getRepairs({ search: search.trim() });
      setRepairs(searchResults);
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

    if (activeTab === 'poligonos_pending') {
      const pendingPols = new Set(
        allPendingRaw
          .map(r => r.project?.poligono?.trim())
          .filter((p): p is string => Boolean(p))
      );
      const polList = filteredBase
        .filter(r => {
          const isPending = r.current_status?.category === 'pending' || r.current_status?.category === 'in_progress';
          const pol = r.project?.poligono?.trim();
          return isPending && pol && pendingPols.has(pol);
        })
        .sort((a, b) => {
          const polA = a.project?.poligono || '';
          const polB = b.project?.poligono || '';
          return polA.localeCompare(polB, 'es', { numeric: true, sensitivity: 'base' });
        });
      setRepairs(polList);
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

  const getActiveFiltersList = () => {
    const active: string[] = [];
    if (search.trim()) {
      active.push(`Búsqueda en listado total: "${search.trim()}"`);
    } else {
      if (statusId !== 'all') {
        const st = repository.getRepairStatuses().find(s => s.id === statusId);
        if (st) active.push(`Estado: ${st.name}`);
      }
      if (responsibleId !== 'all') {
        if (responsibleId.startsWith('sector:')) {
          active.push(`Sector: ${responsibleId.replace('sector:', '')}`);
        } else {
          const resp = repository.getResponsibleParties().find(r => r.id === responsibleId);
          if (resp) active.push(`Responsable: ${resp.name}`);
        }
      }
      if (solicitante !== 'all') {
        active.push(`Solicitante: ${solicitante}`);
      }
      if (priority !== 'all') active.push(`Prioridad: ${priority}`);
      if (typeId !== 'all') {
        const tp = repository.getRepairTypes().find(t => t.id === typeId);
        if (tp) active.push(`Tipo: ${tp.name}`);
      }
      if (distrito !== 'all') active.push(`Distrito: ${distrito}`);
      if (central !== 'all') active.push(`Central: ${central}`);
      if (onlyReiterated) active.push(`Solo Reiterados`);
      if (selectedCumplimientos.length > 0) active.push(`Cumplimiento: ${selectedCumplimientos.map(c => `${c}%`).join(', ')}`);
      if (activeTab !== 'all') {
        if (activeTab === 'poligonos_pending') active.push(`Pestaña: Polígonos c/ pendientes`);
        if (activeTab === 'unassigned') active.push(`Pestaña: Sin Responsable`);
        if (activeTab === 'critical') active.push(`Pestaña: Urgentes`);
        if (activeTab === 'reiterated') active.push(`Pestaña: Reiterados`);
        if (activeTab === 'verification') active.push(`Pestaña: Para Verificar`);
        if (activeTab === 'finalized') active.push(`Pestaña: Finalizados`);
      }
    }
    return active;
  };

  if (isLoading) {
    return (
      <LoadingState
        title="Cargando Tablero Resumen..."
        message="Consultando estado de pendientes y atenciones desde la base de datos."
      />
    );
  }

  const poligonosConPendientesList = (metrics.poligonosConReparos || []).filter(p => p.pendingRepairs > 0);

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

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsReportOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded font-semibold border border-slate-300 shadow-2xs transition-colors"
            title="Generar vista previa y reporte en texto para copiar y pegar en mail / Outlook"
          >
            <FileText className="h-3.5 w-3.5 text-slate-600" />
            <span>Generar reporte</span>
          </button>

          {!isAuthenticated && (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded shadow-xs transition-colors"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Iniciar Sesión</span>
            </Link>
          )}
        </div>
      </div>

      {/* Métricas Resumen */}
      <MetricStrip
        metrics={metrics}
        activeFilter={
          search.trim()
            ? undefined
            : activeTab === 'verification'
            ? 'resolved'
            : activeTab === 'finalized'
            ? 'finalized'
            : activeTab === 'reiterated'
            ? 'reiterated'
            : activeTab === 'poligonos_pending'
            ? 'poligonos_pending'
            : activeTab === 'all'
            ? 'pending'
            : 'all'
        }
        onFilterChange={(key) => {
          setSearch('');
          if (key === 'resolved') setActiveTab('verification');
          else if (key === 'finalized') setActiveTab('finalized');
          else if (key === 'reiterated') setActiveTab('reiterated');
          else if (key === 'poligonos_pending') setActiveTab('poligonos_pending');
          else if (key === 'pending') setActiveTab('all');
          else setActiveTab('all');
        }}
        onSelectPoligono={(pol) => setSearch(pol)}
      />

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

      {/* Tabs de Filtro */}
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
            setActiveTab('poligonos_pending');
          }}
          className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors ${
            activeTab === 'poligonos_pending' && !search.trim()
              ? 'bg-indigo-900 text-white font-semibold shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="h-3.5 w-3.5 text-indigo-400" />
          <span>Polígonos c/ pendientes ({counts.poligonosPending})</span>
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

      {/* Banner de Polígonos con reparos pendientes */}
      {activeTab === 'poligonos_pending' && !search.trim() && (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-950 p-3 rounded text-xs space-y-2 animate-in fade-in duration-100 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-indigo-950 flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-indigo-600" />
                <span>{counts.poligonosPending} Polígonos con reparos pendientes</span>
              </span>
              <span className="bg-indigo-100 text-indigo-800 font-mono font-bold px-2 py-0.5 rounded-full text-[11px] border border-indigo-200">
                {repairs.length} {repairs.length === 1 ? 'reparo pendiente' : 'reparos pendientes en total'}
              </span>
            </div>
            <span className="text-[11px] text-indigo-700">
              Listado ordenado por polígono. Haz clic en cualquier polígono para filtrar:
            </span>
          </div>

          {poligonosConPendientesList.length > 0 && (
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-white/80 rounded border border-indigo-100">
              {poligonosConPendientesList.map(pol => (
                <button
                  key={pol.poligono}
                  onClick={() => setSearch(pol.poligono)}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 hover:border-indigo-400 transition-colors cursor-pointer shadow-2xs"
                  title={`${pol.poligono} | ${pol.pendingRepairs} pendiente(s) | Central: ${pol.central || '-'} | Distrito: ${pol.distrito || '-'}`}
                >
                  <span className="font-bold">{pol.poligono}</span>
                  <span className="bg-indigo-600 text-white font-sans text-[10px] font-bold px-1 rounded-full">
                    {pol.pendingRepairs}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tabla Resumen idéntica con hideActions={true} */}
      <RepairTable
        repairs={repairs}
        onRefresh={loadData}
        hideActions={true}
      />

      <RepairReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        repairs={repairs}
        activeFilters={getActiveFiltersList()}
      />
    </div>
  );
}


