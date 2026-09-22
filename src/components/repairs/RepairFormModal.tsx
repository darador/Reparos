'use client';

import { repository } from "@/lib/store/repository";
import { Project, RepairPriority, RepairType, ResponsibleParty } from "@/lib/types/database";
import { Plus, X } from "lucide-react";
import { useState } from "react";

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
}

export function RepairFormModal({
  isOpen,
  onClose,
  onSubmit,
  projects,
  repairTypes,
  responsibleParties,
  defaultProjectId = ''
}: RepairFormModalProps) {
  const [projectId, setProjectId] = useState(defaultProjectId || (projects[0]?.id || ''));
  const [repairTypeId, setRepairTypeId] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<RepairPriority>('Normal');
  const [solicitante, setSolicitante] = useState('');
  const [responsibleId, setResponsibleId] = useState('');
  const [customResponsibleName, setCustomResponsibleName] = useState('');
  const [fechaCompromiso, setFechaCompromiso] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [error, setError] = useState('');

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
      project_id: projectId,
      repair_type_id: repairTypeId || undefined,
      description: description.trim(),
      priority,
      solicitante: solicitante.trim() || undefined,
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
            <Plus className="h-4 w-4 text-amber-400" />
            <h3 className="font-semibold text-sm">Nuevo Reparo / Incidencia</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded text-xs">
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
                  SIGEST: {p.sigest} | Polígono: {p.poligono} {p.distrito ? `(${p.distrito})` : ''}
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
              <input
                type="text"
                placeholder="Ej. Jefe de Obra / Auditor"
                value={solicitante}
                onChange={(e) => setSolicitante(e.target.value)}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Responsable Inicial (Opcional)</label>
              <select
                value={responsibleId}
                onChange={(e) => setResponsibleId(e.target.value)}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded bg-white"
              >
                <option value="">-- Asignar después --</option>
                {responsibleParties.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
                <option value="__CUSTOM__">✍️ Escribir otro nombre de responsable...</option>
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Fecha Compromiso</label>
              <input
                type="date"
                value={fechaCompromiso}
                onChange={(e) => setFechaCompromiso(e.target.value)}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Observaciones</label>
              <input
                type="text"
                placeholder="Observaciones adicionales..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded font-medium shadow-sm"
            >
              Registrar Reparo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
