// src/pages/Visiteurs.jsx — Statistiques des visiteurs
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, Search, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../utils/api';

export default function Visiteurs() {
  const [jours, setJours] = useState(30);

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', jours],
    queryFn: async () => {
      const { data } = await api.get(`/admin/analytics?jours=${jours}`);
      return data;
    },
    refetchInterval: 60000,
  });

  const { data: topStructures } = useQuery({
    queryKey: ['top-structures', jours],
    queryFn: async () => {
      const { data } = await api.get(`/admin/top-structures?jours=${jours}`);
      return data;
    },
  });

  const topRecherches = (analytics?.recherches || []).slice(0, 15);
  const topStructData = (topStructures?.data || []).slice(0, 10).map((s) => ({
    name: s.nomCommercial?.substring(0, 15) + (s.nomCommercial?.length > 15 ? '…' : ''),
    vues: s._count || 0,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Statistiques visiteurs</h1>
          <p className="text-gray-500 text-sm">Activité des {jours} derniers jours</p>
        </div>
        <select value={jours} onChange={(e) => setJours(Number(e.target.value))}
          className="input w-auto">
          <option value={7}>7 derniers jours</option>
          <option value={30}>30 derniers jours</option>
          <option value={90}>90 derniers jours</option>
        </select>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card text-center">
          <Eye size={24} className="text-primary-500 mx-auto mb-2"/>
          <p className="text-3xl font-bold text-gray-900">{analytics?.vues?.toLocaleString() ?? '—'}</p>
          <p className="text-sm text-gray-500">Vues totales</p>
          <p className="text-xs text-gray-400 mt-0.5">Sur les {jours} derniers jours</p>
        </div>
        <div className="card text-center">
          <Search size={24} className="text-blue-500 mx-auto mb-2"/>
          <p className="text-3xl font-bold text-gray-900">{analytics?.recherches?.reduce((s, r) => s + r._count, 0)?.toLocaleString() ?? '—'}</p>
          <p className="text-sm text-gray-500">Recherches effectuées</p>
          <p className="text-xs text-gray-400 mt-0.5">Sur les {jours} derniers jours</p>
        </div>
        <div className="card text-center">
          <TrendingUp size={24} className="text-green-500 mx-auto mb-2"/>
          <p className="text-3xl font-bold text-gray-900">
            {analytics?.vues && jours ? Math.round(analytics.vues / jours) : '—'}
          </p>
          <p className="text-sm text-gray-500">Vues par jour (moy.)</p>
          <p className="text-xs text-gray-400 mt-0.5">Moyenne sur la période</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top structures vues */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">
            Établissements les plus consultés
          </h2>
          {topStructData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topStructData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false}/>
                <XAxis type="number" tick={{ fontSize: 11 }}/>
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110}/>
                <Tooltip/>
                <Bar dataKey="vues" fill="#0284c7" radius={[0,4,4,0]} name="Vues"/>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">
              {isLoading ? 'Chargement...' : 'Aucune donnée disponible'}
            </div>
          )}
        </div>

        {/* Top recherches */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Termes les plus recherchés</h2>
          {topRecherches.length > 0 ? (
            <div className="space-y-2.5">
              {topRecherches.map((r, i) => {
                const max = topRecherches[0]?._count || 1;
                const pct = Math.round((r._count / max) * 100);
                return (
                  <div key={r.query} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-5 text-right shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-800 font-medium truncate">{r.query}</span>
                        <span className="text-xs text-gray-500 ml-2 shrink-0">{r._count} fois</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-400 rounded-full transition-all" style={{ width: `${pct}%` }}/>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">
              {isLoading ? 'Chargement...' : 'Aucune recherche enregistrée'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
