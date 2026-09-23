'use client';

import { getStoredAuthUser, logoutUser } from '@/lib/auth';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { Activity, HardHat, LogIn, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function MainHeader() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ username: string; displayName: string } | null>(null);

  useEffect(() => {
    // Check local auth storage
    const stored = getStoredAuthUser();
    if (stored) {
      setCurrentUser(stored);
    }

    // Check Supabase Auth session asynchronously
    const supabase = createBrowserClient();
    if (supabase) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          const username = user.user_metadata?.username || user.email?.split('@')[0] || 'usuario';
          const displayName = user.user_metadata?.full_name || username;
          setCurrentUser({ username, displayName });
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          const username = session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'usuario';
          const displayName = session.user.user_metadata?.full_name || username;
          setCurrentUser({ username, displayName });
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    window.location.href = '/login';
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 px-4 py-2.5 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <Link
          href={currentUser ? "/reparos" : "/"}
          className="flex items-center gap-2 font-bold text-base text-slate-100 tracking-tight hover:text-white transition-colors"
        >
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

        {currentUser ? (
          <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 font-bold">
                <User className="h-4 w-4" />
              </div>
              <div className="hidden sm:block text-left">
                <div className="font-semibold text-slate-200 text-xs">
                  {currentUser.displayName}
                </div>
                <div className="text-[10px] text-slate-400">Usuario Interno</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 hover:text-red-400 bg-slate-800 hover:bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700 transition-colors"
              title="Cerrar sesión actual de la plataforma"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded transition-colors"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Iniciar sesión</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
