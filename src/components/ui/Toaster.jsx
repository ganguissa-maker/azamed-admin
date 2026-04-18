// src/components/ui/Toaster.jsx
import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
let _add = null;
export const toast = {
  success: (msg) => _add?.(msg, 'success'),
  error:   (msg) => _add?.(msg, 'error'),
  info:    (msg) => _add?.(msg, 'info'),
};
export function Toaster() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);
  useEffect(() => { _add = add; return () => { _add = null; }; }, [add]);
  const icons = {
    success: <CheckCircle size={16} className="text-green-500 shrink-0" />,
    error:   <XCircle    size={16} className="text-red-500 shrink-0" />,
    info:    <AlertCircle size={16} className="text-blue-500 shrink-0" />,
  };
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="flex items-center gap-3 bg-white border border-gray-200 shadow-lg rounded-xl px-4 py-3 min-w-[260px] max-w-sm pointer-events-auto">
          {icons[t.type]}
          <span className="text-sm text-gray-800 flex-1">{t.message}</span>
          <button onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))} className="text-gray-400 hover:text-gray-600"><X size={13}/></button>
        </div>
      ))}
    </div>
  );
}
