import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  User,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Building2,
  ScanLine
} from 'lucide-react';

type PortalType = 'gate' | 'admin';

export const LoginPage: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getInitialPortal = (): PortalType => {
    if (location.pathname === '/admin-login') return 'admin';
    return 'gate';
  };

  const [activePortal, setActivePortal] = useState<PortalType>(getInitialPortal());
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);


  const handleTabChange = (portal: PortalType) => {
    setActivePortal(portal);
    setError(null);
    if (portal === 'gate') {
      setUsername('guard');
      setPassword('guard123');
    } else {
      setUsername('admin');
      setPassword('admin123');
    }
  };

  useEffect(() => {
    if (activePortal === 'gate') {
      setUsername('guard');
      setPassword('guard123');
    } else {
      setUsername('ictadmin');
      setPassword('admin123');
    }
  }, []);

  useEffect(() => {
    if (user) {
      if (user.role === 'guard') {
        navigate('/gate-monitor');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await login({ username, password });
      const storedUser = localStorage.getItem('sem_auth_user');
      const authUser = storedUser ? JSON.parse(storedUser) : null;

      if (authUser?.role === 'guard') {
        navigate('/gate-monitor');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="relative flex min-h-screen w-full overflow-hidden">

      {/* â”€â”€ Full-Screen Background: School Building Photo â”€â”€ */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/school-bg.jpg')` }}
      />

      {/* â”€â”€ Overlay: deep blue-green gradient for brand feel â”€â”€ */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, rgba(11,26,61,0.82) 0%, rgba(40,121,200,0.72) 50%, rgba(11,26,61,0.90) 100%)'
        }}
      />

      {/* â”€â”€ Particle dots (CSS only decorative accent) â”€â”€ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(14)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-10"
            style={{
              width: `${Math.random() * 6 + 3}px`,
              height: `${Math.random() * 6 + 3}px`,
              background: '#5aaee8',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* â”€â”€ Main Layout â€” fully centered â”€â”€ */}
      <div className="relative z-10 flex w-full min-h-screen items-center justify-center px-4 py-10">

        <div className="w-full max-w-sm space-y-6">

          {/* â”€â”€ School Logo + Name above card â”€â”€ */}
          <div className="flex flex-col items-center text-center space-y-3">
            <img
              src="/school-logo.jpg"
              alt="SINHS Logo"
              className="w-24 h-24 rounded-full object-cover border-4 border-blue-400/50"
              style={{ boxShadow: '0 0 40px rgba(90,174,232,0.35), 0 10px 40px rgba(0,0,0,0.5)' }}
            />
            <div>
              <p className="text-white font-black text-lg leading-tight">San Isidro National High School</p>
              <p className="text-blue-400 text-[11px] font-bold uppercase tracking-widest mt-0.5">
                Student Gate Entrance Monitoring System
              </p>
              <p className="text-white/30 text-[10px] font-medium mt-0.5">Balingasag, Mis. Or.</p>
            </div>
          </div>

          {/* â”€â”€ Glassmorphism Login Card â”€â”€ */}
          <div
            className="w-full rounded-3xl p-8 space-y-5"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              backdropFilter: 'blur(28px)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >
            {/* Card Title */}
            <div className="text-center">
              <h2 className="text-white font-black text-xl">
                {activePortal === 'gate' ? 'Gate Terminal Login' : 'Admin Portal Login'}
              </h2>
              <p className="text-white/40 text-xs mt-1">
                {activePortal === 'gate'
                  ? 'Sign in to launch the live student scan terminal'
                  : 'Sign in to manage the SINHS monitoring system'}
              </p>
            </div>

            {/* Portal Toggle */}
            <div
              className="grid grid-cols-2 rounded-xl p-1"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <button
                type="button"
                onClick={() => handleTabChange('gate')}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                  activePortal === 'gate'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Gate Monitor
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('admin')}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                  activePortal === 'admin'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                <Building2 className="h-3.5 w-3.5" />
                Admin
              </button>
            </div>

            {/* Portal Badge */}
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2.5"
              style={{ background: 'rgba(90,174,232,0.08)', border: '1px solid rgba(90,174,232,0.2)' }}
            >
              {activePortal === 'gate'
                ? <ScanLine className="h-4 w-4 text-blue-400 shrink-0" />
                : <Building2 className="h-4 w-4 text-blue-400 shrink-0" />
              }
              <p className="text-blue-300 text-[11px] font-semibold">
                {activePortal === 'gate'
                  ? 'Gate Security Officer Login â€” QR scan terminal access'
                  : 'Administrator Login â€” Full system management access'}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 bg-red-500/10 border border-red-500/30">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                <span className="text-red-300 text-xs font-medium">{error}</span>
              </div>
            )}

            {/* Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Username */}
              <div className="space-y-1.5">
                <label htmlFor="username" className="text-white/60 text-[10px] font-bold uppercase tracking-widest">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <input
                    id="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={activePortal === 'gate' ? 'e.g. guard' : 'e.g. admin'}
                    className="w-full rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-white/20 outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = 'rgba(90,174,232,0.6)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-white/60 text-[10px] font-bold uppercase tracking-widest">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                    className="w-full rounded-xl py-3 pl-10 pr-10 text-xs text-white placeholder-white/20 outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = 'rgba(90,174,232,0.6)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all disabled:opacity-60"
                style={{
                  background: isLoading
                    ? 'rgba(90,174,232,0.4)'
                    : 'linear-gradient(135deg, #1a5fa0 0%, #5aaee8 100%)',
                  boxShadow: isLoading ? 'none' : '0 8px 30px rgba(90,174,232,0.35)',
                }}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            {/* Quick Creds */}
            <div
              className="rounded-2xl p-3"
              style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-2">ðŸ”‘ Demo Credentials</p>
              <div className="grid grid-cols-2 gap-2">
                <div className={`p-2 rounded-xl transition-all ${activePortal === 'gate' ? 'bg-blue-500/15 border border-blue-500/30' : 'bg-white/5 border border-white/5'}`}>
                  <p className="text-blue-400 text-[10px] font-black flex items-center gap-1 mb-1">
                    <ShieldCheck className="h-3 w-3" /> Gate
                  </p>
                  <p className="text-white/50 text-[10px]">guard / guard123</p>
                </div>
                <div className={`p-2 rounded-xl transition-all ${activePortal === 'admin' ? 'bg-blue-500/15 border border-blue-500/30' : 'bg-white/5 border border-white/5'}`}>
                  <p className="text-blue-400 text-[10px] font-black flex items-center gap-1 mb-1">
                    <Building2 className="h-3 w-3" /> Admin
                  </p>
                  <p className="text-white/50 text-[10px]">admin / admin123</p>
                </div>
              </div>
            </div>

          </div>

          {/* Footer */}
          <p className="text-center text-white/20 text-[10px]">Â© 2024 SINHS Â· SEM System v2.0</p>

        </div>
      </div>
    </div>
  );
};


