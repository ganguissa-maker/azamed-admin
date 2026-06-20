// src/pages/UtilisateursPage.jsx — Patients + Médecins (web et mobile confondus)
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Users, UserCheck, Stethoscope, Shield,
  CheckCircle, XCircle, Eye, Trash2,
} from 'lucide-react';
import api from '../utils/api';

function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-white text-sm font-semibold shadow-lg ${
      msg.type === 'error' ? 'bg-red-500' : 'bg-green-500'
    }`}>
      {msg.text}
    </div>
  );
}
function useToast() {
  const [msg, setMsg] = useState(null);
  const show = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg(null), 3000); };
  return { msg, success: (t) => show(t, 'success'), error: (t) => show(t, 'error') };
}

const ROLE_CONFIG = {
  PATIENT: { label:'Patient', color:'text-blue-700',   bg:'bg-blue-100',   icon:'👤' },
  MEDECIN: { label:'Médecin', color:'text-purple-700', bg:'bg-purple-100', icon:'👨‍⚕️' },
};

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function UtilisateursPage() {
  const qc    = useQueryClient();
  const toast = useToast();

  const [search, setSearch]     = useState('');
  const [roleFilter, setRole]   = useState('');   // '' | PATIENT | MEDECIN
  const [verifFilter, setVerif] = useState('');   // '' | true | false
  const [page, setPage]         = useState(1);
  const [selectedUser, setSelected] = useState(null);

  // ── Liste utilisateurs (patients + médecins, web + mobile = même base) ──
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-users', search, roleFilter, verifFilter, page],
    queryFn: async () => {
      const p = new URLSearchParams({ page, limit: 20 });
      if (search)      p.set('search', search);
      if (roleFilter)  p.set('role', roleFilter);
      if (verifFilter) p.set('isVerified', verifFilter);
      const { data } = await api.get(`/admin/users?${p}`);
      return data;
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ['admin-users-stats'],
    queryFn: async () => { const { data } = await api.get('/admin/users/stats'); return data; },
  });

  const { mutate: toggleVerif, isPending: verifying } = useMutation({
    mutationFn: ({ id, isVerified }) => api.put(`/admin/users/${id}/verifier`, { isVerified }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries(['admin-users']);
      qc.invalidateQueries(['admin-users-stats']);
      toast.success(vars.isVerified ? '✅ Médecin vérifié — il est maintenant visible par les patients' : 'Vérification retirée');
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Erreur'),
  });

  const { mutate: toggleActive } = useMutation({
    mutationFn: ({ id, isActive }) => api.put(`/admin/users/${id}/activer`, { isActive }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries(['admin-users']);
      toast.success(vars.isActive ? 'Compte réactivé' : 'Compte suspendu');
    },
    onError: () => toast.error('Erreur'),
  });

  const { mutate: deleteUser } = useMutation({
    mutationFn: (id) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries(['admin-users']);
      qc.invalidateQueries(['admin-users-stats']);
      setSelected(null);
      toast.success('Utilisateur supprimé');
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Erreur lors de la suppression'),
  });

  const users = data?.data || [];
  const total = data?.pagination?.total || 0;
  const pages = data?.pagination?.pages || 1;
  const stats = statsData || {};

  return (
    <div>
      <Toast msg={toast.msg}/>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Tous les patients et médecins inscrits — depuis le site public et l'application mobile
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard icon={<Users size={18} className="text-gray-600"/>}         label="Total utilisateurs"        value={stats.total      ?? '—'} color="bg-gray-100"/>
        <StatCard icon={<UserCheck size={18} className="text-blue-600"/>}     label="Patients"                   value={stats.patients    ?? '—'} color="bg-blue-100"/>
        <StatCard icon={<Stethoscope size={18} className="text-purple-600"/>} label="Médecins"                  value={stats.medecins    ?? '—'} color="bg-purple-100"/>
        <StatCard icon={<Shield size={18} className="text-orange-600"/>}      label="Médecins à vérifier"       value={stats.nonVerifies ?? '—'} color="bg-orange-100"/>
      </div>

      {/* Bannière médecins en attente */}
      {stats.nonVerifies > 0 && (
        <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-5">
          <Shield size={18} className="text-orange-500 shrink-0"/>
          <p className="text-sm font-semibold text-orange-700 flex-1">
            {stats.nonVerifies} médecin{stats.nonVerifies>1?'s':''} en attente de vérification
          </p>
          <button
            onClick={() => { setRole('MEDECIN'); setVerif('false'); setPage(1); }}
            className="text-xs font-bold text-orange-700 underline hover:no-underline">
            Voir
          </button>
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input type="text" placeholder="Nom, prénom, email, ville, spécialité..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none"/>
        </div>
        <select value={roleFilter} onChange={(e) => { setRole(e.target.value); setPage(1); }}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none">
          <option value="">Tous les rôles</option>
          <option value="PATIENT">👤 Patients</option>
          <option value="MEDECIN">👨‍⚕️ Médecins</option>
        </select>
        <select value={verifFilter} onChange={(e) => { setVerif(e.target.value); setPage(1); }}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none">
          <option value="">Tous statuts</option>
          <option value="true">✅ Vérifiés</option>
          <option value="false">⏳ Non vérifiés</option>
        </select>
        {(roleFilter || verifFilter || search) && (
          <button onClick={() => { setRole(''); setVerif(''); setSearch(''); setPage(1); }}
            className="px-3 py-2.5 text-sm text-gray-500 hover:text-gray-700">
            Réinitialiser
          </button>
        )}
      </div>

      {/* Erreur de chargement */}
      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm mb-4">
          Impossible de charger les utilisateurs. Vérifiez que la route /api/admin/users est bien déployée sur le backend.
        </div>
      )}

      {/* Tableau */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Users size={40} className="mx-auto mb-3 opacity-30"/>
          <p>Aucun utilisateur trouvé</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3">Utilisateur</th>
                  <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3">Rôle</th>
                  <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Spécialité / Ville</th>
                  <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Inscrit le</th>
                  <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3">Statut</th>
                  <th className="text-right text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => {
                  const roleCfg = ROLE_CONFIG[u.role] || ROLE_CONFIG.PATIENT;
                  const profil  = u.profil || {};
                  const nom     = profil.prenom && profil.nom ? `${profil.prenom} ${profil.nom}` : (profil.prenom || '—');
                  const isMedecinNonVerifie = u.role === 'MEDECIN' && !u.isVerified;

                  return (
                    <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${isMedecinNonVerifie ? 'bg-orange-50/40' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${roleCfg.bg}`}>
                            <span className="text-base">{roleCfg.icon}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-gray-900 truncate max-w-[160px]">
                              {u.role === 'MEDECIN' ? `Dr. ${nom}` : nom}
                            </p>
                            <p className="text-xs text-gray-400 truncate max-w-[160px]">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${roleCfg.bg} ${roleCfg.color}`}>
                          {roleCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-sm text-gray-700 truncate max-w-[140px]">{profil.specialite || profil.ville || '—'}</p>
                        {profil.specialite && profil.ville && <p className="text-xs text-gray-400 truncate">{profil.ville}</p>}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <p className="text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString('fr-FR')}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {u.role === 'PATIENT' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full w-fit">
                              <CheckCircle size={10}/> Actif
                            </span>
                          ) : u.isVerified ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full w-fit">
                              <CheckCircle size={10}/> Vérifié
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full w-fit">
                              ⏳ À vérifier
                            </span>
                          )}
                          {!u.isActive && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full w-fit">
                              <XCircle size={10}/> Suspendu
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => setSelected(u)} title="Voir le profil"
                            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                            <Eye size={15}/>
                          </button>

                          {/* ✅ Bouton vérifier proéminent pour médecins non vérifiés */}
                          {u.role === 'MEDECIN' && !u.isVerified && (
                            <button
                              onClick={() => toggleVerif({ id: u.id, isVerified: true })}
                              disabled={verifying}
                              title="Vérifier ce médecin"
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50">
                              <Shield size={13}/> Vérifier
                            </button>
                          )}
                          {u.role === 'MEDECIN' && u.isVerified && (
                            <button
                              onClick={() => toggleVerif({ id: u.id, isVerified: false })}
                              title="Retirer la vérification"
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                              <Shield size={15}/>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              const action = u.isActive ? 'suspendre' : 'réactiver';
                              if (window.confirm(`${action.charAt(0).toUpperCase()+action.slice(1)} ce compte ?`)) {
                                toggleActive({ id: u.id, isActive: !u.isActive });
                              }
                            }}
                            title={u.isActive ? 'Suspendre le compte' : 'Réactiver le compte'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              u.isActive ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                            }`}>
                            {u.isActive ? <XCircle size={15}/> : <CheckCircle size={15}/>}
                          </button>

                          <button
                            onClick={() => { if (window.confirm('Supprimer définitivement ce compte ? Cette action est irréversible.')) deleteUser(u.id); }}
                            title="Supprimer le compte"
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={15}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">{total} utilisateur{total>1?'s':''}</p>
            <div className="flex gap-2">
              <button disabled={page===1} onClick={() => setPage(p=>p-1)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">← Préc.</button>
              <span className="px-3 py-1.5 text-sm text-gray-500">Page {page}/{pages}</span>
              <button disabled={page>=pages} onClick={() => setPage(p=>p+1)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">Suiv. →</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal profil détail */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Profil utilisateur</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="px-5 py-4 space-y-3">
              {(() => {
                const p    = selectedUser.profil || {};
                const rcfg = ROLE_CONFIG[selectedUser.role] || ROLE_CONFIG.PATIENT;
                return (
                  <>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${rcfg.bg}`}>{rcfg.icon}</div>
                      <div>
                        <p className="font-bold text-gray-900">{selectedUser.role==='MEDECIN'?'Dr. ':''}{p.prenom||''} {p.nom||''}</p>
                        <p className="text-sm text-gray-400">{selectedUser.email}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {[
                        { label:'Rôle',          value: rcfg.label },
                        { label:'Statut',        value: selectedUser.role==='PATIENT' ? '🟢 Actif' : selectedUser.isVerified ? '✅ Vérifié' : '⏳ À vérifier' },
                        { label:'Compte',        value: selectedUser.isActive ? '🟢 Actif' : '🔴 Suspendu' },
                        { label:'Inscrit le',    value: new Date(selectedUser.createdAt).toLocaleDateString('fr-FR') },
                        { label:'Ville',         value: p.ville || '—' },
                        { label:'Téléphone',     value: p.telephone || '—' },
                        ...(selectedUser.role==='MEDECIN' ? [
                          { label:'Spécialité',   value: p.specialite || '—' },
                          { label:'Lieu exercice',value: p.lieuExercice || '—' },
                          { label:'N° Ordre',     value: p.numeroOrdre || '—' },
                        ] : []),
                      ].map((row) => (
                        <div key={row.label} className="bg-gray-50 rounded-xl p-2.5">
                          <p className="text-xs text-gray-400 font-semibold mb-0.5">{row.label}</p>
                          <p className="font-medium text-gray-800 text-xs truncate">{row.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 space-y-2">
                      {selectedUser.role === 'MEDECIN' && !selectedUser.isVerified && (
                        <button
                          onClick={() => { toggleVerif({ id:selectedUser.id, isVerified:true }); setSelected(null); }}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                          <Shield size={15}/> ✅ Vérifier ce médecin
                        </button>
                      )}
                      {selectedUser.role === 'MEDECIN' && selectedUser.isVerified && (
                        <button
                          onClick={() => { toggleVerif({ id:selectedUser.id, isVerified:false }); setSelected(null); }}
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                          Retirer la vérification
                        </button>
                      )}
                      <button
                        onClick={() => { toggleActive({ id:selectedUser.id, isActive:!selectedUser.isActive }); setSelected(null); }}
                        className={`w-full font-semibold py-2.5 rounded-xl text-sm transition-colors ${
                          selectedUser.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'
                        }`}>
                        {selectedUser.isActive ? '🔴 Suspendre le compte' : '🟢 Réactiver le compte'}
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
