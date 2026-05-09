import { useState, useRef, useEffect } from 'react';
import { LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handle = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  if (!user) return null;

  const initials = (user.name || user.email)
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="
          flex items-center gap-2.5 px-3 py-2 rounded-xl
          hover:bg-surface-200 transition-all duration-200
        "
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-lg"
          style={{ background: user.avatar_color }}
        >
          {initials}
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-sm font-bold text-surface-900 leading-tight">
            {user.name || 'User'}
          </p>
          <p className="text-[10px] text-surface-500 leading-tight">{user.email}</p>
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-surface-50 border border-surface-200 rounded-2xl p-2 z-50 animate-fade-in-up shadow-md">
          <div className="px-3 py-3 border-b border-surface-200 mb-1">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                style={{ background: user.avatar_color }}
              >
                {initials}
              </div>
              <div>
                <p className="text-sm font-bold text-surface-900">{user.name || 'User'}</p>
                <p className="text-xs text-surface-500 font-medium">{user.email}</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => { logout(); setOpen(false); }}
            className="
              w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold
              text-accent-rose hover:bg-accent-rose/10
              transition-colors duration-200
            "
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
