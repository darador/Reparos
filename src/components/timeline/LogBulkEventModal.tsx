'use client';

import { StatusBadge } from "@/components/shared/Badges";
import { RESPONSABLES_INICIALES_LIST, SOLICITANTES_LIST } from "@/lib/constants/initial-data";
import { repository } from "@/lib/store/repository";
import { EventType, Repair, RepairStatus, ResponsibleParty, VerificationResult } from "@/lib/types/database";
import { History, Layers, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";

interface LogBulkEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    repair_ids: string[];
    event_type: EventType;
    new_responsible_id?: string;
    new_status_id?: string;
    verification_result?: VerificationResult;
    notes?: string;
  }) => Promise<void> | void;
  repairs: Repair[];
  responsibleParties: ResponsibleParty[];
  repairStatuses: RepairStatus[];
  initialEventType?: EventType;
}

export function LogBulkEventModal({
  isOpen,
  onClose,
  onSubmit,
  repairs,
  responsibleParties,
  repairStatuses,
  initialEventType = 'follow_up'
}: LogBulkEventModalProps) {
  const [eventType, setEventType] = useState<EventType>(initialEventType);
  const [reporterValue, setReporterValue] = useState<string>('');
  const [customReporterName, setCustomReporterName] = useState('');

  const [derivationValue, setDerivationValue] = useState<string>('');
  const [customDerivationName, setCustomDerivationName] = useState('');

  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const defaultType = (initialEventType as string) === 'derivation' ? 'assignment' : initialEventType;
    setEventType(defaultType);

    // Default reporter from first repair
    const firstResp = repairs[0]?.current_responsible?.name || '';
    setReporterValue(firstResp);

    // Default derivation from first repair solicitante
    const firstSol = repairs[0]?.solicitante || firstResp || '';
    setDerivationValue(firstSol);
  }, [isOpen, repairs, initialEventType]);

  if (!isOpen || repairs.length === 0) return null;

  const getAutoStatus = () => {
    if (eventType === 'resolution') {
      return { name: 'VERIFICACIÓN RESUELTO', category: 'resolved' as const };
    }
    if (eventType === 'closure') {
      return { name: 'FINALIZADO', category: 'closed' as const };
    }
    if (eventType === 'assignment' || eventType === 'reclaim') {
      return { name: 'PENDIENTE', category: 'pending' as const };
    }
    return { name: 'PENDIENTE', category: 'pending' as const };
  };

  const autoStatus = getAutoStatus();
  const showDerivation = eventType === 'resolution' || eventType === 'assignment' || eventType === 'verification' || eventType === 'reiteration';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim() && eventType !== 'assignment') {
      setError('Por favor ingrese una observación o nota del evento masivo.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      if (reporterValue === '__CUSTOM__' && customReporterName.trim()) {
        await repository.addResponsibleParty(customReporterName.trim(), 'contractor');
      } else if (reporterValue && !responsibleParties.some(p => p.id === reporterValue)) {
        await repository.addResponsibleParty(reporterValue, 'contractor');
      }

      let finalDerivationId: string | undefined = undefined;

      if (showDerivation) {
        if (derivationValue === '__CUSTOM__') {
          if (!customDerivationName.trim()) {
            setError('Escriba el nombre del solicitante / responsable a quien se deriva.');
            setIsSubmitting(false);
            return;
          }
          const newParty = await repository.addResponsibleParty(customDerivationName.trim(), 'contractor');
          finalDerivationId = newParty.id;
        } else if (derivationValue) {
          const partyById = responsibleParties.find(p => p.id === derivationValue);
          if (partyById) {
            finalDerivationId = partyById.id;
          } else {
            const party = await repository.addResponsibleParty(derivationValue, 'contractor');
            finalDerivationId = party.id;
          }
        }
      }

      const targetStatus = repairStatuses.find(s => s.name === autoStatus.name) || repairStatuses.find(s => s.category === autoStatus.category);

      await onSubmit({
        repair_ids: repairs.map(r => r.id),
        event_type: eventType,
        new_responsible_id: finalDerivationId,
        new_status_id: targetStatus?.id,
        verification_result: (eventType === 'verification' || eventType === 'reiteration') ? 'no_solucionado' : undefined,
        notes: notes.trim() || undefined
      });

      onClose();
    } catch (err: any) {
      console.error("Submit bulk log event error:", err);
      setError(err.message || 'Error al registrar la acción masiva en la base de datos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 text-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-300 rounded-lg shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-blue-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-400" />
            <h3 className="font-bold text-sm">Registrar Acción Masiva ({repairs.length} Reparos)</h3>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="text-slate-400 hover:text-white p-1">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded text-xs font-medium">
              {error}
            </div>
          )}

          {/* Selected Repairs Summary Chips */}
          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
              <span>Reparos Seleccionados:</span>
              <span className="bg-blue-100 text-blue-800 font-mono px-2 py-0.5 rounded text-[10px]">
                {repairs.length} reparos
              </span>
            </div>
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-white border border-slate-200 rounded">
              {repairs.map((r) => (
                <span key={r.id} className="inline-flex items-center gap-1 text-[10px] bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded font-mono font-semibold text-slate-800">
                  <span className="text-blue-700">{r.project?.sigest}/{r.project?.poligono}</span>
                  <span className="text-slate-400 font-normal">({r.repair_type?.name || 'Reparo'})</span>
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700">
                Acción / Evento para todos los seleccionados <span className="text-red-500">*</span>
              </label>
              <StatusBadge name={autoStatus.name} category={autoStatus.category} />
            </div>
            <select
              disabled={isSubmitting}
              value={eventType}
              onChange={(e) => setEventType(e.target.value as EventType)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white text-slate-900 font-semibold"
            >
              <option value="verification">🔄 VUELVE REITERADO A PENDIENTE (No solucionado / Falla persiste)</option>
              <option value="resolution">✅ VERIFICAR RESUELTO (Trabajo realizado por el sector)</option>
              <option value="closure">🏁 FINALIZADO (Solicitante verificó ok)</option>
              <option value="reclaim">⚠️ Reclamo / Reiteración de avance</option>
              <option value="assignment">👤 Cambio / Reasignación de Responsable</option>
              <option value="follow_up">💬 + PENDIENTE OTROS (Novedades / Seguimiento)</option>
            </select>
          </div>

          <div className={showDerivation ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "block"}>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Responsable que Informa
              </label>
              <select
                disabled={isSubmitting}
                value={reporterValue}
                onChange={(e) => setReporterValue(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white font-medium text-slate-900"
              >
                <option value="">-- Sin asignar --</option>
                <optgroup label="Equipos Ejecutores / Responsables">
                  {RESPONSABLES_INICIALES_LIST.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Solicitantes">
                  {SOLICITANTES_LIST.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </optgroup>
                {responsibleParties.length > 0 && (
                  <optgroup label="Otros en Sistema">
                    {responsibleParties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                <option value="__CUSTOM__">✍️ Escribir otro responsable...</option>
              </select>

              {reporterValue === '__CUSTOM__' && (
                <input
                  type="text"
                  required
                  disabled={isSubmitting}
                  placeholder="Nombre del responsable..."
                  value={customReporterName}
                  onChange={(e) => setCustomReporterName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-blue-400 rounded mt-1.5 bg-blue-50/50"
                />
              )}
            </div>

            {showDerivation && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Se deriva a: <span className="text-red-500">*</span>
                </label>
                <select
                  disabled={isSubmitting}
                  value={derivationValue}
                  onChange={(e) => setDerivationValue(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white font-medium text-slate-900"
                >
                  <option value="">-- Sin derivar --</option>
                  <optgroup label="Solicitantes">
                    {SOLICITANTES_LIST.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </optgroup>

                  <optgroup label="Equipos Ejecutores / Responsables">
                    {RESPONSABLES_INICIALES_LIST.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </optgroup>

                  {responsibleParties.length > 0 && (
                    <optgroup label="Otros en Sistema">
                      {responsibleParties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </optgroup>
                  )}

                  <option value="__CUSTOM__">✍️ Escribir otro solicitante/responsable...</option>
                </select>

                {derivationValue === '__CUSTOM__' && (
                  <input
                    type="text"
                    required
                    disabled={isSubmitting}
                    placeholder="Nombre del solicitante o responsable..."
                    value={customDerivationName}
                    onChange={(e) => setCustomDerivationName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-blue-400 rounded mt-1.5 bg-blue-50/50"
                  />
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Observaciones / Nota común para los {repairs.length} reparos <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              disabled={isSubmitting}
              placeholder="Detalle de la acción masiva que se aplicará a todos los reparos seleccionados..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 shrink-0">
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
              className="px-4 py-1.5 text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 rounded font-semibold shadow-sm flex items-center gap-1.5"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Guardando...' : `Aplicar a los ${repairs.length} Reparos`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
