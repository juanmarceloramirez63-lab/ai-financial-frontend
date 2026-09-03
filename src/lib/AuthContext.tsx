'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { User, Session } from '@supabase/supabase-js';

export type UserRole = 'super_admin' | 'analista' | 'cliente' | 'demo';
export type UserStatus = 'activo' | 'inactivo' | 'bloqueado';

export interface UserProfile {
  id: string;
  email: string;
  nombre_completo: string | null;
  rol: UserRole;
  estado: UserStatus;
  nits_permitidos: string[];
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isSuperAdmin: boolean;
  isAnalista: boolean;
  isCliente: boolean;
  signIn: (email: string, pass: string) => Promise<{ error: any }>;
  signUp: (email: string, pass: string, nombre: string, rol?: UserRole) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  isSuperAdmin: false,
  isAnalista: false,
  isCliente: false,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, userEmail: string) => {
    try {
      const { data, error } = await supabase
        .from('perfiles_usuarios')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Perfil no existe aún, crearlo por defecto
        const defaultProfile: UserProfile = {
          id: userId,
          email: userEmail,
          nombre_completo: userEmail.split('@')[0],
          rol: userEmail.includes('admin') || userEmail.includes('juan') ? 'super_admin' : 'cliente',
          estado: 'activo',
          nits_permitidos: []
        };
        await supabase.from('perfiles_usuarios').insert([defaultProfile]);
        setProfile(defaultProfile);
      } else if (data) {
        setProfile(data as UserProfile);
      }
    } catch (err) {
      console.error('Error cargando perfil:', err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id, session.user.email || '');
        }
      } catch (e) {
        console.error('Error inicializando auth:', e);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id, session.user.email || '');
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, pass: string) => {
    const res = await supabase.auth.signInWithPassword({
      email,
      password: pass
    });
    if (!res.error && res.data.user) {
      await fetchProfile(res.data.user.id, res.data.user.email || '');
    }
    return { error: res.error };
  };

  const signUp = async (email: string, pass: string, nombre: string, rol: UserRole = 'cliente') => {
    const res = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          nombre_completo: nombre,
          rol: rol
        }
      }
    });
    return { error: res.error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user.email || '');
    }
  };

  const isSuperAdmin = profile?.rol === 'super_admin';
  const isAnalista = profile?.rol === 'analista' || isSuperAdmin;
  const isCliente = profile?.rol === 'cliente';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isSuperAdmin,
        isAnalista,
        isCliente,
        signIn,
        signUp,
        signOut,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
