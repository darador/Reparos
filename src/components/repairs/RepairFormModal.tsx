'use client';

import { RESPONSABLES_INICIALES_LIST, SOLICITANTES_LIST } from "@/lib/constants/initial-data";
export { RESPONSABLES_INICIALES_LIST, SOLICITANTES_LIST };
import { repository } from "@/lib/store/repository";
import { Project, Repair, RepairPriority, RepairType, ResponsibleParty } from "@/lib/types/database";
import { Edit, Loader2, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

interface RepairFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    project_id: string;
    repair_type_id?: string;
    description: string;
    priority?: RepairPriority;
    solicitante?: string;
    current_responsible_id?: string;
    fecha_informado?: string;
    fecha_compromiso?: string;
    observaciones?: string;
  }) => Promise<void> | void;
  projects: Project[];
  repairTypes: RepairType[];
  responsibleParties: ResponsibleParty[];
  defaultProjectId?: string;
  repairToEdit?: Repair;
}

export function RepairFormModal({
  isOpen,
  onClose,
  onSubmit,
  projects,
  repairTypes,
  responsibleParties,
  defaultProjectId = '',
  repairToEdit
}: RepairFormModalProps) {
  const [projectId, setProjectId] = useState('');
  const [repairTypeId, setRepairTypeId] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<RepairPriority>('Normal');
  
  const [solicitante, setSolicitante] = useState('');
  const [customSolicitante, setCustomSolicitante] = useState('');
  
  const [responsibleChoice, setResponsibleChoice] = useState('');
  const [customResponsibleName, setCustomResponsibleName] = useState('');
  
  const [fechaInformado, setFechaInformado] = useState('');
  const [fechaCompromiso, setFechaCompromiso] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const todayStr = new Date().toISOString().split('T')[0];

    if (repairToEdit) {
      setProjectId(repairToEdit.project_id);
      setRepairTypeId(repairToEdit.repair_type_id || '');
      setDescription(repairToEdit.description || '');
      setPriority(repairToEdit.priority || 'Normal');
      
      const sol = repairToEdit.solicitante || '';
      if (SOLICITANTES_LIST.includes(sol)) {
        setSolicitante(sol);
        setCustomSolicitante('');
      } else if (sol) {
        setSolicitante('__CUSTOM__');
        setCustomSolicitante(sol);
      } else {
        setSolicitante('');
        setCustomSolicitante('');
      }

      const currentResp = repairToEdit.current_responsible;
      if (currentResp) {
        if (RESPONSABLES_INICIALES_LIST.includes(currentResp.name)) {
          setResponsibleChoice(currentResp.name);
          setCustomResponsibleName('');
        } else {
          setResponsibleChoice('__CUSTOM__');
          setCustomResponsibleName(currentResp.name);
        }
      } else {
        setResponsibleChoice('');
        setCustomResponsibleName('');
      }

      setFechaInformado(repairToEdit.fecha_informado ? repairToEdit.fecha_informado.split('T')[0] : todayStr);
      setFechaCompromiso(repairToEdit.fecha_compromiso ? repairToEdit.fecha_compromiso.split('T')[0] : '');
      setObservaciones(repairToEdit.observaciones || '');
    } else {
      setProjectId(defaultProjectId || (projects[0]?.id || ''));
      setRepairTypeId('');
      setDescription('');
      setPriority('Normal');
      setSolicitante('');
      setCustomSolicitante('');
      setResponsibleChoice('');
      setCustomResponsibleName('');
      setFechaInformado(todayStr);
      setFechaCompromiso('');
      setObservaciones('');
    }
    setError('');
    setIsSubmitting(false);
  }, [repairToEdit, isOpen, defaultProjectId, projects]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
      setError('Seleccione un Proyecto FTTH.');
      return;
    }
    if (!description.trim()) {
      setError('Ingrese la Descripción del problema.');
      return;
    }

    const finalSolicitante = solicitante === '__CUSTOM__' ? customSolicitante.trim() : solicitante.trim();

    setError('');
    setIsSubmitting(true);

    try {
      let finalResponsibleId: string | undefined = undefined;
      if (responsibleChoice) {
        if (responsibleChoice === '__CUSTOM__') {
          if (!customResponsibleName.trim()) {
            setError('Escriba el nombre del nuevo responsable.');
            setIsSubmitting(false);
            return;
          }
          const newParty = await repository.addResponsibleParty(customResponsibleName.trim(), 'contractor');
          finalResponsibleId = newParty.id;
        } else {
          const existing = responsibleParties.find(r => r.name.toLowerCase() === responsibleChoice.trim().toLowerCase());
          if (existing) {
            finalResponsibleId = existing.id;
          } else {
            const newParty = await repository.addResponsibleParty(responsibleChoice.trim(), 'contractor');
            finalResponsibleId = newParty.id;
          }
        }
      }

      await onSubmit({
        project_id: projectId,
        repair_type_id: repairTypeId || undefined,
        description: description.trim(),
        priority,
        solicitante: finalSolicitante || undefined,
        current_responsible_id: finalResponsibleId,
        fecha_informado: fechaInformado || undefined,
        fecha_compromiso: fechaCompromiso || undefined,
        observaciones: observaciones.trim() || undefined
      });

      onClose();
    } catch (err: any) {
      console.error("Submit repair error:", err);
      setError(err.message || 'Error al guardar el reparo en la base de datos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-300 rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {repairToEdit ? (
              <Edit className="h-4 w-4 text-amber-400" />
            ) : (
              <Plus className="h-4 w-4 text-amber-400" />
            )}
            <h3 className="font-semibold text-sm">
              {repairToEdit ? `Editar Reparo #${repairToEdit.id.slice(0, 8)}` : 'Nuevo Reparo / Incidencia'}
            </h3>
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Proyecto FTTH (SIGEST / Polígono) <span className="text-red-500">*</span>
            </label>
            <select
              required
              disabled={isSubmitting}
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white font-mono"
            >
              <option value="">-- Seleccione Proyecto --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  SIGEST: {p.sigest} | Polígono: {p.poligono} {p.central ? `(${p.central})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tipo de Reparo <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <select
                disabled={isSubmitting}
                value={repairTypeId}
                onChange={(e) => setRepairTypeId(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white"
              >
                <option value="">-- Sin especificar (Opcional) --</option>
                {repairTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Prioridad</label>
              <select
                disabled={isSubmitting}
                value={priority}
                onChange={(e) => setPriority(e.target.value as RepairPriority)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white"
              >
                <option value="Normal">Normal</option>
                <option value="Alta">Alta</option>
                <option value="Crítica">Crítica</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Descripción del Problema <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              disabled={isSubmitting}
              placeholder="Describa claramente la incidencia detectada (ej. Faltan 3 postes en Av. San Martín, HUB sin potencia en cámara 14)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Solicitante</label>
              <select
                disabled={isSubmitting}
                value={solicitante}
                onChange={(e) => setSolicitante(e.target.value)}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded bg-white text-slate-900"
              >
                <option value="">-- Seleccionar Solicitante --</option>
                {SOLICITANTES_LIST.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
                <option value="__CUSTOM__">✍️ Escribir otro solicitante...</option>
              </select>

              {solicitante === '__CUSTOM__' && (
                <input
                  type="text"
                  required
                  disabled={isSubmitting}
                  placeholder="Nombre del solicitante..."
                  value={customSolicitante}
                  onChange={(e) => setCustomSolicitante(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 border border-blue-400 rounded mt-1.5 bg-blue-50/50"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Responsable Inicial (Opcional)</label>
              <select
                disabled={isSubmitting}
                value={responsibleChoice}
                onChange={(e) => setResponsibleChoice(e.target.value)}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded bg-white text-slate-900"
              >
                <option value="">-- Sin asignar --</option>
                {RESPONSABLES_INICIALES_LIST.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
                <option value="__CUSTOM__">✍️ Escribir otro responsable...</option>
              </select>

              {responsibleChoice === '__CUSTOM__' && (
                <input
                  type="text"
                  required
                  disabled={isSubmitting}
                  placeholder="Nombre del responsable..."
                  value={customResponsibleName}
                  onChange={(e) => setCustomResponsibleName(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 border border-blue-400 rounded mt-1.5 bg-blue-50/50"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha del Reparo (Informado) <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                disabled={isSubmitting}
                value={fechaInformado}
                onChange={(e) => setFechaInformado(e.target.value)}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded bg-white font-mono text-slate-900"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Fecha en que se reportó la incidencia</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Fecha Compromiso <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <input
                type="date"
                disabled={isSubmitting}
                value={fechaCompromiso}
                onChange={(e) => setFechaCompromiso(e.target.value)}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded bg-white font-mono text-slate-900"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Plazo estimado de solución</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Observaciones <span className="text-slate-400 font-normal">(Opcional)</span>
            </label>
            <input
              type="text"
              disabled={isSubmitting}
              placeholder="Notas adicionales..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded transition-colors shadow-2xs flex items-center gap-1.5"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Guardando en Base de Datos...' : (repairToEdit ? 'Guardar Cambios' : 'Registrar Reparo')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
