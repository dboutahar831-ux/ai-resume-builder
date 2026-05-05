import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Phone, MapPin, Calendar, AlertCircle, ChevronDown, ChevronUp, Zap, CheckCircle, Users, Briefcase, Sparkles } from 'lucide-react';
import api from '../api/axios';

function NexlyIcon({ className = 'w-8 h-8' }) {
  return (
    <svg viewBox="0 0 56 52" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="nx-reg" x1="0" y1="26" x2="56" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2EC4B6"/>
          <stop offset="45%" stopColor="#6C5CE7"/>
          <stop offset="100%" stopColor="#BF5AF2"/>
        </linearGradient>
      </defs>
      <path d="M5 46 L5 6 L22 42 L22 6" stroke="url(#nx-reg)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M30 6 L51 46" stroke="url(#nx-reg)" strokeWidth="7" strokeLinecap="round"/>
      <path d="M51 6 L30 46" stroke="url(#nx-reg)" strokeWidth="7" strokeLinecap="round"/>
    </svg>
  );
}

const perks = [
  { icon: Sparkles, text: 'AI-powered resume builder' },
  { icon: Users,    text: 'Career network & community' },
  { icon: Briefcase,text: 'Job application tracker' },
  { icon: CheckCircle, text: 'Free forever — no credit card' },
];

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', age: '', phone: '', location: '' });
  const [showExtra, setShowExtra] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inp = 'w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white';

  return (
    <div className="min-h-screen flex bg-gray-50">

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
            Join Nexly
          </p>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            The social platform<br />
            <span style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              built for your career.
            </span>
          </h2>
          <p className="text-gray-400 text-base leading-relaxed">
            Build your resume, grow your network, and track every opportunity — all in one place.
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
      <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <NexlyIcon className="w-8 h-8" />
            <span className="font-bold text-gray-900 text-lg">Nexly</span>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h1>
              <p className="text-sm text-gray-500">Free forever. No credit card required.</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm border border-red-100">
                <AlertCircle size={15} className="flex-shrink-0" />{error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="John Doe" value={form.name}
                    onChange={e => set('name', e.target.value)} required className={inp} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" placeholder="you@email.com" value={form.email}
                    onChange={e => set('email', e.target.value)} required className={inp} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="password" placeholder="Min. 6 characters" value={form.password}
                    onChange={e => set('password', e.target.value)} required className={inp} />
                </div>
              </div>

              <button type="button" onClick={() => setShowExtra(s => !s)}
                className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline pt-1">
                {showExtra ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showExtra ? 'Hide optional info' : 'Add more information (optional)'}
              </button>

              {showExtra && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Age</label>
                    <div className="relative">
                      <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="number" min="10" max="100" placeholder="25" value={form.age}
                        onChange={e => set('age', e.target.value)} className={inp} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="tel" placeholder="+1 234 567 890" value={form.phone}
                        onChange={e => set('phone', e.target.value)} className={inp} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
                    <div className="relative">
                      <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" placeholder="New York, USA" value={form.location}
                        onChange={e => set('location', e.target.value)} className={inp} />
                    </div>
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 text-white py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 mt-2"
                style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating account...</>
                ) : (
                  <><Zap size={15} />Create Free Account</>
                )}
              </button>
            </form>

            <p className="text-sm text-center mt-6 text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-indigo-600 hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
