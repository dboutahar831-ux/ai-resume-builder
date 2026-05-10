import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldOff, ShieldAlert, AlertTriangle, Briefcase, Sparkles, ExternalLink, X } from 'lucide-react';
import Layout from '../components/Layout';
import ProfileCard from '../components/ProfileCard';
import api from '../api/axios';

function HighlightViewer({ highlight, onClose }) {
  const [idx, setIdx] = useState(0);
  const items = highlight?.items || [];
  const item = items[idx];
  if (!highlight) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div className="relative max-w-lg w-full mx-4" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-10 right-0 text-white/60 hover:text-white transition-colors">
          <X size={20} />
        </button>
        {item && (
          <>
            {item.media_type === 'video'
              ? <video src={item.media_url} controls autoPlay className="w-full rounded-2xl max-h-[70vh] object-contain bg-black" />
              : <img src={item.media_url} loading="lazy" alt={item.caption || ''} className="w-full rounded-2xl max-h-[70vh] object-contain bg-black" />
            }
            {item.caption && <p className="text-white/80 text-sm mt-3 text-center">{item.caption}</p>}
            {items.length > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                {items.map((_, i) => (
                  <button key={i} onClick={() => setIdx(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === idx ? 'bg-white w-4' : 'bg-white/40'}`} />
                ))}
              </div>
            )}
          </>
        )}
        {items.length === 0 && (
          <div className="flex items-center justify-center h-48 text-white/40 text-sm">No items</div>
        )}
      </div>
    </div>
  );
}

function getGradientColors(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0;
  }
  return ['#2EC4B6','#6C5CE7','#BF5AF2', '#FF6B6B','#EE5A24','#F0932B', '#00B894','#00CEC9','#55EFC4', '#6C5CE7','#A29BFE','#FD79A8', '#0984E3','#74B9FF','#81ECEC', '#E17055','#FDCB6E','#FAB1A0', '#636E72','#B2BEC3','#DFE6E9', '#2D3436','#0984E3','#00CEC9'][Math.abs(hash) % 24];
}

export default function FriendProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const myId = JSON.parse(localStorage.getItem('user') || '{}').id;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [highlights, setHighlights] = useState([]);
  const [viewingHL, setViewingHL] = useState(null);
  const [latestExp, setLatestExp] = useState(null);

  const load = async () => {
    try {
      const [profileRes, hlRes, resumeRes] = await Promise.allSettled([
        api.get(`/friends/profile/${id}`),
        api.get(`/highlights/${id}`),
        api.get(`/resumes/user/${id}`),
      ]);

      if (profileRes.status === 'fulfilled') {
        setProfile(profileRes.value.data);
        setIsBlocked(profileRes.value.data.blocked || false);
      } else {
        navigate('/friends');
      }

      if (hlRes.status === 'fulfilled') {
        setHighlights(hlRes.value.data);
      }

      if (resumeRes.status === 'fulfilled') {
        const list = resumeRes.value.data;
        if (list.length > 0) {
          const latest = list.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))[0];
          if (latest?.experience?.length > 0) {
            const sorted = [...latest.experience].sort((a, b) => new Date(b.start_date || 0) - new Date(a.start_date || 0));
            setLatestExp(sorted[0]);
          }
        }
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handleAction = async (type) => {
    setActionLoading(true);
    try {
      if (type === 'request') await api.post(`/friends/request/${id}`);
      if (type === 'accept')  await api.put(`/friends/accept/${id}`);
      if (type === 'reject')  await api.put(`/friends/reject/${id}`);
      if (type === 'unfriend') await api.delete(`/friends/${id}`);
      if (type === 'block') {
        await api.post(`/friends/block/${id}`);
        setIsBlocked(true);
      }
      if (type === 'unblock') {
        await api.post(`/friends/unblock/${id}`);
        setIsBlocked(false);
      }
      await load();
    } finally { setActionLoading(false); }
  };

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  );

  if (!profile) return null;

  const { friendship_status: status, requester_id } = profile;
  const [c1, c2] = [getGradientColors(profile.name), getGradientColors(profile.name + 'x')];

  return (
    <Layout>
      {viewingHL && <HighlightViewer highlight={viewingHL} onClose={() => setViewingHL(null)} />}

      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            <ArrowLeft size={16} />Back
          </button>

          {!isBlocked ? (
            <button onClick={() => handleAction('block')} disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all disabled:opacity-60">
              <ShieldOff size={13} />Block
            </button>
          ) : (
            <button onClick={() => handleAction('unblock')} disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all disabled:opacity-60">
              <ShieldAlert size={13} />Unblock
            </button>
          )}
        </div>

        {isBlocked && (
          <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl px-5 py-4">
            <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">User Blocked</p>
              <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">
                You have blocked this user. They cannot see your profile, send you messages, or interact with your posts.
              </p>
            </div>
          </div>
        )}

        <ProfileCard
          profile={profile}
          coverImage={profile.cover_image}
          avatar={profile.avatar}
          name={profile.name}
          bio={profile.bio}
          location={profile.location}
          linkedin={profile.linkedin}
          skills={profile.skills}
          availabilityStatus={profile.availability_status}
          lastSeen={profile.last_seen_at}
          createdAt={profile.created_at}
          isOwn={false}
          isFriend={status === 'accepted'}
          friendshipStatus={isBlocked ? null : status}
          requesterId={requester_id}
          myId={myId}
          onMessage={() => navigate(`/messages?user=${id}`)}
          onAddFriend={() => handleAction('request')}
          onAccept={() => handleAction('accept')}
          onReject={() => handleAction('reject')}
          onUnfriend={() => handleAction('unfriend')}
          actionLoading={actionLoading}
        />

        {/* ── Latest Experience ── */}
        {latestExp && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-sky-50 dark:bg-sky-900/30 rounded-xl flex items-center justify-center">
                <Briefcase size={13} className="text-sky-500" />
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Latest Experience</p>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <div className="w-9 h-9 rounded-lg" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{latestExp.role || 'Role'}</p>
                <p className="text-xs text-gray-500">{latestExp.company || 'Company'} · {latestExp.start_date ? `${latestExp.start_date}${latestExp.end_date ? ` - ${latestExp.end_date}` : ''}` : ''}</p>
                {latestExp.description && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{latestExp.description}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Highlights ── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Sparkles size={14} className="text-amber-500" />Highlights
            </p>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {highlights.length > 0 ? highlights.map(hl => (
              <div key={hl.id} className="flex-shrink-0 group relative">
                <button onClick={() => hl.item_count > 0 && setViewingHL(hl)}
                  className="w-[88px] h-[112px] rounded-2xl overflow-hidden relative shadow-sm hover:shadow-md transition-shadow block">
                  {hl.cover_url
                    ? <img src={hl.cover_url} loading="lazy" alt={hl.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                        <Sparkles size={22} className="text-white" />
                      </div>
                  }
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-2 pt-6 pb-2">
                    <p className="text-white text-[10px] font-semibold truncate text-center leading-tight">{hl.title}</p>
                  </div>
                </button>
              </div>
            )) : (
              <div className="flex items-center gap-3 px-3 py-2 text-gray-300 dark:text-gray-600">
                <Sparkles size={16} className="opacity-50" />
                <p className="text-xs">No highlights yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
