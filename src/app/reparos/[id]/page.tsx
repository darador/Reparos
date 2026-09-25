'use client';

import { RepairFormModal } from "@/components/repairs/RepairFormModal";
import { PriorityBadge, StatusBadge } from "@/components/shared/Badges";
import { ConfirmDeleteModal } from "@/components/shared/ConfirmDeleteModal";
import { LoadingState } from "@/components/shared/LoadingState";
import { LogEventModal } from "@/components/timeline/LogEventModal";
import { RepairTimeline } from "@/components/timeline/RepairTimeline";
import { getStoredAuthUser } from "@/lib/auth";
import { repository } from "@/lib/store/repository";
import { EventType, Repair, RepairEvent } from "@/lib/types/database";
import { formatDate, formatDateTime } from "@/lib/utils";
import { AlertTriangle, ArrowLeft, CheckCircle2, Edit, History, Trash2, Wrench } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RepairDetailPage() {
  const params = useParams();
  const router = useRouter();
  const repairId = params.id as string;

  const [repair, setRepair] = useState<Repair | undefined>(undefined);
  const [events, setEvents] = useState<RepairEvent[]>([]);
  const [isLogEventOpen, setIsLogEventOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [initialEventType, setInitialEventType] = useState<EventType>('follow_up');
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(!!getStoredAuthUser());
  }, []);

  const loadData = () => {
    const r = repository.getRepairById(repairId);
    setRepair(r);
    if (r) {
      setEvents(repository.getRepairEvents(repairId));
    }
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
  }, [repairId]);

  if (isLoading) {
    return (
      <LoadingState
        title="Cargando Ficha de Reparo..."
        message="Obteniendo la información general y la trazabilidad de eventos desde Supabase."
      />
    );
  }

  if (!repair) {
    return (
      <div className="bg-white border border-slate-200 rounded p-8 text-center text-slate-500">
        <Wrench className="h-8 w-8 mx-auto text-slate-400 mb-2" />
        <p className="font-semibold text-slate-800">Reparo no encontrado</p>
        <Link href="/reparos" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
          ← Volver al listado de reparos
        </Link>
      </div>
    );
  }

  const openLogEvent = (type: EventType) => {
    setInitialEventType(type);
    setIsLogEventOpen(true);
  };

  const handleLogEvent = async (data: any) => {
    await repository.addRepairEvent(data);
    loadData();
  };

  const handleUpdateRepair = async (data: any) => {
    await repository.updateRepair(repairId, data);
    loadData();
    setIsEditOpen(false);
  };

  const hasReiterations = (repair.reiteration_count || 0) > 0;
  const isClosed = repair.current_status?.category === 'closed';

  return (
    <div className="space-y-4">
      {/* Navigation link */}
      <div>
        <Link href="/reparos" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 font-medium">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Volver a Reparos</span>
        </Link>
      </div>

      {/* Header Ficha del Reparo */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="bg-slate-900 text-white font-mono font-bold text-xs px-2 py-0.5 rounded">
                REPARO #{repair.id.slice(0, 8)}
              </span>
              <span className="font-semibold text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {repair.repair_type?.name || 'Otro'}
              </span>
              <PriorityBadge priority={repair.priority} />
              <StatusBadge name={repair.current_status?.name} category={repair.current_status?.category} />
              {hasReiterations && (
                <span className="bg-red-100 text-red-900 border border-red-300 font-bold text-xs px-2 py-0.5 rounded flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                  {repair.reiteration_count} {repair.reiteration_count === 1 ? 'Reiteración' : 'Reiteraciones'}
                </span>
              )}
            </div>

            {repair.project && (
              <div className="text-xs text-slate-600 font-mono flex items-center gap-2 mt-1">
                <span>Proyecto:</span>
                <Link href={`/proyectos/${repair.project.id}`} className="font-bold text-blue-700 hover:underline">
                  SIGEST {repair.project.sigest} / {repair.project.poligono}
                </Link>
                {repair.project.central && <span>({repair.project.central})</span>}
                {repair.project.distrito && <span className="text-slate-400">[{repair.project.distrito}]</span>}
              </div>
            )}
          </div>

          {/* Operational action menu bar */}
          <div className="flex flex-wrap items-center gap-1.5">
            {isAuthenticated && (
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="text-xs bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded border border-red-200 font-semibold transition-colors flex items-center gap-1"
                title="Borrar este reparo"
              >
                <Trash2 className="h-3.5 w-3.5 text-red-600" />
                <span>Borrar Reparo</span>
              </button>
            )}

            <button
              onClick={() => setIsEditOpen(true)}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded border border-slate-300 font-semibold transition-colors flex items-center gap-1"
              title="Editar los datos cargados de este reparo"
            >
              <Edit className="h-3.5 w-3.5 text-blue-600" />
              <span>Editar Reparo</span>
            </button>

            {!isClosed && (
              <>
                <button
                  onClick={() => openLogEvent('follow_up')}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded border border-slate-300 font-semibold transition-colors flex items-center gap-1"
                  title="Registrar respuesta o novedad (Permanece PENDIENTE)"
                >
                  <History className="h-3.5 w-3.5 text-slate-600" />
                  <span>+ PENDIENTE OTROS</span>
                </button>
                <button
                  onClick={() => openLogEvent('resolution')}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded font-medium shadow-2xs transition-colors flex items-center gap-1"
                  title="Marcar como resuelto y derivar al solicitante para verificación"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>VERIFICAR RESUELTO</span>
                </button>
                <button
                  onClick={() => openLogEvent('closure')}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded font-medium shadow-2xs transition-colors flex items-center gap-1"
                  title="El solicitante verificó y pudo trabajar luego del reparo resuelto"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>FINALIZADO</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Description box */}
        <div className="space-y-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Descripción del Problema</h3>
          <p className="text-sm text-slate-900 font-semibold bg-blue-50/50 p-3 rounded border border-blue-200/60 whitespace-pre-wrap leading-relaxed">
            {repair.description}
          </p>
        </div>

        {/* Technical metadata grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50/60 p-2.5 rounded border border-slate-100">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Responsable Actual</span>
            <span className="font-semibold text-slate-900">
              {repair.current_responsible ? repair.current_responsible.name : <em className="text-slate-400">Sin asignar</em>}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Solicitante</span>
            <span className="font-semibold text-slate-800">{repair.solicitante || '-'}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Fecha Informado</span>
            <span className="font-mono text-slate-800">{formatDateTime(repair.fecha_informado)}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Fecha Compromiso</span>
            <span className="font-mono text-slate-800">{formatDate(repair.fecha_compromiso)}</span>
          </div>
        </div>

        {repair.observaciones && (
          <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
            <strong>Observaciones generales:</strong> {repair.observaciones}
          </div>
        )}
      </div>

      {/* Historial y Timeline inmutable */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <History className="h-4 w-4 text-blue-600" />
            <span>Historial Completo de Trazabilidad</span>
            <span className="text-slate-400 font-normal font-mono">({events.length} registros)</span>
          </h2>

          <button
            onClick={() => openLogEvent('follow_up')}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded border border-slate-300 font-medium transition-colors"
          >
            + Registrar Acción
          </button>
        </div>

        <RepairTimeline events={events} />
      </div>

      {/* Edit Repair Modal */}
      {isEditOpen && (
        <RepairFormModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSubmit={handleUpdateRepair}
          projects={repository.getProjects()}
          repairTypes={repository.getRepairTypes()}
          responsibleParties={repository.getResponsibleParties()}
          repairToEdit={repair}
        />
      )}

      {/* Log Event Modal */}
      {isLogEventOpen && (
        <LogEventModal
          isOpen={isLogEventOpen}
          onClose={() => setIsLogEventOpen(false)}
          onSubmit={handleLogEvent}
          repair={repair}
          responsibleParties={repository.getResponsibleParties()}
          repairStatuses={repository.getRepairStatuses()}
          initialEventType={initialEventType}
        />
      )}

      {/* Delete Repair Confirmation Modal */}
      {isDeleteModalOpen && repair && (
        <ConfirmDeleteModal
          isOpen={isDeleteModalOpen}
          title="Confirmar eliminación de reparo"
          description={
            <div className="space-y-2">
              <p>
                ¿Estás seguro de que deseas eliminar permanentemente este reparo de{" "}
                <strong className="text-slate-900 font-mono">
                  SIGEST {repair.project?.sigest || ''} / {repair.project?.poligono || ''}
                </strong>?
              </p>
              {repair.description && (
                <p className="p-2 bg-slate-100 rounded text-slate-700 italic border border-slate-200">
                  "{repair.description}"
                </p>
              )}
              <p className="text-red-600 font-medium">
                Esta acción eliminará el reparo y todo su historial de eventos. No se puede deshacer.
              </p>
            </div>
          }
          confirmText="Eliminar Reparo"
          onConfirm={async () => {
            await repository.deleteRepair(repairId);
            setIsDeleteModalOpen(false);
            router.push('/reparos');
          }}
          onClose={() => setIsDeleteModalOpen(false)}
        />
      )}
    </div>
  );
}
