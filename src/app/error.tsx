'use client';

import { AlertTriangle, RefreshCw, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Client Error Boundary caught error:", error);
  }, [error]);

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4 text-xs">
      <div className="bg-white border border-red-200 rounded-lg shadow-xl max-w-lg w-full p-6 text-center space-y-4">
        <div className="bg-red-50 text-red-600 p-3 rounded-full w-12 h-12 mx-auto flex items-center justify-center border border-red-200">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-900">Ocurrió un inconveniente al cargar la vista</h2>
          <p className="text-xs text-slate-500 mt-1">
            Se ha capturado un error en la aplicación. Podés reintentar la carga o regresar al listado principal.
          </p>
        </div>

        {error?.message && (
          <div className="bg-slate-900 text-slate-200 p-3 rounded text-[11px] font-mono text-left overflow-x-auto max-h-32 border border-slate-800">
            <span className="text-red-400 font-bold block mb-1">Detalle del error:</span>
            <code>{error.message}</code>
          </div>
        )}

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded text-xs transition-colors shadow-2xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reintentar</span>
          </button>

          <Link
            href="/reparos"
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-4 py-2 rounded text-xs border border-slate-300 transition-colors"
          >
            <Wrench className="h-3.5 w-3.5 text-slate-600" />
            <span>Ir a Reparos</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
