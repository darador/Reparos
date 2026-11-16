'use client';

import React from 'react';
import { MopImportHistory } from '@/lib/types/database';
import { formatDateTime } from '@/lib/utils';
import { CheckCircle2, Clock, FileSpreadsheet, History, User } from 'lucide-react';

interface MopImportHistoryTableProps {
  history: MopImportHistory[];
  isLoading?: boolean;
}

export function MopImportHistoryTable({ history, isLoading = false }: MopImportHistoryTableProps) {
  if (history.length === 0 && !isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded p-6 text-center text-slate-500 text-xs">
        <History className="h-6 w-6 mx-auto text-slate-400 mb-2" />
        <p className="font-semibold text-slate-700">No hay registros de importación previos</p>
        <p className="text-slate-400 mt-0.5">Los archivos importados se listarán aquí con sus métricas y auditoría.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
        <History className="h-4 w-4 text-blue-600" />
        <span>Historial de Importaciones MOP</span>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Fecha y Hora</th>
              <th>Usuario</th>
              <th>Archivo Excel</th>
              <th className="text-right">Total</th>
              <th className="text-right">Nuevas</th>
              <th className="text-right">Actualizadas</th>
              <th className="text-right">Ausentes</th>
              <th className="text-center">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item, index) => {
              const isEven = index % 2 === 0;

              return (
                <tr
                  key={item.id}
                  className={`${isEven ? 'bg-slate-50/70' : 'bg-white'} hover:bg-slate-100/60 border-b border-slate-100 transition-colors`}
                >
                  {/* Fecha y hora */}
                  <td className="font-mono text-slate-800 text-xs whitespace-nowrap">
                    {formatDateTime(item.created_at)}
                  </td>

                  {/* Usuario */}
                  <td>
                    <span className="inline-flex items-center gap-1 text-slate-800 font-semibold text-xs">
                      <User className="h-3 w-3 text-slate-400" />
                      <span>{item.created_by}</span>
                    </span>
                  </td>

                  {/* Archivo */}
                  <td>
                    <span className="inline-flex items-center gap-1 text-slate-900 font-medium font-mono text-xs">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate max-w-[200px]" title={item.filename}>
                        {item.filename}
                      </span>
                    </span>
                  </td>

                  {/* Total */}
                  <td className="text-right font-mono font-bold text-slate-900 text-xs">
                    {item.total_records}
                  </td>

                  {/* Nuevas */}
                  <td className="text-right font-mono text-emerald-700 font-bold text-xs">
                    +{item.new_records}
                  </td>

                  {/* Actualizadas */}
                  <td className="text-right font-mono text-blue-700 font-semibold text-xs">
                    {item.updated_records}
                  </td>

                  {/* Ausentes */}
                  <td className="text-right font-mono text-slate-500 font-medium text-xs">
                    {item.absent_records}
                  </td>

                  {/* Resultado */}
                  <td className="text-center">
                    {item.result_status === 'success' ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        <span>Completada</span>
                      </span>
                    ) : (
                      <span className="bg-red-100 text-red-800 border border-red-300 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                        Error
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
