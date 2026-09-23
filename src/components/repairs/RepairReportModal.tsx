'use client';

import { Repair } from "@/lib/types/database";
import { formatDate, formatDaysAgoLabel } from "@/lib/utils";
import { Check, Copy, FileText, Table as TableIcon, X } from "lucide-react";
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
  const [format, setFormat] = useState<'text' | 'table'>('text');
  const [copied, setCopied] = useState(false);

  // Generate plain text report grouped by SIGEST + Polígono + Central + Responsable
  const reportText = useMemo(() => {
    if (repairs.length === 0) {
      return "No hay reparos visibles con los filtros seleccionados para generar el reporte.";
    }

    const todayStr = formatDate(new Date().toISOString());
    let output = `REPAROS FTTH – ${todayStr}\n\n`;

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

  // Generate HTML table for email pasting & preview
  const reportTableHtml = useMemo(() => {
    if (repairs.length === 0) return '';
    const todayStr = formatDate(new Date().toISOString());

    const rows = repairs.map((r, i) => {
      const sigest = r.project?.sigest || 'SIN SIGEST';
      const poligono = (r.project?.poligono || '-').replace(/^POL-/i, '').trim();
      const central = r.project?.central || '-';
      const responsible = r.current_responsible?.name || 'Sin asignar';
      const typeName = r.repair_type?.name || 'Otro';
      const description = r.description || 'Sin descripción';
      const solicitante = r.solicitante?.trim() || '-';
      const reiteros = r.reiteration_count || 0;
      const fechaInformado = formatDate(r.fecha_informado);
      const statusName = r.current_status?.name || 'Pendiente';
      const bg = i % 2 === 0 ? '#ffffff' : '#f8fafc';

      return `
        <tr style="background-color: ${bg};">
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-weight: bold; font-family: Arial, sans-serif; font-size: 11px;">${sigest}</td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px;">${poligono}</td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px;">${central}</td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; font-weight: 600; color: #1e293b;">${responsible}</td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px;">${typeName}</td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px;">${description}</td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px;">${solicitante}</td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; text-align: center; font-family: Arial, sans-serif; font-size: 11px; ${reiteros > 0 ? 'color: #dc2626; font-weight: bold;' : ''}">${reiteros}</td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; white-space: nowrap;">${fechaInformado}</td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px;">${statusName}</td>
        </tr>
      `;
    }).join('');

    return `
      <div style="font-family: Arial, sans-serif; color: #0f172a; margin-bottom: 8px;">
        <p style="font-size: 13px; font-weight: bold; margin: 0 0 4px 0; color: #0f172a;">REPAROS FTTH – ${todayStr}</p>
        <p style="font-size: 11px; color: #64748b; margin: 0 0 10px 0;">Total: ${repairs.length} ${repairs.length === 1 ? 'reparo' : 'reparos'}</p>
        <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 11px; border: 1px solid #cbd5e1;">
          <thead>
            <tr style="background-color: #0f172a; color: #ffffff;">
              <th style="padding: 8px 10px; border: 1px solid #334155; text-align: left; font-size: 11px;">SIGEST</th>
              <th style="padding: 8px 10px; border: 1px solid #334155; text-align: left; font-size: 11px;">Polígono</th>
              <th style="padding: 8px 10px; border: 1px solid #334155; text-align: left; font-size: 11px;">Central</th>
              <th style="padding: 8px 10px; border: 1px solid #334155; text-align: left; font-size: 11px;">Responsable</th>
              <th style="padding: 8px 10px; border: 1px solid #334155; text-align: left; font-size: 11px;">Tipo Reparo</th>
              <th style="padding: 8px 10px; border: 1px solid #334155; text-align: left; font-size: 11px;">Descripción</th>
              <th style="padding: 8px 10px; border: 1px solid #334155; text-align: left; font-size: 11px;">Solicitante</th>
              <th style="padding: 8px 10px; border: 1px solid #334155; text-align: center; font-size: 11px;">Reiteros</th>
              <th style="padding: 8px 10px; border: 1px solid #334155; text-align: left; font-size: 11px;">Informado</th>
              <th style="padding: 8px 10px; border: 1px solid #334155; text-align: left; font-size: 11px;">Estado</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }, [repairs]);

  // Generate Tab-Separated Values (TSV) for plain text table fallback (Excel paste)
  const reportTableTsv = useMemo(() => {
    if (repairs.length === 0) return '';
    const headers = ['SIGEST', 'Polígono', 'Central', 'Responsable', 'Tipo Reparo', 'Descripción', 'Solicitante', 'Reiteros', 'Informado', 'Estado'];
    const rows = repairs.map(r => [
      r.project?.sigest || 'SIN SIGEST',
      (r.project?.poligono || '-').replace(/^POL-/i, '').trim(),
      r.project?.central || '-',
      r.current_responsible?.name || 'Sin asignar',
      r.repair_type?.name || 'Otro',
      (r.description || '').replace(/\n/g, ' '),
      r.solicitante?.trim() || '-',
      r.reiteration_count || 0,
      formatDate(r.fecha_informado),
      r.current_status?.name || 'Pendiente'
    ].join('\t'));

    return [headers.join('\t'), ...rows].join('\n');
  }, [repairs]);

  if (!isOpen) return null;

  const copyFallbackText = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
  };

  const handleCopy = async () => {
    try {
      if (format === 'text') {
        if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          await navigator.clipboard.writeText(reportText);
        } else {
          copyFallbackText(reportText);
        }
      } else {
        // Table format: copy HTML table so email clients paste real formatted table
        if (typeof window !== 'undefined' && window.ClipboardItem && navigator.clipboard && navigator.clipboard.write) {
          const htmlBlob = new Blob([reportTableHtml], { type: 'text/html' });
          const textBlob = new Blob([reportTableTsv], { type: 'text/plain' });
          await navigator.clipboard.write([
            new ClipboardItem({
              'text/html': htmlBlob,
              'text/plain': textBlob,
            })
          ]);
        } else {
          // DOM selection fallback for HTML copy
          const container = document.getElementById('report-table-preview-container');
          if (container) {
            const range = document.createRange();
            range.selectNodeContents(container);
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);
            document.execCommand('copy');
            selection?.removeAllRanges();
          } else {
            copyFallbackText(reportTableTsv);
          }
        }
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.warn("Clipboard API failed, using fallback:", err);
      try {
        if (format === 'text') {
          copyFallbackText(reportText);
        } else {
          copyFallbackText(reportTableTsv);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch (e) {
        console.error("Error al copiar reporte:", e);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 text-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-300 rounded-lg shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-400" />
            <h3 className="font-semibold text-sm">Vista Previa y Generador de Reportes</h3>
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

          {/* Format Selector Tabs */}
          <div className="flex items-center gap-1 bg-slate-200 p-1 rounded-md">
            <button
              type="button"
              onClick={() => setFormat('text')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded text-xs font-semibold transition-all ${
                format === 'text'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-300'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              <FileText className={`h-4 w-4 ${format === 'text' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>Formato Texto (Agrupado por Bloques)</span>
            </button>

            <button
              type="button"
              onClick={() => setFormat('table')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded text-xs font-semibold transition-all ${
                format === 'table'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-300'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              <TableIcon className={`h-4 w-4 ${format === 'table' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>Formato Tabla (para Copiar en Outlook / Mail / Excel)</span>
            </button>
          </div>

          {/* Format View Containers */}
          {format === 'text' ? (
            <div>
              <label className="block font-semibold text-slate-700 mb-1 text-[11px] uppercase tracking-wider font-mono">
                Texto Estructurado Generado:
              </label>
              <textarea
                readOnly
                value={reportText}
                className="w-full h-[320px] p-3.5 bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed rounded-md border border-slate-700 shadow-inner resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-text selection:bg-blue-600 selection:text-white"
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              />
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider font-mono">
                  Vista Previa de la Tabla (Se copiará con formato a Mail / Outlook):
                </label>
                <span className="text-[11px] text-slate-500">
                  Listo para pegar directo en Outlook, Gmail o Excel
                </span>
              </div>

              {repairs.length === 0 ? (
                <div className="p-8 text-center bg-white border border-slate-200 rounded-md text-slate-500 italic">
                  No hay reparos visibles con los filtros seleccionados para generar la tabla.
                </div>
              ) : (
                <div
                  id="report-table-preview-container"
                  className="bg-white border border-slate-300 rounded-md p-3.5 max-h-[320px] overflow-auto shadow-inner"
                  dangerouslySetInnerHTML={{ __html: reportTableHtml }}
                />
              )}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-white border-t border-slate-200 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {copied && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded animate-in fade-in duration-150">
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span>
                  {format === 'text' ? '¡Reporte en texto copiado!' : '¡Tabla copiada con formato!'}
                </span>
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
              <span>
                {copied
                  ? '¡Copiado al portapapeles!'
                  : format === 'text'
                  ? 'Copiar reporte (Texto)'
                  : 'Copiar tabla (Mail/Excel)'}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
