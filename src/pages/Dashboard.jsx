// src/pages/Dashboard.jsx — Admin avec vues globales + abonnés
import { useQuery } from '@tanstack/react-query';
import { Building2, Users, Newspaper, Pill, Activity, Eye, TrendingUp, UserCheck, Stethoscope, Globe } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../utils/api';

function StatCard({ icon, label, value, color, sub }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900">{value ?? '…'}</p>
        <p className="text-sm text-gray-500 truncate">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => { const { data } = await api.get('/admin/dashboard'); return data; },
    refetchInterval: 30000,
  });

  const { data: analytics } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => { const { data } = await api.get('/admin/analytics?jours=30'); return data; },
    refetchInterval: 60000,
  });

  const typeData       = (stats?.parType || []).map((t) => ({ name: t.typeStructure.replace('_',' '), count: t._count }));
  const topRecherches  = (analytics?.recherches || []).slice(0, 10);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 text-sm mt-1">Vue d'ensemble de la plateforme AZAMED</p>
      </div>

      {/* Vues globales — bannière principale */}
      <div className="bg-gradient-to-r from-primary-700 to-primary-500 rounded-2xl p-6 mb-6 text-white">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Globe size={20}/> Vues de la plateforme
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center bg-white/10 rounded-xl py-4">
            <p className="text-3xl font-extrabold">{stats?.vuesGlobales?.total?.toLocaleString() ?? '—'}</p>
            <p className="text-primary-100 text-sm mt-1">Total toutes pages</p>
          </div>
          <div className="text-center bg-white/10 rounded-xl py-4">
            <p className="text-3xl font-extrabold">{stats?.vuesGlobales?.trente_jours?.toLocaleString() ?? '—'}</p>
            <p className="text-primary-100 text-sm mt-1">30 derniers jours</p>
          </div>
          <div className="text-center bg-white/10 rounded-xl py-4">
            <p className="text-3xl font-extrabold">{stats?.vuesGlobales?.sept_jours?.toLocaleString() ?? '—'}</p>
            <p className="text-primary-100 text-sm mt-1">7 derniers jours</p>
          </div>
        </div>
      </div>

      {/* Stats abonnés */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={<Users size={22} className="text-primary-600"/>}
          label="Total abonnés inscrits" value={stats?.totalAbonnes}
          color="bg-primary-50" sub="Médecins + Utilisateurs"/>
        <StatCard icon={<UserCheck size={22} className="text-green-600"/>}
          label="Utilisateurs" value={stats?.totalUtilisateurs}
          color="bg-green-50" sub="Comptes grand public"/>
        <StatCard icon={<Stethoscope size={22} className="text-blue-600"/>}
          label="Médecins inscrits" value={stats?.totalMedecins}
          color="bg-blue-50" sub="Professionnels de santé"/>
      </div>

      {/* Stats plateforme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Building2 size={22} className="text-primary-600"/>}
          label="Établissements" value={stats?.totalStructures}
          color="bg-primary-50"/>
        <StatCard icon={<Eye size={22} className="text-purple-600"/>}
          label="Vues aujourd'hui" value={stats?.vuesToday ?? '—'}
          color="bg-purple-50" sub="Fiches structures"/>
        <StatCard icon={<Newspaper size={22} className="text-blue-600"/>}
          label="Publications" value={stats?.totalPosts}
          color="bg-blue-50"/>
        <StatCard icon={<Activity size={22} className="text-orange-600"/>}
          label="Non vérifiés" value={stats?.nonVerifies}
          color="bg-orange-50" sub="En attente"/>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Structures par type */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Établissements par type</h2>
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={typeData} margin={{ top:0, right:0, bottom:35, left:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="name" tick={{ fontSize:10 }} angle={-30} textAnchor="end" interval={0}/>
                <YAxis tick={{ fontSize:12 }}/>
                <Tooltip/>
                <Bar dataKey="count" fill="#0284c7" radius={[4,4,0,0]} name="Nombre"/>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
              Chargement des données...
            </div>
          )}
        </div>

        {/* Top recherches */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Top recherches — 30 jours</h2>
          {topRecherches.length > 0 ? (
            <div className="space-y-2">
              {topRecherches.map((r, i) => (
                <div key={r.query} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-5 text-right shrink-0">{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm text-gray-800 font-medium truncate">{r.query}</span>
                      <span className="text-xs text-gray-500 ml-2 shrink-0">{r._count} fois</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-400 rounded-full transition-all"
                        style={{ width:`${Math.round((r._count/(topRecherches[0]?._count||1))*100)}%` }}/>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
              Aucune recherche enregistrée
            </div>
          )}
        </div>
      </div>

      {/* Inscriptions récentes */}
      {stats?.inscriptionsRecentes?.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Inscriptions récentes</h2>
          <div className="divide-y divide-gray-50">
            {stats.inscriptionsRecentes.map((s) => (
              <div key={s.id} className="flex items-center gap-3 py-3">
                <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-primary-700 font-bold text-sm">{s.nomCommercial.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{s.nomCommercial}</p>
                  <p className="text-xs text-gray-400">{s.typeStructure} · {s.ville}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.isVerified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {s.isVerified ? '✓ Vérifié' : 'En attente'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
