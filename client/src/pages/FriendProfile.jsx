import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldOff, ShieldAlert, AlertTriangle, Sparkles, X, Users, Image as ImageIcon, Briefcase, Star, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import ProfileCard from '../components/ProfileCard';
import PostCard from '../components/PostCard';
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
  const [posts, setPosts] = useState([]);
  const [friendList, setFriendList] = useState([]);
  const [projects, setProjects] = useState([]);
  const [endorsements, setEndorsements] = useState([]);
  const [endorsingSkill, setEndorsingSkill] = useState(null);

  const load = async () => {
    try {
      const [profileRes, hlRes, postsRes, friendsRes, projectsRes, endorsementsRes] = await Promise.allSettled([
        api.get(`/friends/profile/${id}`),
        api.get(`/highlights/${id}`),
        api.get(`/posts/user/${id}`),
        api.get(`/friends/user/${id}`),
        api.get(`/projects/${id}`),
        api.get(`/endorsements/${id}`),
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

      if (postsRes.status === 'fulfilled') {
        setPosts(postsRes.value.data || []);
      }

      if (friendsRes.status === 'fulfilled') {
        setFriendList(friendsRes.value.data);
      }
      if (projectsRes.status === 'fulfilled') setProjects(projectsRes.value.data || []);
      if (endorsementsRes.status === 'fulfilled') setEndorsements(endorsementsRes.value.data || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handleReact = async (postId, type) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const removing = !type;
    const typeToSend = type || post.my_reaction;
    if (!typeToSend) return;
    const prevReaction = post.my_reaction;
    const prevCount = post.reactions_count;
    setPosts(p => p.map(x => x.id === postId ? {
      ...x,
      my_reaction: removing ? null : type,
      reactions_count: removing
        ? Math.max(0, Number(x.reactions_count) - 1)
        : prevReaction ? Number(x.reactions_count) : Number(x.reactions_count) + 1,
    } : x));
    try {
      await api.post(`/posts/${postId}/react`, { type: typeToSend });
    } catch {
      setPosts(p => p.map(x => x.id === postId ? { ...x, my_reaction: prevReaction, reactions_count: prevCount } : x));
    }
  };

  const handleDelete = async (postId) => {
    try {
      await api.delete(`/posts/${postId}`);
      setPosts(p => p.filter(x => x.id !== postId));
    } catch {}
  };

  const handleRepost = async (postId, repost_text) => {
    try { await api.post(`/posts/${postId}/repost`, { repost_text }); } catch {}
  };

  const handleCommentCountChange = (postId, delta) => {
    setPosts(p => p.map(x => x.id === postId
      ? { ...x, comments_count: Math.max(0, Number(x.comments_count) + delta) }
      : x));
  };

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
          nickname={profile.nickname}
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

        {/* ── Friends Grid ── */}
        {friendList.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Users size={14} className="text-emerald-500" />
                Friends <span className="text-gray-400 font-normal">· {friendList.length}</span>
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {friendList.slice(0, 9).map(f => (
                <Link key={f.id} to={`/friends/${f.id}`}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-white dark:ring-gray-900">
                    {f.avatar
                      ? <img src={f.avatar} loading="lazy" alt={f.name} className="w-full h-full rounded-full object-cover" />
                      : (f.name?.[0] || '?')
                    }
                  </div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate w-full text-center group-hover:text-indigo-600 transition-colors">{f.name}</p>
                  <p className="text-[10px] text-gray-400 truncate w-full text-center">{f.location || 'Nexly'}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
        {/* ── Projects ── */}
        {projects.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-3">
              <Briefcase size={14} className="text-indigo-500" />Projects
            </p>
            <div className="space-y-3">
              {projects.map(p => (
                <div key={p.id}
                  className={`p-3 bg-gray-50 dark:bg-gray-800 rounded-xl ${p.url ? 'cursor-pointer' : ''}`}
                  onClick={() => p.url && window.open(p.url, '_blank', 'noopener,noreferrer')}>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex-1 truncate">{p.title}</p>
                    {p.url && <ExternalLink size={12} className="text-indigo-500 flex-shrink-0" />}
                  </div>
                  {p.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{p.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Skills & Endorsements ── */}
        {profile?.skills?.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-3">
              <Star size={14} className="text-amber-500" />Skills
              {profile?.friendship_status === 'accepted' && (
                <span className="ml-auto text-[10px] font-normal text-gray-400">Click a skill to endorse</span>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map(skill => {
                const endorsement = endorsements.find(e => e.skill === skill);
                const count = endorsement?.count || 0;
                const endorsed = endorsement?.endorsed_by_me || false;
                const isFriend = profile?.friendship_status === 'accepted';
                return (
                  <button key={skill}
                    onClick={async () => {
                      if (!isFriend || endorsingSkill === skill) return;
                      setEndorsingSkill(skill);
                      try {
                        if (endorsed) {
                          await api.delete(`/endorsements/${id}/${encodeURIComponent(skill)}`);
                          setEndorsements(prev =>
                            prev.map(e => e.skill === skill ? { ...e, endorsed_by_me: false, count: Math.max(0, e.count - 1) } : e)
                              .filter(e => e.count > 0 || e.endorsed_by_me)
                          );
                        } else {
                          await api.post(`/endorsements/${id}/${encodeURIComponent(skill)}`);
                          setEndorsements(prev => {
                            const existing = prev.find(e => e.skill === skill);
                            if (existing) return prev.map(e => e.skill === skill ? { ...e, endorsed_by_me: true, count: e.count + 1 } : e);
                            return [...prev, { skill, count: 1, endorsed_by_me: true, endorsers: [] }];
                          });
                        }
                      } catch {}
                      finally { setEndorsingSkill(null); }
                    }}
                    disabled={endorsingSkill === skill}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all disabled:opacity-60 ${
                      endorsed
                        ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                        : isFriend
                          ? 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 cursor-pointer'
                          : 'border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-500 cursor-default'
                    }`}>
                    <Star size={10} className={endorsed ? 'text-indigo-500' : 'text-gray-400'} />
                    {skill}
                    {count > 0 && <span className="font-bold text-indigo-600 dark:text-indigo-400 ml-0.5">{count}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Posts ── */}
        <div className="space-y-3">
          {posts.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-8 flex flex-col items-center gap-2 text-gray-300 dark:text-gray-600">
              <ImageIcon size={28} className="opacity-40" />
              <p className="text-sm">No posts yet</p>
            </div>
          ) : posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              myId={myId}
              onReact={handleReact}
              onDelete={handleDelete}
              onRepost={handleRepost}
              onCommentCountChange={handleCommentCountChange}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
}
