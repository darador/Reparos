'use client';

import React, { useState } from 'react';
import { MopCto, MopStatus } from '@/lib/types/database';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Edit3, Eye, Lock, MessageSquare, Radio, Archive } from 'lucide-react';
import { mopService } from '@/lib/mop/service';

interface MopTableProps {
  ctos: MopCto[];
  totalRecords: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  onSortChange: (column: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
  viewMode?: 'vigentes' | 'cerradas';
  canEdit?: boolean;
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

export function MopTable({
  ctos,
  totalRecords,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sortColumn,
  sortDirection,
  onSortChange,
  onRefresh,
  isLoading = false,
  viewMode = 'vigentes',
  canEdit = false
}: MopTableProps) {
  // Modal / Edición de Observación
  const [editingObservacionCto, setEditingObservacionCto] = useState<MopCto | null>(null);
  const [observacionText, setObservacionText] = useState<string>('');
  const [isSavingObs, setIsSavingObs] = useState<boolean>(false);

  // Estado de actualización de estado
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const handleOpenObservacion = (cto: MopCto) => {
    setEditingObservacionCto(cto);
    setObservacionText(cto.observacion || '');
  };

  const handleSaveObservacion = async () => {
    if (!canEdit || !editingObservacionCto) return;
    setIsSavingObs(true);
    await mopService.updateMopObservacion(editingObservacionCto.id, observacionText);
    setIsSavingObs(false);
    setEditingObservacionCto(null);
    onRefresh();
  };

  const handleChangeStatus = async (cto: MopCto, newStatus: MopStatus) => {
    if (!canEdit) return;
    if (cto.estado === newStatus) return;
    setUpdatingStatusId(cto.id);
    await mopService.updateMopStatus(cto.id, newStatus);
    setUpdatingStatusId(null);
    onRefresh();
  };

  const totalPages = Math.ceil(totalRecords / pageSize) || 1;

  const renderSortHeader = (column: string, label: string, className: string = '') => {
    const isActive = sortColumn === column;
    return (
      <th
        onClick={() => onSortChange(column)}
        className={`cursor-pointer select-none group hover:bg-slate-200/80 transition-colors ${className}`}
        title={`Ordenar por ${label}`}
      >
        <div className="flex items-center gap-1 font-semibold">
          <span>{label}</span>
          {!isActive && <ArrowUpDown className="h-3 w-3 text-slate-400 group-hover:text-slate-600 transition-colors" />}
          {isActive && sortDirection === 'asc' && <ArrowUp className="h-3.5 w-3.5 text-blue-600 font-bold" />}
          {isActive && sortDirection === 'desc' && <ArrowDown className="h-3.5 w-3.5 text-blue-600 font-bold" />}
        </div>
      </th>
    );
  };

  const getStatusBadgeClass = (status: MopStatus) => {
    switch (status) {
      case 'PENDIENTE':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'COMPLETADO':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'CON REPARO':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  if (ctos.length === 0 && !isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded p-8 text-center text-slate-500">
        {viewMode === 'cerradas' ? (
          <>
            <Archive className="h-8 w-8 mx-auto text-slate-400 mb-2" />
            <p className="font-medium text-slate-700">No hay registros cerrados por actualización</p>
            <p className="text-xs text-slate-500 mt-1">
              Todas las CTOs importadas se encuentran actualmente vigentes en el último archivo de Excel.
            </p>
          </>
        ) : (
          <>
            <Radio className="h-8 w-8 mx-auto text-slate-400 mb-2" />
            <p className="font-medium text-slate-700">No se encontraron registros de CTO vigentes</p>
            <p className="text-xs text-slate-500 mt-1">
              Intente ajustar los filtros de búsqueda o cargue un archivo Excel desde la sección de Carga MOP.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            {viewMode === 'cerradas' ? (
              <tr>
                {/* 1. Sigest CTO / Polígono */}
                {renderSortHeader('sigest', '1. Sigest CTO / Polígono', 'min-w-[150px]')}
                {/* 2. Central */}
                {renderSortHeader('central', '2. Central', 'min-w-[100px]')}
                {/* 3. CTO */}
                {renderSortHeader('cto', '3. CTO', 'min-w-[90px]')}
                {/* 4. Responsable CTO */}
                {renderSortHeader('responsable', '4. Responsable CTO', 'min-w-[130px]')}
                {/* 5. Último Estado Operativo */}
                {renderSortHeader('estado', '5. Último Estado Operativo', 'min-w-[140px]')}
                {/* 6. Fecha Cierre por Actualización */}
                {renderSortHeader('fecha_cierre', '6. Fecha Cierre por Actualización', 'min-w-[160px]')}
                {/* 7. Última Aparición en Excel */}
                {renderSortHeader('fecha_ultima_aparicion', '7. Última Aparición en Excel', 'min-w-[160px]')}
                {/* 8. Observación */}
                <th className="min-w-[180px]">8. Observación</th>
              </tr>
            ) : (
              <tr>
                {/* 1. Sigest CTO / Polígono */}
                {renderSortHeader('sigest', '1. Sigest CTO / Polígono', 'min-w-[150px]')}
                {/* 2. Central */}
                {renderSortHeader('central', '2. Central', 'min-w-[100px]')}
                {/* 3. CTO */}
                {renderSortHeader('cto', '3. CTO', 'min-w-[90px]')}
                {/* 4. Pelo */}
                <th>4. Pelo</th>
                {/* 5. Instalación CTO (TOA) */}
                <th>5. Instalación CTO (TOA)</th>
                {/* 6. Certificación CTO (TOA) */}
                <th>6. Certificación CTO (TOA)</th>
                {/* 7. Responsable CTO */}
                {renderSortHeader('responsable', '7. Responsable CTO', 'min-w-[130px]')}
                {/* 8. Estado */}
                {renderSortHeader('estado', canEdit ? '8. Estado' : '8. Estado (Solo lectura)', 'min-w-[140px]')}
                {/* 9. Observación */}
                <th className="min-w-[180px]">9. Observación</th>
              </tr>
            )}
          </thead>
          <tbody>
            {ctos.map((cto, index) => {
              const isEven = index % 2 === 0;
              const isUpdating = updatingStatusId === cto.id;

              if (viewMode === 'cerradas') {
                return (
                  <tr
                    key={cto.id}
                    className={`${
                      isEven ? 'bg-slate-50/70 hover:bg-slate-100/60' : 'bg-white hover:bg-slate-100/60'
                    } transition-colors border-b border-slate-100`}
                  >
                    {/* 1. Sigest / Polígono */}
                    <td>
                      <div className="flex items-center gap-1 font-mono">
                        <span className="font-extrabold text-slate-900 text-xs tracking-tight">
                          {cto.sigest}
                        </span>
                        <span className="text-slate-300 font-sans text-xs">/</span>
                        <span className="font-bold text-slate-700 bg-slate-100 border border-slate-200 px-1 py-0.2 rounded text-[11px] shadow-2xs">
                          {cto.poligono}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-sans">
                        Pestaña: <span className="font-medium text-slate-600">{cto.categoria_origen}</span>
                      </div>
                    </td>

                    {/* 2. Central */}
                    <td className="font-medium text-slate-800">
                      {cto.central || '-'}
                    </td>

                    {/* 3. CTO */}
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold font-mono text-slate-900 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-xs">
                          {cto.cto}
                        </span>
                        <span
                          className="inline-flex items-center gap-0.5 bg-slate-200 text-slate-700 text-[10px] font-semibold px-1 py-0.2 rounded"
                          title="Cerrada por actualización (ausente en último Excel)"
                        >
                          <Archive className="h-2.5 w-2.5" />
                          <span>Cerrado</span>
                        </span>
                      </div>
                    </td>

                    {/* 4. Responsable CTO */}
                    <td>
                      {cto.responsable_cto ? (
                        <span className="font-semibold text-slate-800 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-xs">
                          {cto.responsable_cto}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Sin asignar</span>
                      )}
                    </td>

                    {/* 5. Último Estado Operativo (badge conservado) */}
                    <td>
                      <span
                        className={`inline-block text-xs font-bold py-0.5 px-2 rounded border shadow-2xs ${getStatusBadgeClass(
                          cto.estado
                        )}`}
                        title="Último estado operativo registrado antes del cierre"
                      >
                        {cto.estado}
                      </span>
                    </td>

                    {/* 6. Fecha Cierre por Actualización */}
                    <td className="text-xs font-mono text-slate-700">
                      {formatDateTime(cto.fecha_cierre_actualizacion || cto.updated_at)}
                    </td>

                    {/* 7. Última Aparición en Excel */}
                    <td className="text-xs font-mono text-slate-600">
                      {formatDateTime(cto.fecha_ultima_aparicion)}
                    </td>

                    {/* 8. Observación */}
                    <td>
                      <div className="flex items-center justify-between gap-1 max-w-[240px]">
                        <span
                          className={`text-xs truncate ${
                            cto.observacion ? 'text-slate-800' : 'text-slate-400 italic'
                          } ${!canEdit && cto.observacion ? 'cursor-pointer hover:underline' : ''}`}
                          onClick={() => {
                            if (!canEdit && cto.observacion) {
                              handleOpenObservacion(cto);
                            }
                          }}
                          title={cto.observacion || 'Sin observación'}
                        >
                          {cto.observacion || 'Sin observación'}
                        </span>
                        {canEdit ? (
                          <button
                            onClick={() => handleOpenObservacion(cto)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-blue-600 transition-colors shrink-0 cursor-pointer"
                            title="Editar observación"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                        ) : cto.observacion ? (
                          <button
                            onClick={() => handleOpenObservacion(cto)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors shrink-0 cursor-pointer"
                            title="Ver observación completa"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              }

              // Vista de CTOs Vigentes (activas)
              return (
                <tr
                  key={cto.id}
                  className={`${
                    isEven ? 'bg-slate-50/70 hover:bg-blue-50/30' : 'bg-white hover:bg-blue-50/30'
                  } transition-colors border-b border-slate-100`}
                >
                  {/* 1. Sigest / Polígono */}
                  <td>
                    <div className="flex items-center gap-1 font-mono">
                      <span className="font-extrabold text-slate-900 text-xs tracking-tight">
                        {cto.sigest}
                      </span>
                      <span className="text-slate-300 font-sans text-xs">/</span>
                      <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1 py-0.2 rounded text-[11px] shadow-2xs">
                        {cto.poligono}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-sans">
                      Pestaña: <span className="font-medium text-slate-600">{cto.categoria_origen}</span>
                    </div>
                  </td>

                  {/* 2. Central */}
                  <td className="font-medium text-slate-800">
                    {cto.central || '-'}
                  </td>

                  {/* 3. CTO */}
                  <td>
                    <span className="font-bold font-mono text-slate-900 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-xs">
                      {cto.cto}
                    </span>
                  </td>

                  {/* 4. Pelo */}
                  <td className="font-mono text-slate-700 text-xs">
                    {cto.pelo || '-'}
                  </td>

                  {/* 5. Instalación CTO (TOA) */}
                  <td className="text-slate-700 text-xs">
                    {cto.instalacion_toa || '-'}
                  </td>

                  {/* 6. Certificación CTO (TOA) */}
                  <td className="text-slate-700 text-xs">
                    {cto.certificacion_toa || '-'}
                  </td>

                  {/* 7. Responsable CTO */}
                  <td>
                    {cto.responsable_cto ? (
                      <span className="font-semibold text-slate-800 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-xs">
                        {cto.responsable_cto}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs italic">Sin asignar</span>
                    )}
                  </td>

                  {/* 8. Estado (Editable si canEdit, Bloqueado si no) */}
                  <td>
                    {canEdit ? (
                      <select
                        value={cto.estado}
                        disabled={isUpdating}
                        onChange={(e) => handleChangeStatus(cto, e.target.value as MopStatus)}
                        className={`text-xs font-bold py-1 px-2 rounded border cursor-pointer transition-colors shadow-2xs focus:ring-1 focus:ring-blue-500 ${getStatusBadgeClass(
                          cto.estado
                        )} ${isUpdating ? 'opacity-50 cursor-wait' : ''}`}
                        title="Haz clic para modificar el estado de la CTO"
                      >
                        <option value="PENDIENTE">PENDIENTE</option>
                        <option value="COMPLETADO">COMPLETADO</option>
                        <option value="CON REPARO">CON REPARO</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-block text-xs font-bold py-1 px-2.5 rounded border shadow-2xs select-none cursor-default ${getStatusBadgeClass(
                          cto.estado
                        )}`}
                        title="Estado operativo (solo lectura: inicie sesión para modificar)"
                      >
                        {cto.estado}
                      </span>
                    )}
                  </td>

                  {/* 9. Observación */}
                  <td>
                    <div className="flex items-center justify-between gap-1 max-w-[240px]">
                      <span
                        className={`text-xs truncate ${
                          cto.observacion ? 'text-slate-800' : 'text-slate-400 italic'
                        } ${!canEdit && cto.observacion ? 'cursor-pointer hover:underline' : ''}`}
                        onClick={() => {
                          if (!canEdit && cto.observacion) {
                            handleOpenObservacion(cto);
                          }
                        }}
                        title={cto.observacion ? `${cto.observacion} (haz clic para ver completa)` : 'Sin observación'}
                      >
                        {cto.observacion || 'Sin observación'}
                      </span>
                      {canEdit ? (
                        <button
                          onClick={() => handleOpenObservacion(cto)}
                          className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-blue-600 transition-colors shrink-0 cursor-pointer"
                          title="Editar observación"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                      ) : cto.observacion ? (
                        <button
                          onClick={() => handleOpenObservacion(cto)}
                          className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors shrink-0 cursor-pointer"
                          title="Ver observación completa"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Barra de Paginación */}
      <div className="bg-white border border-slate-200 rounded px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span>
            Mostrando <strong>{ctos.length}</strong> de <strong>{totalRecords}</strong> registros
          </span>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5">
            <span>Filas por página:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="py-0.5 px-1.5 border border-slate-300 rounded text-xs bg-white text-slate-700"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span>
            Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
              className="p-1 border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition-colors"
              title="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || isLoading}
              className="p-1 border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition-colors"
              title="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de visualización o edición de observación */}
      {editingObservacionCto && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded border border-slate-300 shadow-xl max-w-md w-full p-4 space-y-3 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <span>
                  Observación de CTO: {editingObservacionCto.cto}
                  {!canEdit && <span className="ml-1 text-xs font-normal text-slate-500">(Solo lectura)</span>}
                </span>
              </div>
              <span className="text-xs font-mono text-slate-500">
                {editingObservacionCto.sigest} / {editingObservacionCto.poligono}
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Detalle operativo u observación:
              </label>
              <textarea
                value={observacionText}
                readOnly={!canEdit}
                onChange={(e) => canEdit && setObservacionText(e.target.value)}
                placeholder={canEdit ? "Escriba aquí los detalles operativos o aclaraciones para esta CTO..." : "Sin observación registrada."}
                rows={4}
                className={`w-full p-2 border border-slate-300 rounded text-xs ${
                  canEdit
                    ? "focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    : "bg-slate-50 text-slate-800 cursor-default"
                }`}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingObservacionCto(null)}
                disabled={isSavingObs}
                className="px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded border border-slate-300 transition-colors cursor-pointer"
              >
                {canEdit ? 'Cancelar' : 'Cerrar'}
              </button>
              {canEdit && (
                <button
                  type="button"
                  onClick={handleSaveObservacion}
                  disabled={isSavingObs}
                  className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors shadow-xs cursor-pointer"
                >
                  {isSavingObs ? 'Guardando...' : 'Guardar Observación'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
