'use client';

import { DISTRITOS_LIST } from "@/lib/constants/initial-data";
import { OperationalStatus, Project } from "@/lib/types/database";
import { Edit3, Loader2, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

const EJECUTORES_LIST = [
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

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => Promise<void> | void;
  initialSigest?: string;
  projectToEdit?: Project | null;
}

export function ProjectFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialSigest = '',
  projectToEdit = null
}: ProjectFormModalProps) {
  const [sigest, setSigest] = useState(initialSigest);
  const [poligono, setPoligono] = useState('');
  const [distrito, setDistrito] = useState('');
  const [customDistrito, setCustomDistrito] = useState('');
  const [central, setCentral] = useState('');
  const [titulo, setTitulo] = useState('');
  const [ejecutor, setEjecutor] = useState('');
  const [customEjecutor, setCustomEjecutor] = useState('');
  const [ctosCount, setCtosCount] = useState<number>(0);
  const [alimentacion, setAlimentacion] = useState('NO');
  const [situacion, setSituacion] = useState<OperationalStatus>('Demorado');
  const [observaciones, setObservaciones] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (projectToEdit) {
        setSigest(projectToEdit.sigest || '');
        setPoligono(projectToEdit.poligono || '');
        
        let dis = (projectToEdit.distrito || '').trim().toUpperCase();
        if (dis === 'MONTEGRANDE') dis = 'MONTE GRANDE';
        if (DISTRITOS_LIST.includes(dis)) {
          setDistrito(dis);
          setCustomDistrito('');
        } else if (dis) {
          setDistrito('__CUSTOM__');
          setCustomDistrito(dis);
        } else {
          setDistrito('');
          setCustomDistrito('');
        }

        setCentral(projectToEdit.central || '');
        setTitulo(projectToEdit.titulo || '');
        
        const ej = projectToEdit.ejecutor || '';
        if (EJECUTORES_LIST.includes(ej)) {
          setEjecutor(ej);
          setCustomEjecutor('');
        } else if (ej) {
          setEjecutor('__CUSTOM__');
          setCustomEjecutor(ej);
        } else {
          setEjecutor('');
          setCustomEjecutor('');
        }

        setCtosCount(projectToEdit.ctos_count || 0);
        setAlimentacion(projectToEdit.alimentacion || 'NO');
        setSituacion(projectToEdit.situacion_operativa || 'Demorado');
        setObservaciones(projectToEdit.observaciones || '');
      } else {
        setSigest(initialSigest);
        setPoligono('');
        setDistrito('');
        setCustomDistrito('');
        setCentral('');
        setTitulo('');
        setEjecutor('');
        setCustomEjecutor('');
        setCtosCount(0);
        setAlimentacion('NO');
        setSituacion('Demorado');
        setObservaciones('');
      }
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen, projectToEdit, initialSigest]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sigest.trim()) {
      setError('El campo SIGEST es obligatorio.');
      return;
    }
    if (!poligono.trim()) {
      setError('El campo Polígono es obligatorio.');
      return;
    }

    let finalDistrito = distrito === '__CUSTOM__' ? customDistrito.trim() : distrito.trim();
    if (finalDistrito.toUpperCase() === 'MONTEGRANDE') {
      finalDistrito = 'MONTE GRANDE';
    }
    const finalEjecutor = ejecutor === '__CUSTOM__' ? customEjecutor.trim() : ejecutor.trim();

    setError('');
    setIsSubmitting(true);

    try {
      await onSubmit({
        sigest: sigest.trim(),
        poligono: poligono.trim(),
        distrito: finalDistrito || undefined,
        central: central.trim() || undefined,
        titulo: titulo.trim() || undefined,
        ejecutor: finalEjecutor || undefined,
        ctos_count: Number(ctosCount) || 0,
        alimentacion: alimentacion.trim() || 'NO',
        situacion_operativa: situacion,
        observaciones: observaciones.trim() || undefined,
        created_by: projectToEdit?.created_by || 'Dario'
      });
      onClose();
    } catch (err: any) {
      console.error("Submit project error:", err);
      setError(err.message || 'Error al guardar el proyecto en la base de datos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = !!projectToEdit;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-300 rounded-lg shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isEditing ? <Edit3 className="h-4 w-4 text-blue-400" /> : <Plus className="h-4 w-4 text-blue-400" />}
            <h3 className="font-semibold text-sm">
              {isEditing ? `Editar Proyecto FTTH: SIGEST ${projectToEdit.sigest} / ${projectToEdit.poligono}` : 'Nuevo Proyecto FTTH'}
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
                disabled={isSubmitting}
                placeholder="Ej. 102345"
                value={sigest}
                onChange={(e) => setSigest(e.target.value)}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Polígono <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={isSubmitting}
                placeholder="Ej. 045"
                value={poligono}
                onChange={(e) => setPoligono(e.target.value)}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Distrito</label>
              <select
                disabled={isSubmitting}
                value={distrito}
                onChange={(e) => setDistrito(e.target.value)}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded bg-white text-slate-900 font-medium"
              >
                <option value="">-- Seleccionar Distrito --</option>
                {DISTRITOS_LIST.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
                <option value="__CUSTOM__">✍️ Escribir otro distrito...</option>
              </select>

              {distrito === '__CUSTOM__' && (
                <input
                  type="text"
                  required
                  disabled={isSubmitting}
                  placeholder="Nombre del distrito..."
                  value={customDistrito}
                  onChange={(e) => setCustomDistrito(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 border border-blue-400 rounded mt-1.5 bg-blue-50/50"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Central</label>
              <input
                type="text"
                disabled={isSubmitting}
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
              <select
                disabled={isSubmitting}
                value={ejecutor}
                onChange={(e) => setEjecutor(e.target.value)}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded bg-white text-slate-900"
              >
                <option value="">-- Seleccionar Ejecutor --</option>
                {EJECUTORES_LIST.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
                <option value="__CUSTOM__">✍️ Escribir otro ejecutor...</option>
              </select>

              {ejecutor === '__CUSTOM__' && (
                <input
                  type="text"
                  required
                  disabled={isSubmitting}
                  placeholder="Nombre del ejecutor..."
                  value={customEjecutor}
                  onChange={(e) => setCustomEjecutor(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 border border-blue-400 rounded mt-1.5 bg-blue-50/50"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Situación Operativa</label>
              <select
                disabled={isSubmitting}
                value={situacion}
                onChange={(e) => setSituacion(e.target.value as OperationalStatus)}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded bg-white font-semibold"
              >
                <option value="Demorado">Demorado</option>
                <option value="En preparación">En preparación</option>
                <option value="Asignado">Asignado</option>
                <option value="En ejecución">En ejecución</option>
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
                disabled={isSubmitting}
                value={ctosCount}
                onChange={(e) => setCtosCount(parseInt(e.target.value) || 0)}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Alimentación</label>
              <select
                disabled={isSubmitting}
                value={alimentacion}
                onChange={(e) => setAlimentacion(e.target.value)}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded bg-white font-semibold"
              >
                <option value="NO">NO</option>
                <option value="SI">SI</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Observaciones</label>
            <textarea
              rows={2}
              disabled={isSubmitting}
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
              disabled={isSubmitting}
              className="px-3 py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded font-semibold shadow-sm flex items-center gap-1.5"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Guardando en Base de Datos...' : (isEditing ? 'Guardar Cambios' : 'Guardar Proyecto')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
