'use client';

import { getStoredAuthUser } from '@/lib/auth';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { AlertCircle, ChevronLeft, ChevronRight, FolderGit2, LayoutDashboard, LogIn, Settings, Wrench } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const PROTECTED_NAV_ITEMS = [
  { href: '/reparos', label: 'Reparos', icon: Wrench },
  { href: '/proyectos', label: 'Proyectos FTTH', icon: FolderGit2 },
  { href: '/pendientes', label: 'Tablero Resumen', icon: AlertCircle },
  { href: '/configuracion/catalogos', label: 'Configuración', icon: Settings },
];

const PUBLIC_NAV_ITEMS = [
  { href: '/', label: 'Tablero Resumen', icon: LayoutDashboard },
  { href: '/login', label: 'Iniciar Sesión', icon: LogIn },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getStoredAuthUser());

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sidebar_collapsed');
      if (saved === 'true') {
        setIsCollapsed(true);
      }
    } catch (e) {
      // Ignore
    }

    // Sync auth state
    const user = getStoredAuthUser();
    setIsAuthenticated(!!user);

    const supabase = createBrowserClient();
    if (supabase) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        setIsAuthenticated(!!user || !!getStoredAuthUser());
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        setIsAuthenticated(!!session?.user || !!getStoredAuthUser());
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    try {
      localStorage.setItem('sidebar_collapsed', String(nextState));
    } catch (e) {
      // Ignore storage errors
    }
  };

  const navItems = isAuthenticated ? PROTECTED_NAV_ITEMS : PUBLIC_NAV_ITEMS;

  return (
    <aside
      className={cn(
        "bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-45px)] transition-all duration-200 ease-in-out relative group",
        isCollapsed ? "w-14" : "w-48"
      )}
    >
      {/* Collapse Toggle Button */}
      <div className="p-2 border-b border-slate-800/80 flex items-center justify-between">
        {!isCollapsed && (
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1.5 whitespace-nowrap">
            Navegación
          </span>
        )}
        <button
          onClick={toggleCollapse}
          className={cn(
            "p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors",
            isCollapsed && "mx-auto"
          )}
          title={isCollapsed ? "Expandir menú lateral" : "Colapsar menú lateral para maximizar pantalla"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-blue-400" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-slate-400" />
          )}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-1.5 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 rounded text-xs font-medium transition-colors whitespace-nowrap",
                isActive
                  ? "bg-slate-800 text-white font-semibold border-l-2 border-blue-500 pl-2"
                  : "text-slate-300 hover:bg-slate-800/60 hover:text-white",
                isCollapsed && "justify-center px-0 py-2.5"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-blue-400" : "text-slate-400")} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer Toggle shortcut */}
      <div className="p-2 border-t border-slate-800/80 text-[10px] text-slate-500 text-center">
        {!isCollapsed ? (
          <button
            onClick={toggleCollapse}
            className="text-slate-400 hover:text-slate-200 text-[10px] flex items-center justify-center gap-1 w-full py-1 hover:bg-slate-800/50 rounded"
          >
            <ChevronLeft className="h-3 w-3" />
            <span>Minimizar Menú</span>
          </button>
        ) : (
          <button
            onClick={toggleCollapse}
            className="text-blue-400 hover:text-blue-300 p-1 flex justify-center w-full"
            title="Expandir menú"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
