import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FileText, Briefcase, TrendingUp, Plus, ChevronRight, CheckCircle2, Circle, Target, Lightbulb, Clock } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../api/axios';

const statusColors = {
  pending:   'bg-yellow-50 text-yellow-700',
  interview: 'bg-blue-50 text-blue-700',
  offered:   'bg-purple-50 text-purple-700',
  accepted:  'bg-emerald-50 text-emerald-700',
  rejected:  'bg-red-50 text-red-700',
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
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const tip = tips[new Date().getDay() % tips.length];

  useEffect(() => {
    Promise.all([api.get('/resumes'), api.get('/jobs')])
      .then(([r, j]) => { setResumes(r.data); setJobs(j.data); })
      .catch(() => { localStorage.clear(); navigate('/login'); })
      .finally(() => setLoading(false));
  }, []);

  const accepted  = jobs.filter(j => j.status === 'accepted').length;
  const interview = jobs.filter(j => j.status === 'interview').length;
  const offered   = jobs.filter(j => j.status === 'offered').length;
  const pending   = jobs.filter(j => j.status === 'pending').length;

  const stats = [
    { label: 'Resumes Created', value: resumes.length, icon: FileText, color: 'bg-indigo-50 text-indigo-600', link: '/resumes' },
    { label: 'Jobs Tracked',    value: jobs.length,    icon: Briefcase, color: 'bg-blue-50 text-blue-600',   link: '/jobs' },
    { label: 'Interviews',      value: interview,      icon: TrendingUp, color: 'bg-green-50 text-green-600', link: '/jobs' },
    { label: 'Offers Received', value: offered,        icon: Target,     color: 'bg-purple-50 text-purple-600', link: '/jobs' },
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

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{getGreeting()}, {user.name?.split(' ')[0]} 👋</h1>
            <p className="text-gray-500 mt-1 text-sm">Here's an overview of your job search progress.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm">
            <Clock size={13} />
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color, link }) => (
            <Link key={label} to={link} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                <Icon size={20} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{label}</p>
            </Link>
          ))}
        </div>

        {/* Main content */}
        <div className="grid lg:grid-cols-3 gap-5">

          {/* Recent Resumes */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 text-sm">Recent Resumes</h2>
              <Link to="/resumes" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                View all <ChevronRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {resumes.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <FileText size={24} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No resumes yet</p>
                  <Link to="/resumes/new" className="inline-flex items-center gap-1 mt-2 text-xs text-indigo-600 hover:underline">
                    <Plus size={12} />Create one
                  </Link>
                </div>
              ) : resumes.slice(0, 4).map(r => (
                <Link key={r.id} to={`/resumes/${r.id}/edit`}
                  className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors group">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <FileText size={13} className="text-indigo-600" />
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
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 text-sm">Recent Applications</h2>
              <Link to="/jobs" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                View all <ChevronRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {jobs.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <Briefcase size={24} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No applications yet</p>
                  <Link to="/jobs" className="inline-flex items-center gap-1 mt-2 text-xs text-indigo-600 hover:underline">
                    <Plus size={12} />Track one
                  </Link>
                </div>
              ) : jobs.slice(0, 4).map(j => (
                <div key={j.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0 text-xs font-bold text-gray-500">
                    {j.company?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{j.company}</p>
                    <p className="text-xs text-gray-400 truncate">{j.role}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${statusColors[j.status] || 'bg-gray-50 text-gray-600'}`}>
                    {j.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right column: checklist + tip */}
          <div className="space-y-4">
            {/* Progress checklist */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900 text-sm">Job Search Checklist</h2>
                <span className="text-xs font-semibold text-indigo-600">{progress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
                <div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
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

            {/* Daily tip */}
            <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={14} className="text-indigo-500" />
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Tip of the day</p>
              </div>
              <p className="text-sm text-indigo-800 leading-relaxed">{tip}</p>
            </div>
          </div>
        </div>

        {/* Application status breakdown */}
        {jobs.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 text-sm mb-4">Application Breakdown</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: 'Pending',   count: pending,   color: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
                { label: 'Interview', count: interview, color: 'bg-blue-50 text-blue-700 border-blue-100' },
                { label: 'Offered',   count: offered,   color: 'bg-purple-50 text-purple-700 border-purple-100' },
                { label: 'Accepted',  count: accepted,  color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                { label: 'Rejected',  count: jobs.filter(j => j.status === 'rejected').length, color: 'bg-red-50 text-red-700 border-red-100' },
              ].map(({ label, count, color }) => (
                <div key={label} className={`rounded-xl border px-4 py-3 text-center ${color}`}>
                  <p className="text-xl font-bold">{count}</p>
                  <p className="text-xs font-medium mt-0.5 opacity-80">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Link to="/resumes/new" className="group flex items-center gap-4 bg-indigo-600 rounded-2xl p-5 hover:bg-indigo-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Plus size={20} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-white">New Resume</p>
              <p className="text-sm text-indigo-200">Build a professional resume</p>
            </div>
            <ChevronRight size={18} className="text-white/60 ml-auto group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/jobs" className="group flex items-center gap-4 bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Briefcase size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Track Application</p>
              <p className="text-sm text-gray-500">Add a new job application</p>
            </div>
            <ChevronRight size={18} className="text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </Layout>
  );
}
