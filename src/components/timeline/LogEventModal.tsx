'use client';

import { repository } from "@/lib/store/repository";
import { EventType, Repair, RepairStatus, ResponsibleParty } from "@/lib/types/database";
import { History, Loader2, X } from "lucide-react";
import { useState } from "react";

interface LogEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    repair_id: string;
    event_type: EventType;
    new_responsible_id?: string;
    new_status_id?: string;
    notes?: string;
  }) => Promise<void> | void;
  repair: Repair;
  responsibleParties: ResponsibleParty[];
  repairStatuses: RepairStatus[];
  initialEventType?: EventType;
}

export function LogEventModal({
  isOpen,
  onClose,
  onSubmit,
  repair,
  responsibleParties,
  repairStatuses,
  initialEventType = 'follow_up'
}: LogEventModalProps) {
  const [eventType, setEventType] = useState<EventType>(initialEventType);
  const [responsibleId, setResponsibleId] = useState<string>(repair.current_responsible_id || '');
  const [customResponsibleName, setCustomResponsibleName] = useState('');
  const [statusId, setStatusId] = useState<string>(repair.current_status_id || '');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim() && eventType !== 'assignment') {
      setError('Por favor ingrese una observación o nota del evento.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      let finalResponsibleId: string | undefined = responsibleId || undefined;
      if (responsibleId === '__CUSTOM__') {
        if (!customResponsibleName.trim()) {
          setError('Escriba el nombre del nuevo responsable.');
          setIsSubmitting(false);
          return;
        }
        const newParty = await repository.addResponsibleParty(customResponsibleName.trim(), 'contractor');
        finalResponsibleId = newParty.id;
      }

      await onSubmit({
        repair_id: repair.id,
        event_type: eventType,
        new_responsible_id: finalResponsibleId,
        new_status_id: statusId || undefined,
        notes: notes.trim() || undefined
      });

      onClose();
    } catch (err: any) {
      console.error("Submit log event error:", err);
      setError(err.message || 'Error al registrar el evento en la base de datos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 text-xs">
      <div className="bg-white border border-slate-300 rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-sky-400" />
            <h3 className="font-semibold text-sm">Registrar Acción / Evento</h3>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="text-slate-400 hover:text-white p-1">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded text-xs font-medium">
              {error}
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 font-mono block text-[10px]">REPARO</span>
              <strong className="text-slate-900 font-mono">#{repair.id.slice(0, 8)}</strong>
            </div>
            {repair.project && (
              <div className="text-right">
                <span className="text-slate-400 block text-[10px]">PROYECTO</span>
                <span className="font-mono font-bold text-blue-700">SIGEST {repair.project.sigest} / {repair.project.poligono}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Tipo de Acción / Evento <span className="text-red-500">*</span>
            </label>
            <select
              disabled={isSubmitting}
              value={eventType}
              onChange={(e) => setEventType(e.target.value as EventType)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white text-slate-900 font-semibold"
            >
              <option value="follow_up">💬 + PENDIENTE OTROS (Permanece PENDIENTE)</option>
              <option value="resolution">✅ VERIFICAR RESUELTO (Trabajo realizado por el sector)</option>
              <option value="closure">🏁 FINALIZADO (Solicitante verificó ok)</option>
              <option value="reclaim">⚠️ Reclamo / Reiteración de avance</option>
              <option value="assignment">👤 Cambio / Reasignación de Responsable</option>
              <option value="derivation">➡️ Derivación a otro área</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Responsable del Reparo
              </label>
              <select
                disabled={isSubmitting}
                value={responsibleId}
                onChange={(e) => setResponsibleId(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white"
              >
                <option value="">-- Sin asignar --</option>
                {responsibleParties.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
                <option value="__CUSTOM__">✍️ Escribir otro responsable...</option>
              </select>

              {responsibleId === '__CUSTOM__' && (
                <input
                  type="text"
                  required
                  disabled={isSubmitting}
                  placeholder="Nombre del responsable..."
                  value={customResponsibleName}
                  onChange={(e) => setCustomResponsibleName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-blue-400 rounded mt-1.5 bg-blue-50/50"
                />
              )}
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Estado resultante
              </label>
              <select
                disabled={isSubmitting}
                value={statusId}
                onChange={(e) => setStatusId(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white font-medium"
              >
                {repairStatuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Observaciones / Detalle de la Acción <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              disabled={isSubmitting}
              placeholder={
                eventType === 'resolution'
                  ? "Detalle de la reparación realizada por el sector (ej. Se reemplazó el poste dañado y se verificó la potencia)..."
                  : eventType === 'closure'
                  ? "Confirmación de trabajo realizado (ej. Solicitante verificó y pudo ingresar la acometida sin problemas)..."
                  : "Detalle de la respuesta o seguimiento (ej. Se reiteró reclamo a Obras)..."
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded font-semibold shadow-sm flex items-center gap-1.5"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Guardando Evento...' : 'Registrar Acción'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
