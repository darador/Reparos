'use client';

import { EventType, RepairEvent, RepairStatus, ResponsibleParty, VerificationResult } from "@/lib/types/database";
import { Edit3, Loader2, X } from "lucide-react";
import { useState } from "react";

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventId: string, data: {
    event_type?: EventType;
    notes?: string;
    new_responsible_id?: string;
    new_status_id?: string;
    verification_result?: VerificationResult;
  }) => Promise<void> | void;
  event: RepairEvent;
  responsibleParties: ResponsibleParty[];
  repairStatuses: RepairStatus[];
}

export function EditEventModal({
  isOpen,
  onClose,
  onSave,
  event,
  responsibleParties,
  repairStatuses
}: EditEventModalProps) {
  const [eventType, setEventType] = useState<EventType>(event.event_type);
  const [notes, setNotes] = useState(event.notes || '');
  const [responsibleId, setResponsibleId] = useState(event.new_responsible_id || '');
  const [statusId, setStatusId] = useState(event.new_status_id || '');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | undefined>(event.verification_result);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await onSave(event.id, {
        event_type: eventType,
        notes: notes.trim() || undefined,
        new_responsible_id: responsibleId || undefined,
        new_status_id: statusId || undefined,
        verification_result: eventType === 'verification' ? (verificationResult || 'no_solucionado') : undefined
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el hito del historial.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <Edit3 className="h-4 w-4 text-blue-600" />
            <span>Editar Hito / Acción del Historial</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
          {error && (
            <div className="bg-red-50 text-red-700 border border-red-200 p-2 rounded text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-slate-600 font-medium mb-1">Tipo de Hito / Acción</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as EventType)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="follow_up">Seguimiento Operativo (+ PENDIENTE OTROS)</option>
              <option value="verification">🔄 Vuelve Reiterado a Pendiente / Verificación</option>
              <option value="resolution">Verificar Resuelto</option>
              <option value="reclaim">Reclamo Registrado</option>
              <option value="assignment">Asignación / Reasignación</option>
              <option value="response">Respuesta Recibida</option>
              <option value="closure">Caso Cerrado</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">Responsable Asignado</label>
            <select
              value={responsibleId}
              onChange={(e) => setResponsibleId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">-- Sin responsable asignado --</option>
              {responsibleParties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">Estado Asociado</label>
            <select
              value={statusId}
              onChange={(e) => setStatusId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">-- Sin estado asociado --</option>
              {repairStatuses.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">Observación / Nota</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Escriba la observación o detalle del hito..."
              className="w-full border border-slate-300 rounded p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none font-sans"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 bg-slate-50 hover:bg-slate-100 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1 shadow-2xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
