'use client';

import React, { useEffect, useState } from 'react';
import { MopTable } from '@/lib/../components/mop/MopTable';
import { MopFilters } from '@/lib/../components/mop/MopFilters';
import { MopMetricFilterKey, MopMetricStrip } from '@/lib/../components/mop/MopMetricStrip';
import { LoadingState } from '@/lib/../components/shared/LoadingState';
import { mopService } from '@/lib/mop/service';
import { MopCto, MopMetrics } from '@/lib/types/database';
import { Network, UploadCloud, FileText } from 'lucide-react';
import Link from 'next/link';
import { getStoredAuthUser } from '@/lib/auth';
import { MopReportModal } from '@/components/mop/MopReportModal';

export default function PendienteMopPage() {
  const [ctos, setCtos] = useState<MopCto[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [metrics, setMetrics] = useState<MopMetrics>({
    total: 0,
    pendientes: 0,
    completadas: 0,
    conReparo: 0,
    ausentes: 0
  });
  const [filterOptions, setFilterOptions] = useState<{ responsables: string[]; centrales: string[] }>({
    responsables: [],
    centrales: []
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Filtros
  const [search, setSearch] = useState<string>('');
  const [category, setCategory] = useState<string>('all');
  const [responsable, setResponsable] = useState<string>('all');
  const [central, setCentral] = useState<string>('all');
  const [estado, setEstado] = useState<string>('all');
  const [isAusenteFilter, setIsAusenteFilter] = useState<boolean>(false);

  // Métrica activa (filtro interactivo)
  const [activeMetricFilter, setActiveMetricFilter] = useState<MopMetricFilterKey>('all');

  // Paginación y ordenamiento
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [sortColumn, setSortColumn] = useState<string>('sigest');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Reporte
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [reportCtos, setReportCtos] = useState<MopCto[]>([]);
  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);

  useEffect(() => {
    setIsAuthenticated(!!getStoredAuthUser());
  }, []);

  const handleOpenReport = async () => {
    setIsLoadingReport(true);
    setIsReportOpen(true);

    let effectiveEstado = estado;
    let effectiveAusente: boolean | undefined = isAusenteFilter ? true : undefined;

    if (activeMetricFilter === 'pendientes') {
      effectiveEstado = 'PENDIENTE';
    } else if (activeMetricFilter === 'completadas') {
      effectiveEstado = 'COMPLETADO';
    } else if (activeMetricFilter === 'con_reparo') {
      effectiveEstado = 'CON REPARO';
    } else if (activeMetricFilter === 'ausentes') {
      effectiveAusente = true;
    }

    const res = await mopService.getMopCtos({
      categoria: category,
      responsable,
      central,
      estado: effectiveEstado,
      isAusente: effectiveAusente,
      search,
      page: 1,
      pageSize: 10000,
      sortColumn,
      sortDirection
    });

    setReportCtos(res.data);
    setIsLoadingReport(false);
  };

  const getActiveFiltersList = () => {
    const list: string[] = [];
    if (search.trim()) list.push(`Búsqueda: "${search.trim()}"`);
    if (category !== 'all') list.push(`Pestaña: ${category}`);
    if (responsable !== 'all') list.push(`Responsable: ${responsable}`);
    if (central !== 'all') list.push(`Central: ${central}`);
    if (estado !== 'all') list.push(`Estado: ${estado}`);
    if (isAusenteFilter) list.push('Solo Ausentes');
    if (activeMetricFilter !== 'all') {
      if (activeMetricFilter === 'pendientes') list.push('Métrica: Pendientes');
      if (activeMetricFilter === 'completadas') list.push('Métrica: Completadas');
      if (activeMetricFilter === 'con_reparo') list.push('Métrica: Con Reparo');
      if (activeMetricFilter === 'ausentes') list.push('Métrica: Ausentes');
    }
    return list;
  };

  const loadData = async () => {
    setIsLoading(true);

    // Mapear métrica activa a estado o ausente
    let effectiveEstado = estado;
    let effectiveAusente: boolean | undefined = isAusenteFilter ? true : undefined;

    if (activeMetricFilter === 'pendientes') {
      effectiveEstado = 'PENDIENTE';
    } else if (activeMetricFilter === 'completadas') {
      effectiveEstado = 'COMPLETADO';
    } else if (activeMetricFilter === 'con_reparo') {
      effectiveEstado = 'CON REPARO';
    } else if (activeMetricFilter === 'ausentes') {
      effectiveAusente = true;
    }

    const res = await mopService.getMopCtos({
      categoria: category,
      responsable,
      central,
      estado: effectiveEstado,
      isAusente: effectiveAusente,
      search,
      page: currentPage,
      pageSize,
      sortColumn,
      sortDirection
    });

    setCtos(res.data);
    setTotalRecords(res.total);
    setMetrics(res.metrics);
    setFilterOptions(res.filterOptions);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [category, responsable, central, estado, isAusenteFilter, activeMetricFilter, search, currentPage, pageSize, sortColumn, sortDirection]);

  const handleResetFilters = () => {
    setSearch('');
    setCategory('all');
    setResponsable('all');
    setCentral('all');
    setEstado('all');
    setIsAusenteFilter(false);
    setActiveMetricFilter('all');
    setCurrentPage(1);
  };

  const handleMetricFilterChange = (filterKey: MopMetricFilterKey) => {
    setActiveMetricFilter(filterKey);
    setCurrentPage(1);
  };

  const handleSortChange = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded shadow-2xs">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Network className="h-4 w-4 text-blue-600" />
            <span>Pendiente MOP — Gestión y Seguimiento de CTOs</span>
            <span className="text-[11px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded font-mono font-bold">
              {metrics.pendientes} pendientes
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Consulta y trazabilidad operativa de cajas terminales ópticas importadas desde MOP por responsable y central.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleOpenReport}
            disabled={isLoadingReport}
            className="inline-flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded font-semibold border border-slate-300 shadow-2xs transition-colors cursor-pointer"
            title="Generar vista previa y reporte en texto o tabla para copiar y pegar en mail / Outlook"
          >
            <FileText className="h-3.5 w-3.5 text-slate-600" />
            <span>{isLoadingReport ? 'Generando...' : 'Generar reporte'}</span>
          </button>

          {isAuthenticated ? (
            <Link
              href="/carga-mop"
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded shadow-xs transition-colors"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span>Importar Excel MOP</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded shadow-xs transition-colors"
            >
              <span>Iniciar Sesión</span>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Metric Strip */}
      <MopMetricStrip
        metrics={metrics}
        activeFilter={activeMetricFilter}
        onFilterChange={handleMetricFilterChange}
      />

      {/* Filtros avanzados */}
      <MopFilters
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setCurrentPage(1);
        }}
        category={category}
        onCategoryChange={(val) => {
          setCategory(val);
          setCurrentPage(1);
        }}
        responsable={responsable}
        onResponsableChange={(val) => {
          setResponsable(val);
          setCurrentPage(1);
        }}
        central={central}
        onCentralChange={(val) => {
          setCentral(val);
          setCurrentPage(1);
        }}
        estado={estado}
        onEstadoChange={(val) => {
          setEstado(val);
          setActiveMetricFilter('all');
          setCurrentPage(1);
        }}
        isAusenteFilter={isAusenteFilter}
        onIsAusenteFilterToggle={(val) => {
          setIsAusenteFilter(val);
          setActiveMetricFilter('all');
          setCurrentPage(1);
        }}
        responsablesList={filterOptions.responsables}
        centralesList={filterOptions.centrales}
        onResetFilters={handleResetFilters}
      />

      {/* Tabla con estados de carga */}
      {isLoading && ctos.length === 0 ? (
        <LoadingState
          title="Cargando CTOs de MOP..."
          message="Consultando registros y estados desde la base de datos."
        />
      ) : (
        <MopTable
          ctos={ctos}
          totalRecords={totalRecords}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
          onRefresh={loadData}
          isLoading={isLoading}
        />
      )}

      {/* Modal de Reporte */}
      <MopReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        ctos={reportCtos.length > 0 ? reportCtos : ctos}
        activeFilters={getActiveFiltersList()}
      />
    </div>
  );
}
