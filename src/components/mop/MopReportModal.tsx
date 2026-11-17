'use client';

import React, { useMemo, useState } from 'react';
import { MopCto } from '@/lib/types/database';
import { formatDate } from '@/lib/utils';
import { Check, Copy, FileText, Table as TableIcon, X } from 'lucide-react';

interface MopReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  ctos: MopCto[];
  activeFilters: string[];
  viewMode?: 'vigentes' | 'cerradas';
}

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '-';
  }
}

export function MopReportModal({
  isOpen,
  onClose,
  ctos,
  activeFilters,
  viewMode = 'vigentes'
}: MopReportModalProps) {
  const [format, setFormat] = useState<'table' | 'text'>('table');
  const [copied, setCopied] = useState(false);

  // Generar reporte en Texto Plano agrupado por Responsable + Central
  const reportText = useMemo(() => {
    if (ctos.length === 0) {
      return 'No hay CTOs visibles con los filtros seleccionados para generar el reporte.';
    }

    const todayStr = formatDate(new Date().toISOString());
    const reportTitle =
      viewMode === 'cerradas'
        ? `REPORTE HISTORIAL CTOs CERRADAS POR ACTUALIZACIÓN MOP – ${todayStr}`
        : `REPORTE PENDIENTE MOP – ${todayStr}`;

    let output = `${reportTitle}\n`;
    output += `Total de CTOs: ${ctos.length}\n\n`;

    type GroupMap = Map<string, {
      responsable: string;
      central: string;
      items: MopCto[];
    }>;

    const groups: GroupMap = new Map();

    ctos.forEach((c) => {
      const resp = c.responsable_cto || 'Sin Asignar';
      const cent = c.central || 'Sin Central';
      const key = `${resp}__${cent}`;

      if (!groups.has(key)) {
        groups.set(key, {
          responsable: resp,
          central: cent,
          items: []
        });
      }

      groups.get(key)!.items.push(c);
    });

    const groupEntries = Array.from(groups.values());

    groupEntries.forEach((group, index) => {
      output += `RESPONSABLE: ${group.responsable.toUpperCase()}\n`;
      output += `CENTRAL: ${group.central}\n`;
      output += `CANTIDAD: ${group.items.length} CTOs\n\n`;

      group.items.forEach((item) => {
        const obs = item.observacion ? ` | Obs: ${item.observacion}` : '';
        if (viewMode === 'cerradas') {
          const fc = formatDateTime(item.fecha_cierre_actualizacion || item.updated_at);
          const fa = formatDateTime(item.fecha_ultima_aparicion);
          output += `• CTO: ${item.cto} [CERRADA POR ACTUALIZACIÓN]\n`;
          output += `  Sigest CTO: ${item.sigest} | Polígono: ${item.poligono}\n`;
          output += `  Último Estado: ${item.estado} | Pestaña: ${item.categoria_origen}\n`;
          output += `  Fecha Cierre: ${fc} | Última Aparición Excel: ${fa}${obs}\n\n`;
        } else {
          output += `• CTO: ${item.cto}\n`;
          output += `  Sigest CTO: ${item.sigest} | Polígono: ${item.poligono}\n`;
          output += `  Pelo: ${item.pelo || '-'} | Inst: ${item.instalacion_toa || '-'} | Cert: ${item.certificacion_toa || '-'}\n`;
          output += `  Estado: ${item.estado} | Pestaña: ${item.categoria_origen}${obs}\n\n`;
        }
      });

      if (index < groupEntries.length - 1) {
        output += `--------------------------------------------------\n\n`;
      }
    });

    return output.trim();
  }, [ctos, viewMode]);

  // Generar reporte en Tabla HTML para pegar directo en Outlook / Mail
  const reportTableHtml = useMemo(() => {
    if (ctos.length === 0) return '';
    const todayStr = formatDate(new Date().toISOString());
    const reportTitle =
      viewMode === 'cerradas'
        ? `REPORTE HISTORIAL CTOs CERRADAS POR ACTUALIZACIÓN MOP – ${todayStr}`
        : `REPORTE PENDIENTE MOP – ${todayStr}`;

    if (viewMode === 'cerradas') {
      const rows = ctos.map((c, i) => {
        const bg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
        const statusColor =
          c.estado === 'PENDIENTE'
            ? '#b45309'
            : c.estado === 'COMPLETADO'
            ? '#15803d'
            : '#be123c';

        return `
          <tr style="background-color: ${bg};">
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold; font-family: Arial, sans-serif; font-size: 11px;">${c.sigest}</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px;">${c.poligono}</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px;">${c.central || '-'}</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; color: #0f172a;">${c.cto}</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; font-weight: 600; color: #1e293b;">${c.responsable_cto || '-'}</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; color: ${statusColor};">${c.estado}</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px;">${formatDateTime(c.fecha_cierre_actualizacion || c.updated_at)}</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px;">${formatDateTime(c.fecha_ultima_aparicion)}</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; color: #475569;">${c.observacion || '-'}</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 10px; color: #64748b;">${c.categoria_origen}</td>
          </tr>
        `;
      }).join('');

      return `
        <div style="font-family: Arial, sans-serif; color: #0f172a; margin-bottom: 8px;">
          <p style="font-size: 13px; font-weight: bold; margin: 0 0 4px 0; color: #0f172a;">${reportTitle}</p>
          <p style="font-size: 11px; color: #64748b; margin: 0 0 10px 0;">Total de CTOs Cerradas: ${ctos.length}</p>
          <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 11px; border: 1px solid #cbd5e1;">
            <thead>
              <tr style="background-color: #334155; color: #ffffff;">
                <th style="padding: 7px 8px; border: 1px solid #475569; text-align: left; font-size: 11px;">Sigest CTO</th>
                <th style="padding: 7px 8px; border: 1px solid #475569; text-align: left; font-size: 11px;">Polígono</th>
                <th style="padding: 7px 8px; border: 1px solid #475569; text-align: left; font-size: 11px;">Central</th>
                <th style="padding: 7px 8px; border: 1px solid #475569; text-align: left; font-size: 11px;">CTO</th>
                <th style="padding: 7px 8px; border: 1px solid #475569; text-align: left; font-size: 11px;">Responsable CTO</th>
                <th style="padding: 7px 8px; border: 1px solid #475569; text-align: left; font-size: 11px;">Último Estado</th>
                <th style="padding: 7px 8px; border: 1px solid #475569; text-align: left; font-size: 11px;">Fecha Cierre</th>
                <th style="padding: 7px 8px; border: 1px solid #475569; text-align: left; font-size: 11px;">Última Aparición</th>
                <th style="padding: 7px 8px; border: 1px solid #475569; text-align: left; font-size: 11px;">Observación</th>
                <th style="padding: 7px 8px; border: 1px solid #475569; text-align: left; font-size: 10px;">Pestaña</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      `;
    }

    const rows = ctos.map((c, i) => {
      const bg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
      const statusColor =
        c.estado === 'PENDIENTE'
          ? '#b45309'
          : c.estado === 'COMPLETADO'
          ? '#15803d'
          : '#be123c';

      return `
        <tr style="background-color: ${bg};">
          <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold; font-family: Arial, sans-serif; font-size: 11px;">${c.sigest}</td>
          <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px;">${c.poligono}</td>
          <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px;">${c.central || '-'}</td>
          <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; color: #0f172a;">${c.cto}</td>
          <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center; font-family: Arial, sans-serif; font-size: 11px;">${c.pelo || '-'}</td>
          <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px;">${c.instalacion_toa || '-'}</td>
          <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px;">${c.certificacion_toa || '-'}</td>
          <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; font-weight: 600; color: #1e293b;">${c.responsable_cto || '-'}</td>
          <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; color: ${statusColor};">${c.estado}</td>
          <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; color: #475569;">${c.observacion || '-'}</td>
          <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 10px; color: #64748b;">${c.categoria_origen}</td>
        </tr>
      `;
    }).join('');

    return `
      <div style="font-family: Arial, sans-serif; color: #0f172a; margin-bottom: 8px;">
        <p style="font-size: 13px; font-weight: bold; margin: 0 0 4px 0; color: #0f172a;">${reportTitle}</p>
        <p style="font-size: 11px; color: #64748b; margin: 0 0 10px 0;">Total de CTOs: ${ctos.length}</p>
        <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 11px; border: 1px solid #cbd5e1;">
          <thead>
            <tr style="background-color: #0f172a; color: #ffffff;">
              <th style="padding: 7px 8px; border: 1px solid #334155; text-align: left; font-size: 11px;">Sigest CTO</th>
              <th style="padding: 7px 8px; border: 1px solid #334155; text-align: left; font-size: 11px;">Polígono</th>
              <th style="padding: 7px 8px; border: 1px solid #334155; text-align: left; font-size: 11px;">Central</th>
              <th style="padding: 7px 8px; border: 1px solid #334155; text-align: left; font-size: 11px;">CTO</th>
              <th style="padding: 7px 8px; border: 1px solid #334155; text-align: center; font-size: 11px;">Pelo</th>
              <th style="padding: 7px 8px; border: 1px solid #334155; text-align: left; font-size: 11px;">Instalación TOA</th>
              <th style="padding: 7px 8px; border: 1px solid #334155; text-align: left; font-size: 11px;">Certificación TOA</th>
              <th style="padding: 7px 8px; border: 1px solid #334155; text-align: left; font-size: 11px;">Responsable CTO</th>
              <th style="padding: 7px 8px; border: 1px solid #334155; text-align: left; font-size: 11px;">Estado</th>
              <th style="padding: 7px 8px; border: 1px solid #334155; text-align: left; font-size: 11px;">Observación</th>
              <th style="padding: 7px 8px; border: 1px solid #334155; text-align: left; font-size: 10px;">Pestaña</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }, [ctos, viewMode]);

  // Tab-Separated Values para pegar en Excel
  const reportTableTsv = useMemo(() => {
    if (ctos.length === 0) return '';
    if (viewMode === 'cerradas') {
      const headers = [
        'Sigest CTO',
        'Polígono',
        'Central',
        'CTO',
        'Responsable CTO',
        'Último Estado',
        'Fecha Cierre',
        'Última Aparición',
        'Observación',
        'Pestaña Origen'
      ];
      const rows = ctos.map(c => [
        c.sigest,
        c.poligono,
        c.central || '-',
        c.cto,
        c.responsable_cto || '-',
        c.estado,
        formatDateTime(c.fecha_cierre_actualizacion || c.updated_at),
        formatDateTime(c.fecha_ultima_aparicion),
        (c.observacion || '-').replace(/\n/g, ' '),
        c.categoria_origen
      ].join('\t'));
      return [headers.join('\t'), ...rows].join('\n');
    }

    const headers = [
      'Sigest CTO',
      'Polígono',
      'Central',
      'CTO',
      'Pelo',
      'Instalación TOA',
      'Certificación TOA',
      'Responsable CTO',
      'Estado',
      'Observación',
      'Pestaña Origen'
    ];

    const rows = ctos.map(c => [
      c.sigest,
      c.poligono,
      c.central || '-',
      c.cto,
      c.pelo || '-',
      c.instalacion_toa || '-',
      c.certificacion_toa || '-',
      c.responsable_cto || '-',
      c.estado,
      (c.observacion || '-').replace(/\n/g, ' '),
      c.categoria_origen
    ].join('\t'));

    return [headers.join('\t'), ...rows].join('\n');
  }, [ctos, viewMode]);

  if (!isOpen) return null;

  const copyFallbackText = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Fallback copy failed', e);
    }
    document.body.removeChild(textArea);
  };

  const handleCopy = async () => {
    try {
      if (format === 'table') {
        if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
          const blobHtml = new Blob([reportTableHtml], { type: 'text/html' });
          const blobText = new Blob([reportTableTsv], { type: 'text/plain' });
          const item = new ClipboardItem({
            'text/html': blobHtml,
            'text/plain': blobText
          });
          await navigator.clipboard.write([item]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          return;
        }
        copyFallbackText(reportTableTsv);
      } else {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(reportText);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          return;
        }
        copyFallbackText(reportText);
      }
    } catch (err) {
      copyFallbackText(format === 'table' ? reportTableTsv : reportText);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded border border-slate-300 shadow-2xl max-w-4xl w-full p-5 space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {viewMode === 'cerradas' ? 'Generar Reporte — Historial de Cerradas MOP' : 'Generar Reporte — Pendiente MOP'}
              </h2>
              <p className="text-xs text-slate-500">
                Vista previa y copiado con formato para Outlook, correo electrónico o Excel.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Barra de Filtros Activos y Formato */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-2.5 rounded border border-slate-200 text-xs shrink-0">
          <div className="space-y-0.5">
            <span className="font-semibold text-slate-700">Filtros aplicados en el reporte:</span>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600">
              {activeFilters.length > 0 ? (
                activeFilters.map((f, i) => (
                  <span key={i} className="bg-white border border-slate-300 px-2 py-0.5 rounded shadow-2xs font-medium">
                    {f}
                  </span>
                ))
              ) : (
                <span className="italic text-slate-400">Todos los registros (sin filtros)</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[11px] font-semibold">Formato:</span>
            <div className="inline-flex rounded border border-slate-300 p-0.5 bg-white">
              <button
                type="button"
                onClick={() => setFormat('table')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                  format === 'table' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span>Tabla HTML (Outlook)</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat('text')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                  format === 'text' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Texto Plano</span>
              </button>
            </div>
          </div>
        </div>

        {/* Vista previa del Reporte */}
        <div className="flex-1 overflow-y-auto border border-slate-200 rounded p-3 bg-slate-50/50">
          {format === 'table' ? (
            <div
              className="bg-white p-3 rounded border border-slate-200 shadow-2xs overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: reportTableHtml }}
            />
          ) : (
            <pre className="bg-white p-3 rounded border border-slate-200 shadow-2xs font-mono text-[11px] text-slate-800 whitespace-pre-wrap leading-relaxed select-all">
              {reportText}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-3 shrink-0">
          <div className="text-xs text-slate-500">
            Total en reporte: <strong className="text-slate-800 font-mono">{ctos.length}</strong> CTOs
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded border border-slate-300 transition-colors"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded shadow-xs transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-300" />
                  <span>¡Copiado al portapapeles!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>{format === 'table' ? 'Copiar Tabla para Correo / Outlook' : 'Copiar Texto Plano'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
