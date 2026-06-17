import { Menu, Bell, LogOut, User, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-navy/80 backdrop-blur-xl border-b border-navy-border">
      <div className="flex items-center justify-between px-4 lg:px-6 py-3">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick} className="lg:hidden btn-ghost p-2">
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden sm:block">
            <h2 className="text-sm font-semibold text-white">Sistem Analisa Kredit</h2>
            <p className="text-xs text-slate-500">PT BPR BAPERA BATANG</p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button className="btn-ghost p-2 relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-gold rounded-full"></span>
          </button>

          {/* User dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-navy-lighter transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
                <span className="text-navy text-xs font-bold">
                  {user?.fullName?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-white">{user?.fullName || 'User'}</p>
                <p className="text-[10px] text-slate-500">{user?.role || 'N/A'}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-500 hidden md:block" />
            </button>

            {showDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-navy-light border border-navy-border rounded-xl shadow-xl z-20 py-1 animate-fade-in">
                  <div className="px-4 py-2 border-b border-navy-border">
                    <p className="text-sm font-medium">{user?.fullName}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-navy-lighter flex items-center gap-2">
                    <User className="w-4 h-4" /> Profil
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-navy-lighter flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
