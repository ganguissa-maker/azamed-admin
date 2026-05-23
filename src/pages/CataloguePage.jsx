// frontend-admin/src/pages/CataloguePage.jsx
// Page admin pour gérer le catalogue complet (médicaments, examens, services)
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Trash2, Edit2, Check, X, RefreshCw, Pill, TestTube2, Building2 } from 'lucide-react';
import api from '../utils/api';

// ─── Toast simple ──────────────────────────────────────────────
function useToast() {
  const [msg, setMsg] = useState(null);
  const show = (text, type='success') => { setMsg({ text, type }); setTimeout(() => setMsg(null), 3000); };
  return { msg, success: (t) => show(t,'success'), error: (t) => show(t,'error') };
}

function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-white text-sm font-semibold shadow-lg ${
      msg.type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`}>
      {msg.text}
    </div>
  );
}

// ─── Modal ajout/édition ───────────────────────────────────────
function Modal({ title, fields, onSave, onClose, saving }) {
  const [form, setForm] = useState(() => {
    const init = {};
    fields.forEach(f => init[f.name] = f.default || '');
    return init;
  });
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <X size={18}/>
          </button>
        </div>
        <div className="px-6 py-4 space-y-3">
          {fields.map(f => (
            <div key={f.name}>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                {f.label} {f.required && <span className="text-red-400">*</span>}
              </label>
              {f.type === 'select' ? (
                <select value={form[f.name]} onChange={e => setForm(p => ({...p, [f.name]: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none">
                  <option value="">Choisir...</option>
                  {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea value={form[f.name]} onChange={e => setForm(p => ({...p, [f.name]: e.target.value}))}
                  rows={2} placeholder={f.placeholder}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none resize-none"/>
              ) : (
                <input type={f.type||'text'} value={form[f.name]}
                  onChange={e => setForm(p => ({...p, [f.name]: e.target.value}))}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none"/>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
            Annuler
          </button>
          <button onClick={() => onSave(form)} disabled={saving}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// ONGLET MÉDICAMENTS
// ════════════════════════════════════════════════════════════
const CLASSES = ['Antibiotique','Antipaludéen','Antalgique/Antipyrétique','Anti-inflammatoire AINS',
  'Antidiabétique','Antihypertenseur','Antiulcéreux IPP','Antiparasitaire','Antifongique',
  'Antirétroviral','Corticoïde','Vitamine','Diurétique','Antitussif','Antiépileptique',
  'Antipsychotique','Antidépresseur','Utérotonique','Contraceptif','Antituberculeux',
  'Antiémétique','Antidiarrhéique','Antispasmodique','Antihistaminique','Cardiotonique',
  'Hypolipémiant','Bronchodilatateur','Soluté de remplissage','Anesthésique','Autre'];

const FORMES = ['Comprimé','Gélule','Sirop','Injectable','Suspension','Crème','Pommade',
  'Collyre','Aérosol','Sachet','Perfusion','Spray sublingual','Suppositoire','Patch','Autre'];

function OngletMedicaments({ toast }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [classe, setClasse] = useState('');
  const [page, setPage]     = useState(1);
  const [modal, setModal]   = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-meds', search, classe, page],
    queryFn: async () => {
      const p = new URLSearchParams({ page, limit:50 });
      if (search) p.set('search', search);
      if (classe) p.set('classe', classe);
      const { data } = await api.get(`/admin/medicaments?${p}`);
      return data;
    },
  });

  const { mutate: add, isPending: adding } = useMutation({
    mutationFn: (form) => api.post('/admin/medicaments', form),
    onSuccess: () => { qc.invalidateQueries(['admin-meds']); setModal(false); toast.success('Médicament ajouté !'); },
    onError: (e) => toast.error(e.response?.data?.error || 'Erreur'),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id) => api.delete(`/admin/medicaments/${id}`),
    onSuccess: () => { qc.invalidateQueries(['admin-meds']); toast.success('Médicament retiré.'); },
  });

  const meds   = data?.data || [];
  const total  = data?.total || 0;
  const pages  = data?.pages || 1;

  // Grouper par classe
  const grouped = meds.reduce((acc, m) => {
    const k = m.classeTherapeutique || 'Autre';
    if (!acc[k]) acc[k] = [];
    acc[k].push(m); return acc;
  }, {});

  return (
    <div>
      {modal && (
        <Modal title="Ajouter un médicament"
          fields={[
            { name:'nomCommercial', label:'Nom commercial', required:true, placeholder:'Ex: Amoxicilline 500mg' },
            { name:'dci',           label:'DCI (molécule)',  required:true, placeholder:'Ex: Amoxicilline' },
            { name:'classeTherapeutique', label:'Classe thérapeutique', type:'select', options:CLASSES },
            { name:'forme',         label:'Forme galénique', type:'select', options:FORMES },
            { name:'dosage',        label:'Dosage',          placeholder:'Ex: 500mg' },
            { name:'laboratoireFabricant', label:'Laboratoire', placeholder:'Ex: Sanofi' },
          ]}
          onSave={add} onClose={() => setModal(false)} saving={adding}
        />
      )}

      {/* Barre de recherche */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input type="text" placeholder="Rechercher un médicament..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none"/>
        </div>
        <select value={classe} onChange={e => { setClasse(e.target.value); setPage(1); }}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none">
          <option value="">Toutes les classes</option>
          {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
          <Plus size={15}/> Ajouter
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-4">{total} médicament(s) dans le catalogue</p>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      ) : meds.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Pill size={40} className="mx-auto mb-3 opacity-30"/>
          <p>Aucun médicament. Cliquez "Ajouter" pour commencer.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([cls, items]) => (
          <div key={cls} className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"/>
              <h3 className="font-bold text-sm text-gray-700 uppercase tracking-wider">{cls} ({items.length})</h3>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              {items.map((m, i) => (
                <div key={m.id} className={`flex items-center gap-3 px-4 py-3 ${i < items.length-1 ? 'border-b border-gray-50' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900">{m.nomCommercial}</p>
                    <p className="text-xs text-gray-400">{m.dci} · {m.forme} · {m.dosage}</p>
                  </div>
                  <span className="text-xs text-gray-400 hidden sm:block">{m.laboratoireFabricant}</span>
                  <button onClick={() => { if(window.confirm('Supprimer ?')) remove(m.id); }}
                    className="p-1.5 text-red-300 hover:text-red-500 rounded-lg transition-colors shrink-0">
                    <Trash2 size={14}/>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {pages > 1 && (
        <div className="flex justify-center gap-3 mt-6">
          <button disabled={page===1} onClick={() => setPage(p=>p-1)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40">← Préc.</button>
          <span className="px-4 py-2 text-sm text-gray-500">Page {page}/{pages}</span>
          <button disabled={page>=pages} onClick={() => setPage(p=>p+1)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40">Suiv. →</button>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// ONGLET EXAMENS
// ════════════════════════════════════════════════════════════
const CATS_EXAMENS = ['Hématologie','Biochimie','Sérologie','Parasitologie','Bactériologie',
  'Urologie','Hormonologie','Imagerie','Anatomopathologie','Autre'];

function OngletExamens({ toast }) {
  const qc = useQueryClient();
  const [search, setSearch]   = useState('');
  const [categorie, setCat]   = useState('');
  const [modal, setModal]     = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-examens', search, categorie],
    queryFn: async () => {
      const p = new URLSearchParams({ limit:200 });
      if (search)   p.set('search', search);
      if (categorie) p.set('categorie', categorie);
      const { data } = await api.get(`/admin/examens?${p}`);
      return data;
    },
  });

  const { mutate: add, isPending: adding } = useMutation({
    mutationFn: (form) => api.post('/admin/examens', form),
    onSuccess: () => { qc.invalidateQueries(['admin-examens']); setModal(false); toast.success('Examen ajouté !'); },
    onError: (e) => toast.error(e.response?.data?.error || 'Erreur'),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id) => api.delete(`/admin/examens/${id}`),
    onSuccess: () => { qc.invalidateQueries(['admin-examens']); toast.success('Examen retiré.'); },
  });

  const examens = data?.data || [];
  const total   = data?.total || 0;

  const grouped = examens.reduce((acc, e) => {
    const k = e.categorie || 'Autre';
    if (!acc[k]) acc[k] = [];
    acc[k].push(e); return acc;
  }, {});

  return (
    <div>
      {modal && (
        <Modal title="Ajouter un examen"
          fields={[
            { name:'nom',       label:'Nom de l\'examen',  required:true, placeholder:'Ex: Numération Formule Sanguine' },
            { name:'categorie', label:'Catégorie',          required:true, type:'select', options:CATS_EXAMENS },
            { name:'codeAzamed',label:'Code AZAMED',        placeholder:'Ex: HEMA-001 (auto si vide)' },
            { name:'description',label:'Description',       type:'textarea', placeholder:'Description courte...' },
          ]}
          onSave={add} onClose={() => setModal(false)} saving={adding}
        />
      )}

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input type="text" placeholder="Rechercher un examen..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none"/>
        </div>
        <select value={categorie} onChange={e => setCat(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none">
          <option value="">Toutes catégories</option>
          {CATS_EXAMENS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700">
          <Plus size={15}/> Ajouter
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-4">{total} examen(s) dans le catalogue</p>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      ) : examens.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <TestTube2 size={40} className="mx-auto mb-3 opacity-30"/>
          <p>Aucun examen.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-purple-500"/>
              <h3 className="font-bold text-sm text-gray-700 uppercase tracking-wider">{cat} ({items.length})</h3>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              {items.map((e, i) => (
                <div key={e.id} className={`flex items-center gap-3 px-4 py-3 ${i < items.length-1 ? 'border-b border-gray-50' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900">{e.nom}</p>
                    <p className="text-xs text-gray-400">{e.codeAzamed}</p>
                  </div>
                  <button onClick={() => { if(window.confirm('Supprimer ?')) remove(e.id); }}
                    className="p-1.5 text-red-300 hover:text-red-500 rounded-lg transition-colors shrink-0">
                    <Trash2 size={14}/>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// ONGLET SERVICES
// ════════════════════════════════════════════════════════════
const CATS_SERVICES = ['Médecine générale','Spécialité médicale','Spécialité chirurgicale',
  'Gynécologie-Obstétrique','Pédiatrie','Plateau technique','Hospitalisation',
  'Programmes Cameroun','Prévention','Autre'];

function OngletServices({ toast }) {
  const qc = useQueryClient();
  const [search, setSearch]  = useState('');
  const [categorie, setCat]  = useState('');
  const [modal, setModal]    = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-services', search, categorie],
    queryFn: async () => {
      const p = new URLSearchParams({ limit:200 });
      if (search)    p.set('search', search);
      if (categorie) p.set('categorie', categorie);
      const { data } = await api.get(`/admin/services?${p}`);
      return data;
    },
  });

  const { mutate: add, isPending: adding } = useMutation({
    mutationFn: (form) => api.post('/admin/services', form),
    onSuccess: () => { qc.invalidateQueries(['admin-services']); setModal(false); toast.success('Service ajouté !'); },
    onError: (e) => toast.error(e.response?.data?.error || 'Erreur'),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id) => api.delete(`/admin/services/${id}`),
    onSuccess: () => { qc.invalidateQueries(['admin-services']); toast.success('Service retiré.'); },
  });

  const services = data?.data || [];
  const total    = data?.total || 0;

  const grouped = services.reduce((acc, s) => {
    const k = s.categorie || 'Autre';
    if (!acc[k]) acc[k] = [];
    acc[k].push(s); return acc;
  }, {});

  return (
    <div>
      {modal && (
        <Modal title="Ajouter un service médical"
          fields={[
            { name:'nom',        label:'Nom du service',  required:true, placeholder:'Ex: Consultation médecine générale' },
            { name:'categorie',  label:'Catégorie',        required:true, type:'select', options:CATS_SERVICES },
            { name:'description',label:'Description',      type:'textarea', placeholder:'Description courte...' },
          ]}
          onSave={add} onClose={() => setModal(false)} saving={adding}
        />
      )}

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input type="text" placeholder="Rechercher un service..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none"/>
        </div>
        <select value={categorie} onChange={e => setCat(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none">
          <option value="">Toutes catégories</option>
          {CATS_SERVICES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700">
          <Plus size={15}/> Ajouter
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-4">{total} service(s) dans le catalogue</p>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      ) : services.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Building2 size={40} className="mx-auto mb-3 opacity-30"/>
          <p>Aucun service.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-teal-500"/>
              <h3 className="font-bold text-sm text-gray-700 uppercase tracking-wider">{cat} ({items.length})</h3>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              {items.map((s, i) => (
                <div key={s.id} className={`flex items-center gap-3 px-4 py-3 ${i < items.length-1 ? 'border-b border-gray-50' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900">{s.nom}</p>
                    {s.description && <p className="text-xs text-gray-400 truncate">{s.description}</p>}
                  </div>
                  <button onClick={() => { if(window.confirm('Supprimer ?')) remove(s.id); }}
                    className="p-1.5 text-red-300 hover:text-red-500 rounded-lg transition-colors shrink-0">
                    <Trash2 size={14}/>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ════════════════════════════════════════════════════════════
export default function CataloguePage() {
  const [tab, setTab] = useState('medicaments');
  const toast = useToast();
  const qc    = useQueryClient();

  const { mutate: seedAll, isPending: seeding } = useMutation({
    mutationFn: () => api.post('/admin/seed-catalogue'),
    onSuccess: (res) => {
      qc.invalidateQueries(['admin-meds']);
      qc.invalidateQueries(['admin-examens']);
      qc.invalidateQueries(['admin-services']);
      const r = res.data?.result || {};
      toast.success(`Catalogue chargé : ${r.medicaments||0} méds, ${r.examens||0} examens, ${r.services||0} services`);
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Erreur chargement catalogue'),
  });

  const TABS = [
    { key:'medicaments', label:'💊 Médicaments',      color:'blue'   },
    { key:'examens',     label:'🔬 Examens',           color:'purple' },
    { key:'services',    label:'🏥 Services médicaux', color:'teal'   },
  ];

  const tabStyle = (key) => {
    const colors = { blue:'bg-blue-600', purple:'bg-purple-600', teal:'bg-teal-600' };
    const t = TABS.find(t => t.key === key);
    return tab === key
      ? `${colors[t?.color || 'blue']} text-white`
      : 'bg-gray-100 text-gray-600 hover:bg-gray-200';
  };

  return (
    <div>
      <Toast msg={toast.msg}/>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catalogue médical</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Gérez les médicaments, examens et services disponibles pour les établissements
          </p>
        </div>
        <button
          onClick={() => {
            if (window.confirm('Charger le catalogue complet Cameroun ? (médicaments, examens, services)')) {
              seedAll();
            }
          }}
          disabled={seeding}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 disabled:opacity-50"
        >
          <RefreshCw size={15} className={seeding ? 'animate-spin' : ''}/>
          {seeding ? 'Chargement...' : '⚡ Charger catalogue Cameroun'}
        </button>
      </div>

      {/* Explication */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-800 leading-relaxed">
        <strong>Comment ça marche :</strong><br/>
        1. Cliquez <strong>"⚡ Charger catalogue Cameroun"</strong> pour pré-remplir avec tous les médicaments, examens et services existants.<br/>
        2. Vous pouvez ensuite ajouter, modifier ou supprimer des entrées.<br/>
        3. Les établissements de santé voient ce catalogue dans leur tableau de bord et cochent ce qu'ils proposent.<br/>
        4. Tout ce qui est coché est automatiquement visible dans le site public et l'application mobile.
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${tabStyle(t.key)}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {tab === 'medicaments' && <OngletMedicaments toast={toast}/>}
      {tab === 'examens'     && <OngletExamens     toast={toast}/>}
      {tab === 'services'    && <OngletServices    toast={toast}/>}
    </div>
  );
}
