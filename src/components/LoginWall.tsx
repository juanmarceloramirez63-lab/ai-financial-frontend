'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, UserRole } from '../lib/AuthContext';
import { 
  Lock, Mail, User, ShieldCheck, ArrowRight, Loader2, 
  Building2, AlertCircle, KeyRound, CheckCircle2, RefreshCw, BarChart3, TrendingUp, Shield
} from 'lucide-react';

export default function LoginWall() {
  const { signIn, signUp, signInWithGoogle, resetPassword, updatePassword } = useAuth();
  
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'update_password'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const isReset = urlParams.get('reset') === 'true' || window.location.hash.includes('type=recovery');
      if (isReset) {
        setMode('update_password');
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          setErrorMsg(
            error.message === 'Invalid login credentials'
              ? 'Credenciales incorrectas. Verifica tu correo y contraseña.'
              : error.message
          );
        }
      } else if (mode === 'register') {
        const { error } = await signUp(email, password, nombre, 'cliente');
        if (error) {
          setErrorMsg(error.message);
        } else {
          setSuccessMsg('¡Cuenta registrada exitosamente! Puedes iniciar sesión.');
          setMode('login');
        }
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) {
          setErrorMsg(error.message);
        } else {
          setSuccessMsg('Te hemos enviado un enlace de recuperación a tu correo electrónico.');
        }
      } else if (mode === 'update_password') {
        if (newPassword !== confirmPassword) {
          setErrorMsg('Las contraseñas no coinciden.');
          setLoading(false);
          return;
        }
        if (newPassword.length < 6) {
          setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
          setLoading(false);
          return;
        }
        const { error } = await updatePassword(newPassword);
        if (error) {
          setErrorMsg(error.message);
        } else {
          setSuccessMsg('¡Contraseña actualizada con éxito! Redirigiendo...');
          setTimeout(() => {
            window.location.href = window.location.origin;
          }, 1500);
        }
      }
    } catch (err: any) {
      setErrorMsg('Ocurrió un error inesperado. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setErrorMsg(error.message || 'Error al iniciar sesión con Google.');
      }
    } catch (err: any) {
      setErrorMsg('No se pudo conectar con el servicio de autenticación de Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#000033] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans select-none">
      
      {/* Luces de fondo ambientales */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="w-full max-w-md bg-[#000022]/95 border border-[#4fc3f7]/30 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl z-10">
        
        {/* ENCABEZADO */}
        <div className="p-8 text-center bg-gradient-to-b from-[#0a192f] to-[#000022] border-b border-slate-800 relative">
          <div className="flex justify-center mb-4">
            <img 
              src="/logo_ratio.png" 
              alt="Ratio CE Logo" 
              className="h-28 w-auto object-contain drop-shadow-md"
            />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Acceso Seguro Restringido</span>
          </div>

          <h1 className="text-xl font-black text-white tracking-tight">
            Plataforma de Análisis Financiero
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Auditoría contable, benchmarking y diagnósticos con IA
          </p>

          {/* SELECTOR DE PESTAÑAS */}
          {mode !== 'update_password' && (
            <div className="grid grid-cols-2 p-1 mt-6 bg-[#112240] rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(null); setSuccessMsg(null); }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  mode === 'login'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setErrorMsg(null); setSuccessMsg(null); }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  mode === 'register'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Registrarse
              </button>
            </div>
          )}
        </div>

        {/* CUERPO DEL FORMULARIO */}
        <div className="p-8 space-y-5">
          
          {/* BOTÓN DE GOOGLE OAUTH */}
          {mode !== 'update_password' && (
            <div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 border border-slate-300 disabled:opacity-60 cursor-pointer active:scale-98"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Continuar con Google</span>
              </button>

              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-slate-800"></div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">o con tu correo</span>
                <div className="flex-1 h-px bg-slate-800"></div>
              </div>
            </div>
          )}

          {/* ALERTAS DE ERROR / ÉXITO */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 text-xs text-rose-300 bg-rose-950/60 border border-rose-800/80 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2.5 p-3.5 text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-800/80 rounded-xl">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* MODO REGISTRO: NOMBRE COMPLETO */}
            {mode === 'register' && (
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-300">Nombre Completo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Juan Marcelo Ramírez"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#112240] border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            {/* CORREO ELECTRÓNICO (LOGIN / REGISTER / FORGOT) */}
            {mode !== 'update_password' && (
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-300">Correo Electrónico</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@empresa.com"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#112240] border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            {/* CONTRASEÑA (LOGIN / REGISTER) */}
            {(mode === 'login' || mode === 'register') && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300">Contraseña</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setErrorMsg(null); setSuccessMsg(null); }}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
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
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#112240] border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            {/* RESTABLECER CONTRASEÑA (MODO UPDATE_PASSWORD) */}
            {mode === 'update_password' && (
              <>
                <div className="text-center pb-2">
                  <KeyRound className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                  <h3 className="text-sm font-bold text-white">Establecer Nueva Contraseña</h3>
                  <p className="text-xs text-slate-400">Ingresa tu nueva contraseña para ingresar al sistema.</p>
                </div>

                <div>
                  <label className="block mb-1.5 text-xs font-bold text-slate-300">Nueva Contraseña</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#112240] border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1.5 text-xs font-bold text-slate-300">Confirmar Contraseña</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite tu nueva contraseña"
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#112240] border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            {/* BOTÓN SUBMIT PRINCIPAL */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-98"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : mode === 'login' ? (
                <>
                  <span>Ingresar a la Plataforma</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : mode === 'register' ? (
                <>
                  <span>Crear Cuenta</span>
                  <ShieldCheck className="w-4 h-4" />
                </>
              ) : mode === 'forgot' ? (
                <>
                  <span>Enviar Enlace de Recuperación</span>
                  <Mail className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Guardar Contraseña y Acceder</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>

            {/* VOLVER A LOGIN EN MODO FORGOT */}
            {mode === 'forgot' && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setErrorMsg(null); setSuccessMsg(null); }}
                  className="text-xs text-slate-400 hover:text-white font-medium underline cursor-pointer"
                >
                  ← Volver a Iniciar Sesión
                </button>
              </div>
            )}
          </form>

          {/* PIE DE PÁGINA DE SEGURIDAD */}
          <div className="pt-4 border-t border-slate-800/80 text-center">
            <p className="text-[10px] text-slate-500">
              🔒 Acceso protegido por Supabase Authentication & Encriptación SHA-256
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
