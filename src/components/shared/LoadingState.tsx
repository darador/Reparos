'use client';

import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  title?: string;
  message?: string;
}

export function LoadingState({
  title = "Cargando datos...",
  message = "Sincronizando información en tiempo real con Supabase. Por favor aguarde un instante."
}: LoadingStateProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-10 text-center shadow-2xs space-y-3 my-4 animate-in fade-in duration-200">
      <div className="inline-flex items-center justify-center p-3 bg-blue-50 text-blue-600 rounded-full animate-spin">
        <Loader2 className="h-6 w-6" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">{message}</p>
      </div>
    </div>
  );
}
