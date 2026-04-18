// src/pages/AdminLayout.jsx — avec Examens + Services
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users, Newspaper,
  Pill, TestTube2, Activity, LogOut, Shield, Menu, X, ExternalLink,
} from 'lucide-react';
import useAuthStore from '../store/authStore';

const PUBLIC_URL     = import.meta.env.VITE_PUBLIC_URL     || 'http://localhost:5173';
const STRUCTURES_URL = import.meta.env.VITE_STRUCTURES_URL || 'http://localhost:5174';

const nav = [
  { to:'/',              label:'Tableau de bord', icon:<LayoutDashboard size={17}/>, end:true },
  { to:'/structures',    label:'Établissements',  icon:<Building2 size={17}/> },
  { to:'/visiteurs',     label:'Visiteurs',        icon:<Users size={17}/> },
  { to:'/publications',  label:'Publications',     icon:<Newspaper size={17}/> },
  { divider: true, label: 'Catalogue' },
  { to:'/medicaments',   label:'Médicaments',     icon:<Pill size={17}/> },
  { to:'/examens',       label:'Examens',         icon:<TestTube2 size={17}/> },
  { to:'/services',      label:'Services médicaux',icon:<Activity size={17}/> },
];

function Sidebar({ onClose }) {
  const { logout } = useAuthStore();
  const navigate   = useNavigate();

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <div className="p-5 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-none">AZAMED</p>
            <p className="text-gray-400 text-xs leading-none mt-0.5">Administration</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {nav.map((item, i) => {
          if (item.divider) return (
            <p key={i} className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 pt-4 pb-1">
              {item.label}
            </p>
          );
          return (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }>
              {item.icon} {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-700 space-y-1">
        <a href={PUBLIC_URL} target="_blank" rel="noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors">
          <ExternalLink size={13}/> Site public
        </a>
        <a href={STRUCTURES_URL} target="_blank" rel="noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors">
          <ExternalLink size={13}/> Espace structures
        </a>
        <button onClick={() => { logout(); navigate('/connexion'); }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-900/20 w-full transition-colors mt-1">
          <LogOut size={17}/> Déconnexion
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="hidden md:flex flex-col w-64 fixed top-0 left-0 h-full z-30">
        <Sidebar />
      </aside>
      {open && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="relative w-72 h-full z-50"><Sidebar onClose={() => setOpen(false)} /></aside>
        </div>
      )}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="md:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
          <button onClick={() => setOpen(true)} className="p-1.5 text-gray-500 hover:text-primary-600 rounded-lg">
            <Menu size={22}/>
          </button>
          <Shield size={18} className="text-primary-600"/>
          <span className="font-semibold text-gray-900 text-sm">AZAMED Admin</span>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
