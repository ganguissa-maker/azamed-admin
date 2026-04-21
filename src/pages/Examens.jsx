// src/pages/Examens.jsx — Admin avec modification
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Search, Pencil, Check, X } from 'lucide-react';
import { toast } from '../components/ui/Toaster';
import api from '../utils/api';

const CATEGORIES = [
  'Hématologie','Biochimie','Sérologie','Parasitologie','Bactériologie',
  'Imagerie','Anatomopathologie','Urologie','Hormonologie','Autres',
];
const VIDE = { nom:'', codeAzamed:'', categorie:'', description:'' };

function Field({ label, name, required, value, onChange, type, options }) {
  if (type === 'select') return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label} {required && <span className="text-red-400">*</span>}</label>
      <select name={name} value={value} onChange={onChange}
        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400">
        <option value="">Sélectionner...</option>
        {(options||[]).map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label} {required && <span className="text-red-400">*</span>}</label>
      <input type="text" name={name} value={value} onChange={onChange}
        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400"/>
    </div>
  );
}

export default function Examens() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(VIDE);
  const [search, setSearch]     = useState('');
  const [catFiltre, setCat]     = useState('');
  const [page, setPage]         = useState(1);
  const [toDelete, setToDelete] = useState(null);
  const [editing, setEditing]   = useState(null);
  const [editForm, setEditForm] = useState(VIDE);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-examens', search, catFiltre, page],
    queryFn: async () => {
      const p = new URLSearchParams({ page, limit: 30 });
      if (search)   p.set('search', search);
      if (catFiltre) p.set('categorie', catFiltre);
      const { data } = await api.get(`/laboratoires/catalogue/examens?${p}`);
      return data;
    },
  });

  const handleChange    = (f) => (e) => { const v = e.target.value; setForm((p) => ({ ...p, [f]: v })); };
  const handleEditChange = (f) => (e) => { const v = e.target.value; setEditForm((p) => ({ ...p, [f]: v })); };

  const { mutate: add, isPending: adding } = useMutation({
    mutationFn: () => api.post('/admin/examens', form),
    onSuccess: () => { queryClient.invalidateQueries(['admin-examens']); setForm(VIDE); setShowForm(false); toast.success('Examen ajouté !'); },
    onError: (e) => toast.error(e.response?.data?.error || 'Erreur'),
  });

  const { mutate: edit, isPending: saving } = useMutation({
    mutationFn: () => api.put(`/admin/examens/${editing.id}`, editForm),
    onSuccess: () => { queryClient.invalidateQueries(['admin-examens']); setEditing(null); toast.success('Examen modifié !'); },
    onError: (e) => toast.error(e.response?.data?.error || 'Erreur'),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id) => api.delete(`/admin/examens/${id}`),
    onSuccess: () => { queryClient.invalidateQueries(['admin-examens']); setToDelete(null); toast.success('Examen supprimé.'); },
  });

  const startEdit = (ex) => {
    setEditing(ex);
    setEditForm({ nom: ex.nom||'', codeAzamed: ex.codeAzamed||'', categorie: ex.categorie||'', description: ex.description||'' });
  };

  return (
    <div>
      {toDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-2">Supprimer cet examen ?</h3>
            <p className="text-sm font-semibold text-gray-800 mb-4">{toDelete.nom}</p>
            <div className="flex gap-3">
              <button onClick={() => setToDelete(null)} className="flex-1 btn-ghost">Annuler</button>
              <button onClick={() => remove(toDelete.id)} className="flex-1 btn-danger">Supprimer</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catalogue examens</h1>
          <p className="text-gray-500 text-sm">{data?.pagination?.total ?? 0} examens</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus size={16}/> Ajouter un examen
        </button>
      </div>

      {showForm && (
        <div className="card border-2 border-primary-100 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Nouvel examen</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <Field label="Nom" name="nom" required value={form.nom} onChange={handleChange('nom')}/>
            <Field label="Code AZAMED" name="codeAzamed" required value={form.codeAzamed} onChange={handleChange('codeAzamed')}/>
            <Field label="Catégorie" name="categorie" required type="select" options={CATEGORIES} value={form.categorie} onChange={handleChange('categorie')}/>
            <Field label="Description" name="description" value={form.description} onChange={handleChange('description')}/>
          </div>
          <div className="flex gap-2">
            <button onClick={() => add()} disabled={adding || !form.nom || !form.codeAzamed || !form.categorie} className="btn-primary disabled:opacity-50">
              {adding ? 'Ajout...' : 'Ajouter'}
            </button>
            <button onClick={() => { setShowForm(false); setForm(VIDE); }} className="btn-ghost">Annuler</button>
          </div>
        </div>
      )}

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input type="text" placeholder="Rechercher..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input pl-9"/>
        </div>
        <select value={catFiltre} onChange={(e) => { setCat(e.target.value); setPage(1); }} className="input w-auto">
          <option value="">Toutes catégories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Code','Examen','Catégorie','Description','Actions'].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                [...Array(5)].map((_,i) => <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse"/></td></tr>)
              ) : data?.data?.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-gray-400 py-12">Aucun examen</td></tr>
              ) : data?.data?.map((ex) => (
                editing?.id === ex.id ? (
                  <tr key={ex.id} className="bg-primary-50">
                    <td className="px-3 py-2"><input value={editForm.codeAzamed} onChange={handleEditChange('codeAzamed')} className="w-full px-2 py-1.5 border border-primary-200 rounded-lg text-sm bg-white focus:outline-none"/></td>
                    <td className="px-3 py-2"><input value={editForm.nom} onChange={handleEditChange('nom')} className="w-full px-2 py-1.5 border border-primary-200 rounded-lg text-sm bg-white focus:outline-none"/></td>
                    <td className="px-3 py-2">
                      <select value={editForm.categorie} onChange={handleEditChange('categorie')} className="w-full px-2 py-1.5 border border-primary-200 rounded-lg text-sm bg-white focus:outline-none">
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2"><input value={editForm.description} onChange={handleEditChange('description')} className="w-full px-2 py-1.5 border border-primary-200 rounded-lg text-sm bg-white focus:outline-none"/></td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <button onClick={() => edit()} disabled={saving} className="p-1.5 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg"><Check size={14}/></button>
                        <button onClick={() => setEditing(null)} className="p-1.5 bg-gray-100 text-gray-500 hover:bg-gray-200 rounded-lg"><X size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={ex.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs font-mono text-gray-500">{ex.codeAzamed}</td>
                    <td className="px-4 py-3 font-medium text-sm text-gray-900">{ex.nom}</td>
                    <td className="px-4 py-3"><span className="badge-blue">{ex.categorie}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">{ex.description}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => startEdit(ex)} className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Pencil size={13}/></button>
                        <button onClick={() => setToDelete(ex)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13}/></button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
        {data?.pagination?.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Page {page} / {data.pagination.pages}</p>
            <div className="flex gap-2">
              <button disabled={page===1} onClick={() => setPage(p=>p-1)} className="btn-ghost text-sm disabled:opacity-40">← Préc.</button>
              <button disabled={page>=data.pagination.pages} onClick={() => setPage(p=>p+1)} className="btn-ghost text-sm disabled:opacity-40">Suiv. →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
