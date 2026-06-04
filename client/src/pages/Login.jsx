import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Zap, Users, Briefcase, Sparkles, CheckCircle, Eye, EyeOff } from 'lucide-react';
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

const perks = [
  { icon: Sparkles,    text: 'AI-powered resume builder' },
  { icon: Users,       text: 'Career network & community' },
  { icon: Briefcase,   text: 'Job application tracker' },
  { icon: CheckCircle, text: 'Free forever — no credit card' },
];

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [oauthStatus, setOauthStatus] = useState({ google: false, linkedin: false });

  // Handle OAuth callback (token in URL)
  useEffect(() => {
    const token = searchParams.get('token');
    const user = searchParams.get('user');
    if (token && user) {
      try {
        localStorage.setItem('token', token);
        localStorage.setItem('user', decodeURIComponent(user));
        navigate('/home', { replace: true });
      } catch {}
    }
  }, []);

  // Check OAuth availability
  useEffect(() => {
    api.get('/auth/oauth/status').then(r => setOauthStatus(r.data)).catch(err => console.error('Failed to check OAuth status:', err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/home');
    } catch (err) {
      const data = err.response?.data;
      if (data?.requiresVerification) { navigate('/verify', { state: { email: data.email } }); return; }
      setError(data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inp = 'w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-[#2A2A2A] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600';

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-[#0A0A0A]">

      {/* Left panel */}
      <div
        className="hidden lg:flex w-5/12 flex-col justify-between p-12"
        style={{ background: 'linear-gradient(145deg, #0d1117 0%, #1a1040 55%, #2d1b4e 100%)' }}
      >
        <Link to="/" className="flex items-center gap-2">
          <NexlyIcon className="w-9 h-9" />
          <span className="font-bold text-white text-xl tracking-tight">Nexly</span>
        </Link>

        <div>
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: '#2EC4B6' }}>
            Welcome back
          </p>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Your career network<br />
            <span style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              is waiting for you.
            </span>
          </h2>
          <p className="text-gray-400 text-base leading-relaxed">
            Sign in to continue building your career and connecting with professionals.
          </p>
        </div>

        <div className="space-y-4">
          {perks.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(108,92,231,0.15)', border: '1px solid rgba(108,92,231,0.3)' }}>
                <Icon size={15} style={{ color: '#a78bfa' }} />
              </div>
              <span className="text-sm text-gray-300">{text}</span>
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

          <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#2A2A2A] shadow-sm p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Sign in to your account</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back — enter your credentials to continue.</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm border border-red-100">
                <AlertCircle size={15} className="flex-shrink-0" />{error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" placeholder="you@email.com" value={email}
                    onChange={e => setEmail(e.target.value)} required className={inp} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type={showPw ? 'text' : 'password'} placeholder="••••••••" value={password}
                    onChange={e => setPassword(e.target.value)} required className={inp} />
                  <button type="button" onClick={() => setShowPw(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 text-white py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 mt-2"
                style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Signing in...</>
                ) : (
                  <><Zap size={15} />Sign In</>
                )}
              </button>
            </form>

            {(oauthStatus.google || oauthStatus.linkedin) && (
              <div className="mt-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs font-medium text-gray-400">or continue with</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <div className="flex gap-3">
                  {oauthStatus.google && (
                    <a href={`${import.meta.env.VITE_API_URL || ''}/api/auth/google`}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all">
                      <svg viewBox="0 0 24 24" className="w-4 h-4"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                      Google
                    </a>
                  )}
                  {oauthStatus.linkedin && (
                    <a href={`${import.meta.env.VITE_API_URL || ''}/api/auth/linkedin`}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all">
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                      LinkedIn
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="text-center mt-5">
              <Link to="/forgot-password" className="text-sm text-indigo-500 hover:text-indigo-400 transition-colors">Forgot password?</Link>
            </div>

            <p className="text-sm text-center mt-4 text-gray-500 dark:text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Create one free</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
