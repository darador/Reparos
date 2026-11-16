'use client';

import React from 'react';
import { MopImportPreview } from '@/lib/mop/service';
import { AlertCircle, AlertTriangle, CheckCircle2, Clock, Copy, FileSpreadsheet, Layers, ShieldCheck, X } from 'lucide-react';

interface MopImportPreviewModalProps {
  preview: MopImportPreview | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isConfirming: boolean;
}

export function MopImportPreviewModal({
  preview,
  isOpen,
  onClose,
  onConfirm,
  isConfirming
}: MopImportPreviewModalProps) {
  if (!isOpen || !preview) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded border border-slate-300 shadow-2xl max-w-2xl w-full p-5 space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-blue-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Vista Previa y Validación de Importación MOP
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {preview.filename}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isConfirming}
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido con scroll si es extenso */}
        <div className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs text-slate-700">
          {/* Alertas de Error */}
          {preview.errors.length > 0 && (
            <div className="bg-red-50 border border-red-300 text-red-900 p-3 rounded space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-red-950">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>Errores de validación que impiden la importación:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 pl-2 text-[11px] text-red-800">
                {preview.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Advertencias */}
          {preview.warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-300 text-amber-900 p-3 rounded space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-950">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Avisos detectados:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 pl-2 text-[11px] text-amber-800 max-h-24 overflow-y-auto">
                {preview.warnings.map((warn, i) => (
                  <li key={i}>{warn}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Resumen por Pestañas */}
          <div>
            <span className="font-bold text-slate-800 block mb-1.5 flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-blue-600" />
              <span>Registros encontrados en las 5 pestañas:</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(preview.sheetCounts).map(([cat, count]) => (
                <div key={cat} className="p-2 bg-slate-50 border border-slate-200 rounded flex flex-col">
                  <span className="text-[11px] text-slate-500 font-medium truncate">{cat}</span>
                  <span className="text-sm font-bold font-mono text-slate-900">{count} CTOs</span>
                </div>
              ))}
              <div className="p-2 bg-blue-50 border border-blue-200 rounded flex flex-col sm:col-span-1">
                <span className="text-[11px] text-blue-700 font-bold uppercase">Total Filas</span>
                <span className="text-sm font-black font-mono text-blue-950">{preview.totalFound} CTOs</span>
              </div>
            </div>
          </div>

          {/* Diagnóstico de Sincronización Incremental */}
          {preview.valid && (
            <div className="border border-slate-200 rounded p-3 bg-slate-50/70 space-y-2">
              <span className="font-bold text-slate-800 block flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Diagnóstico de actualización inteligente:</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded">
                  <span className="block text-[11px] text-emerald-700 font-medium">Registros Nuevos</span>
                  <span className="text-base font-extrabold font-mono text-emerald-900">
                    +{preview.newCount}
                  </span>
                  <span className="block text-[10px] text-emerald-600 mt-0.5">Ingresarán como PENDIENTE</span>
                </div>

                <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                  <span className="block text-[11px] text-blue-700 font-medium">A Actualizar</span>
                  <span className="text-base font-extrabold font-mono text-blue-900">
                    {preview.updateCount}
                  </span>
                  <span className="block text-[10px] text-blue-600 mt-0.5">Conserva Estado y Observación</span>
                </div>

                <div className="p-2 bg-slate-100 border border-slate-300 rounded">
                  <span className="block text-[11px] text-slate-600 font-medium">Pasarán a Ausentes</span>
                  <span className="text-base font-extrabold font-mono text-slate-800">
                    {preview.absentCount}
                  </span>
                  <span className="block text-[10px] text-slate-500 mt-0.5">No se eliminan ni modifican</span>
                </div>
              </div>
            </div>
          )}

          {/* Duplicados detectados */}
          {preview.duplicatesCount > 0 && (
            <div className="border border-amber-300 bg-amber-50/60 rounded p-3 space-y-1.5">
              <div className="flex items-center justify-between text-amber-900 font-bold">
                <span className="flex items-center gap-1.5">
                  <Copy className="h-3.5 w-3.5 text-amber-600" />
                  <span>{preview.duplicatesCount} Duplicados internos detectados (Mismo SIGEST + POLÍGONO + CTO):</span>
                </span>
              </div>
              <p className="text-[11px] text-amber-800">
                El sistema conservará una única instancia para asegurar la restricción de unicidad y evitar inconsistencias.
              </p>
              <div className="max-h-24 overflow-y-auto space-y-1 p-1 bg-white/80 rounded border border-amber-200 font-mono text-[10px]">
                {preview.duplicateDetails.map((dup, i) => (
                  <div key={i} className="flex justify-between items-center text-slate-700">
                    <span>
                      {dup.sigest} / {dup.poligono} — CTO {dup.cto}
                    </span>
                    <span className="text-amber-700 text-[9px]">{dup.sheet}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer con acciones */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isConfirming}
            className="px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded border border-slate-300 transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={!preview.valid || isConfirming || preview.errors.length > 0}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{isConfirming ? 'Importando registros...' : 'Confirmar e Importar a Base de Datos'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
