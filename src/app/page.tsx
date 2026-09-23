'use client';

import { ProjectStatusBadge } from "@/components/shared/Badges";
import { LoadingState } from "@/components/shared/LoadingState";
import { MetricStrip } from "@/components/shared/MetricStrip";
import { repository } from "@/lib/store/repository";
import { DashboardMetrics, Project } from "@/lib/types/database";
import { Building2, FolderGit2, HardHat, Lock, LogIn } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function PublicDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalProjects: 0,
    activeProjects: 0,
    totalRepairs: 0,
    pendingRepairs: 0,
    reiteratedRepairs: 0,
    resolvedAwaitingVerification: 0,
    finalizedRepairs: 0
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(!repository.isLoaded);

  const loadData = () => {
    setMetrics(repository.getDashboardMetrics());
    setProjects(repository.getProjects());
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
  }, []);

  if (isLoading) {
    return (
      <LoadingState
        title="Cargando Dashboard Resumen Público..."
        message="Obteniendo métricas consolidadas de proyectos y reparos FTTH."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Banner Superior Resumen Público */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <HardHat className="h-5 w-5 text-blue-600" />
            <span>Dashboard Resumen Público — Proyectos y Despliegue FTTH</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Vista consolidada de alto nivel para seguimiento institucional de proyectos y estado de despliegue.
          </p>
        </div>

        <div className="shrink-0">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg shadow-sm transition-colors"
          >
            <LogIn className="h-4 w-4" />
            <span>Iniciar Sesión Interna</span>
          </Link>
        </div>
      </div>

      {/* Métricas Consolidadas */}
      <MetricStrip metrics={metrics} />

      {/* Tabla de Resumen de Proyectos (Sin acciones operativas ni observaciones sensibles) */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <FolderGit2 className="h-4 w-4 text-blue-600" />
            <span>Resumen Ejecutivo de Polígonos y Proyectos ({projects.length})</span>
          </h2>
          <span className="text-[11px] text-slate-400 font-mono">
            Acceso público
          </span>
        </div>

        {projects.length === 0 ? (
          <div className="text-slate-400 text-xs text-center py-6">
            No se encontraron proyectos registrados en el sistema.
          </div>
        ) : (
          <div className="data-table-container border border-slate-200 rounded overflow-hidden">
            <table className="data-table text-xs">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700">
                  <th className="whitespace-nowrap">SIGEST / Polígono</th>
                  <th className="whitespace-nowrap">Distrito / Central</th>
                  <th className="whitespace-nowrap">Ejecutor</th>
                  <th className="whitespace-nowrap font-mono text-center">CTOs</th>
                  <th className="whitespace-nowrap">Situación</th>
                  <th className="whitespace-nowrap text-right">Reparos Acumulados</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project, index) => {
                  const isEven = index % 2 === 0;
                  return (
                    <tr key={project.id} className={isEven ? "bg-slate-50/70" : "bg-white"}>
                      <td className="font-mono">
                        <span className="font-bold text-slate-900">{project.sigest}</span>
                        <span className="text-slate-400 px-1">/</span>
                        <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                          {project.poligono}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>{project.distrito || '-'} / {project.central || '-'}</span>
                        </div>
                      </td>
                      <td className="text-slate-800 font-medium">
                        {project.ejecutor || '-'}
                      </td>
                      <td className="text-center font-mono font-semibold text-slate-700">
                        {project.ctos_count}
                      </td>
                      <td>
                        <ProjectStatusBadge status={project.situacion_operativa} />
                      </td>
                      <td className="text-right font-mono">
                        <span className="font-bold text-slate-900">{project.repairs_count || 0}</span>
                        {(project.pending_repairs_count || 0) > 0 && (
                          <span className="ml-2 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] px-1.5 py-0.2 rounded font-bold">
                            {project.pending_repairs_count} pend.
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="bg-slate-50 border border-slate-200 p-3 rounded text-xs text-slate-500 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-slate-400 shrink-0" />
            <span>
              La trazabilidad completa, fichas técnicas de reparos y gestión de hitos requieren autenticación interna.
            </span>
          </div>
          <Link href="/login" className="text-blue-600 hover:underline font-semibold text-xs whitespace-nowrap">
            Iniciar sesión →
          </Link>
        </div>
      </div>
    </div>
  );
}
