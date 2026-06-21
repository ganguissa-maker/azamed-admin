// src/App.jsx — AZAMED Admin (avec Examens + Services)
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/Toaster';
import useAuthStore from './store/authStore';
import LoginPage    from './pages/LoginPage';
import AdminLayout  from './pages/AdminLayout';
import Dashboard    from './pages/Dashboard';
import Structures   from './pages/Structures';
import Visiteurs    from './pages/Visiteurs';
import Publications from './pages/Publications';
import Medicaments  from './pages/Medicaments';
import Examens      from './pages/Examens';
import Services     from './pages/Services';
import CataloguePage from './pages/CataloguePage'; 
import UtilisateursPage from './pages/UtilisateursPage';
import MedicamentsProposesPage from './pages/MedicamentsProposesPage';// 1. L'import est bien ici

const Guard = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/connexion" />;
  if (user?.role !== 'ADMIN') return <Navigate to="/connexion" />;
  if (user?.role !== 'ADMIN') return <Navigate to="/connexion" />;
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/connexion" element={<LoginPage />} />
        
        {/* Toutes les routes ici profitent du Guard et du AdminLayout */}
        <Route path="/" element={<Guard><AdminLayout /></Guard>}>
          <Route index              element={<Dashboard />} />
          <Route path="structures"  element={<Structures />} />
          <Route path="visiteurs"   element={<Visiteurs />} />
          <Route path="publications" element={<Publications />} />
          <Route path="medicaments" element={<Medicaments />} />
          <Route path="examens"     element={<Examens />} />
          <Route path="services"    element={<Services />} />
          {/* 2. On place la route ici (sans le "/" devant, car elle hérite de la racine) */}
          <Route path="catalogue"   element={<CataloguePage />} />
          <Route path="/utilisateurs" element={<UtilisateursPage/>}/>
          <Route path="medicaments-proposes" element={<MedicamentsProposesPage/>}/>
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
  <Link to="/utilisateurs">👥 Utilisateurs</Link>
}
