// src/pages/Publications.jsx — Modération des publications
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, CheckCircle, XCircle, Pin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from '../components/ui/Toaster';
import api from '../utils/api';

const TYPE_LABELS = {
  PROMOTION:'Promotion', NOUVEAU_SERVICE:'Nouveau service',
  DISPONIBILITE_MEDICAMENT:'Médicament dispo', NOUVEL_EXAMEN:'Nouvel examen',
  CAMPAGNE_DEPISTAGE:'Campagne dépistage', HORAIRES_MODIFIES:'Horaires modifiés',
  EVENEMENT_MEDICAL:'Événement', RECRUTEMENT:'Recrutement',
  MESSAGE_INSTITUTIONNEL:'Annonce', AUTRE:'Autre',
};

export default function Publications() {
  const [filtre, setFiltre]   = useState('all');
  const [page, setPage]       = useState(1);
  const [toDelete, setToDelete] = useState(null);
  const queryClient           = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-posts', filtre, page],
    queryFn: async () => {
      const p = new URLSearchParams({ page, limit: 20 });
      if (filtre !== 'all') p.set('status', filtre);
      const { data } = await api.get(`/admin/posts?${p}`);
      return data;
    },
  });

  const { mutate: moderer } = useMutation({
    mutationFn: ({ id, action }) => api.put(`/admin/posts/${id}/moderer`, { action }),
    onSuccess: ({ data: d }) => {
      queryClient.invalidateQueries(['admin-posts']);
      toast.success(d.message || 'Action effectuée');
    },
    onError: () => toast.error('Erreur lors de la modération'),
  });

  const { mutate: supprimer } = useMutation({
    mutationFn: (id) => api.delete(`/admin/posts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-posts']);
      setToDelete(null);
      toast.success('Publication supprimée.');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const filtres = [
    { val: 'all',      label: 'Toutes' },
    { val: 'pending',  label: 'En attente' },
    { val: 'approved', label: 'Approuvées' },
    { val: 'rejected', label: 'Rejetées' },
  ];

  return (
    <div>
      {/* Confirm delete modal */}
      {toDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Supprimer cette publication ?</h3>
            <p className="text-sm text-gray-600 mb-1 line-clamp-3 italic">"{toDelete.contenu}"</p>
            <p className="text-xs text-gray-400 mb-6">Par {toDelete.structure?.nomCommercial}</p>
            <div className="flex gap-3">
              <button onClick={() => setToDelete(null)} className="flex-1 btn-ghost">Annuler</button>
              <button onClick={() => supprimer(toDelete.id)} className="flex-1 btn-danger">Supprimer</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Publications</h1>
          <p className="text-gray-500 text-sm">{data?.pagination?.total ?? 0} publication(s)</p>
        </div>
        {/* Filtres */}
        <div className="flex gap-2 flex-wrap">
          {filtres.map((f) => (
            <button key={f.val} onClick={() => { setFiltre(f.val); setPage(1); }}
              className={`text-sm px-4 py-1.5 rounded-full font-medium transition-colors ${
                filtre === f.val ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="card animate-pulse h-24 bg-gray-50"/>
          ))
        ) : data?.data?.length === 0 ? (
          <div className="card text-center py-16 text-gray-400">
            <p>Aucune publication dans cette catégorie</p>
          </div>
        ) : data?.data?.map((post) => (
          <div key={post.id} className="card">
            <div className="flex items-start gap-4">
              {/* Icône structure */}
              <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-primary-700 font-bold text-sm">
                  {post.structure?.nomCommercial?.charAt(0) || '?'}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                {/* Méta */}
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-sm text-gray-900">{post.structure?.nomCommercial}</span>
                  <span className="badge-gray">{TYPE_LABELS[post.typePost] || 'Autre'}</span>
                  {post.isPinned && <Pin size={12} className="text-amber-500"/>}
                  {!post.isApproved && !post.isRejected && (
                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">En attente</span>
                  )}
                  {post.isApproved && <span className="badge-green">Approuvée</span>}
                  {post.isRejected && <span className="badge-red">Rejetée</span>}
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: fr })}
                  </span>
                </div>
                {/* Contenu */}
                <p className="text-sm text-gray-700 line-clamp-2 whitespace-pre-line">{post.contenu}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {!post.isApproved && (
                  <button onClick={() => moderer({ id: post.id, action: 'approuver' })}
                    title="Approuver"
                    className="p-1.5 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors">
                    <CheckCircle size={17}/>
                  </button>
                )}
                {!post.isRejected && (
                  <button onClick={() => moderer({ id: post.id, action: 'rejeter' })}
                    title="Rejeter"
                    className="p-1.5 text-orange-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
                    <XCircle size={17}/>
                  </button>
                )}
                <button onClick={() => setToDelete(post)}
                  title="Supprimer définitivement"
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={17}/>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

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
