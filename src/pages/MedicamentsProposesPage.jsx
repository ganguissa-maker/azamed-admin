// src/pages/MedicamentsProposesPage.jsx — Validation des propositions delegues (admin)
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Clock, Search, Building2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from '../components/ui/Toaster';
import api from '../utils/api';

const STATUT_CONFIG = {
  EN_ATTENTE: { label:'En attente', color:'text-orange-600', bg:'bg-orange-50 border-orange-200' },
  VALIDE:     { label:'Valide',     color:'text-green-600',  bg:'bg-green-50  border-green-200'  },
  REFUSE:     { label:'Refuse',     color:'text-red-500',    bg:'bg-red-50    border-red-200'    },
};

export default function MedicamentsProposesPage() {
  const qc = useQueryClient();
  const [filtre, setFiltre] = useState('EN_ATTENTE');
  const [search, setSearch] = useState('');
  const [motifModal, setMotifModal] = useState(null);
  const [motif, setMotif] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-medicaments-proposes', filtre],
    queryFn: async () => {
      const p = filtre !== 'all' ? `?statut=${filtre}` : '';
      const { data } = await api.get(`/delegue/admin/medicaments${p}`);
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-medicaments-stats'],
    queryFn: async () => { const { data } = await api.get('/delegue/admin/stats'); return data; },
  });

  const { mutate: valider, isPending: validating } = useMutation({
    mutationFn: (id) => api.put(`/delegue/admin/medicaments/${id}/valider`),
    onSuccess: () => {
      qc.invalidateQueries(['admin-medicaments-proposes']);
      qc.invalidateQueries(['admin-medicaments-stats']);
      toast.success('Medicament valide et ajoute au catalogue !');
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Erreur'),
  });

  const { mutate: refuser } = useMutation({
    mutationFn: ({ id, motif }) => api.put(`/delegue/admin/medicaments/${id}/refuser`, { motif }),
    onSuccess: () => {
      qc.invalidateQueries(['admin-medicaments-proposes']);
      qc.invalidateQueries(['admin-medicaments-stats']);
      setMotifModal(null);
      setMotif('');
      toast.success('Proposition refusee.');
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Erreur'),
  });

  const filtres = [
    { val:'EN_ATTENTE', label:'En attente', count: stats?.enAttente },
    { val:'VALIDE',     label:'Valides',    count: stats?.valides },
    { val:'REFUSE',     label:'Refuses',    count: stats?.refuses },
    { val:'all',        label:'Tous',       count: null },
  ];

  let propositions = data?.data || [];
  if (search) {
    const s = search.toLowerCase();
    propositions = propositions.filter((m) =>
      m.nomCommercial?.toLowerCase().includes(s) ||
      m.nomLaboratoire?.toLowerCase().includes(s) ||
      m.delEmail?.toLowerCase().includes(s)
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medicaments proposes</h1>
          <p className="text-gray-500 text-sm mt-0.5">Propositions des delegues medicaux en attente de validation</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
          <p className="text-2xl font-bold text-gray-900">{stats?.totalDelegues ?? '-'}</p>
          <p className="text-xs text-gray-500 mt-1">Delegues inscrits</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
          <p className="text-2xl font-bold text-orange-500">{stats?.enAttente ?? '-'}</p>
          <p className="text-xs text-gray-500 mt-1">En attente</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
          <p className="text-2xl font-bold text-green-600">{stats?.valides ?? '-'}</p>
          <p className="text-xs text-gray-500 mt-1">Valides</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
          <p className="text-2xl font-bold text-red-500">{stats?.refuses ?? '-'}</p>
          <p className="text-xs text-gray-500 mt-1">Refuses</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {filtres.map((f) => (
          <button key={f.val} onClick={() => setFiltre(f.val)}
            className={`text-sm px-4 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1.5 ${
              filtre === f.val ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {f.label}
            {f.count != null && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${filtre === f.val ? 'bg-white/20' : 'bg-gray-200'}`}>{f.count}</span>
            )}
          </button>
        ))}
      </div>

      <div className="relative mb-5">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom, laboratoire, email..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none"/>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      ) : propositions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Clock size={40} className="mx-auto mb-3 opacity-30"/>
          <p>Aucune proposition trouvee</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {propositions.map((m) => {
            const cfg = STATUT_CONFIG[m.statut] || STATUT_CONFIG.EN_ATTENTE;
            return (
              <div key={m.id} className={`bg-white rounded-2xl border-l-4 border-t border-r border-b ${cfg.bg} p-4`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
                    {cfg.label}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(m.createdAt), { addSuffix:true, locale:fr })}
                  </span>
                </div>

                <p className="font-bold text-gray-900 text-sm">{m.nomCommercial}</p>
                {(m.dci || m.forme || m.dosage) && (
                  <p className="text-xs text-gray-500 mt-0.5">{[m.dci, m.forme, m.dosage].filter(Boolean).join(' . ')}</p>
                )}
                {m.classeTherapeutique && <p className="text-xs text-primary-600 font-medium mt-1">{m.classeTherapeutique}</p>}

                <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                  <Building2 size={12}/> {m.nomLaboratoire}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Par {m.delPrenom||''} {m.delNom||''} ({m.delEmail})
                </p>

                {m.statut === 'REFUSE' && m.motifRefus && (
                  <div className="bg-red-50 rounded-lg p-2 mt-2">
                    <p className="text-xs text-red-600">Motif : {m.motifRefus}</p>
                  </div>
                )}

                {m.statut === 'EN_ATTENTE' && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => valider(m.id)} disabled={validating}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 rounded-lg transition-colors disabled:opacity-50">
                      <CheckCircle size={13}/> Valider
                    </button>
                    <button onClick={() => setMotifModal(m.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 border-2 border-red-300 text-red-500 hover:bg-red-50 text-xs font-bold py-2 rounded-lg transition-colors">
                      <XCircle size={13}/> Refuser
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {motifModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
            <h3 className="font-bold text-gray-900 mb-3">Motif du refus</h3>
            <textarea value={motif} onChange={(e) => setMotif(e.target.value)} rows={3}
              placeholder="Optionnel : expliquez pourquoi cette proposition est refusee..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 resize-none mb-4"/>
            <div className="flex gap-3">
              <button onClick={() => { setMotifModal(null); setMotif(''); }}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50">
                Annuler
              </button>
              <button onClick={() => refuser({ id: motifModal, motif })}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                Confirmer le refus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
