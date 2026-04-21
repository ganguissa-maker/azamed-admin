// src/pages/Structures.jsx — Vérification structures avec confirmation visible
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Trash2, Search, Filter, Eye, EyeOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from '../components/ui/Toaster';
import api from '../utils/api';

const TYPE_LABELS = {
  PHARMACIE:'Pharmacie', LABORATOIRE:'Laboratoire',
  HOPITAL_PUBLIC:'Hôpital Public', HOPITAL_PRIVE:'Hôpital Privé',
  CLINIQUE:'Clinique', CABINET_MEDICAL:'Cabinet Médical',
  CABINET_SPECIALISE:'Cabinet Spécialisé', CENTRE_SANTE:'Centre de Santé',
};

const TYPE_COLORS = {
  PHARMACIE:'bg-green-100 text-green-700', LABORATOIRE:'bg-blue-100 text-blue-700',
  HOPITAL_PUBLIC:'bg-primary-100 text-primary-700', HOPITAL_PRIVE:'bg-purple-100 text-purple-700',
  CLINIQUE:'bg-pink-100 text-pink-700', CABINET_MEDICAL:'bg-orange-100 text-orange-700',
  CABINET_SPECIALISE:'bg-teal-100 text-teal-700', CENTRE_SANTE:'bg-yellow-100 text-yellow-700',
};

export default function Structures() {
  const queryClient = useQueryClient();
  const [search, setSearch]   = useState('');
  const [type, setType]       = useState('');
  const [status, setStatus]   = useState('');
  const [page, setPage]       = useState(1);
  const [toDelete, setToDelete] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-structures', search, type, status, page],
    queryFn: async () => {
      const p = new URLSearchParams({ page, limit: 15 });
      if (search) p.set('search', search);
      if (type)   p.set('type', type);
      if (status) p.set('status', status);
      const { data } = await api.get(`/admin/structures?${p}`);
      return data;
    },
  });

  const { mutate: verifier } = useMutation({
    mutationFn: (id) => api.put(`/admin/structures/${id}/verifier`),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['admin-structures']);
      toast.success(res.data?.message || 'Structure vérifiée — maintenant visible sur le site public !');
    },
    onError: () => toast.error('Erreur lors de la vérification'),
  });

  const { mutate: suspendre } = useMutation({
    mutationFn: (id) => api.put(`/admin/structures/${id}/suspendre`),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['admin-structures']);
      toast.success(res.data?.message || 'Statut modifié');
    },
    onError: () => toast.error('Erreur'),
  });

  const { mutate: supprimer } = useMutation({
    mutationFn: (id) => api.delete(`/admin/structures/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-structures']);
      setToDelete(null);
      toast.success('Structure supprimée définitivement.');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const structures = data?.data || [];

  return (
    <div>
      {/* Confirm delete */}
      {toDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Supprimer cet établissement ?</h3>
            <p className="text-sm font-semibold text-gray-800 mb-1">{toDelete.nomCommercial}</p>
            <p className="text-xs text-gray-500 mb-6">
              Cette action est irréversible. Le compte et toutes les données associées seront supprimés.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setToDelete(null)} className="flex-1 btn-ghost">Annuler</button>
              <button onClick={() => supprimer(toDelete.id)} className="flex-1 btn-danger">Supprimer</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Établissements</h1>
          <p className="text-gray-500 text-sm">{data?.pagination?.total ?? 0} établissement(s)</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input type="text" placeholder="Rechercher..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input pl-9"/>
        </div>
        <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="input w-auto">
          <option value="">Tous types</option>
          {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input w-auto">
          <option value="">Tous statuts</option>
          <option value="actif">Actifs</option>
          <option value="suspendu">Suspendus</option>
        </select>
      </div>

      {/* Liste */}
      <div className="space-y-2">
        {isLoading ? (
          [...Array(5)].map((_, i) => <div key={i} className="card animate-pulse h-20 bg-gray-50"/>)
        ) : structures.length === 0 ? (
          <div className="card text-center py-12 text-gray-400">Aucun établissement trouvé</div>
        ) : structures.map((s) => (
          <div key={s.id} className="card">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-primary-700 font-bold text-sm">{s.nomCommercial?.charAt(0)}</span>
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-sm text-gray-900 truncate">{s.nomCommercial}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[s.typeStructure] || 'bg-gray-100 text-gray-600'}`}>
                    {TYPE_LABELS[s.typeStructure] || s.typeStructure}
                  </span>
                  {s.isVerified
                    ? <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium"><Eye size={10}/>Visible</span>
                    : <span className="flex items-center gap-1 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium"><EyeOff size={10}/>Non visible</span>}
                  {!s.isActive && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Suspendu</span>}
                </div>
                <p className="text-xs text-gray-400">
                  {s.ville}{s.quartier ? `, ${s.quartier}` : ''} · {s.user?.email} ·{' '}
                  {formatDistanceToNow(new Date(s.createdAt), { addSuffix: true, locale: fr })}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {!s.isVerified && (
                  <button onClick={() => verifier(s.id)}
                    title="Vérifier — rendre visible sur le site public"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-xs font-medium transition-colors">
                    <CheckCircle size={13}/> Vérifier
                  </button>
                )}
                <button onClick={() => suspendre(s.id)}
                  title={s.isActive ? 'Suspendre' : 'Réactiver'}
                  className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors">
                  {s.isActive ? <XCircle size={16}/> : <CheckCircle size={16}/>}
                </button>
                <button onClick={() => setToDelete(s)}
                  title="Supprimer définitivement"
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={16}/>
                </button>
              </div>
            </div>
          </div>
        ))}
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
