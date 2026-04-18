// src/pages/Structures.jsx — Gestion des établissements
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, ShieldCheck, Trash2, Search, Eye } from 'lucide-react';
import { toast } from '../components/ui/Toaster';
import api from '../utils/api';

const TYPE_LABEL = {
  PHARMACIE:'Pharmacie', LABORATOIRE:'Laboratoire', HOPITAL_PUBLIC:'Hôpital Public',
  HOPITAL_PRIVE:'Hôpital Privé', CLINIQUE:'Clinique', CABINET_MEDICAL:'Cabinet Médical',
  CABINET_SPECIALISE:'Cabinet Spécialisé', CENTRE_SANTE:'Centre de Santé',
};

// Modal confirmation suppression
function ConfirmModal({ structure, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Supprimer cet établissement ?</h3>
        <p className="text-gray-600 text-sm mb-1">
          Vous êtes sur le point de supprimer définitivement :
        </p>
        <p className="font-semibold text-gray-900 mb-1">{structure.nomCommercial}</p>
        <p className="text-xs text-gray-400 mb-6">{structure.typeStructure} · {structure.ville} · {structure.user?.email}</p>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-6">
          <p className="text-sm text-red-700 font-medium">⚠️ Cette action est irréversible.</p>
          <p className="text-xs text-red-600 mt-1">Toutes les données (médicaments, examens, services, publications) seront supprimées.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 btn-ghost">Annuler</button>
          <button onClick={onConfirm} className="flex-1 btn-danger">Supprimer définitivement</button>
        </div>
      </div>
    </div>
  );
}

export default function Structures() {
  const [search, setSearch]   = useState('');
  const [type, setType]       = useState('');
  const [statut, setStatut]   = useState('');
  const [page, setPage]       = useState(1);
  const [toDelete, setToDelete] = useState(null);
  const [detail, setDetail]   = useState(null);
  const queryClient           = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-structures', search, type, statut, page],
    queryFn: async () => {
      const p = new URLSearchParams({ page, limit: 15 });
      if (search) p.set('search', search);
      if (type)   p.set('type', type);
      if (statut) p.set('status', statut);
      const { data } = await api.get(`/admin/structures?${p}`);
      return data;
    },
  });

  const { mutate: verify } = useMutation({
    mutationFn: (id) => api.put(`/admin/structures/${id}/verifier`),
    onSuccess: () => { queryClient.invalidateQueries(['admin-structures']); toast.success('Établissement vérifié ✓'); },
    onError:   () => toast.error('Erreur lors de la vérification'),
  });

  const { mutate: toggle } = useMutation({
    mutationFn: (id) => api.put(`/admin/structures/${id}/suspendre`),
    onSuccess: ({ data }) => { queryClient.invalidateQueries(['admin-structures']); toast.success(data.message); },
    onError:   () => toast.error('Erreur'),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id) => api.delete(`/admin/structures/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-structures']);
      queryClient.invalidateQueries(['admin-dashboard']);
      setToDelete(null);
      toast.success('Établissement supprimé.');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const types = ['', 'PHARMACIE', 'LABORATOIRE', 'HOPITAL_PUBLIC', 'HOPITAL_PRIVE', 'CLINIQUE', 'CABINET_MEDICAL', 'CENTRE_SANTE'];

  return (
    <div>
      {/* Confirm modal */}
      {toDelete && (
        <ConfirmModal
          structure={toDelete}
          onConfirm={() => remove(toDelete.id)}
          onCancel={() => setToDelete(null)}
        />
      )}

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{detail.nomCommercial}</h3>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-2 text-sm">
              {[
                ['Type',         TYPE_LABEL[detail.typeStructure] || detail.typeStructure],
                ['Email',        detail.user?.email],
                ['Téléphone',    detail.telephone],
                ['WhatsApp',     detail.whatsapp],
                ['Ville',        detail.ville],
                ['Quartier',     detail.quartier],
                ['Adresse',      detail.adresse],
                ['Description',  detail.description],
                ['Statut',       detail.isActive ? 'Actif' : 'Suspendu'],
                ['Vérifié',      detail.isVerified ? 'Oui' : 'Non'],
                ['Inscrit le',   detail.createdAt ? new Date(detail.createdAt).toLocaleDateString('fr-FR') : '—'],
              ].map(([k, v]) => v ? (
                <div key={k} className="flex gap-2">
                  <span className="font-medium text-gray-500 w-28 shrink-0">{k} :</span>
                  <span className="text-gray-800">{v}</span>
                </div>
              ) : null)}
            </div>
            <div className="flex gap-2 mt-5 pt-4 border-t border-gray-100">
              {!detail.isVerified && (
                <button onClick={() => { verify(detail.id); setDetail(null); }} className="btn-primary flex-1">
                  <CheckCircle size={14} className="inline mr-1"/> Vérifier
                </button>
              )}
              <button onClick={() => { toggle(detail.id); setDetail(null); }}
                className={`flex-1 btn ${detail.isActive ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                {detail.isActive ? 'Suspendre' : 'Réactiver'}
              </button>
              <button onClick={() => { setDetail(null); setToDelete(detail); }} className="btn-danger">
                <Trash2 size={14}/>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Établissements de santé</h1>
          <p className="text-gray-500 text-sm">{data?.pagination?.total ?? 0} établissement(s) inscrit(s)</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input type="text" placeholder="Nom, email, ville..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input pl-9" />
          </div>
          <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="input w-auto">
            <option value="">Tous les types</option>
            {types.filter(Boolean).map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
          </select>
          <select value={statut} onChange={(e) => { setStatut(e.target.value); setPage(1); }} className="input w-auto">
            <option value="">Tous statuts</option>
            <option value="actif">Actifs</option>
            <option value="suspendu">Suspendus</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Établissement','Type','Ville','Email','Statut','Vérifié','Actions'].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-5 bg-gray-100 rounded animate-pulse"/></td></tr>
                ))
              ) : data?.data?.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-gray-400 py-12">Aucun établissement trouvé</td></tr>
              ) : data?.data?.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                        <span className="text-primary-700 font-bold text-xs">{s.nomCommercial.charAt(0)}</span>
                      </div>
                      <p className="font-medium text-sm text-gray-900 truncate max-w-[150px]">{s.nomCommercial}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{TYPE_LABEL[s.typeStructure] || s.typeStructure}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{s.ville}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 truncate max-w-[160px]">{s.user?.email}</td>
                  <td className="px-4 py-3">
                    {s.isActive
                      ? <span className="badge-green">Actif</span>
                      : <span className="badge-red">Suspendu</span>}
                  </td>
                  <td className="px-4 py-3">
                    {s.isVerified
                      ? <span className="badge-blue">Vérifié</span>
                      : <span className="badge-gray">En attente</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {/* Voir détail */}
                      <button onClick={() => setDetail(s)} title="Voir détail"
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                        <Eye size={15}/>
                      </button>
                      {/* Vérifier */}
                      {!s.isVerified && (
                        <button onClick={() => verify(s.id)} title="Vérifier l'établissement"
                          className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <ShieldCheck size={15}/>
                        </button>
                      )}
                      {/* Suspendre / Réactiver */}
                      <button onClick={() => toggle(s.id)}
                        title={s.isActive ? 'Suspendre' : 'Réactiver'}
                        className={`p-1.5 rounded-lg transition-colors ${s.isActive ? 'text-orange-400 hover:text-orange-600 hover:bg-orange-50' : 'text-green-500 hover:text-green-700 hover:bg-green-50'}`}>
                        {s.isActive ? <XCircle size={15}/> : <CheckCircle size={15}/>}
                      </button>
                      {/* Supprimer */}
                      <button onClick={() => setToDelete(s)} title="Supprimer définitivement"
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={15}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pagination?.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Page {page} / {data.pagination.pages} · {data.pagination.total} résultats
            </p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-ghost text-sm disabled:opacity-40">← Préc.</button>
              <button disabled={page >= data.pagination.pages} onClick={() => setPage(p => p + 1)} className="btn-ghost text-sm disabled:opacity-40">Suiv. →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
