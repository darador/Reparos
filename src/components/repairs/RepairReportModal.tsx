'use client';

import { Repair } from "@/lib/types/database";
import { formatDate, formatDaysAgoLabel } from "@/lib/utils";
import { Check, Copy, FileText, X } from "lucide-react";
import { useMemo, useState } from "react";

interface RepairReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  repairs: Repair[];
  activeFilters: string[];
}

export function RepairReportModal({
  isOpen,
  onClose,
  repairs,
  activeFilters
}: RepairReportModalProps) {
  const [copied, setCopied] = useState(false);

  // Generate plain text report grouped by SIGEST + Polígono + Central + Responsable
  const reportText = useMemo(() => {
    if (repairs.length === 0) {
      return "No hay reparos visibles con los filtros seleccionados para generar el reporte.";
    }

    const todayStr = formatDate(new Date().toISOString());
    let output = `REPAROS FTTH – ${todayStr}\n\n`;

    // Group repairs by key (SIGEST + Polígono + Central + Responsable)
    type GroupMap = Map<string, {
      sigest: string;
      poligono: string;
      central: string;
      responsible: string;
      items: Repair[];
    }>;

    const groups: GroupMap = new Map();

    repairs.forEach((r) => {
      const sigest = r.project?.sigest || 'SIN SIGEST';
      const rawPoligono = r.project?.poligono || 'SIN POLÍGONO';
      // Clean 'POL-' prefix if present to ensure numeric poligono display
      const poligono = rawPoligono.replace(/^POL-/i, '').trim();
      const central = r.project?.central || '-';
      const responsible = r.current_responsible?.name || 'Sin asignar';

      const groupKey = `${sigest}_${poligono}_${central}_${responsible}`;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          sigest,
          poligono,
          central,
          responsible,
          items: []
        });
      }

      groups.get(groupKey)!.items.push(r);
    });

    // Build formatted string for each group
    const groupEntries = Array.from(groups.values());

    groupEntries.forEach((group, index) => {
      output += `SIGEST: ${group.sigest}\n`;
      output += `POLÍGONO: ${group.poligono}\n`;
      output += `CENTRAL: ${group.central}\n`;
      output += `RESPONSABLE: ${group.responsible}\n\n`;

      group.items.forEach((item) => {
        const typeName = item.repair_type?.name || 'Otro';
        const description = item.description || 'Sin descripción';
        const solicitante = item.solicitante?.trim() || 'Sin especificar';
        const reiteros = item.reiteration_count || 0;
        const reclamos = item.reclaim_count || 0;
        const fechaInformado = formatDate(item.fecha_informado);
        const antiguedad = formatDaysAgoLabel(item.fecha_informado);

        output += `• ${typeName}\n`;
        output += `  ${description}\n`;
        output += `  Solicitante: ${solicitante}\n`;
        output += `  Reiteros: ${reiteros} | Reclamos: ${reclamos}\n`;
        output += `  Informado: ${fechaInformado} | ${antiguedad}\n\n`;
      });

      if (index < groupEntries.length - 1) {
        output += `--------------------------------------------------\n\n`;
      }
    });

    return output.trim();
  }, [repairs]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error("Error al copiar reporte:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 text-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-300 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-400" />
            <h3 className="font-semibold text-sm">Vista Previa del Reporte de Reparos</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
            title="Cerrar ventana"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1 bg-slate-50/50">
          
          {/* Metadata info header */}
          <div className="bg-white border border-slate-200 p-3 rounded-md shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-mono text-[11px] uppercase tracking-wider block">
                Alcance del Reporte:
              </span>
              <span className="font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-xs">
                {repairs.length} {repairs.length === 1 ? 'reparo incluido' : 'reparos incluidos'}
              </span>
            </div>

            {/* Active Filters list */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100 text-[11px]">
              <span className="text-slate-400 font-medium">Filtros aplicados:</span>
              {activeFilters.length > 0 ? (
                activeFilters.map((filter, i) => (
                  <span
                    key={i}
                    className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-mono"
                  >
                    {filter}
                  </span>
                ))
              ) : (
                <span className="text-slate-500 italic font-mono">Sin filtros (Todos los reparos activos)</span>
              )}
            </div>
          </div>

          {/* Report Preview Text Area */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 text-[11px] uppercase tracking-wider font-mono">
              Texto Generado para Copiar y Pegar (Outlook / Mail):
            </label>
            <textarea
              readOnly
              value={reportText}
              className="w-full h-[340px] p-3.5 bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed rounded-md border border-slate-700 shadow-inner resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-text selection:bg-blue-600 selection:text-white"
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-white border-t border-slate-200 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {copied && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded animate-in fade-in duration-150">
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span>Reporte copiado al portapapeles</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 font-medium transition-colors"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded font-semibold shadow-sm transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? '¡Reporte Copiado!' : 'Copiar reporte'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
