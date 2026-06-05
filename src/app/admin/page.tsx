'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in: string | null;
  role: 'super_admin' | 'user';
  subscription_status: 'active' | 'pending' | 'cancelled';
  seo_allowed: boolean;
  monthly_allowance: number;
  clients: string[];
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending' | 'cancelled'>('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState('');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      setCurrentUserEmail(session.user.email || '');

      // Verificar se é super_admin
      const res = await fetch('/api/auth/subscription', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const data = await res.json();

      if (data.role !== 'super_admin') {
        router.push('/');
        return;
      }
      setAuthorized(true);
      await loadUsers(session.access_token);
      setLoading(false);
    };
    init();
  }, []);

  const loadUsers = async (token?: string) => {
    let t = token;
    if (!t) {
      const { data: { session } } = await supabase.auth.getSession();
      t = session?.access_token;
    }
    const res = await fetch('/api/admin/users', {
      headers: { Authorization: `Bearer ${t}` }
    });
    const data = await res.json();
    if (data.users) setUsers(data.users);
  };

  const patchUser = async (userId: string, patch: Partial<Pick<AdminUser, 'subscription_status' | 'seo_allowed' | 'role'>>) => {
    setUpdating(userId);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ userId, ...patch })
    });
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...patch } : u));
      showToast('Atualizado com sucesso!');
    } else {
      showToast('Erro ao atualizar usuário.', 'error');
    }
    setUpdating(null);
  };

  const deleteUser = async (userId: string) => {
    setUpdating(userId);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`/api/admin/users?userId=${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session?.access_token}` }
    });
    if (res.ok) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      showToast('Usuário removido com sucesso!');
    } else {
      const err = await res.json();
      showToast(err.error || 'Erro ao remover usuário.', 'error');
    }
    setUpdating(null);
    setConfirmDelete(null);
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = !searchQuery ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.clients.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchFilter = filterStatus === 'all' || u.subscription_status === filterStatus;
    return matchSearch && matchFilter;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.subscription_status === 'active').length,
    pending: users.filter(u => u.subscription_status === 'pending').length,
    admins: users.filter(u => u.role === 'super_admin').length,
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060912] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-[#00ff9d]/20 border-t-[#00ff9d] animate-spin" />
          <p className="text-gray-500 text-sm">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-[#060912] text-[#e6edf3] font-sans">

      {/* Toast */}
      {toastMsg && (
        <div className={`fixed top-5 right-5 z-[999] px-5 py-3 rounded-xl border text-sm font-semibold shadow-2xl transition-all animate-[fadeIn_0.2s_ease] ${
          toastMsg.type === 'success'
            ? 'bg-[#001a0e] border-[#00ff9d]/30 text-[#00ff9d]'
            : 'bg-[#1a0006] border-red-500/30 text-red-400'
        }`}>
          {toastMsg.type === 'success' ? '✓' : '✗'} {toastMsg.text}
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[998] flex items-center justify-center p-4">
          <div className="bg-[#0d1117] border border-red-500/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-2xl mb-4 mx-auto">🗑️</div>
            <h3 className="text-base font-black text-white text-center mb-1">Remover usuário</h3>
            <p className="text-sm text-gray-400 text-center mb-5">
              Tem certeza que deseja remover <strong className="text-white">{confirmDelete.email}</strong> permanentemente? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm font-bold hover:border-gray-500 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteUser(confirmDelete.id)}
                disabled={!!updating}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-black transition-all disabled:opacity-50"
              >
                {updating ? 'Removendo...' : 'Sim, remover'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-[#00ff9d]/10 bg-[#080b10]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => router.push('/')}
            >
              <svg className="w-7 h-7 text-[#00ff9d]" viewBox="0 0 100 100" fill="none">
                <path d="M50 15 L85 75 A4 4 0 0 1 81.5 81 L18.5 81 A4 4 0 0 1 15 75 Z" stroke="currentColor" strokeWidth="11" strokeLinejoin="round" strokeLinecap="round" />
                <path d="M50 32 L70 67 L30 67 Z" fill="currentColor" fillOpacity="0.2" />
              </svg>
              <span className="font-black tracking-tighter text-white text-lg group-hover:text-[#00ff9d] transition-colors">
                Easy<span className="text-[#00ff9d]">Local</span>
              </span>
            </div>
            <div className="w-px h-5 bg-gray-700 mx-1" />
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#00ff9d]/10 border border-[#00ff9d]/20 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ff9d] animate-pulse" />
              <span className="text-[#00ff9d] text-xs font-black uppercase tracking-wider">Super Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 hidden sm:block">{currentUserEmail}</span>
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-700 hover:border-gray-500 rounded-lg text-xs text-gray-400 hover:text-white transition-all"
            >
              ← Voltar ao App
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Título */}
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white">
            Painel de <span className="text-[#00ff9d]">Administração</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie usuários, assinaturas e permissões do EasyLocal.</p>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total de Usuários', value: stats.total, icon: '👥', color: 'border-gray-700' },
            { label: 'Assinantes Ativos', value: stats.active, icon: '✅', color: 'border-[#00ff9d]/30' },
            { label: 'Aguardando Ativação', value: stats.pending, icon: '⏳', color: 'border-amber-500/30' },
            { label: 'Super Admins', value: stats.admins, icon: '🛡️', color: 'border-sky-500/30' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className={`bg-[#0d1117] border ${color} rounded-2xl p-5`}>
              <div className="text-2xl mb-2">{icon}</div>
              <div className="text-3xl font-black text-white">{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Buscar por e-mail ou nome do cliente..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[#0d1117] border border-gray-800 focus:border-[#00ff9d]/40 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition-colors"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'active', 'pending', 'cancelled'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                  filterStatus === s
                    ? 'bg-[#00ff9d]/15 border-[#00ff9d]/30 text-[#00ff9d]'
                    : 'bg-transparent border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300'
                }`}
              >
                {s === 'all' ? 'Todos' : s === 'active' ? 'Ativos' : s === 'pending' ? 'Pendentes' : 'Cancelados'}
              </button>
            ))}
          </div>
        </div>

        {/* Tabela de usuários */}
        <div className="bg-[#0d1117] border border-gray-800/60 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-gray-500">Usuário</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-gray-500 hidden md:table-cell">Clientes</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-gray-500 hidden lg:table-cell">Cadastro</th>
                  <th className="text-center px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-gray-500">Assinatura</th>
                  <th className="text-center px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-gray-500">Acesso SEO</th>
                  <th className="text-center px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-gray-500">Role</th>
                  <th className="text-right px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-gray-600 text-sm">
                      {searchQuery || filterStatus !== 'all' ? 'Nenhum usuário encontrado com esses filtros.' : 'Nenhum usuário cadastrado ainda.'}
                    </td>
                  </tr>
                )}
                {filteredUsers.map(user => {
                  const isUpdating = updating === user.id;
                  return (
                    <tr key={user.id} className="border-b border-gray-800/40 hover:bg-white/[0.02] transition-colors group">
                      {/* Usuário */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00ff9d]/20 to-[#00ff9d]/5 border border-[#00ff9d]/20 flex items-center justify-center text-xs font-black text-[#00ff9d] shrink-0">
                            {user.email?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{user.email}</p>
                            {user.role === 'super_admin' && (
                              <span className="text-[10px] text-sky-400 font-bold">🛡️ Admin</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Clientes */}
                      <td className="px-5 py-4 hidden md:table-cell">
                        {user.clients.length === 0 ? (
                          <span className="text-xs text-gray-600">Sem clientes</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {user.clients.slice(0, 2).map(c => (
                              <span key={c} className="px-2 py-0.5 bg-gray-800 rounded text-[10px] text-gray-300 font-medium">{c}</span>
                            ))}
                            {user.clients.length > 2 && (
                              <span className="px-2 py-0.5 bg-gray-800 rounded text-[10px] text-gray-500">+{user.clients.length - 2}</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Data de cadastro */}
                      <td className="px-5 py-4 hidden lg:table-cell">
                        <div className="text-xs text-gray-500">
                          <div>{formatDate(user.created_at)}</div>
                          {user.last_sign_in && (
                            <div className="text-gray-700 text-[10px] mt-0.5">Último login: {formatDate(user.last_sign_in)}</div>
                          )}
                        </div>
                      </td>

                      {/* Status Assinatura */}
                      <td className="px-5 py-4 text-center">
                        <select
                          value={user.subscription_status}
                          disabled={isUpdating}
                          onChange={e => patchUser(user.id, { subscription_status: e.target.value as any })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black border cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed outline-none ${
                            user.subscription_status === 'active'
                              ? 'bg-[#001a0e] border-[#00ff9d]/30 text-[#00ff9d]'
                              : user.subscription_status === 'pending'
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                              : 'bg-red-500/10 border-red-500/30 text-red-400'
                          }`}
                        >
                          <option value="active">✅ Ativo</option>
                          <option value="pending">⏳ Pendente</option>
                          <option value="cancelled">❌ Cancelado</option>
                        </select>
                      </td>

                      {/* SEO Toggle */}
                      <td className="px-5 py-4 text-center">
                        <button
                          disabled={isUpdating}
                          onClick={() => patchUser(user.id, { seo_allowed: !user.seo_allowed })}
                          className={`w-10 h-5 rounded-full border transition-all relative disabled:opacity-50 disabled:cursor-not-allowed ${
                            user.seo_allowed
                              ? 'bg-[#00ff9d]/20 border-[#00ff9d]/40'
                              : 'bg-gray-800 border-gray-700'
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded-full absolute top-0.5 transition-all ${
                            user.seo_allowed
                              ? 'bg-[#00ff9d] left-[22px]'
                              : 'bg-gray-600 left-0.5'
                          }`} />
                        </button>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-4 text-center">
                        <select
                          value={user.role}
                          disabled={isUpdating || user.email === currentUserEmail}
                          onChange={e => patchUser(user.id, { role: e.target.value as any })}
                          className="px-3 py-1.5 bg-[#0d1117] border border-gray-700 rounded-lg text-xs font-bold text-gray-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed outline-none hover:border-gray-500 transition-colors"
                        >
                          <option value="user">👤 User</option>
                          <option value="super_admin">🛡️ Super Admin</option>
                        </select>
                      </td>

                      {/* Ações */}
                      <td className="px-5 py-4 text-right">
                        {isUpdating ? (
                          <div className="w-4 h-4 border border-[#00ff9d]/30 border-t-[#00ff9d] rounded-full animate-spin inline-block" />
                        ) : (
                          user.email !== currentUserEmail && (
                            <button
                              onClick={() => setConfirmDelete(user)}
                              className="p-2 rounded-lg text-gray-700 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                              title="Remover usuário"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-gray-800/40 flex items-center justify-between">
            <p className="text-xs text-gray-600">
              {filteredUsers.length} de {users.length} usuários
            </p>
            <button
              onClick={() => loadUsers()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-[#00ff9d] transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Atualizar
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-700">
          EasyLocal — Painel Super Admin • Apenas administradores autorizados têm acesso a esta área.
        </p>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
