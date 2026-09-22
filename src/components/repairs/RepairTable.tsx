'use client';

import { repository } from "@/lib/store/repository";
import { Repair } from "@/lib/types/database";
import { formatDate, formatDateTime } from "@/lib/utils";
import { AlertTriangle, ArrowRight, ArrowUpRight, Building2, ChevronDown, ChevronUp, Edit, History, Wrench } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { RepairFormModal, RESPONSABLES_INICIALES_LIST } from "./RepairFormModal";
import { StatusBadge } from "../shared/Badges";

interface RepairTableProps {
  repairs: Repair[];
  onLogEventClick?: (repair: Repair) => void;
  onRefresh?: () => void;
}

export function RepairTable({ repairs, onLogEventClick, onRefresh }: RepairTableProps) {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [repairToEdit, setRepairToEdit] = useState<Repair | null>(null);
  const [showCentralColumn, setShowCentralColumn] = useState<boolean>(true);

  if (repairs.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded p-8 text-center text-slate-500">
        <Wrench className="h-8 w-8 mx-auto text-slate-400 mb-2" />
        <p className="font-medium text-slate-700">No se encontraron reparos</p>
        <p className="text-xs text-slate-500 mt-1">Intente cambiar los filtros aplicados o cargue un nuevo reparo.</p>
      </div>
    );
  }

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleResponsibleChange = async (repairId: string, value: string) => {
    let finalResponsibleId: string | undefined = undefined;

    if (value && value !== '__UNASSIGNED__') {
      const activeParties = repository.getResponsibleParties();
      const existing = activeParties.find(r => r.name.toLowerCase() === value.trim().toLowerCase());
      if (existing) {
        finalResponsibleId = existing.id;
      } else {
        const newParty = await repository.addResponsibleParty(value.trim(), 'contractor');
        finalResponsibleId = newParty.id;
      }
    }

    await repository.updateRepairResponsible(repairId, finalResponsibleId);
    if (onRefresh) {
      onRefresh();
    } else {
      setExpandedIds(prev => ({ ...prev }));
    }
  };

  const handleUpdateRepair = async (data: any) => {
    if (repairToEdit) {
      await repository.updateRepair(repairToEdit.id, data);
      setRepairToEdit(null);
      if (onRefresh) onRefresh();
    }
  };

  // Get options list for responsible dropdown
  const activeParties = repository.getResponsibleParties();
  const partyNames = Array.from(new Set([
    ...RESPONSABLES_INICIALES_LIST,
    ...activeParties.map(p => p.name)
  ]));

  return (
    <div className="space-y-0">
      {/* Dynamic Columns Control Bar */}
      <div className="flex items-center justify-between bg-slate-50/90 px-3 py-1.5 border border-slate-200 border-b-0 rounded-t text-xs">
        <div className="flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5 text-blue-600" />
          <span className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider">Columnas Opcionales:</span>
          <button
            onClick={() => setShowCentralColumn(!showCentralColumn)}
            className={`px-2.5 py-0.5 rounded border text-[11px] font-semibold transition-colors flex items-center gap-1.5 shadow-2xs ${
              showCentralColumn
                ? 'bg-blue-50 text-blue-800 border-blue-300 font-bold'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
            }`}
            title="Mostrar u ocultar la columna Central en la tabla"
          >
            <span>Central</span>
            <span className="text-[10px] font-mono">{showCentralColumn ? '👁️ ON' : '🙈 OFF'}</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-400 font-mono">
          {showCentralColumn ? 'Central activada' : 'Central oculta'}
        </span>
      </div>

      <div className="data-table-container rounded-t-none">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-6"></th>
              <th className="whitespace-nowrap">SIGEST / Polígono</th>
              {showCentralColumn && <th className="whitespace-nowrap">CENTRAL</th>}
              <th className="whitespace-nowrap">TIPO</th>
              <th className="min-w-[280px] max-w-[460px]">DESCRIPCIÓN / SOLICITANTE</th>
              <th className="min-w-[160px]">RESPONSABLE</th>
              <th>ESTADO</th>
              <th className="whitespace-nowrap">REITERACIONES</th>
              <th className="whitespace-nowrap">INFORMADO</th>
              <th className="text-right whitespace-nowrap">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {repairs.map((repair, index) => {
              const hasReiterations = (repair.reiteration_count || 0) > 0;
              const isExpanded = !!expandedIds[repair.id];
              const events = isExpanded ? repository.getRepairEvents(repair.id) : [];
              const isEven = index % 2 === 0;

              const rowBgClass = hasReiterations
                ? "bg-amber-50/70 hover:bg-amber-100/70"
                : isExpanded
                ? "bg-blue-50/50"
                : isEven
                ? "bg-slate-50 hover:bg-blue-50/40"
                : "bg-white hover:bg-blue-50/40";

              const currentRespName = repair.current_responsible?.name || '__UNASSIGNED__';

              return (
                <React.Fragment key={repair.id}>
                  <tr className={`${rowBgClass} transition-colors border-b border-slate-200/80`}>
                    <td>
                      <button
                        onClick={() => toggleExpand(repair.id)}
                        className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-200/80 rounded transition-colors"
                        title={isExpanded ? "Ocultar hitos del historial" : "Desplegar hitos del historial"}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5 text-blue-600 font-bold" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                        )}
                      </button>
                    </td>
                    <td className="whitespace-nowrap">
                      {repair.project ? (
                        <Link
                          href={`/proyectos/${repair.project.id}`}
                          className="inline-flex items-center gap-1.5 font-mono group"
                          title={`Ver proyecto SIGEST: ${repair.project.sigest} | Polígono: ${repair.project.poligono}`}
                        >
                          <span className="font-black text-slate-900 text-sm tracking-tight group-hover:text-blue-600 transition-colors">
                            {repair.project.sigest}
                          </span>
                          <span className="text-slate-400 font-sans text-xs">/</span>
                          <span className="font-bold text-blue-700 bg-blue-50/90 border border-blue-200/90 px-2 py-0.5 rounded text-[13px] shadow-2xs group-hover:bg-blue-100 group-hover:border-blue-300 transition-colors">
                            {repair.project.poligono}
                          </span>
                        </Link>
                      ) : (
                        <span className="text-slate-400 font-mono text-xs">-</span>
                      )}
                    </td>

                    {/* Columna Opcional CENTRAL */}
                    {showCentralColumn && (
                      <td className="whitespace-nowrap">
                        {repair.project?.central ? (
                          <span className="font-bold text-slate-800 bg-slate-100 border border-slate-200/90 px-2 py-0.5 rounded text-[11px] font-mono">
                            {repair.project.central}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">-</span>
                        )}
                      </td>
                    )}

                    <td className="whitespace-nowrap">
                      <span className="font-medium text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[11px]">
                        {repair.repair_type?.name || 'Otro'}
                      </span>
                    </td>
                    
                    {/* Columna DESCRIPCION destacada */}
                    <td className="min-w-[280px] max-w-[460px] py-2 px-3">
                      <Link
                        href={`/reparos/${repair.id}`}
                        className="font-semibold text-slate-900 hover:text-blue-700 text-[13px] md:text-sm leading-snug block transition-colors"
                      >
                        {repair.description}
                      </Link>
                      {repair.solicitante && (
                        <div className="text-[11px] text-slate-500 mt-1 font-sans flex items-center gap-1">
                          <span className="text-slate-400">Sol:</span>
                          <span className="font-semibold text-slate-800 bg-slate-100/80 px-1.5 py-0.2 rounded border border-slate-200/60">
                            {repair.solicitante}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Columna RESPONSABLE con combo interactivo de fácil edición */}
                    <td className="min-w-[160px]">
                      <select
                        value={partyNames.includes(currentRespName) ? currentRespName : (repair.current_responsible ? '__CUSTOM_EXISTING__' : '__UNASSIGNED__')}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '__PROMPT_NEW__') {
                            const newName = prompt('Ingrese el nombre del nuevo Responsable:');
                            if (newName && newName.trim()) {
                              handleResponsibleChange(repair.id, newName.trim());
                            }
                          } else {
                            handleResponsibleChange(repair.id, val);
                          }
                        }}
                        className="w-full text-[11px] font-semibold text-slate-800 bg-white border border-slate-300 rounded px-2 py-1 shadow-2xs hover:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        title="Haz clic para cambiar el responsable de este reparo de forma rápida"
                      >
                        <option value="__UNASSIGNED__">-- Sin asignar --</option>
                        {partyNames.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                        {repair.current_responsible && !partyNames.includes(currentRespName) && (
                          <option value="__CUSTOM_EXISTING__">{currentRespName}</option>
                        )}
                        <option value="__PROMPT_NEW__">✍️ Escribir otro responsable...</option>
                      </select>
                    </td>

                    <td className="whitespace-nowrap">
                      <StatusBadge 
                        name={repair.current_status?.name} 
                        category={repair.current_status?.category} 
                      />
                    </td>
                    <td className="whitespace-nowrap">
                      {hasReiterations ? (
                        <div className="flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold w-fit">
                          <AlertTriangle className="h-3 w-3 text-red-600 shrink-0" />
                          <span>{repair.reiteration_count} reit.</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs font-mono">0</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap text-xs text-slate-600">
                      <div className="flex flex-col text-[11px]">
                        <span>{formatDate(repair.fecha_informado)}</span>
                      </div>
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setRepairToEdit(repair)}
                          className="inline-flex items-center gap-0.5 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded border border-slate-300 font-medium transition-colors"
                          title="Editar datos cargados del reparo"
                        >
                          <Edit className="h-3 w-3 text-blue-600" />
                          <span>Editar</span>
                        </button>

                        <button
                          onClick={() => toggleExpand(repair.id)}
                          className={`inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded border font-medium transition-colors ${
                            isExpanded
                              ? 'bg-blue-100 text-blue-900 border-blue-300 font-bold'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                          }`}
                          title="Desplegar hitos del historial de eventos"
                        >
                          <History className="h-3 w-3 text-slate-600" />
                          <span>Hitos {isExpanded ? '▲' : '▼'}</span>
                        </button>

                        {onLogEventClick && (
                          <button
                            onClick={() => onLogEventClick(repair)}
                            className="inline-flex items-center gap-0.5 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded border border-slate-300 font-medium transition-colors"
                            title="Registrar Acción / Evento"
                          >
                            <span>+ Acción</span>
                          </button>
                        )}
                        <Link
                          href={`/reparos/${repair.id}`}
                          className="inline-flex items-center gap-0.5 text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded border border-blue-200 font-medium transition-colors"
                        >
                          <span>Ver</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>

                  {/* Desplegable de Hitos (Expanded Row) */}
                  {isExpanded && (
                    <tr className="bg-slate-50/90 border-b border-slate-300">
                      <td colSpan={showCentralColumn ? 10 : 9} className="p-3">
                        <div className="bg-white border border-slate-300 rounded p-3 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                            <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                              <History className="h-3.5 w-3.5 text-blue-600" />
                              <span>Hitos del Historial del Reparo ({events.length} eventos)</span>
                            </span>
                            <Link
                              href={`/reparos/${repair.id}`}
                              className="text-[11px] text-blue-600 hover:underline font-medium"
                            >
                              Ver trazabilidad completa →
                            </Link>
                          </div>

                          {events.length === 0 ? (
                            <div className="text-slate-400 text-xs italic py-2 text-center">
                              Sin hitos o eventos registrados aún.
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-mono bg-slate-100/70">
                                    <th className="py-1 px-2 font-semibold">Fecha y Hora</th>
                                    <th className="py-1 px-2 font-semibold">Hito / Acción</th>
                                    <th className="py-1 px-2 font-semibold">Responsable</th>
                                    <th className="py-1 px-2 font-semibold">Estado</th>
                                    <th className="py-1 px-2 font-semibold">Usuario</th>
                                    <th className="py-1 px-2 font-semibold">Observación / Nota</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                                  {events.map((ev) => (
                                    <tr key={ev.id} className="hover:bg-slate-50">
                                      <td className="py-1.5 px-2 text-slate-600 whitespace-nowrap">
                                        {formatDateTime(ev.created_at)}
                                      </td>
                                      <td className="py-1.5 px-2 font-sans font-semibold text-slate-900 whitespace-nowrap">
                                        {ev.event_type === 'creation' && 'Reparo Creado'}
                                        {ev.event_type === 'assignment' && 'Asignación / Reasignación'}
                                        {ev.event_type === 'reclaim' && 'Reclamo Registrado'}
                                        {ev.event_type === 'response' && 'Respuesta Recibida'}
                                        {ev.event_type === 'follow_up' && 'Seguimiento Operativo'}
                                        {ev.event_type === 'derivation' && 'Derivación'}
                                        {ev.event_type === 'verification' && `Verificación (${ev.verification_result || 'registrada'})`}
                                        {ev.event_type === 'reiteration' && 'Reiteración'}
                                        {ev.event_type === 'resolution' && 'Reparo Resuelto'}
                                        {ev.event_type === 'closure' && 'Caso Cerrado'}
                                      </td>
                                      <td className="py-1.5 px-2 font-sans text-slate-800 whitespace-nowrap">
                                        {ev.new_responsible ? (
                                          <span className="flex items-center gap-1">
                                            {ev.previous_responsible && ev.previous_responsible.id !== ev.new_responsible.id && (
                                              <>
                                                <span className="text-slate-400 line-through">{ev.previous_responsible.name}</span>
                                                <ArrowRight className="h-3 w-3 text-slate-400" />
                                              </>
                                            )}
                                            <strong className="text-slate-900">{ev.new_responsible.name}</strong>
                                          </span>
                                        ) : (
                                          <em className="text-slate-400">Sin cambiar</em>
                                        )}
                                      </td>
                                      <td className="py-1.5 px-2 whitespace-nowrap">
                                        {ev.new_status ? (
                                          <StatusBadge name={ev.new_status.name} category={ev.new_status.category} />
                                        ) : (
                                          <em className="text-slate-400">Sin cambiar</em>
                                        )}
                                      </td>
                                      <td className="py-1.5 px-2 text-slate-600 whitespace-nowrap">
                                        {ev.created_by || 'Usuario Sistema'}
                                      </td>
                                      <td className="py-1.5 px-2 text-slate-700 font-sans max-w-[280px]">
                                        {ev.notes || '-'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit Repair Modal from Table */}
      {repairToEdit && (
        <RepairFormModal
          isOpen={!!repairToEdit}
          onClose={() => setRepairToEdit(null)}
          onSubmit={handleUpdateRepair}
          projects={repository.getProjects()}
          repairTypes={repository.getRepairTypes()}
          responsibleParties={repository.getResponsibleParties()}
          repairToEdit={repairToEdit}
        />
      )}
    </div>
  );
}
