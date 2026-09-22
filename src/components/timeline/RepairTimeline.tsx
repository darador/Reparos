'use client';

import { RepairEvent } from "@/lib/types/database";
import { formatDateTime, formatTimeAgo } from "@/lib/utils";
import { AlertCircle, AlertTriangle, ArrowRight, CheckCircle2, Clock, History, ShieldAlert, User, Wrench } from "lucide-react";
import { StatusBadge } from "../shared/Badges";

interface RepairTimelineProps {
  events: RepairEvent[];
}

export function RepairTimeline({ events }: RepairTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded p-6 text-center text-slate-500 text-xs">
        <Clock className="h-6 w-6 mx-auto text-slate-400 mb-2" />
        <p className="font-medium text-slate-700">Sin historial de eventos registrado</p>
      </div>
    );
  }

  const getEventIcon = (eventType: RepairEvent['event_type'], verificationResult?: string) => {
    switch (eventType) {
      case 'creation':
        return <Wrench className="h-3.5 w-3.5 text-blue-600" />;
      case 'assignment':
        return <User className="h-3.5 w-3.5 text-sky-600" />;
      case 'reclaim':
        return <AlertCircle className="h-3.5 w-3.5 text-orange-600" />;
      case 'response':
        return <Clock className="h-3.5 w-3.5 text-indigo-600" />;
      case 'resolution':
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />;
      case 'closure':
        return <CheckCircle2 className="h-3.5 w-3.5 text-slate-700" />;
      case 'reiteration':
        return <AlertTriangle className="h-3.5 w-3.5 text-red-600" />;
      case 'verification':
        if (verificationResult === 'solucionado') return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />;
        if (verificationResult === 'no_solucionado') return <ShieldAlert className="h-3.5 w-3.5 text-red-600" />;
        return <Clock className="h-3.5 w-3.5 text-amber-600" />;
      default:
        return <History className="h-3.5 w-3.5 text-slate-600" />;
    }
  };

  const getEventLabel = (eventType: RepairEvent['event_type']) => {
    switch (eventType) {
      case 'creation': return 'Reparo Creado';
      case 'assignment': return 'Asignación / Reasignación';
      case 'reclaim': return 'Reclamo Registrado';
      case 'response': return 'Respuesta Recibida';
      case 'follow_up': return 'Seguimiento Operativo';
      case 'derivation': return 'Derivación';
      case 'verification': return 'Verificación de Trabajo';
      case 'reiteration': return 'Reiteración de Reparo';
      case 'resolution': return 'Reparo Resuelto';
      case 'closure': return 'Caso Cerrado';
      default: return eventType;
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {events.map((event) => {
        const isReiteration = event.event_type === 'reiteration' || event.verification_result === 'no_solucionado';
        const isResolution = event.event_type === 'resolution' || event.event_type === 'closure';

        return (
          <div key={event.id} className="relative group">
            {/* Timeline node icon */}
            <div className={`absolute -left-6 top-0.5 h-5 w-5 rounded-full border flex items-center justify-center bg-white ${
              isReiteration ? 'border-red-400 bg-red-50' : isResolution ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300'
            }`}>
              {getEventIcon(event.event_type, event.verification_result)}
            </div>

            {/* Event content box */}
            <div className={`border rounded-md p-3 text-xs bg-white shadow-2xs ${
              isReiteration ? 'border-red-200 bg-red-50/20' : 'border-slate-200'
            }`}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{getEventLabel(event.event_type)}</span>
                  {event.verification_result && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                      event.verification_result === 'solucionado' 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {event.verification_result === 'solucionado' ? 'Solucionado' : 'No solucionado'}
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                  <span>{formatDateTime(event.created_at)}</span>
                  <span className="text-slate-400">({formatTimeAgo(event.created_at)})</span>
                </div>
              </div>

              {/* Responsible assignment diff if present */}
              {(event.previous_responsible || event.new_responsible) && (
                <div className="flex items-center gap-1.5 text-xs text-slate-700 my-1 bg-slate-50 px-2 py-1 rounded border border-slate-100 font-mono">
                  <span className="text-slate-500 text-[11px]">Responsable:</span>
                  <span className="text-slate-600 line-through">
                    {event.previous_responsible?.name || 'Sin asignar'}
                  </span>
                  <ArrowRight className="h-3 w-3 text-slate-400" />
                  <span className="font-semibold text-slate-900">
                    {event.new_responsible?.name || 'Sin asignar'}
                  </span>
                </div>
              )}

              {/* Status diff if present */}
              {event.new_status && (
                <div className="flex items-center gap-2 my-1">
                  <span className="text-[11px] text-slate-500 font-mono">Estado:</span>
                  {event.previous_status && (
                    <StatusBadge name={event.previous_status.name} category={event.previous_status.category} />
                  )}
                  {event.previous_status && <ArrowRight className="h-3 w-3 text-slate-400" />}
                  <StatusBadge name={event.new_status.name} category={event.new_status.category} />
                </div>
              )}

              {/* Notes */}
              {event.notes && (
                <p className="text-slate-800 mt-1.5 whitespace-pre-wrap leading-relaxed text-xs">
                  {event.notes}
                </p>
              )}

              {/* Auditor user footer */}
              <div className="mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
                <span>
                  Registrado por: <strong className="text-slate-700">{event.created_by_profile?.full_name || event.created_by}</strong>
                </span>
                <span className="font-mono text-slate-400">ID Evento: {event.id.slice(0, 8)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
