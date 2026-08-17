import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  User,
  AlertCircle,
  Eye,
  EyeOff,
  LogIn,
  HelpCircle
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      setError('Please enter both username and password');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await login({ username: username.trim(), password });
      const storedUser = localStorage.getItem('sem_auth_user');
      const authUser = storedUser ? JSON.parse(storedUser) : null;

      if (authUser?.role === 'guard') {
        navigate('/gate-monitor');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };




  return (
    <div className="relative flex min-h-screen w-full overflow-hidden font-sans">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/school-bg.jpg')` }}
      />

      {/* High contrast gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, rgba(10,25,47,0.92) 0%, rgba(15,48,87,0.88) 50%, rgba(10,25,47,0.95) 100%)'
        }}
      />

      {/* Decorative dots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-15"
            style={{
              width: `${Math.random() * 8 + 4}px`,
              height: `${Math.random() * 8 + 4}px`,
              background: '#60a5fa',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Main Centered Container */}
      <div className="relative z-10 flex w-full min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-lg space-y-6 sm:space-y-8">

          {/* School Header */}
          <div className="flex flex-col items-center text-center space-y-4">
            <img
              src="/school-logo.jpg"
              alt="SINHS Logo"
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-blue-400/60 shadow-2xl"
              style={{ boxShadow: '0 0 45px rgba(96,165,250,0.4), 0 10px 40px rgba(0,0,0,0.6)' }}
            />
            <div>
              <h1 className="text-white font-black text-2xl sm:text-3xl md:text-4xl tracking-tight leading-tight">
                San Isidro National High School
              </h1>
              <p className="text-blue-300 font-black text-sm sm:text-base md:text-lg uppercase tracking-widest mt-1">
                School Entrance Monitoring System
              </p>
              <p className="text-white/60 font-semibold text-xs sm:text-sm mt-1">
                Balingasag, Mis. Or.
              </p>
            </div>
          </div>

          {/* Unified Glassmorphism Login Card */}
          <div
            className="w-full rounded-3xl p-6 sm:p-10 space-y-6 shadow-2xl"
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(30px)',
              boxShadow: '0 35px 90px rgba(0,0,0,0.75), inset 0 1px 1px rgba(255,255,255,0.2)',
            }}
          >


            {/* Error Banner */}
            {error && (
              <div className="flex items-center gap-3 rounded-2xl p-4 bg-red-600/30 border-2 border-red-500/60 shadow-lg">
                <AlertCircle className="h-7 w-7 text-red-400 shrink-0" />
                <span className="text-red-100 text-base sm:text-lg font-bold leading-snug">{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Username Input */}
              <div className="space-y-2">
                <label htmlFor="username" className="block text-blue-200 text-base sm:text-lg font-extrabold uppercase tracking-wider">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-blue-300 pointer-events-none" />
                  <input
                    id="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full rounded-2xl py-4 pl-14 pr-5 text-lg sm:text-xl font-bold text-white placeholder-white/40 outline-none transition-all border-2"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderColor: 'rgba(255, 255, 255, 0.25)',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = '#60a5fa'}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)'}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-blue-200 text-base sm:text-lg font-extrabold uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-blue-300 pointer-events-none" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-2xl py-4 pl-14 pr-14 text-lg sm:text-xl font-bold text-white placeholder-white/40 outline-none transition-all border-2"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderColor: 'rgba(255, 255, 255, 0.25)',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = '#60a5fa'}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white p-1 transition"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 rounded-2xl text-xl sm:text-2xl font-black uppercase tracking-wider text-white transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 disabled:opacity-50 border border-blue-400/40"
                style={{
                  background: isLoading
                    ? 'rgba(59, 130, 246, 0.5)'
                    : 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 50%, #2563eb 100%)',
                  boxShadow: isLoading ? 'none' : '0 12px 35px rgba(37, 99, 235, 0.5)',
                }}
              >
                {isLoading ? (
                  <>
                    <div className="h-7 w-7 animate-spin rounded-full border-4 border-white border-t-transparent" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-7 w-7" />
                    <span>LOG IN</span>
                  </>
                )}
              </button>

              {/* Forgot Password */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setError('Please contact your ICT Administrator to reset your password.')}
                  className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-100 font-bold text-base sm:text-lg transition-colors"
                >
                  <HelpCircle className="h-5 w-5" />
                  Forgot Password?
                </button>
              </div>
            </form>



          </div>

          {/* Footer */}
          <p className="text-center text-white/70 font-semibold text-xs sm:text-sm">
            © 2024 San Isidro National High School · SEM System v2.0
          </p>

        </div>
      </div>
    </div>
  );
};



