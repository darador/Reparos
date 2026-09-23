'use client';

import { loginWithUsernameAndPassword } from '@/lib/auth';
import { Eye, EyeOff, HardHat, Loader2, Lock, User } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/reparos';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedUser = username.trim();
    if (!trimmedUser || !password) {
      setErrorMessage('Por favor complete el usuario y la contraseña.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await loginWithUsernameAndPassword(trimmedUser, password);
      if (res.success) {
        // Force full page navigation to update middleware cookies and app state
        window.location.href = redirectTo;
      } else {
        setErrorMessage(res.error || 'Usuario o contraseña incorrectos.');
      }
    } catch (err) {
      console.error("Login exception:", err);
      setErrorMessage('No fue posible iniciar sesión. Intentá nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 px-4">
        <div className="inline-flex items-center justify-center bg-blue-600 text-white p-3 rounded-xl shadow-lg border border-blue-500/30">
          <HardHat className="h-8 w-8" />
        </div>

        <h1 className="text-xl font-bold tracking-tight text-white uppercase font-mono">
          Sistema de Reparos FTTH
        </h1>
        <p className="text-xs text-slate-400">
          Trazabilidad Operacional y Seguimiento de Proyectos
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-slate-800/90 border border-slate-700/80 py-8 px-6 shadow-2xl rounded-xl sm:px-10 backdrop-blur-sm space-y-6">
          <div className="border-b border-slate-700/80 pb-4 text-center">
            <h2 className="text-lg font-bold text-slate-100">Iniciar sesión</h2>
            <p className="text-xs text-slate-400 mt-1">Ingrese sus credenciales de usuario interno</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="bg-red-950/80 border border-red-800/80 text-red-200 px-3.5 py-2.5 rounded-lg text-xs font-medium animate-in fade-in duration-150 flex items-center gap-2">
                <span className="shrink-0 text-red-400 font-bold">⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Campo Usuario */}
            <div className="space-y-1.5">
              <label htmlFor="username" className="block text-xs font-semibold text-slate-300">
                Usuario
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  disabled={isSubmitting}
                  placeholder="Nombre de usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-semibold text-slate-300">
                Contraseña
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-10 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Botón Ingresar */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-900 shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <span>Ingresar</span>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors font-medium hover:underline inline-flex items-center gap-1"
          >
            ← Volver al Dashboard Resumen Público
          </a>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 text-xs">
        Cargando formulario de acceso...
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}
