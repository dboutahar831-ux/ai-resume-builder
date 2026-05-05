import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import api from '../api/axios';

function NexlyIcon({ className = 'w-8 h-8' }) {
  return (
    <svg viewBox="0 0 56 52" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="nx-login" x1="0" y1="26" x2="56" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2EC4B6"/>
          <stop offset="45%" stopColor="#6C5CE7"/>
          <stop offset="100%" stopColor="#BF5AF2"/>
        </linearGradient>
      </defs>
      <path d="M5 46 L5 6 L22 42 L22 6" stroke="url(#nx-login)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M30 6 L51 46" stroke="url(#nx-login)" strokeWidth="7" strokeLinecap="round"/>
      <path d="M51 6 L30 46" stroke="url(#nx-login)" strokeWidth="7" strokeLinecap="round"/>
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.requiresVerification) { navigate('/verify', { state: { email: data.email } }); return; }
      setError(data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inp = 'w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white';

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left panel */}
      <div className="hidden lg:flex w-5/12 bg-indigo-600 flex-col justify-between p-12">
        <Link to="/" className="flex items-center gap-2">
          <NexlyIcon className="w-8 h-8" />
          <span className="font-bold text-white text-lg">Nexly</span>
        </Link>
        <div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Welcome back.<br />Let's keep building.
          </h2>
          <p className="text-indigo-200 text-base leading-relaxed">
            Your resumes and job applications are waiting for you.
          </p>
        </div>
        <div className="space-y-3">
          {['AI-powered content generation', 'Real-time resume preview', 'Job application tracker', 'One-click PDF export'].map(f => (
            <div key={f} className="flex items-center gap-3 text-sm text-indigo-100">
              <CheckCircle size={16} className="text-indigo-300 flex-shrink-0" />
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <NexlyIcon className="w-8 h-8" />
            <span className="font-bold text-gray-900 text-lg">Nexly</span>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Sign in to your account</h1>
              <p className="text-sm text-gray-500">Welcome back — enter your credentials to continue.</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm border border-red-100">
                <AlertCircle size={15} className="flex-shrink-0" />{error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" placeholder="you@email.com" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })} required className={inp} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="password" placeholder="••••••••" value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })} required className={inp} />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all disabled:opacity-60 mt-2">
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Signing in...</>
                ) : (
                  <><Zap size={15} />Sign In</>
                )}
              </button>
            </form>

            <p className="text-sm text-center mt-6 text-gray-500">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-indigo-600 hover:underline">Create one free</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
