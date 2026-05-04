import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FileText, Mail, Lock, User, Phone, MapPin, Calendar, AlertCircle, ChevronDown, ChevronUp, Zap, CheckCircle } from 'lucide-react';
import api from '../api/axios';

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
      <div className="hidden lg:flex w-5/12 bg-indigo-600 flex-col justify-between p-12">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <FileText size={16} className="text-white" />
          </div>
          <span className="font-bold text-white text-lg">ResumeAI</span>
        </Link>
        <div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Start Your Journey<br />Today
          </h2>
          <p className="text-indigo-200 text-base leading-relaxed">
            Join thousands of professionals who use ResumeAI to land their dream jobs.
          </p>
        </div>
        <div className="bg-white/10 rounded-2xl p-6">
          <p className="text-sm text-indigo-100 italic mb-4">"Got 3 interviews in my first week using ResumeAI. The AI suggestions are incredibly professional."</p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-400 flex items-center justify-center text-sm font-bold text-white">S</div>
            <div>
              <p className="text-sm font-semibold text-white">Sarah M.</p>
              <p className="text-xs text-indigo-300">Software Engineer</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <FileText size={15} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">ResumeAI</span>
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
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all disabled:opacity-60 mt-2">
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
