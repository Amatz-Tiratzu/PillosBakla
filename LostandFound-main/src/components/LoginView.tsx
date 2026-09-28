import React, { useState } from 'react';
import { User } from '../types';
import { Eye, EyeOff, UserPlus, LogIn, Loader2, CheckCircle2 } from 'lucide-react';

interface LoginViewProps {
  onLogin: (user: User) => void;
  availableUsers: User[];
  onUserRegistered?: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLogin,
  availableUsers,
  onUserRegistered,
}) => {
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  
  // Sign In State
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Registration State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Match by email or username
    const found = availableUsers.find(
      (u) =>
        u.email.toLowerCase() === userName.trim().toLowerCase() ||
        u.name.toLowerCase() === userName.trim().toLowerCase()
    );

    if (found) {
      onLogin(found);
    } else {
      // Default fallback
      if (userName.toLowerCase().includes('admin')) {
        const adminUser = availableUsers.find((u) => u.role === 'admin') || {
          id: 1,
          name: 'System Administrator',
          email: 'admin@ifound.org',
          role: 'admin',
        };
        onLogin(adminUser);
      } else {
        const user = availableUsers.find((u) => u.role === 'user') || {
          id: 2,
          name: 'Daniel Perez',
          email: 'danielperez@sksu.edu.ph',
          role: 'user',
        };
        onLogin(user);
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          password: regPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed. Please try again.');
      }

      setSuccessMsg('Account created successfully. Please sign in with your new account.');
      setMode('signin');
      setUserName(data.email || regEmail.trim().toLowerCase());
      setPassword('');
      setRegName('');
      setRegEmail('');
      setRegPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Side: Scuba welcome card */}
        <div className="lg:col-span-7 relative rounded-2xl overflow-hidden shadow-xl border border-stone-200 aspect-[16/11] flex items-center justify-center group bg-black">
          <img
            src="/src/assets/images/scubaa!.gif"
            alt="Scuba cat welcome animation"
            className="absolute inset-0 h-full w-full object-contain p-3 sm:p-5"
          />
        </div>

        {/* Right Side: Account Authentication & Registration Card */}
        <div className="lg:col-span-5 bg-[#F6F8EC]/95 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-stone-300/80 shadow-lg flex flex-col justify-between">
          <div>
            {/* Header Tabs: Sign In / Create Account */}
            <div className="flex items-center justify-center p-1 bg-[#E7EBD8] rounded-xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError('');
                  setSuccessMsg('');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-700 hover:text-stone-950'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError('');
                  setSuccessMsg('');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'register'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-700 hover:text-stone-950'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 text-center mb-4 tracking-tight">
              {mode === 'signin' ? 'Account Login' : 'Register Account'}
            </h1>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* FORM 1: SIGN IN */}
            {mode === 'signin' && (
              <form onSubmit={handleSignIn} autoComplete="off" className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                    Registered Email
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#D9DBE0]/90 text-stone-900 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-xs transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#D9DBE0]/90 text-stone-900 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-xs transition-all pr-11 tracking-wider"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#2D3136] hover:bg-[#1E2125] text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError('');
                    }}
                    className="w-full py-2.5 bg-[#D8DCE0] hover:bg-[#C9CFD6] text-stone-800 font-bold text-xs rounded-lg border border-stone-300 shadow-2xs transition-colors cursor-pointer"
                  >
                    Register Account
                  </button>
                </div>

                <div className="text-center pt-1">
                  <span className="text-xs text-stone-600">
                    Don&apos;t have an account yet?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('register')}
                      className="font-bold text-emerald-800 hover:underline cursor-pointer"
                    >
                      Create one now
                    </button>
                  </span>
                </div>
              </form>
            )}

            {/* FORM 2: REGISTER ACCOUNT (CAMPUS MEMBERS ONLY - NO ADMIN ROLE OPTION) */}
            {mode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white text-stone-900 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-xs transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                    Campus or Personal Email (Gmail) *
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white text-stone-900 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-xs transition-all font-mono"
                  />
                  <p className="text-[10px] text-stone-500 mt-1">
                    Campus administrators will contact this Gmail address when items you report are located.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white text-stone-900 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-xs transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-stone-900 hover:bg-black text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 text-emerald-400" />
                      <span>Create Account &amp; Continue</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-1">
                  <span className="text-xs text-stone-600">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('signin')}
                      className="font-bold text-stone-900 hover:underline cursor-pointer"
                    >
                      Sign In
                    </button>
                  </span>
                </div>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
