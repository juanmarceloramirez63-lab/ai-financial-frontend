'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth, UserProfile, UserRole, UserStatus } from '../lib/AuthContext';
import { 
  Users, Shield, X, Check, Search, Plus, 
  Trash2, Edit3, KeyRound, Building, RefreshCw, AlertCircle 
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserManagementModal({ isOpen, onClose }: UserManagementModalProps) {
  const { isSuperAdmin, user: currentUser } = useAuth();
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('cliente');
  const [editStatus, setEditStatus] = useState<UserStatus>('activo');
  const [editNits, setEditNits] = useState<string>('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('perfiles_usuarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando usuarios:', error);
      } else if (data) {
        setUsersList(data as UserProfile[]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isSuperAdmin) {
      fetchUsers();
    }
  }, [isOpen, isSuperAdmin]);

  if (!isOpen || !isSuperAdmin) return null;

  const handleEditClick = (u: UserProfile) => {
    setEditingUser(u);
    setEditRole(u.rol);
    setEditStatus(u.estado);
    setEditNits((u.nits_permitidos || []).join(', '));
    setFeedbackMsg(null);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    setSaveLoading(true);
    setFeedbackMsg(null);

    const nitsArray = editNits
      .split(',')
      .map(n => n.trim())
      .filter(n => n.length > 0);

    try {
      const { error } = await supabase
        .from('perfiles_usuarios')
        .update({
          rol: editRole,
          estado: editStatus,
          nits_permitidos: nitsArray,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingUser.id);

      if (error) {
        setFeedbackMsg({ type: 'error', text: `Error al actualizar: ${error.message}` });
      } else {
        setFeedbackMsg({ type: 'success', text: 'Usuario actualizado con éxito.' });
        await fetchUsers();
        setTimeout(() => {
          setEditingUser(null);
          setFeedbackMsg(null);
        }, 1200);
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'Error inesperado.' });
    } finally {
      setSaveLoading(false);
    }
  };

  const filteredUsers = usersList.filter(u => {
    const q = search.toLowerCase();
    return (
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.nombre_completo && u.nombre_completo.toLowerCase().includes(q)) ||
      (u.rol && u.rol.toLowerCase().includes(q))
    );
  });

  const getRoleBadge = (rol: UserRole) => {
    switch (rol) {
      case 'super_admin':
        return <span className="px-2 py-0.5 text-[10px] font-black tracking-wide uppercase bg-purple-100 text-purple-800 rounded-full border border-purple-200">👑 Super Admin</span>;
      case 'analista':
        return <span className="px-2 py-0.5 text-[10px] font-black tracking-wide uppercase bg-blue-100 text-blue-800 rounded-full border border-blue-200">💼 Analista</span>;
      case 'cliente':
        return <span className="px-2 py-0.5 text-[10px] font-black tracking-wide uppercase bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">🏢 Cliente</span>;
      case 'demo':
        return <span className="px-2 py-0.5 text-[10px] font-black tracking-wide uppercase bg-amber-100 text-amber-800 rounded-full border border-amber-200">👀 Demo</span>;
    }
  };

  const getStatusBadge = (estado: UserStatus) => {
    switch (estado) {
      case 'activo':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">Activo</span>;
      case 'bloqueado':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-700 rounded-full border border-rose-200">Bloqueado</span>;
      case 'inactivo':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-full border border-slate-200">Inactivo</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white border border-slate-200/90 shadow-2xl rounded-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/30 text-indigo-400 rounded-lg border border-indigo-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                Panel de Super Administrador: Gestión de Usuarios
              </h2>
              <p className="text-[11px] text-slate-400">
                Control de perfiles, niveles de acceso y empresas autorizadas por usuario
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por correo, nombre o rol..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">Cargando lista de usuarios...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">No se encontraron usuarios registrados.</div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase bg-slate-50">
                  <th className="py-2.5 px-3">Usuario / Correo</th>
                  <th className="py-2.5 px-3">Rol Asignado</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3">NITs Permitidos</th>
                  <th className="py-2.5 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-all">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{u.nombre_completo || 'Sin nombre'}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                    </td>
                    <td className="py-3 px-3">{getRoleBadge(u.rol)}</td>
                    <td className="py-3 px-3">{getStatusBadge(u.estado)}</td>
                    <td className="py-3 px-3">
                      {u.rol === 'super_admin' || u.rol === 'analista' ? (
                        <span className="text-[11px] font-bold text-indigo-600">Acceso Total (35K+ NITs)</span>
                      ) : (u.nits_permitidos && u.nits_permitidos.length > 0) ? (
                        <span className="text-[11px] font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {u.nits_permitidos.length} empresa(s)
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Sin NITs asignados</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleEditClick(u)}
                        className="px-2.5 py-1 text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg transition-all"
                      >
                        Editar Rol
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Editar Usuario */}
        {editingUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-indigo-600" />
                  <span>Editar Usuario</span>
                </h3>
                <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {feedbackMsg && (
                <div className={`p-2.5 text-xs rounded-lg border ${
                  feedbackMsg.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {feedbackMsg.text}
                </div>
              )}

              <div>
                <span className="text-xs text-slate-500">Correo del Usuario:</span>
                <p className="font-bold text-xs text-slate-900 font-mono">{editingUser.email}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nivel de Acceso (Rol):</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="super_admin">👑 Super Administrador (Acceso Total + Control)</option>
                  <option value="analista">💼 Analista Financiero (Acceso a todas las empresas)</option>
                  <option value="cliente">🏢 Cliente / Empresa (Solo sus NITs asignados)</option>
                  <option value="demo">👀 Demo / Prueba (Acceso demostrativo)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Estado de la Cuenta:</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as UserStatus)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="activo">🟢 Activo (Permite el acceso)</option>
                  <option value="bloqueado">🔴 Bloqueado (Acceso denegado)</option>
                  <option value="inactivo">⚪ Inactivo</option>
                </select>
              </div>

              {editRole === 'cliente' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NITs Permitidos (Separados por coma):
                  </label>
                  <input
                    type="text"
                    value={editNits}
                    onChange={(e) => setEditNits(e.target.value)}
                    placeholder="Ej. 800000313, 900123456"
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    El cliente solo podrá ver y descargar estados financieros de estos NITs.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={saveLoading}
                  onClick={handleSaveUser}
                  className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {saveLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
