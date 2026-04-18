// src/pages/Dashboard.jsx — Tableau de bord admin
import { useQuery } from '@tanstack/react-query';
import { Building2, Users, Newspaper, Pill, TestTube2, Activity, TrendingUp, Eye } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
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

  // Données pour le graphique des types de structures
  const typeData = (stats?.parType || []).map((t) => ({
    name: t.typeStructure.replace('_', ' '),
    count: t._count,
  }));

  // Top recherches
  const topRecherches = (analytics?.recherches || []).slice(0, 10);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 text-sm mt-1">Vue d'ensemble de la plateforme AZAMED</p>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Building2 size={22} className="text-primary-600"/>}
          label="Établissements inscrits"
          value={stats?.totalStructures}
          color="bg-primary-50"
        />
        <StatCard
          icon={<Eye size={22} className="text-purple-600"/>}
          label="Vues aujourd'hui"
          value={stats?.vuesToday ?? '—'}
          color="bg-purple-50"
          sub="Sur toutes les fiches"
        />
        <StatCard
          icon={<Newspaper size={22} className="text-blue-600"/>}
          label="Publications actives"
          value={stats?.totalPosts}
          color="bg-blue-50"
        />
        <StatCard
          icon={<Activity size={22} className="text-green-600"/>}
          label="Inscrits aujourd'hui"
          value={stats?.inscriptionsAujourdhui}
          color="bg-green-50"
        />
      </div>

      {/* Ligne 2 stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={<Pill size={22} className="text-orange-600"/>}
          label="Médicaments catalogue"
          value={stats?.totalMedicaments}
          color="bg-orange-50"
        />
        <StatCard
          icon={<TestTube2 size={22} className="text-teal-600"/>}
          label="Examens catalogue"
          value={stats?.totalExamens}
          color="bg-teal-50"
        />
        <StatCard
          icon={<TrendingUp size={22} className="text-red-500"/>}
          label="Établissements non vérifiés"
          value={stats?.nonVerifies ?? '—'}
          color="bg-red-50"
          sub="En attente de vérification"
        />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Types de structures */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Structures par type</h2>
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={typeData} margin={{ top: 0, right: 0, bottom: 30, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end"/>
                <YAxis tick={{ fontSize: 12 }}/>
                <Tooltip/>
                <Bar dataKey="count" fill="#0284c7" radius={[4,4,0,0]} name="Nombre"/>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">Chargement...</div>
          )}
        </div>

        {/* Top recherches */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Top 10 recherches (30 jours)</h2>
          {topRecherches.length > 0 ? (
            <div className="space-y-2">
              {topRecherches.map((r, i) => (
                <div key={r.query} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-5 text-right shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm text-gray-800 truncate">{r.query}</span>
                      <span className="text-xs text-gray-500 shrink-0 ml-2">{r._count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-400 rounded-full"
                        style={{ width: `${Math.round((r._count / (topRecherches[0]?._count || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">Aucune donnée</div>
          )}
        </div>
      </div>

      {/* Inscriptions récentes */}
      {stats?.inscriptionsRecentes?.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Inscriptions récentes</h2>
          <div className="space-y-2">
            {stats.inscriptionsRecentes.map((s) => (
              <div key={s.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-primary-700 font-bold text-xs">{s.nomCommercial.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{s.nomCommercial}</p>
                  <p className="text-xs text-gray-400">{s.typeStructure} · {s.ville}</p>
                </div>
                <span className={s.isVerified ? 'badge-green' : 'badge-gray'}>
                  {s.isVerified ? 'Vérifié' : 'Non vérifié'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
