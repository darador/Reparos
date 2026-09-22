'use client';

import { cn } from '@/lib/utils';
import { AlertCircle, Clock, FolderGit2, LayoutDashboard, Settings, Wrench } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Inicio Operacional', icon: LayoutDashboard },
  { href: '/proyectos', label: 'Proyectos FTTH', icon: FolderGit2 },
  { href: '/reparos', label: 'Reparos e Incidencias', icon: Wrench },
  { href: '/pendientes', label: 'Tablero Resumen', icon: AlertCircle, badge: 'Urgente' },
  { href: '/configuracion/catalogos', label: 'Configuración Catálogos', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-45px)]">
      <div className="p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
        Navegación Principal
      </div>

      <nav className="flex-1 px-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-colors",
                isActive
                  ? "bg-slate-800 text-white font-semibold border-l-2 border-blue-500 pl-2.5"
                  : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-blue-400" : "text-slate-400")} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono font-medium">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800/80 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5 text-slate-400 mb-1">
          <Clock className="h-3 w-3" />
          <span className="font-semibold text-[10px] uppercase">Regla de Trazabilidad</span>
        </div>
        <div>Toda modificación conserva audit trail de responsable e historial de estados.</div>
      </div>
    </aside>
  );
}
