'use client';

import { Activity, Bell, HardHat, Search, User } from 'lucide-react';
import Link from 'next/link';

export function MainHeader() {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 px-4 py-2.5 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <Link href="/reparos" className="flex items-center gap-2 font-bold text-base text-slate-100 tracking-tight hover:text-white transition-colors">
          <div className="bg-blue-600 text-white p-1.5 rounded">
            <HardHat className="h-4 w-4" />
          </div>
          <span>FTTH REPAROS</span>
        </Link>
      </div>

      <div className="flex items-center gap-4 text-xs">
        <div className="hidden md:flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded px-2.5 py-1 text-slate-300">
          <Activity className="h-3.5 w-3.5 text-emerald-400" />
          <span>Trazabilidad activa</span>
          <span className="text-slate-500">|</span>
          <span className="font-mono text-slate-400">SIGEST + Polígono</span>
        </div>

        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="h-7 w-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden sm:block text-left">
            <div className="font-medium text-slate-200 text-xs">Dario (Gestión FTTH)</div>
            <div className="text-[10px] text-slate-400">Administrador de Operaciones</div>
          </div>
        </div>
      </div>
    </header>
  );
}
