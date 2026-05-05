import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileText, Mail, Phone, MapPin, Link2, ExternalLink } from 'lucide-react';
import api from '../api/axios';

export default function PublicResume() {
  const { slug } = useParams();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/resumes/public/${slug}`)
      .then(r => setResume(r.data))
      .catch(() => setError('This resume could not be found or the link has expired.'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4">
      <FileText size={48} className="text-gray-200 mb-4" />
      <h1 className="text-xl font-bold text-gray-800 mb-2">Resume not found</h1>
      <p className="text-gray-500 text-sm mb-6">{error}</p>
      <Link to="/" className="text-indigo-600 hover:underline text-sm">Back to Nexly</Link>
    </div>
  );

  const p = resume.personal_info || {};
  const exp = resume.experience || [];
  const edu = resume.education || [];
  const skills = resume.skills || [];

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 print:bg-white print:py-0">
      <div className="max-w-3xl mx-auto">
        {/* Branding bar */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link to="/" className="flex items-center gap-2 text-indigo-600 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <FileText size={14} className="text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-sm">Nexly</span>
          </Link>
          <button onClick={() => window.print()} className="text-sm text-gray-500 hover:text-indigo-600 border border-gray-200 px-4 py-1.5 rounded-lg transition-colors">
            Print / Save PDF
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-none print:rounded-none">
          {/* Header */}
          <div className="bg-indigo-600 px-8 py-8 text-white">
            <h1 className="text-3xl font-bold">{p.full_name || 'No Name'}</h1>
            <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-indigo-200 text-sm">
              {p.email && <span className="flex items-center gap-1.5"><Mail size={13} />{p.email}</span>}
              {p.phone && <span className="flex items-center gap-1.5"><Phone size={13} />{p.phone}</span>}
              {p.location && <span className="flex items-center gap-1.5"><MapPin size={13} />{p.location}</span>}
              {p.linkedin && (
                <a href={p.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors">
                  <Link2 size={13} />{p.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')}
                </a>
              )}
            </div>
          </div>

          <div className="px-8 py-7 space-y-7">
            {/* Summary */}
            {p.summary && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-3">Professional Summary</h2>
                <p className="text-gray-700 text-sm leading-relaxed">{p.summary}</p>
              </section>
            )}

            {/* Experience */}
            {exp.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-3">Work Experience</h2>
                <div className="space-y-5">
                  {exp.map((e, i) => (
                    <div key={i}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-gray-900">{e.role}</p>
                          <p className="text-sm text-gray-600">{e.company}</p>
                        </div>
                        {(e.start_date || e.end_date) && (
                          <p className="text-xs text-gray-400 flex-shrink-0 mt-0.5">{e.start_date}{e.start_date && e.end_date ? ' – ' : ''}{e.end_date}</p>
                        )}
                      </div>
                      {e.description && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{e.description}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Education */}
            {edu.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-3">Education</h2>
                <div className="space-y-4">
                  {edu.map((e, i) => (
                    <div key={i} className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-gray-900">{e.degree}{e.field ? ` in ${e.field}` : ''}</p>
                        <p className="text-sm text-gray-600">{e.institution}</p>
                      </div>
                      {(e.start_date || e.end_date) && (
                        <p className="text-xs text-gray-400 flex-shrink-0 mt-0.5">{e.start_date}{e.start_date && e.end_date ? ' – ' : ''}{e.end_date}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Skills */}
            {skills.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-3">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s, i) => (
                    <span key={i} className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-medium">{s}</span>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6 print:hidden">
          Created with <a href="/" className="text-indigo-600 hover:underline">Nexly</a>
        </p>
      </div>
    </div>
  );
}
