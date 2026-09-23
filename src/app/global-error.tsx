'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error caught:", error);
  }, [error]);

  return (
    <html lang="es">
      <body className="bg-slate-900 text-white min-h-screen flex items-center justify-center p-4 text-xs font-sans">
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl max-w-md w-full p-6 text-center space-y-4">
          <div className="bg-red-500/20 text-red-400 p-3 rounded-full w-12 h-12 mx-auto flex items-center justify-center border border-red-500/40">
            <AlertTriangle className="h-6 w-6" />
          </div>

          <div>
            <h1 className="text-base font-bold text-white">Error de Ejecución del Sistema</h1>
            <p className="text-slate-400 text-xs mt-1">
              Ha ocurrido una excepción cliente inesperada.
            </p>
          </div>

          {error?.message && (
            <div className="bg-slate-950 text-slate-300 p-3 rounded text-[11px] font-mono text-left overflow-x-auto border border-slate-800">
              <span className="text-red-400 font-bold block mb-1">Error:</span>
              <code>{error.message}</code>
            </div>
          )}

          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded text-xs transition-colors shadow-sm"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Recargar Sistema</span>
          </button>
        </div>
      </body>
    </html>
  );
}
