'use client';

import { repository } from "@/lib/store/repository";
import { AlertCircle, CheckCircle2, FileSpreadsheet, Upload, X } from "lucide-react";
import React, { useState } from "react";
import * as XLSX from "xlsx";

interface ImportCumplimientoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedRecord {
  sigest: string;
  poligono: string;
  central: string;
  porcentaje_cumplimiento: number | null;
  titulo?: string;
  ejecutor?: string;
}

export function ImportCumplimientoModal({
  isOpen,
  onClose,
  onSuccess
}: ImportCumplimientoModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createIfNotExists, setCreateIfNotExists] = useState(true);
  const [results, setResults] = useState<{ updated: number; created: number; matched: number } | null>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setFile(null);
    setParsedData([]);
    setIsProcessing(false);
    setErrorMsg(null);
    setResults(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    processFile(uploadedFile);
  };

  const processFile = (uploadedFile: File) => {
    setFile(uploadedFile);
    setErrorMsg(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          setErrorMsg("El archivo seleccionado está vacío o no contiene datos.");
          setIsProcessing(false);
          return;
        }

        const firstRow = rawJson[0];
        const headers = Object.keys(firstRow);

        const findHeader = (candidates: string[]) => {
          return headers.find(h => 
            candidates.some(c => h.trim().toLowerCase() === c.toLowerCase()) ||
            candidates.some(c => h.trim().toLowerCase().includes(c.toLowerCase()))
          );
        };

        const sigestHeader = findHeader(['sisvadi', 'sigest', 'proyecto', 'sigest_num', 'num_sigest']);
        const poligonoHeader = findHeader(['poligono', 'pol', 'poligono_num', 'num_poligono']);
        const centralHeader = findHeader(['central', 'central_cod', 'distrito', 'nodo']);
        const pctHeader = findHeader(['fase_1_porcentaje', 'porcentaje_cumplimiento', 'cumplimiento', 'porcentaje', 'fase_1', '%']);

        if (!poligonoHeader || (!sigestHeader && !centralHeader)) {
          setErrorMsg(
            `No se pudieron detectar las columnas requeridas en el Excel. Encabezados detectados: [${headers.join(', ')}]. Se requiere al menos "sisvadi" / "sigest" y "poligono".`
          );
          setIsProcessing(false);
          return;
        }

        const mapByPair = new Map<string, ParsedRecord>();

        rawJson.forEach(row => {
          const sigest = String(row[sigestHeader || ''] || '').trim();
          const poligono = String(row[poligonoHeader || ''] || '').trim();
          const central = String(row[centralHeader || ''] || '').trim();
          const rawPct = pctHeader ? row[pctHeader] : null;

          let pct: number | null = null;
          if (rawPct !== '' && rawPct !== null && rawPct !== undefined) {
            const parsedNum = Number(String(rawPct).replace('%', '').trim());
            if (!isNaN(parsedNum)) {
              pct = parsedNum;
            }
          }

          if (poligono) {
            const key = `${sigest}_${poligono}_${central}`;
            mapByPair.set(key, {
              sigest,
              poligono,
              central,
              porcentaje_cumplimiento: pct,
              titulo: row['titulo'] || undefined,
              ejecutor: row['contrata_of'] || row['ejecutor'] || undefined
            });
          }
        });

        setParsedData(Array.from(mapByPair.values()));
      } catch (err: any) {
        console.error("Error reading Excel:", err);
        setErrorMsg("Error al leer el archivo Excel: " + (err.message || "Formato no válido"));
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsArrayBuffer(uploadedFile);
  };

  const handleApplyImport = async () => {
    if (parsedData.length === 0) return;
    setIsProcessing(true);
    try {
      const res = await repository.bulkUpdateCumplimiento(parsedData, createIfNotExists);
      setResults(res);
      onSuccess();
    } catch (err: any) {
      console.error("Error executing bulk import:", err);
      setErrorMsg("Error al procesar la actualización: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 shadow-2xl rounded-lg w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-bold tracking-tight">Importar % Cumplimiento desde Excel</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 text-xs text-slate-700 overflow-y-auto">
          {!file && (
            <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-lg p-6 text-center bg-slate-50/50 transition-colors">
              <Upload className="h-8 w-8 mx-auto text-emerald-600 mb-2" />
              <p className="font-bold text-slate-800 text-sm">Selecciona o arrastra tu archivo Excel</p>
              <p className="text-slate-500 text-xs mt-1">
                Soporta formatos <span className="font-mono font-bold text-slate-700">.xlsx, .xls, .csv</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-2 italic">
                Columnas requeridas: <strong className="text-slate-600">sisvadi (SIGEST), poligono, central, fase_1_porcentaje</strong>
              </p>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
                id="excel-file-input"
              />
              <label
                htmlFor="excel-file-input"
                className="inline-block mt-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded cursor-pointer transition-colors shadow-2xs"
              >
                Buscar Archivo
              </label>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {file && parsedData.length > 0 && !results && (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-900 block text-xs">📄 {file.name}</span>
                  <span className="text-[11px] text-emerald-700">
                    Se leyeron exitosamente <strong className="font-mono">{parsedData.length}</strong> proyectos / polígonos.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => resetState()}
                  className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
                >
                  Cambiar archivo
                </button>
              </div>

              <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={createIfNotExists}
                  onChange={(e) => setCreateIfNotExists(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-800 font-medium">
                  Crear nuevos proyectos en el catálogo si aún no existen en el sistema.
                </span>
              </label>

              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded text-[11px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 font-mono text-[10px]">
                      <th className="py-1 px-2">SIGEST (sisvadi)</th>
                      <th className="py-1 px-2">POLÍGONO</th>
                      <th className="py-1 px-2">CENTRAL</th>
                      <th className="py-1 px-2 text-right">% CUMPLIMIENTO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {parsedData.slice(0, 8).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-1 px-2 font-bold text-slate-900">{item.sigest || '-'}</td>
                        <td className="py-1 px-2 text-blue-700 font-bold">{item.poligono || '-'}</td>
                        <td className="py-1 px-2 text-slate-700">{item.central || '-'}</td>
                        <td className="py-1 px-2 text-right">
                          <span className="bg-blue-50 text-blue-900 font-bold px-1.5 py-0.2 rounded border border-blue-200">
                            {item.porcentaje_cumplimiento !== null ? `${item.porcentaje_cumplimiento}%` : '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 8 && (
                  <div className="text-center py-1 text-[10px] text-slate-400 bg-slate-50 italic">
                    ... y {parsedData.length - 8} filas más.
                  </div>
                )}
              </div>
            </div>
          )}

          {results && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded text-emerald-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span>¡Importación completada con éxito!</span>
              </div>
              <ul className="text-xs space-y-1 pl-7 list-disc">
                <li>Proyectos actualizados con nuevo % de cumplimiento: <strong className="font-mono">{results.updated}</strong></li>
                <li>Proyectos creados nuevos en la base de datos: <strong className="font-mono">{results.created}</strong></li>
                <li>Total de coincidencia en sistema: <strong className="font-mono">{results.matched}</strong></li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 transition-colors"
          >
            {results ? 'Cerrar' : 'Cancelar'}
          </button>

          {file && parsedData.length > 0 && !results && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleApplyImport}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {isProcessing ? 'Procesando...' : `Aplicar Importación (${parsedData.length} proyectos)`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
