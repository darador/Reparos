'use client';

import { repository } from "@/lib/store/repository";
import { EventType, Repair, RepairStatus, ResponsibleParty } from "@/lib/types/database";
import { History, X } from "lucide-react";
import { useEffect, useState } from "react";

interface LogEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    repair_id: string;
    event_type: EventType;
    new_responsible_id?: string;
    new_status_id?: string;
    notes?: string;
  }) => void;
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
  const [customResponsibleName, setCustomResponsibleName] = useState<string>('');
  const [statusId, setStatusId] = useState<string>(repair.current_status_id || '');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleEventTypeChange = (newType: EventType) => {
    setEventType(newType);

    const pendingStatus = repairStatuses.find(s => s.name === 'PENDIENTE' || s.category === 'pending');
    const resolvedStatus = repairStatuses.find(s => s.name === 'VERIFICACIÓN RESUELTO' || s.category === 'resolved');
    const finalizedStatus = repairStatuses.find(s => s.name === 'FINALIZADO' || s.category === 'closed');

    if (newType === 'resolution') {
      if (resolvedStatus) setStatusId(resolvedStatus.id);
      
      // Auto-assign to Solicitante
      const solicitanteName = repair.solicitante?.trim() || repair.created_by?.trim() || '';
      if (solicitanteName) {
        const matchingParty = responsibleParties.find(r => r.name.toLowerCase() === solicitanteName.toLowerCase());
        if (matchingParty) {
          setResponsibleId(matchingParty.id);
          setCustomResponsibleName('');
        } else {
          setResponsibleId('__CUSTOM__');
          setCustomResponsibleName(solicitanteName);
        }
      }
    } else if (newType === 'closure') {
      if (finalizedStatus) setStatusId(finalizedStatus.id);
    } else {
      if (pendingStatus) setStatusId(pendingStatus.id);
      setResponsibleId(repair.current_responsible_id || '');
      setCustomResponsibleName('');
    }
  };

  useEffect(() => {
    if (isOpen) {
      handleEventTypeChange(initialEventType);
      setNotes('');
      setError('');
    }
  }, [isOpen, initialEventType]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim() && eventType !== 'assignment') {
      setError('Por favor ingrese una observación o nota del evento.');
      return;
    }

    let finalResponsibleId: string | undefined = responsibleId || undefined;
    if (responsibleId === '__CUSTOM__') {
      if (!customResponsibleName.trim()) {
        setError('Escriba el nombre del nuevo responsable.');
        return;
      }
      const newParty = repository.addResponsibleParty(customResponsibleName.trim(), 'contractor');
      finalResponsibleId = newParty.id;
    }

    setError('');
    onSubmit({
      repair_id: repair.id,
      event_type: eventType,
      new_responsible_id: finalResponsibleId,
      new_status_id: statusId || undefined,
      notes: notes.trim() || undefined
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-300 rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-sky-400" />
            <h3 className="font-semibold text-sm">Registrar Acción / Evento</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded font-medium">
              {error}
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded font-mono">
            <div className="font-semibold text-slate-900">
              {repair.project?.sigest} / {repair.project?.poligono} — {repair.repair_type?.name}
            </div>
            <div className="text-slate-600 line-clamp-1 mt-0.5">{repair.description}</div>
            {repair.solicitante && (
              <div className="text-[11px] text-slate-500 mt-1">
                Solicitante original: <strong className="text-slate-800">{repair.solicitante}</strong>
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tipo de Acción / Evento</label>
            <select
              value={eventType}
              onChange={(e) => handleEventTypeChange(e.target.value as EventType)}
              className="w-full px-3 py-2 border border-slate-300 rounded bg-white font-medium text-xs text-slate-900 shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="follow_up">PENDIENTE OTROS</option>
              <option value="resolution">VERIFICAR RESUELTO</option>
              <option value="closure">FINALIZADO</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Responsable Asignado {eventType === 'resolution' && <span className="text-blue-600 font-semibold">(Solicitante)</span>}
              </label>
              <select
                value={responsibleId}
                onChange={(e) => setResponsibleId(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white text-xs"
              >
                <option value="">-- Sin asignar --</option>
                {responsibleParties.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
                <option value="__CUSTOM__">✍️ Escribir otro nombre responsable...</option>
              </select>

              {responsibleId === '__CUSTOM__' && (
                <input
                  type="text"
                  required
                  placeholder="Nombre del responsable (ej. Marcos Silva, Contratista X)..."
                  value={customResponsibleName}
                  onChange={(e) => setCustomResponsibleName(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 border border-blue-400 rounded mt-1.5 bg-blue-50/50"
                />
              )}
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Estado Resultante</label>
              <select
                value={statusId}
                onChange={(e) => setStatusId(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white text-xs font-semibold"
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
              className="px-3 py-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded font-medium shadow-sm"
            >
              Registrar Acción
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
