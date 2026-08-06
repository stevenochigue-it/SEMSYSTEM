import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Menu, LogOut, Clock, Calendar } from 'lucide-react';
import { format } from '../../utils/dateTime';

interface NavbarProps {
  onMenuClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!user) return null;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm no-print">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
          aria-label="Toggle Menu"
        >
          <Menu className="h-6 w-6 text-slate-600" />
        </button>
        <div className="hidden items-center gap-5 text-sm text-slate-500 md:flex">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="font-medium">{format(time, 'YYYY-MM-DD')}</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-200" />
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="font-semibold text-slate-700">{format(time, 'hh:mm:ss A')}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Profile Info */}
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-800">{user.full_name}</p>
          <p className="text-[11px] font-medium text-blue-600 uppercase tracking-wider">{user.role}</p>
        </div>

        <div className="h-8 w-[1px] bg-slate-200" />

        {/* Quick Log Out */}
        <button
          onClick={logout}
          title="Logout"
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-600"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};


