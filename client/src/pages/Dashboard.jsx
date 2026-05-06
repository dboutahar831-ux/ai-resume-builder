import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Briefcase, TrendingUp, Plus, ChevronRight, CheckCircle2, Circle, Target, Lightbulb, ArrowUpRight } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../api/axios';

const statusColors = {
  pending:   { bg: 'bg-yellow-50', text: 'text-yellow-700', bar: '#F59E0B' },
  interview: { bg: 'bg-blue-50',   text: 'text-blue-700',   bar: '#3B82F6' },
  offered:   { bg: 'bg-purple-50', text: 'text-purple-700', bar: '#8B5CF6' },
  accepted:  { bg: 'bg-emerald-50',text: 'text-emerald-700',bar: '#10B981' },
  rejected:  { bg: 'bg-red-50',    text: 'text-red-700',    bar: '#EF4444' },
};

const tips = [
  'Tailor each resume to the specific job description.',
  'Use numbers to quantify your impact (e.g. "increased sales by 30%").',
  'Keep your resume to one page if you have less than 10 years of experience.',
  'Follow up within a week of submitting an application.',
  'Research the company before every interview.',
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const tip = tips[new Date().getDay() % tips.length];

  useEffect(() => {
    Promise.all([api.get('/resumes'), api.get('/jobs')])
      .then(([r, j]) => { setResumes(r.data); setJobs(j.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const accepted  = jobs.filter(j => j.status === 'accepted').length;
  const interview = jobs.filter(j => j.status === 'interview').length;
  const offered   = jobs.filter(j => j.status === 'offered').length;
  const pending   = jobs.filter(j => j.status === 'pending').length;
  const rejected  = jobs.filter(j => j.status === 'rejected').length;

  const stats = [
    { label: 'Resumes',     value: resumes.length, icon: FileText,    gradient: 'from-teal-400 to-cyan-500',    link: '/resumes' },
    { label: 'Jobs Tracked',value: jobs.length,    icon: Briefcase,   gradient: 'from-violet-400 to-indigo-500',link: '/jobs'    },
    { label: 'Interviews',  value: interview,      icon: TrendingUp,  gradient: 'from-blue-400 to-sky-500',     link: '/jobs'    },
    { label: 'Offers',      value: offered,        icon: Target,      gradient: 'from-pink-400 to-rose-500',    link: '/jobs'    },
  ];

  const checklist = [
    { done: resumes.length > 0, text: 'Create your first resume' },
    { done: jobs.length > 0,    text: 'Track your first job application' },
    { done: !!user.phone,       text: 'Add your phone number to your profile' },
    { done: !!user.linkedin,    text: 'Add your LinkedIn profile' },
    { done: interview > 0,      text: 'Land your first interview' },
    { done: accepted > 0,       text: 'Get a job offer' },
  ];
  const progress = Math.round((checklist.filter(c => c.done).length / checklist.length) * 100);

  const statusBreakdown = [
    { label: 'Pending',   count: pending,   color: '#F59E0B' },
    { label: 'Interview', count: interview, color: '#3B82F6' },
    { label: 'Offered',   count: offered,   color: '#8B5CF6' },
    { label: 'Accepted',  count: accepted,  color: '#10B981' },
    { label: 'Rejected',  count: rejected,  color: '#EF4444' },
  ];

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#6C5CE7', borderTopColor: 'transparent' }} />
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Hero header */}
        <div className="rounded-3xl p-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="relative">
            <p className="text-white/70 text-sm font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-2xl font-bold mt-1">{getGreeting()}, {user.name?.split(' ')[0]} 👋</h1>
            <p className="text-white/70 text-sm mt-1">Here's your job search overview.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, gradient, link }) => (
            <Link key={label} to={link} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden">
              <div className={`h-1 w-full bg-gradient-to-r ${gradient}`} />
              <div className="p-5">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon size={18} className="text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-400 mt-0.5">{label}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-3 gap-5">

          {/* Recent Resumes */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-1" style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7)' }} />
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <FileText size={14} className="text-indigo-400" />Recent Resumes
              </h2>
              <Link to="/resumes" className="text-xs font-medium flex items-center gap-1" style={{ color: '#6C5CE7' }}>
                View all <ChevronRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {resumes.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <FileText size={24} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No resumes yet</p>
                  <Link to="/resumes/new" className="inline-flex items-center gap-1 mt-2 text-xs font-semibold" style={{ color: '#6C5CE7' }}>
                    <Plus size={12} />Create one
                  </Link>
                </div>
              ) : resumes.slice(0, 4).map(r => (
                <Link key={r.id} to={`/resumes/${r.id}/edit`}
                  className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors group">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#2EC4B6,#6C5CE7)' }}>
                    <FileText size={13} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.personal_info?.full_name || 'Untitled'}</p>
                    <p className="text-xs text-gray-400 truncate">{r.personal_info?.location || 'No location'}</p>
                  </div>
                  <ChevronRight size={13} className="text-gray-300 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Applications */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-1" style={{ background: 'linear-gradient(90deg,#6C5CE7,#BF5AF2)' }} />
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <Briefcase size={14} className="text-purple-400" />Recent Applications
              </h2>
              <Link to="/jobs" className="text-xs font-medium flex items-center gap-1" style={{ color: '#6C5CE7' }}>
                View all <ChevronRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {jobs.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <Briefcase size={24} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No applications yet</p>
                  <Link to="/jobs" className="inline-flex items-center gap-1 mt-2 text-xs font-semibold" style={{ color: '#6C5CE7' }}>
                    <Plus size={12} />Track one
                  </Link>
                </div>
              ) : jobs.slice(0, 4).map(j => (
                <div key={j.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0 text-xs font-bold text-gray-600">
                    {j.company?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{j.company}</p>
                    <p className="text-xs text-gray-400 truncate">{j.role}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${statusColors[j.status]?.bg || 'bg-gray-50'} ${statusColors[j.status]?.text || 'text-gray-600'}`}>
                    {j.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Progress checklist */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }} />
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-semibold text-gray-900 text-sm">Checklist</h2>
                  <span className="text-xs font-bold" style={{ color: '#6C5CE7' }}>{progress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
                  <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }} />
                </div>
                <ul className="space-y-2.5">
                  {checklist.map(({ done, text }) => (
                    <li key={text} className="flex items-start gap-2.5">
                      {done
                        ? <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                        : <Circle size={15} className="text-gray-300 flex-shrink-0 mt-0.5" />
                      }
                      <span className={`text-xs leading-relaxed ${done ? 'text-gray-400 line-through' : 'text-gray-600'}`}>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Daily tip */}
            <div className="rounded-2xl p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#2EC4B6,#6C5CE7)' }}>
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb size={14} className="text-white/80" />
                  <p className="text-xs font-bold text-white/80 uppercase tracking-wider">Tip of the day</p>
                </div>
                <p className="text-sm text-white leading-relaxed">{tip}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Application pipeline */}
        {jobs.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#F59E0B,#3B82F6,#8B5CF6,#10B981,#EF4444)' }} />
            <div className="p-5">
              <h2 className="font-semibold text-gray-900 text-sm mb-4">Application Pipeline</h2>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {statusBreakdown.map(({ label, count, color }) => (
                  <div key={label} className="bg-gray-50 rounded-xl border border-gray-100 p-3 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: color }} />
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                    <p className="text-xs font-medium text-gray-400 mt-0.5">{label}</p>
                    {jobs.length > 0 && (
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                        <div className="h-1 rounded-full transition-all" style={{ width: `${Math.round((count / jobs.length) * 100)}%`, background: color }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Link to="/resumes/new" className="group flex items-center gap-4 rounded-2xl p-5 transition-all hover:opacity-90" style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Plus size={20} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-white">New Resume</p>
              <p className="text-sm text-white/70">Build a professional resume</p>
            </div>
            <ArrowUpRight size={18} className="text-white/60 ml-auto group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
          <Link to="/jobs" className="group flex items-center gap-4 bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <Briefcase size={20} className="text-violet-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Track Application</p>
              <p className="text-sm text-gray-400">Add a new job application</p>
            </div>
            <ArrowUpRight size={18} className="text-gray-300 ml-auto group-hover:text-violet-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </Link>
        </div>

      </div>
    </Layout>
  );
}
