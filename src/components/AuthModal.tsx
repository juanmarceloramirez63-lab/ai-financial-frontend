'use client';

import React, { useState } from 'react';
import { useAuth, UserRole } from '../lib/AuthContext';
import { Lock, Mail, User, ShieldCheck, ArrowRight, Loader2, Sparkles, Building2, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export default function AuthModal({ isOpen }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          setErrorMsg(error.message === 'Invalid login credentials' 
            ? 'Credenciales incorrectas. Verifica tu correo y contraseña.' 
            : error.message);
        }
      } else {
        const { error } = await signUp(email, password, nombre, 'cliente');
        if (error) {
          setErrorMsg(error.message);
        } else {
          setSuccessMsg('¡Cuenta creada exitosamente! Puedes iniciar sesión ahora.');
          setMode('login');
        }
      }
    } catch (err: any) {
      setErrorMsg('Ocurrió un error inesperado al conectar con el servicio.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-md overflow-hidden bg-white border border-slate-200/80 shadow-2xl rounded-2xl">
        {/* Encabezado con degradado y branding */}
        <div className="px-6 pt-8 pb-6 text-center bg-gradient-to-b from-slate-900 to-slate-850 text-white relative">
          <div className="inline-flex items-center justify-center w-12 h-12 mb-3 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            Plataforma de Análisis Financiero
          </h2>
          <p className="mt-1 text-xs text-slate-300">
            Información contable y diagnósticos empresariales con IA (2016 – 2025)
          </p>

          {/* Selector de modo Login / Register */}
          <div className="flex p-1 mt-6 bg-slate-800/80 rounded-lg border border-slate-700/50">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                mode === 'login'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                mode === 'register'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Registrarse
            </button>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="flex items-start gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2 p-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block mb-1 text-xs font-bold text-slate-700">Nombre Completo</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block mb-1 text-xs font-bold text-slate-700">Correo Electrónico</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@empresa.com"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-xs font-bold text-slate-700">Contraseña</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verificando...</span>
              </>
            ) : mode === 'login' ? (
              <>
                <span>Ingresar al Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Crear Cuenta</span>
                <ShieldCheck className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-2 text-center">
            <span className="text-[11px] text-slate-400">
              Sistema protegido por Supabase Authentication & Encriptación SHA-256
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
