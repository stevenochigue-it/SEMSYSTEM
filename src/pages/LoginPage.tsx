import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Lock, User, AlertCircle, Eye, EyeOff, Mail, UserPlus, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const LoginPage: React.FC = () => {
  const { user, login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-redirect if already logged in
  React.useEffect(() => {
    if (user) {
      if (user.role === 'parent') {
        navigate('/parent-dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  // Google Login Mock State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isCustomGoogleAccount, setIsCustomGoogleAccount] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [googleError, setGoogleError] = useState<string | null>(null);

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
      const user = storedUser ? JSON.parse(storedUser) : null;
      if (user && user.role === 'parent') {
        navigate('/parent-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLoginSelect = async (id: string, email: string, name: string) => {
    setGoogleError(null);
    setIsGoogleLoading(true);
    try {
      // Small simulated latency for realistic network connection to Google Auth servers
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await loginWithGoogle(id, email, name);
      setShowGoogleModal(false);
      navigate('/parent-dashboard');
    } catch (err: any) {
      setGoogleError(err.message || 'Failed to authenticate via Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleCustomGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customEmail.trim()) {
      setGoogleError('Please fill in Google account profile details');
      return;
    }
    if (!customEmail.includes('@')) {
      setGoogleError('Please enter a valid Google email address');
      return;
    }

    const mockId = 'google-id-' + Math.random().toString(36).substring(2, 11);
    handleGoogleLoginSelect(mockId, customEmail.trim(), customName.trim());
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white/95 p-8 shadow-2xl backdrop-blur-md border border-white/20">
        
        {/* Header Branding */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-600/20 text-white">
            <GraduationCap className="h-10 w-10" />
          </div>
          <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-800 text-center">
            San Isidro National High School
          </h2>
          <p className="mt-1 text-sm font-semibold text-emerald-600 uppercase tracking-wider">
            Gate Entrance Monitoring System
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Log in to manage records and monitor school gate scans
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200/50 p-3 text-sm text-red-700 animate-fade-in">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {/* Username Input */}
          <div>
            <label htmlFor="username" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Username
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <User className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Enter username"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full justify-center py-2.5 text-sm font-semibold tracking-wide"
            isLoading={isLoading}
          >
            Sign In to Dashboard
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white/95 px-3 text-slate-400 font-bold tracking-wider">Or parent portal</span>
          </div>
        </div>

        {/* Google Authentication Trigger Button */}
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setGoogleError(null);
            setIsCustomGoogleAccount(false);
            setShowGoogleModal(true);
          }}
          className="w-full justify-center gap-2.5 py-2.5 text-sm font-bold border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors shadow-sm"
        >
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continue with Google Account
        </Button>

        {/* Demo Helper Panel */}
        <div className="mt-6 rounded-xl bg-slate-50 border border-slate-200/50 p-4">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
            🔑 System Access Accounts
          </h4>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-2">
              <p className="font-bold text-emerald-800 leading-none mb-1">Gate / Admin</p>
              <p className="text-slate-500">User: <span className="font-semibold text-slate-700">admin</span></p>
              <p className="text-slate-500">Pass: <span className="font-semibold text-slate-700">admin123</span></p>
            </div>
            <div className="rounded-lg bg-blue-50 border border-blue-100 p-2">
              <p className="font-bold text-blue-800 leading-none mb-1">Parent Portal</p>
              <p className="text-slate-500">Method: <span className="font-semibold text-slate-700">Google Auth</span></p>
              <p className="text-slate-500">Target: <span className="font-semibold text-slate-700">Monitor Child</span></p>
            </div>
          </div>
        </div>

      </div>

      {/* Simulated Google OAuth Dialog Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-sm rounded-lg bg-white p-6 shadow-2xl border border-slate-100 animate-scale-in text-slate-800">
            
            {/* Google Brand Logo */}
            <div className="flex flex-col items-center text-center pb-4 border-b border-slate-100">
              <svg className="h-8 w-24 mb-2" viewBox="0 0 74 24">
                <path fill="#EA4335" d="M12.2 11.2c0-3.2-2.5-5.8-5.8-5.8-3.3 0-5.8 2.5-5.8 5.8s2.5 5.8 5.8 5.8c3.3 0 5.8-2.6 5.8-5.8zm-9.3 0c0-2.1 1.6-3.7 3.5-3.7s3.5 1.6 3.5 3.7c0 2-1.6 3.7-3.5 3.7s-3.5-1.7-3.5-3.7z"/>
                <path fill="#FBBC05" d="M25 11.2c0-3.2-2.5-5.8-5.8-5.8-3.3 0-5.8 2.5-5.8 5.8s2.5 5.8 5.8 5.8c3.3 0 5.8-2.6 5.8-5.8zm-9.3 0c0-2.1 1.6-3.7 3.5-3.7s3.5 1.6 3.5 3.7c0 2-1.6 3.7-3.5 3.7s-3.5-1.7-3.5-3.7z"/>
                <path fill="#4285F4" d="M37.8 5.8h-5.3v10.8h5.3v-4c0-2.4 1.8-4.1 4.1-4.1.3 0 .7 0 1 .1V3.2c-.4-.1-.8-.1-1.3-.1-2.2 0-3.6.9-3.8 2.7zM49.6 15.6c-2.3 0-4-1.3-4.8-3l8.8-3.6-.3-.7c-.6-1.5-2.2-4.1-5.5-4.1-3.2 0-5.8 2.5-5.8 5.8s2.5 5.8 5.8 5.8c2.6 0 4.1-1.6 4.7-2.5l-3.9-2.6c-.6.9-1.5 1.7-2.6 1.7-1.2 0-2.2-.6-2.7-1.5l9.2-3.8c-.2-.5-.9-2.2-3.9-2.2zm-4.7-4.5c0-1.5 1-2.5 2.2-2.5.9 0 1.7.5 2 1.2l-4.2 1.7v-.4z"/>
                <path fill="#34A853" d="M57.6 1.6H59v15h-1.4z"/>
                <path fill="#4285F4" d="M69.8 9.3h-7.6V7.7h6.2C68 6 65.6 4.9 63 4.9c-3.6 0-6.4 2.8-6.4 6.4s2.8 6.4 6.4 6.4c2.8 0 4.9-1.5 5.9-3.6h1.5C69.3 16.7 66.4 19 63 19c-4.4 0-7.8-3.4-7.8-7.8s3.4-7.8 7.8-7.8c3.1 0 5.8 1.8 7 4.5l.8-.6z"/>
              </svg>
              <h3 className="text-base font-bold text-slate-800">Choose an account</h3>
              <p className="text-xs text-slate-500 mt-1">to continue to <span className="font-semibold text-emerald-700">SINHS Gate Portal</span></p>
            </div>

            {googleError && (
              <div className="my-3 flex items-center gap-2 rounded bg-red-50 p-2 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{googleError}</span>
              </div>
            )}

            {isGoogleLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-3" />
                <p className="text-sm font-semibold text-slate-600">Connecting to Google Auth...</p>
                <p className="text-xs text-slate-400 mt-1">Verifying identity profile</p>
              </div>
            ) : !isCustomGoogleAccount ? (
              /* Account Listing */
              <div className="mt-4 space-y-2">
                {/* Predefined Account 1 */}
                <button
                  type="button"
                  onClick={() => handleGoogleLoginSelect('google-101', 'steve.nochigue@gmail.com', 'Steve Nochigue')}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 border border-slate-100 transition-colors text-left"
                >
                  <div className="h-9 w-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center uppercase text-sm">
                    SN
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-800 leading-tight">Steve Nochigue</p>
                    <p className="text-[10px] text-slate-450 truncate">steve.nochigue@gmail.com</p>
                  </div>
                </button>

                {/* Predefined Account 2 */}
                <button
                  type="button"
                  onClick={() => handleGoogleLoginSelect('google-102', 'parent.test@gmail.com', 'Maria Reyes (Parent)')}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 border border-slate-100 transition-colors text-left"
                >
                  <div className="h-9 w-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center uppercase text-sm">
                    MR
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-800 leading-tight">Maria Reyes (Parent)</p>
                    <p className="text-[10px] text-slate-450 truncate">parent.test@gmail.com</p>
                  </div>
                </button>

                {/* Add Custom Google Profile Trigger */}
                <button
                  type="button"
                  onClick={() => {
                    setGoogleError(null);
                    setIsCustomGoogleAccount(true);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 border border-dashed border-slate-200 transition-colors text-left text-slate-600"
                >
                  <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">Use another Google account</p>
                    <p className="text-[10px] text-slate-400">Sign in with a different profile</p>
                  </div>
                </button>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowGoogleModal(false)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* Custom Account Input Form */
              <form onSubmit={handleCustomGoogleSubmit} className="mt-4 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
                  <button
                    type="button"
                    onClick={() => {
                      setGoogleError(null);
                      setIsCustomGoogleAccount(false);
                    }}
                    className="text-slate-400 hover:text-slate-600 flex items-center gap-1 font-semibold"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  <span className="text-slate-350">|</span>
                  <span>Google User Profile Details</span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Steve Nochigue"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full text-xs p-2.5 pl-9 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Google Email</label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. steve@gmail.com"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      className="w-full text-xs p-2.5 pl-9 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-between gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsCustomGoogleAccount(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Sign In with Google
                  </Button>
                </div>
              </form>
            )}

            <div className="mt-5 text-[10px] text-slate-400 text-center leading-normal">
              To proceed, Google will share your name, email address, profile picture, and language preference with San Isidro National High School Gate Portal.
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
