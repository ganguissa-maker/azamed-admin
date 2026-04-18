// src/pages/LoginPage.jsx — Admin
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { toast } from '../components/ui/Toaster';
import api from '../utils/api';
import useAuthStore from '../store/authStore';

export default function LoginPage() {
  const [form, setForm]         = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const { login }               = useAuthStore();
  const navigate                = useNavigate();

  const handleChange = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      if (data.user.role !== 'ADMIN') {
        toast.error('Accès refusé. Ce portail est réservé aux administrateurs.');
        return;
      }
      login(data.user, data.token);
      toast.success('Connexion réussie !');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Email ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4 shadow-lg">
            <Shield size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">AZAMED Admin</h1>
          <p className="text-gray-400 text-sm mt-1">Portail d'administration — accès restreint</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse email</label>
              <input type="email" required autoFocus value={form.email} onChange={handleChange('email')}
                placeholder="admin@azamed.com"
                className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} required value={form.password} onChange={handleChange('password')}
                  placeholder="••••••••"
                  className="input pr-11" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full btn-primary py-3 text-base">
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Connexion...</span>
                : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-5">
            Accès réservé aux administrateurs AZAMED
          </p>
        </div>
      </div>
    </div>
  );
}
