// src/pages/Visiteurs.jsx — Gestion utilisateurs publics + médecins (CORRIGÉ)
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Search, Stethoscope, User, Shield, Briefcase, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from '../components/ui/Toaster';
import api from '../utils/api';

export default function Visiteurs() {
  const queryClient         = useQueryClient();
  const [filtre, setFiltre] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);

  // ✅ CORRECTION : le rôle réel en base est "PATIENT", jamais "UTILISATEUR"
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', filtre, search, page],
    queryFn: async () => {
      const p = new URLSearchParams({ page, limit: 20 });
      if (filtre === 'medecins')   p.set('role', 'MEDECIN');
      if (filtre === 'users')      p.set('role', 'PATIENT');
      if (filtre === 'delegues')   p.set('role', 'DELEGUE');
      if (filtre === 'unverified') p.set('isVerified', 'false');
      if (search) p.set('search', search);
      const { data } = await api.get(`/admin/users?${p}`);
      return data;
    },
  });

  const { data: statsUsers } = useQuery({
    queryKey: ['admin-users-stats'],
    queryFn: async () => { const { data } = await api.get('/admin/users/stats'); return data; },
  });

  // ✅ CORRECTION : on envoie bien { isVerified: true } dans le body
  const { mutate: verifier, isPending: verifying } = useMutation({
    mutationFn: (id) => api.put(`/admin/users/${id}/verifier`, { isVerified: true }),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['admin-users']);
      queryClient.invalidateQueries(['admin-users-stats']);
      toast.success(res.data?.message || '✅ Médecin vérifié — visible par les patients');
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Erreur lors de la vérification'),
  });

  // Possibilité de retirer la vérification si nécessaire
  const { mutate: retirerVerif } = useMutation({
    mutationFn: (id) => api.put(`/admin/users/${id}/verifier`, { isVerified: false }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      queryClient.invalidateQueries(['admin-users-stats']);
      toast.success('Vérification retirée.');
    },
  });

  // ✅ Suppression définitive (médecins et délégués uniquement)
  const { mutate: supprimer, isPending: deleting } = useMutation({
    mutationFn: (id) => api.delete(`/admin/users/${id}`),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['admin-users']);
      queryClient.invalidateQueries(['admin-users-stats']);
      toast.success(res.data?.message || 'Compte supprimé.');
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Erreur lors de la suppression'),
  });

  const filtres = [
    { val:'all',        label:'Tous',         count: statsUsers?.total },
    { val:'medecins',   label:'Médecins',     count: statsUsers?.medecins },
    { val:'users',      label:'Utilisateurs', count: statsUsers?.patients },
    { val:'delegues',   label:'Délégués',     count: statsUsers?.delegues },
    { val:'unverified', label:'Non vérifiés', count: statsUsers?.nonVerifies },
  ];

  const users = data?.data || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Abonnés & Visiteurs</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {statsUsers?.total ?? 0} abonnés · {statsUsers?.medecins ?? 0} médecins · {statsUsers?.patients ?? 0} utilisateurs
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-primary-600">{statsUsers?.total ?? '—'}</p>
          <p className="text-xs text-gray-500 mt-1">Total abonnés</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-blue-600">{statsUsers?.medecins ?? '—'}</p>
          <p className="text-xs text-gray-500 mt-1">Médecins</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-green-600">{statsUsers?.patients ?? '—'}</p>
          <p className="text-xs text-gray-500 mt-1">Utilisateurs</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-purple-600">{statsUsers?.delegues ?? '—'}</p>
          <p className="text-xs text-gray-500 mt-1">Délégués</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap mb-4">
        {filtres.map((f) => (
          <button key={f.val} onClick={() => { setFiltre(f.val); setPage(1); }}
            className={`text-sm px-4 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1.5 ${
              filtre === f.val ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {f.label}
            {f.count != null && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${filtre === f.val ? 'bg-white/20' : 'bg-gray-200'}`}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Recherche */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
        <input type="text" placeholder="Rechercher par email, nom, ville..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="input pl-9"/>
      </div>

      {/* Liste */}
      <div className="space-y-2">
        {isLoading ? (
          [...Array(5)].map((_, i) => <div key={i} className="card animate-pulse h-16 bg-gray-50"/>)
        ) : users.length === 0 ? (
          <div className="card text-center py-12 text-gray-400">Aucun utilisateur trouvé</div>
        ) : users.map((u) => {
          const profil = u.profil || {};
          const nom    = profil.prenom && profil.nom ? `${profil.prenom} ${profil.nom}` : null;

          return (
            <div key={u.id} className="card flex items-center gap-4">
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                u.role === 'MEDECIN' ? 'bg-blue-100' : u.role === 'DELEGUE' ? 'bg-purple-100' : 'bg-gray-100'
              }`}>
                {u.role === 'MEDECIN'
                  ? <Stethoscope size={16} className="text-blue-600"/>
                  : u.role === 'DELEGUE'
                  ? <Briefcase size={16} className="text-purple-600"/>
                  : <User size={16} className="text-gray-500"/>}
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {u.role === 'MEDECIN' && nom ? `Dr. ${nom}` : (nom || u.email)}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    u.role === 'MEDECIN' ? 'bg-blue-100 text-blue-700'
                    : u.role === 'DELEGUE' ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-600'
                  }`}>
                    {u.role === 'MEDECIN' ? 'Médecin' : u.role === 'DELEGUE' ? 'Délégué' : 'Utilisateur'}
                  </span>

                  {/* ✅ Badge dynamique : passe instantanément en vert après vérification */}
                  {u.role === 'PATIENT' || u.isVerified ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      ✓ Vérifié
                    </span>
                  ) : (
                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                      ⏳ En attente
                    </span>
                  )}
                </div>
                {nom && <p className="text-xs text-gray-400">{u.email}</p>}
                {u.role === 'DELEGUE' && profil.nomLaboratoire && (
                  <p className="text-xs text-purple-500 mt-0.5">💼 {profil.nomLaboratoire}{profil.ville ? ` · ${profil.ville}` : ''}</p>
                )}
                {u.role === 'MEDECIN' && profil.specialite && (
                  <p className="text-xs text-blue-500 mt-0.5">🩺 {profil.specialite}{profil.ville ? ` · ${profil.ville}` : ''}</p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">
                  Inscrit {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true, locale: fr })}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {(u.role === 'MEDECIN' || u.role === 'DELEGUE') && !u.isVerified && (
                  <button onClick={() => verifier(u.id)} disabled={verifying}
                    title="Vérifier ce compte"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded-lg text-xs font-bold transition-colors disabled:opacity-50">
                    <CheckCircle size={13}/> Vérifier
                  </button>
                )}
                {(u.role === 'MEDECIN' || u.role === 'DELEGUE') && u.isVerified && (
                  <button onClick={() => retirerVerif(u.id)}
                    title="Retirer la vérification"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-xs font-medium transition-colors">
                    <Shield size={13}/> Vérifié
                  </button>
                )}
                {(u.role === 'MEDECIN' || u.role === 'DELEGUE') && (
                  <button
                    onClick={() => {
                      const label = u.role === 'MEDECIN' ? 'ce médecin' : 'ce délégué médical';
                      if (window.confirm(`Supprimer définitivement ${label} ? Cette action est irréversible.`)) {
                        supprimer(u.id);
                      }
                    }}
                    disabled={deleting}
                    title="Supprimer ce compte"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg text-xs font-medium transition-colors disabled:opacity-50">
                    <Trash2 size={13}/>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {data?.pagination?.pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-xs text-gray-500">Page {page} / {data.pagination.pages}</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-ghost text-sm disabled:opacity-40">← Préc.</button>
            <button disabled={page >= data.pagination.pages} onClick={() => setPage(p => p + 1)} className="btn-ghost text-sm disabled:opacity-40">Suiv. →</button>
          </div>
        </div>
      )}
    </div>
  );
}
