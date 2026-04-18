// src/pages/Medicaments.jsx — Gestion du catalogue médicaments
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Search } from 'lucide-react';
import { toast } from '../components/ui/Toaster';
import api from '../utils/api';

const CHAMPS = [
  { f: 'nomCommercial',        l: 'Nom commercial',       required: true  },
  { f: 'dci',                  l: 'DCI (principe actif)', required: true  },
  { f: 'classeTherapeutique',  l: 'Classe thérapeutique', required: false },
  { f: 'forme',                l: 'Forme pharmaceutique', required: false },
  { f: 'dosage',               l: 'Dosage',               required: false },
  { f: 'laboratoireFabricant', l: 'Laboratoire',          required: false },
];

const VIDE = { nomCommercial:'', dci:'', classeTherapeutique:'', forme:'', dosage:'', laboratoireFabricant:'' };

// Champ défini EN DEHORS — évite la perte de focus
function Field({ label, name, required, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input type="text" name={name} value={value} onChange={onChange}
        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400"/>
    </div>
  );
}

export default function Medicaments() {
  const queryClient     = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(VIDE);
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [toDelete, setToDelete] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-meds', search, page],
    queryFn: async () => {
      const p = new URLSearchParams({ page, limit: 30 });
      if (search) p.set('search', search);
      const { data } = await api.get(`/pharmacies/catalogue/medicaments?${p}`);
      return data;
    },
  });

  const handleChange = (f) => (e) => {
    const val = e.target.value;
    setForm((prev) => ({ ...prev, [f]: val }));
  };

  const { mutate: add, isPending: adding } = useMutation({
    mutationFn: () => api.post('/admin/medicaments', form),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-meds']);
      setForm(VIDE);
      setShowForm(false);
      toast.success('Médicament ajouté au catalogue !');
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Erreur lors de l\'ajout'),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id) => api.delete(`/admin/medicaments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-meds']);
      setToDelete(null);
      toast.success('Médicament supprimé du catalogue.');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  return (
    <div>
      {/* Confirm delete */}
      {toDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Supprimer ce médicament ?</h3>
            <p className="text-sm font-semibold text-gray-800 mb-1">{toDelete.nomCommercial}</p>
            <p className="text-xs text-gray-500 mb-6">{toDelete.dci} · {toDelete.classeTherapeutique}</p>
            <div className="flex gap-3">
              <button onClick={() => setToDelete(null)} className="flex-1 btn-ghost">Annuler</button>
              <button onClick={() => remove(toDelete.id)} className="flex-1 btn-danger">Supprimer</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catalogue médicaments</h1>
          <p className="text-gray-500 text-sm">{data?.pagination?.total ?? 0} médicaments dans la base AZAMED</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2">
          <Plus size={16}/> Ajouter un médicament
        </button>
      </div>

      {/* Formulaire ajout */}
      {showForm && (
        <div className="card border-2 border-primary-100 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Nouveau médicament</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {CHAMPS.map(({ f, l, required }) => (
              <Field key={f} label={l} name={f} required={required}
                value={form[f]} onChange={handleChange(f)} />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => add()} disabled={adding || !form.nomCommercial || !form.dci}
              className="btn-primary disabled:opacity-50">
              {adding ? 'Ajout en cours...' : 'Ajouter au catalogue'}
            </button>
            <button onClick={() => { setShowForm(false); setForm(VIDE); }} className="btn-ghost">
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Recherche */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
        <input type="text" placeholder="Rechercher par nom, DCI, classe..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="input pl-9" />
      </div>

      {/* Liste */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Nom commercial','DCI','Classe thérapeutique','Forme','Dosage',''].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse"/></td></tr>
                ))
              ) : data?.data?.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-gray-400 py-12">Aucun médicament trouvé</td></tr>
              ) : data?.data?.map((med) => (
                <tr key={med.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-sm text-gray-900">{med.nomCommercial}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{med.dci}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">{med.classeTherapeutique}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{med.forme}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{med.dosage}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setToDelete(med)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={14}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data?.pagination?.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Page {page} / {data.pagination.pages}</p>
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
