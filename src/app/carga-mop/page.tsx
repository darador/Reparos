'use client';

import React, { useEffect, useState } from 'react';
import { MopImportHistoryTable } from '@/lib/../components/mop/MopImportHistoryTable';
import { MopImportPreviewModal } from '@/lib/../components/mop/MopImportPreviewModal';
import { mopService, MopImportPreview } from '@/lib/mop/service';
import { MopImportHistory } from '@/lib/types/database';
import { AlertCircle, ArrowRight, CheckCircle2, FileSpreadsheet, Layers, Network, ShieldAlert, UploadCloud } from 'lucide-react';
import Link from 'next/link';
import { getStoredAuthUser } from '@/lib/auth';

export default function CargaMopPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<MopImportPreview | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const [importErrorMsg, setImportErrorMsg] = useState<string | null>(null);

  const [history, setHistory] = useState<MopImportHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);

  const currentUser = getStoredAuthUser();

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    const hist = await mopService.getImportHistory();
    setHistory(hist);
    setIsLoadingHistory(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setImportErrorMsg('Por favor seleccione un archivo con formato Excel (.xlsx).');
      return;
    }

    setSelectedFile(file);
    setImportSuccessMsg(null);
    setImportErrorMsg(null);
    setIsValidating(true);

    try {
      const preview = await mopService.previewExcelImport(file);
      setPreviewData(preview);
      setIsPreviewModalOpen(true);
    } catch (err: any) {
      setImportErrorMsg(`Error al leer el archivo: ${err.message || 'Formato de archivo inválido.'}`);
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData) return;
    setIsConfirming(true);
    setImportErrorMsg(null);

    const res = await mopService.confirmExcelImport(previewData);

    setIsConfirming(false);

    if (res.success) {
      setIsPreviewModalOpen(false);
      setImportSuccessMsg(
        `Importación completada con éxito. Se procesaron ${previewData.totalFound} CTOs (${previewData.newCount} nuevas, ${previewData.updateCount} actualizadas, ${previewData.absentCount} cerradas por actualización).`
      );
      setSelectedFile(null);
      setPreviewData(null);
      await loadHistory();
    } else {
      setImportErrorMsg(res.error || 'Ocurrió un error al guardar los registros en Supabase.');
    }
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded shadow-2xs">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UploadCloud className="h-4 w-4 text-blue-600" />
            <span>Carga MOP — Importación y Sincronización Incremental</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Módulo exclusivo para usuarios autorizados. Carga masiva de CTOs respetando estados y observaciones existentes.
          </p>
        </div>

        <Link
          href="/pendiente-mop"
          className="inline-flex items-center gap-1.5 text-xs text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded font-semibold border border-slate-300 transition-colors shrink-0"
        >
          <Network className="h-3.5 w-3.5" />
          <span>Ver Pendiente MOP</span>
        </Link>
      </div>

      {/* Mensajes de éxito / error */}
      {importSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{importSuccessMsg}</span>
          </div>
          <Link
            href="/pendiente-mop"
            className="inline-flex items-center gap-1 font-bold text-emerald-800 hover:text-emerald-950 underline shrink-0 ml-2"
          >
            <span>Ir a la tabla de Pendiente MOP</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {importErrorMsg && (
        <div className="bg-red-50 border border-red-300 text-red-900 p-3 rounded text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{importErrorMsg}</span>
        </div>
      )}

      {/* Zona de Carga de Archivo */}
      <div className="bg-white border border-slate-200 rounded p-5 shadow-2xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Seleccionar archivo Excel MOP (.xlsx)</span>
          </h2>
          <p className="text-xs text-slate-500">
            El archivo debe contener las 5 pestañas oficiales y las columnas necesarias. El sistema validará la estructura antes de confirmar.
          </p>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/60 hover:bg-blue-50/20 rounded-lg p-8 text-center transition-all cursor-pointer relative group"
        >
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isValidating || isConfirming}
          />
          <UploadCloud className="h-10 w-10 text-slate-400 group-hover:text-blue-600 mx-auto mb-2 transition-colors" />
          <p className="font-bold text-xs text-slate-800 group-hover:text-blue-700">
            {isValidating
              ? 'Analizando y validando archivo...'
              : 'Arrastre el archivo Excel aquí o haga clic para examinar'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Formato admitido: .xlsx con las 5 pestañas de CTOs</p>
        </div>

        {/* Requisitos y Reglas de Importación */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-blue-600" />
              <span>5 Pestañas Requeridas en el Excel:</span>
            </span>
            <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5 pl-1">
              <li>Certifcar</li>
              <li>INstalar y Certificar</li>
              <li>Adelantar</li>
              <li>Dem Trab Ter</li>
              <li>Demorado</li>
            </ul>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
              <span>Garantía de Integridad Operativa:</span>
            </span>
            <ul className="text-[11px] text-slate-600 space-y-1 pl-1">
              <li>
                <strong>Identificación única:</strong> Sigest CTO + Polígono CTO + CTO.
              </li>
              <li>
                <strong>Conservación de datos:</strong> Una importación <u>NUNCA</u> sobrescribe el estado ni la observación de CTOs ya cargadas.
              </li>
              <li>
                <strong>Marcado de ausentes:</strong> Los registros que no figuren en la nueva carga se marcan como ausentes sin eliminarse.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Historial de Importaciones */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-2xs">
        <MopImportHistoryTable history={history} isLoading={isLoadingHistory} />
      </div>

      {/* Modal de Validación y Vista Previa (Etapa 1 y 2) */}
      <MopImportPreviewModal
        preview={previewData}
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        onConfirm={handleConfirmImport}
        isConfirming={isConfirming}
      />
    </div>
  );
}
