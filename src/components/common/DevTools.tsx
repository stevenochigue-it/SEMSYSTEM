import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  Wrench,
  LayoutDashboard,
  GraduationCap,
  UserCog,
  Users,
  ClipboardList,
  BarChart3,
  UserCheck,
  ShieldCheck,
  X,
  RefreshCw,
  Zap,
  Lock,
  GripVertical,
  ChevronUp,
  QrCode,
  Shield,
  Briefcase,
  Sparkles,
  Trash2,
} from 'lucide-react';

interface NavigationItem {
  name: string;
  path: string;
  roleRequired?: 'admin' | 'guard';
  icon: React.ElementType;
}

const ADMIN_NAV_ITEMS: NavigationItem[] = [
  { name: 'Dashboard', path: '/dashboard', roleRequired: 'admin', icon: LayoutDashboard },
  { name: 'Enrollment Dashboard', path: '/enrollment-dashboard', roleRequired: 'admin', icon: GraduationCap },
  { name: 'Teachers & Personnel', path: '/teachers', roleRequired: 'admin', icon: UserCog },
  { name: 'Students', path: '/students', roleRequired: 'admin', icon: Users },
  { name: 'Attendance Logs', path: '/attendance', roleRequired: 'admin', icon: ClipboardList },
  { name: 'Reports', path: '/reports', roleRequired: 'admin', icon: BarChart3 },
  { name: 'User Management', path: '/users', roleRequired: 'admin', icon: UserCheck },
];

const GUARD_NAV_ITEMS: NavigationItem[] = [
  { name: 'Gate Portal', path: '/gate-monitor', roleRequired: 'guard', icon: ShieldCheck },
];

export const DevTools: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isEnrollmentSeeding, setIsEnrollmentSeeding] = useState(false);
  const [isEnrollmentClearing, setIsEnrollmentClearing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, switchRole, logout } = useAuth();
  const { refreshData, seedMockAttendance, clearMockAttendance, seedMockEnrollment, clearMockEnrollment } = useData();

  // Position state for dragging
  const [position, setPosition] = useState({
    x: typeof window !== 'undefined' ? Math.max(16, window.innerWidth - 260) : 20,
    y: typeof window !== 'undefined' ? Math.max(16, window.innerHeight - 70) : 20,
  });

  const [isDragging, setIsDragging] = useState(false);
  const hasDragged = useRef(false);
  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0,
  });

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    hasDragged.current = false;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasDragged.current = true;
      }

      const newX = Math.max(10, Math.min(window.innerWidth - 250, dragRef.current.posX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 60, dragRef.current.posY + dy));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleJump = (item: NavigationItem) => {
    if (item.path === '/login') {
      logout();
    } else if (item.roleRequired && (!user || user.role !== item.roleRequired)) {
      switchRole(item.roleRequired);
    }
    navigate(item.path);
    setIsOpen(false);
  };

  const handleRoleSwitch = (role: 'admin' | 'guard') => {
    switchRole(role);
    if (role === 'guard' && location.pathname !== '/gate-monitor') {
      navigate('/gate-monitor');
    } else if (role === 'admin' && location.pathname === '/gate-monitor') {
      navigate('/dashboard');
    }
  };

  const handleTriggerMockScan = () => {
    if (user?.role !== 'guard' || location.pathname !== '/gate-monitor') {
      switchRole('guard');
      navigate('/gate-monitor');
    }
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('sem-trigger-mock-scan'));
    }, 150);
    setIsOpen(false);
  };

  const handleSeedReportsData = async () => {
    try {
      setIsSeeding(true);
      await seedMockAttendance();
      if (user?.role !== 'admin') {
        switchRole('admin');
      }
      navigate('/reports');
    } catch (err) {
      console.error('Seeding error:', err);
    } finally {
      setIsSeeding(false);
      setIsOpen(false);
    }
  };

  const handleClearReportsData = async () => {
    try {
      setIsClearing(true);
      await clearMockAttendance();
      if (user?.role !== 'admin') {
        switchRole('admin');
      }
      navigate('/reports');
    } catch (err) {
      console.error('Clearing error:', err);
    } finally {
      setIsClearing(false);
      setIsOpen(false);
    }
  };

  const handleSeedEnrollmentData = async () => {
    try {
      setIsEnrollmentSeeding(true);
      await seedMockEnrollment();
      if (user?.role !== 'admin') switchRole('admin');
      navigate('/enrollment-dashboard');
    } catch (err) {
      console.error('Seed enrollment error:', err);
    } finally {
      setIsEnrollmentSeeding(false);
      setIsOpen(false);
    }
  };

  const handleClearEnrollmentData = async () => {
    try {
      setIsEnrollmentClearing(true);
      await clearMockEnrollment();
      if (user?.role !== 'admin') switchRole('admin');
      navigate('/enrollment-dashboard');
    } catch (err) {
      console.error('Clear enrollment error:', err);
    } finally {
      setIsEnrollmentClearing(false);
      setIsOpen(false);
    }
  };

  return (
    <div
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className="fixed z-[9999] no-print touch-none select-none"
    >
      {/* Draggable Compact Pill */}
      <div
        onMouseDown={handleMouseDown}
        className={`flex items-center gap-1.5 bg-slate-900/95 hover:bg-slate-900 text-white p-1.5 pl-2.5 rounded-full shadow-xl border border-slate-700/90 backdrop-blur-md transition-all cursor-move ${
          isDragging ? 'opacity-80 scale-95 shadow-2xl' : ''
        }`}
      >
        <GripVertical className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300" />
        
        <button
          type="button"
          onClick={() => {
            if (!hasDragged.current) {
              setIsOpen((prev) => !prev);
            }
          }}
          className="flex items-center gap-2 pr-1 focus:outline-none"
        >
          <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
            <Wrench className="w-3 h-3 text-white" />
          </div>
          <span className="text-xs font-bold text-slate-100 tracking-tight">Cyberboard</span>
          <ChevronUp className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Mini Floating Quick Menu (Popup) */}
      {isOpen && (
        <div className="absolute bottom-full mb-2 right-0 sm:right-auto sm:left-0 bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-800 w-64 max-h-[80vh] overflow-y-auto p-2.5 text-xs space-y-3 animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="flex items-center justify-between px-1 pb-2 border-b border-slate-800/80">
            <span className="font-extrabold text-[11px] uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-blue-400" /> Dev Quick Jump
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Role Toggle */}
          <div className="flex items-center justify-between bg-slate-800/60 p-1.5 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 pl-1">Active Role:</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => handleRoleSwitch('admin')}
                className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold transition-all ${
                  user?.role === 'admin' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleRoleSwitch('guard')}
                className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold transition-all ${
                  user?.role === 'guard' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                Guard
              </button>
            </div>
          </div>

          {/* SECTION: Guard Portal */}
          <div className="space-y-1.5 bg-slate-950/40 p-2 rounded-xl border border-slate-800/60">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 px-1">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span>Guard Portal</span>
            </div>

            <div className="space-y-1 pt-0.5">
              {GUARD_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => handleJump(item)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0 opacity-90 text-emerald-400" />
                    <span className="truncate flex-1 text-[11px]">{item.name}</span>
                  </button>
                );
              })}

              {/* Special Guard Action: Mock QR Scan */}
              <button
                type="button"
                onClick={handleTriggerMockScan}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-[11px] transition-all"
              >
                <QrCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Mock Scan Student</span>
              </button>
            </div>
          </div>

          {/* SECTION: Admin Pages */}
          <div className="space-y-1.5 bg-slate-950/40 p-2 rounded-xl border border-slate-800/60">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-400 px-1">
              <Briefcase className="w-3 h-3 text-blue-400" />
              <span>Admin Pages</span>
            </div>

            <div className="space-y-0.5">
              {ADMIN_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => handleJump(item)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                    <span className="truncate flex-1 text-[11px]">{item.name}</span>
                  </button>
                );
              })}

              {/* Special Admin Actions: Seed & Remove Mock Reports Data */}
              <div className="flex gap-1.5 mt-1">
                <button
                  type="button"
                  onClick={handleSeedReportsData}
                  disabled={isSeeding || isClearing}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 font-bold text-[10px] transition-all disabled:opacity-50"
                  title="Generate mock attendance records for reports"
                >
                  <Sparkles className={`w-3.5 h-3.5 text-blue-400 shrink-0 ${isSeeding ? 'animate-spin' : ''}`} />
                  <span className="truncate">{isSeeding ? 'Seeding...' : 'Seed Reports'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearReportsData}
                  disabled={isSeeding || isClearing}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-[10px] transition-all disabled:opacity-50"
                  title="Remove all mock attendance reports data"
                >
                  <Trash2 className={`w-3.5 h-3.5 text-rose-400 shrink-0 ${isClearing ? 'animate-spin' : ''}`} />
                  <span className="truncate">{isClearing ? 'Clearing...' : 'Clear Reports'}</span>
                </button>
              </div>

              {/* Special Admin Actions: Seed & Clear Mock Enrollment Data */}
              <div className="flex gap-1.5 mt-1">
                <button
                  type="button"
                  onClick={handleSeedEnrollmentData}
                  disabled={isEnrollmentSeeding || isEnrollmentClearing}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 font-bold text-[10px] transition-all disabled:opacity-50"
                  title="Seed mock enrollment & population data"
                >
                  <Sparkles className={`w-3.5 h-3.5 text-indigo-400 shrink-0 ${isEnrollmentSeeding ? 'animate-spin' : ''}`} />
                  <span className="truncate">{isEnrollmentSeeding ? 'Seeding...' : 'Seed Enrollment'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearEnrollmentData}
                  disabled={isEnrollmentSeeding || isEnrollmentClearing}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-[10px] transition-all disabled:opacity-50"
                  title="Remove mock enrollment data"
                >
                  <Trash2 className={`w-3.5 h-3.5 text-rose-400 shrink-0 ${isEnrollmentClearing ? 'animate-spin' : ''}`} />
                  <span className="truncate">{isEnrollmentClearing ? 'Clearing...' : 'Clear Enrollment'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* System Actions & Shared Links */}
          <div className="pt-2 border-t border-slate-800/80 space-y-1">
            <button
              type="button"
              onClick={() => handleJump({ name: 'Login Page', path: '/login', icon: Lock })}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left font-semibold transition-all ${
                location.pathname === '/login'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Lock className="w-3.5 h-3.5 shrink-0 opacity-80" />
              <span className="truncate text-[11px]">Login Page</span>
            </button>

            <button
              type="button"
              onClick={() => {
                refreshData();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-[10px] font-bold transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Refresh App Data</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
};


