'use client';

import React from 'react';
import { useAuth } from '../lib/AuthContext';
import LoginWall from './LoginWall';

export default function AppAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#000033] flex flex-col items-center justify-center text-white space-y-4 font-sans select-none">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-300 font-semibold tracking-wide">
          Verificando sesión segura...
        </p>
      </div>
    );
  }

  if (!user) {
    return <LoginWall />;
  }

  return <>{children}</>;
}
