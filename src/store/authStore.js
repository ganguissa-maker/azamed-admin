// src/store/authStore.js
import { create } from 'zustand';
const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('azamed_admin_user') || 'null'),
  token: localStorage.getItem('azamed_admin_token') || null,
  isAuthenticated: !!localStorage.getItem('azamed_admin_token'),
  login: (user, token) => {
    localStorage.setItem('azamed_admin_token', token);
    localStorage.setItem('azamed_admin_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('azamed_admin_token');
    localStorage.removeItem('azamed_admin_user');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
export default useAuthStore;
