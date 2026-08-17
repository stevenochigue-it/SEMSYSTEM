import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FileBarChart,
  UserCheck,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!user) return null;

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Students',
      path: '/students',
      icon: Users,
    },

    {
      name: 'Attendance Log',
      path: '/attendance',
      icon: CalendarDays,
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: FileBarChart,
    },
    {
      name: 'User Accounts',
      path: '/users',
      icon: UserCheck,
    },
  ];

  const filteredMenu = menuItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-45 flex w-64 flex-col bg-[var(--color-sidebar-bg)] text-[var(--color-sidebar-text)] transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 border-b border-blue-950 px-4">
          <img
            src="/school-logo.jpg"
            alt="SINHS Logo"
            className="h-10 w-10 rounded-full object-cover border-2 border-blue-400/60 shrink-0"
          />
          <div>
            <h1 className="text-xs font-bold tracking-wider text-white uppercase">Entrance Monitor</h1>
            <p className="text-[10px] text-blue-400 font-semibold uppercase">School Gate System</p>
          </div>
        </div>

        {/* User Info Card */}
        <div className="mx-4 my-6 rounded-xl bg-blue-950/40 p-4 border border-blue-900/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-800 text-white font-bold uppercase">
              {user.username.slice(0, 2)}
            </div>
            <div className="overflow-hidden">
              <h2 className="text-xs font-semibold text-white truncate">{user.full_name}</h2>
              <p className="text-[10px] text-blue-400 font-medium capitalize mt-0.5">{user.role} Account</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 px-3">
          {filteredMenu.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                    : 'hover:bg-blue-900/35 hover:text-white'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-blue-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Device Status */}
        <div className="mx-4 mb-4">
          <p className="text-[9px] font-bold uppercase tracking-widest text-blue-500/60 mb-3 px-1">
            Device Status
          </p>
          <div className="rounded-xl bg-blue-950/30 border border-blue-900/20 p-3 space-y-2.5">
            {[
              { label: 'QR Code Scanner', status: 'Online',    color: 'bg-green-400' },
              { label: 'Database (MySQL)', status: 'Connected', color: 'bg-green-400' },
              { label: 'LAN Network',      status: 'Connected', color: 'bg-green-400' },
            ].map((device) => (
              <div key={device.label} className="flex items-center justify-between">
                <span className="text-[11px] text-blue-200/80 font-medium">{device.label}</span>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-400">
                  <span className={`h-2 w-2 rounded-full ${device.color} animate-pulse`} />
                  {device.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer / Logout */}
        <div className="border-t border-blue-950 p-4">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-blue-400 transition-colors hover:bg-red-950/20 hover:text-red-300"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4 text-center border border-slate-200">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mx-auto mb-4">
              <LogOut className="h-7 w-7 text-red-600" />
            </div>
            <h2 className="text-lg font-black text-slate-900 mb-1">Confirm Logout</h2>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to log out of the system?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-xl border-2 border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowLogoutConfirm(false); logout(); }}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-colors"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};


