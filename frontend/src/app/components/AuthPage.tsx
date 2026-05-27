import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { resetPassword } from '@/lib/api';
import logo from '../../imports/logo.png';

const MANAGER_EMAIL = 'karla.bailey@iitelsolutions.com';

type Step =
  | 'form'                // normal login / signup form
  | 'confirm-reset'       // "wrong password — reset it?" prompt
  | 'reset-done';         // success confirmation after reset

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>('form');

  const { login, signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await signup(email, password);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';

      // Offer password reset only for regular users with a wrong password
      if (
        mode === 'login' &&
        msg === 'Incorrect password' &&
        email.trim().toLowerCase() !== MANAGER_EMAIL
      ) {
        setStep('confirm-reset');
        return;
      }

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    setError(null);
    try {
      await resetPassword(email, password);
      // Auto-login with the new password
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m: 'login' | 'signup') => {
    setMode(m);
    setError(null);
    setStep('form');
  };

  // ── Confirm-reset screen ───────────────────────────────────────────────────
  if (step === 'confirm-reset') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <Branding />
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-5">
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Incorrect password</p>
                <p className="text-sm text-amber-700 mt-1">
                  The password you entered doesn't match the one on file for{' '}
                  <span className="font-medium">{email}</span>.
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              Would you like to reset your password to the one you just entered?
            </p>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setStep('form'); setError(null); }}
                disabled={loading}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={loading}
                className="flex-1 py-2.5 bg-[#C9A961] text-white rounded-lg text-sm font-medium hover:bg-[#B8984F] disabled:opacity-50 transition-colors"
              >
                {loading ? 'Resetting…' : 'Yes, reset password'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Normal login / signup form ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Branding />

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {/* Mode tabs */}
          <div className="flex rounded-lg border border-gray-200 mb-6 overflow-hidden">
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  mode === m ? 'bg-[#C9A961] text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A961]/40 focus:border-[#C9A961]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder={mode === 'signup' ? 'At least 6 characters' : ''}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A961]/40 focus:border-[#C9A961]"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-2.5 bg-[#C9A961] text-white rounded-lg font-medium hover:bg-[#B8984F] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Branding() {
  return (
    <div className="text-center mb-8">
      <img
        src={logo}
        alt="iitel solutions"
        className="w-16 h-16 mx-auto mb-4"
        style={{ mixBlendMode: 'multiply' }}
      />
      <h1 className="text-xl font-semibold text-gray-900">Global Policy Tracker</h1>
      <p className="text-sm text-gray-500 mt-1">
        International Institute of Technology Education and Leadership
      </p>
    </div>
  );
}
