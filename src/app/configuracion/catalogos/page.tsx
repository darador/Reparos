'use client';

import { repository } from "@/lib/store/repository";
import { RepairStatus, RepairType, ResponsibleParty } from "@/lib/types/database";
import { Check, Plus, Settings, Shield, User, Wrench } from "lucide-react";
import { useState } from "react";

export default function CatalogsPage() {
  const [responsibleParties, setResponsibleParties] = useState<ResponsibleParty[]>(repository.getAllResponsibleParties());
  const [repairTypes, setRepairTypes] = useState<RepairType[]>(repository.getAllRepairTypes());
  const [repairStatuses, setRepairStatuses] = useState<RepairStatus[]>(repository.getRepairStatuses());

  // Form states
  const [newRespName, setNewRespName] = useState('');
  const [newRespType, setNewRespType] = useState<ResponsibleParty['type']>('contractor');
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDesc, setNewTypeDesc] = useState('');

  const handleAddResponsible = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRespName.trim()) return;
    repository.addResponsibleParty(newRespName.trim(), newRespType);
    setResponsibleParties(repository.getAllResponsibleParties());
    setNewRespName('');
  };

  const handleAddRepairType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    repository.addRepairType(newTypeName.trim(), newTypeDesc.trim() || undefined);
    setRepairTypes(repository.getAllRepairTypes());
    setNewTypeName('');
    setNewTypeDesc('');
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white p-3.5 border border-slate-200 rounded shadow-2xs">
        <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="h-4 w-4 text-slate-600" />
          <span>Gestión de Catálogos del Sistema</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Administración de tipos de reparo, responsables/contratistas y estados operacionales.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Catálogo de Responsables */}
        <div className="bg-white border border-slate-200 rounded p-4 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <User className="h-4 w-4 text-blue-600" />
              <span>Responsables y Contratistas</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">{responsibleParties.length} ítems</span>
          </div>

          <form onSubmit={handleAddResponsible} className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2 text-xs">
            <div className="font-semibold text-slate-800">Agregar Nuevo Responsable</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                required
                placeholder="Nombre (ej. Contratista XYZ)"
                value={newRespName}
                onChange={(e) => setNewRespName(e.target.value)}
                className="sm:col-span-2 px-2.5 py-1.5 border border-slate-300 rounded bg-white"
              />
              <select
                value={newRespType}
                onChange={(e) => setNewRespType(e.target.value as any)}
                className="px-2 py-1.5 border border-slate-300 rounded bg-white"
              >
                <option value="contractor">Contratista</option>
                <option value="engineering">Ingeniería</option>
                <option value="cto_team">Equipo CTO</option>
                <option value="redesign">Rediseño</option>
                <option value="other">Otro</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 rounded transition-colors"
            >
              + Guardar Responsable
            </button>
          </form>

          <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
            {responsibleParties.map((resp) => (
              <div key={resp.id} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded text-xs">
                <span className="font-medium text-slate-900">{resp.name}</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono uppercase">
                  {resp.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Catálogo de Tipos de Reparo */}
        <div className="bg-white border border-slate-200 rounded p-4 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Wrench className="h-4 w-4 text-amber-600" />
              <span>Tipos de Reparo</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">{repairTypes.length} tipos</span>
          </div>

          <form onSubmit={handleAddRepairType} className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2 text-xs">
            <div className="font-semibold text-slate-800">Agregar Nuevo Tipo de Reparo</div>
            <input
              type="text"
              required
              placeholder="Nombre del tipo (ej. Falta empalme)"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
            />
            <input
              type="text"
              placeholder="Descripción opcional..."
              value={newTypeDesc}
              onChange={(e) => setNewTypeDesc(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
            />
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 rounded transition-colors"
            >
              + Guardar Tipo de Reparo
            </button>
          </form>

          <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
            {repairTypes.map((t) => (
              <div key={t.id} className="p-2 bg-slate-50 border border-slate-200 rounded text-xs space-y-0.5">
                <div className="font-medium text-slate-900">{t.name}</div>
                {t.description && <div className="text-[11px] text-slate-500">{t.description}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Catálogo de Estados */}
      <div className="bg-white border border-slate-200 rounded p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-emerald-600" />
            <span>Estados del Reparo (Secuencia Operacional)</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {repairStatuses.map((st) => (
            <div key={st.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded text-center text-xs space-y-1">
              <span className="text-[10px] font-mono text-slate-400 block">Orden #{st.order_index}</span>
              <span className="font-bold text-slate-900 block">{st.name}</span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono uppercase inline-block">
                Categoría: {st.category}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
