'use client';

import { repository } from "@/lib/store/repository";
import { Project, Repair, RepairPriority, RepairType, ResponsibleParty } from "@/lib/types/database";
import { Edit, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

export const SOLICITANTES_LIST = [
  'AMIGO SEBASTIAN',
  'ALBANESE JESUS',
  'ARMIGNACCO ADRIAN',
  'JARA ESTEBAN',
  'MARCHAT ALEJANDRO',
  'MARCHAT JONATAN',
  'KOZDRON MATIAS',
  'ROMERO GUSTAVO',
  'SALDIAS PABLO'
];

export const RESPONSABLES_INICIALES_LIST = [
  'Obras / ALI EDUARDO',
  'Obras / DE LIO MARIANO',
  'Obras / DI PASQUO EMILIO',
  'Obras / LUTZ MARIA',
  'Ingeniería / BENITEZ DANIEL',
  'Ingeniería / PANDIANI'
];

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
    fecha_compromiso?: string;
    observaciones?: string;
  }) => void;
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
  
  const [fechaCompromiso, setFechaCompromiso] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

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
      setFechaCompromiso('');
      setObservaciones('');
    }
  }, [repairToEdit, isOpen, defaultProjectId, projects]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
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

    let finalResponsibleId: string | undefined = undefined;
    if (responsibleChoice) {
      if (responsibleChoice === '__CUSTOM__') {
        if (!customResponsibleName.trim()) {
          setError('Escriba el nombre del nuevo responsable.');
          return;
        }
        const newParty = repository.addResponsibleParty(customResponsibleName.trim(), 'contractor');
        finalResponsibleId = newParty.id;
      } else {
        const existing = responsibleParties.find(r => r.name.toLowerCase() === responsibleChoice.trim().toLowerCase());
        if (existing) {
          finalResponsibleId = existing.id;
        } else {
          const newParty = repository.addResponsibleParty(responsibleChoice.trim(), 'contractor');
          finalResponsibleId = newParty.id;
        }
      }
    }

    setError('');
    onSubmit({
      project_id: projectId,
      repair_type_id: repairTypeId || undefined,
      description: description.trim(),
      priority,
      solicitante: finalSolicitante || undefined,
      current_responsible_id: finalResponsibleId,
      fecha_compromiso: fechaCompromiso || undefined,
      observaciones: observaciones.trim() || undefined
    });

    onClose();
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
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
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
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Fecha Compromiso <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <input
                type="date"
                value={fechaCompromiso}
                onChange={(e) => setFechaCompromiso(e.target.value)}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded bg-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Observaciones <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <input
                type="text"
                placeholder="Notas adicionales..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded bg-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors shadow-2xs"
            >
              {repairToEdit ? 'Guardar Cambios' : 'Registrar Reparo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
