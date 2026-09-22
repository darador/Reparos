'use client';

import { OperationalStatus, Project } from "@/lib/types/database";
import { Plus, X } from "lucide-react";
import { useState } from "react";

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => void;
  initialSigest?: string;
}

export function ProjectFormModal({ isOpen, onClose, onSubmit, initialSigest = '' }: ProjectFormModalProps) {
  const [sigest, setSigest] = useState(initialSigest);
  const [poligono, setPoligono] = useState('');
  const [distrito, setDistrito] = useState('');
  const [central, setCentral] = useState('');
  const [titulo, setTitulo] = useState('');
  const [ejecutor, setEjecutor] = useState('');
  const [ctosCount, setCtosCount] = useState<number>(0);
  const [alimentacion, setAlimentacion] = useState('SI');
  const [situacion, setSituacion] = useState<OperationalStatus>('En ejecución');
  const [observaciones, setObservaciones] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sigest.trim()) {
      setError('El campo SIGEST es obligatorio.');
      return;
    }
    if (!poligono.trim()) {
      setError('El campo Polígono es obligatorio.');
      return;
    }

    setError('');
    onSubmit({
      sigest: sigest.trim(),
      poligono: poligono.trim(),
      distrito: distrito.trim() || undefined,
      central: central.trim() || undefined,
      titulo: titulo.trim() || undefined,
      ejecutor: ejecutor.trim() || undefined,
      ctos_count: Number(ctosCount) || 0,
      alimentacion: alimentacion.trim() || undefined,
      situacion_operativa: situacion,
      observaciones: observaciones.trim() || undefined,
      created_by: 'Dario'
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-300 rounded-lg shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-blue-400" />
            <h3 className="font-semibold text-sm">Nuevo Proyecto FTTH</h3>
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

          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-2.5 rounded text-xs">
            <strong>Identificación:</strong> La combinación <code className="bg-amber-100 px-1 font-bold">SIGEST + Polígono</code> identifica unívocamente el proyecto en el sistema.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                SIGEST <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ej. 102345"
                value={sigest}
                onChange={(e) => setSigest(e.target.value)}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Polígono <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ej. 045"
                value={poligono}
                onChange={(e) => setPoligono(e.target.value)}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Distrito</label>
              <input
                type="text"
                placeholder="Ej. Florencio Varela"
                value={distrito}
                onChange={(e) => setDistrito(e.target.value)}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Central</label>
              <input
                type="text"
                placeholder="Ej. Varela Central"
                value={central}
                onChange={(e) => setCentral(e.target.value)}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Equipo Ejecutor</label>
              <input
                type="text"
                placeholder="Ej. Contratista ABC"
                value={ejecutor}
                onChange={(e) => setEjecutor(e.target.value)}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Situación Operativa</label>
              <select
                value={situacion}
                onChange={(e) => setSituacion(e.target.value as OperationalStatus)}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded bg-white"
              >
                <option value="En preparación">En preparación</option>
                <option value="Asignado">Asignado</option>
                <option value="En ejecución">En ejecución</option>
                <option value="Demorado">Demorado</option>
                <option value="Rediseño">Rediseño</option>
                <option value="Finalizado">Finalizado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Cantidad de CTOs</label>
              <input
                type="number"
                min="0"
                value={ctosCount}
                onChange={(e) => setCtosCount(parseInt(e.target.value) || 0)}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Alimentación</label>
              <select
                value={alimentacion}
                onChange={(e) => setAlimentacion(e.target.value)}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded bg-white font-semibold"
              >
                <option value="SI">SI</option>
                <option value="NO">NO</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Observaciones Iniciales</label>
            <textarea
              rows={2}
              placeholder="Detalles u observaciones del proyecto..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded"
            />
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
              Guardar Proyecto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
