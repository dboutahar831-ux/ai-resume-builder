import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Image, X, Users, Video, Sparkles, Search,
  Clock, Hash, SlidersHorizontal, CalendarClock,
  BarChart2, Globe, Lock, ChevronDown, Plus, Trash2,
} from 'lucide-react';
import Layout from '../components/Layout';
import StoriesBar from '../components/StoriesBar';
import MentionSuggestions from '../components/MentionSuggestions';
import HomeSidebar from '../components/HomeSidebar';
import { useMention } from '../hooks/useMention';
import { useToast } from '../components/Toast';
import api from '../api/axios';
import { compressImage } from '../utils/imageUtils';
import PostCard, { Avatar, timeAgo, isOnline } from '../components/PostCard';

const FALLBACK_TOPICS = ['#JobSearchAI', '#ResumeTips', '#CareerGrowth', '#InterviewPrep', '#TechJobs', '#HiringNow', '#CareerAdvice', '#LinkedInTips'];

function ScheduleModal({ onClose, onSchedule }) {
  const [dt, setDt] = useState('');
  const min = new Date(Date.now() + 5 * 60000).toISOString().slice(0, 16);
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'popUp 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="font-bold text-gray-900">Schedule Post</p>
            <p className="text-xs text-gray-400 mt-0.5">Choose when to publish</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"><X size={15} /></button>
        </div>
        <div className="p-5 space-y-3">
          <input
            type="datetime-local"
            value={dt}
            min={min}
            onChange={e => setDt(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
          />
          {dt && (
            <p className="text-xs text-indigo-600 font-medium flex items-center gap-1.5">
              <CalendarClock size={13} />
              Scheduled for {new Date(dt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={() => { if (dt) { onSchedule(dt); onClose(); } }}
            disabled={!dt}
            className="flex-1 px-4 py-2.5 text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2 transition-all" style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
            <Clock size={14} />Schedule
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const myUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [coverImage, setCoverImage] = useState(myUser.cover_image || '');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState('');
  const [postVideo, setPostVideo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState('');
  const [stats, setStats] = useState({ friends: 0, unread: 0 });
  const [friends, setFriends] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [addedIds, setAddedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [trendingTopics, setTrendingTopics] = useState(FALLBACK_TOPICS);
  const [scheduleModal, setScheduleModal] = useState(false);
  const [composerFocused, setComposerFocused] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [scheduledAt, setScheduledAt] = useState(null);
  const [feedOffset, setFeedOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [linkPreview, setLinkPreview] = useState(null);
  const [linkPreviewLoading, setLinkPreviewLoading] = useState(false);
  const [linkPreviewDismissed, setLinkPreviewDismissed] = useState(false);
  const sentinelRef = useRef();
  const postFileRef = useRef();
  const postVideoRef = useRef();
  const textareaRef = useRef();
  const searchRef = useRef();
  const searchTimerRef = useRef();
  const linkPreviewTimerRef = useRef();
  const postMention = useMention();

  // Poll composer state
  const [showPollComposer, setShowPollComposer] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollEndsAt, setPollEndsAt] = useState('');

  // Post visibility
  const [postVisibility, setPostVisibility] = useState('public');
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
  const addToast = useToast();

  const loadMore = useCallback(async (offset) => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await api.get(`/posts/feed?offset=${offset}`);
      const newPosts = res.data;
      if (newPosts.length < 20) setHasMore(false);
      setPosts(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        return [...prev, ...newPosts.filter(p => !existingIds.has(p.id))];
      });
      setFeedOffset(offset + newPosts.length);
    } catch {} finally { setLoadingMore(false); }
  }, [loadingMore]);

  const load = useCallback(async () => {
    api.get('/posts/feed?offset=0')
      .then(res => {
        setPosts(res.data);
        setFeedOffset(res.data.length);
        setHasMore(res.data.length >= 20);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    Promise.all([
      api.get('/friends'),
      api.get('/messages/unread/count'),
    ]).then(([f, u]) => {
      setStats({ friends: f.data.length, unread: u.data.count });
      setFriends(f.data.slice(0, 7));
    }).catch(() => {});
    api.get('/friends/requests').then(r => setFriendRequests(r.data)).catch(() => {});
    api.get('/notifications').then(r => {
      const data = Array.isArray(r.data) ? r.data : [];
      setNotifications(data);
      setNotifCount(data.filter(n => !n.read_at).length);
    }).catch(() => {});
    api.get('/friends/suggestions').then(r => setSuggestions(r.data)).catch(() => {});
    api.get('/messages/conversations').then(r => setConversations(r.data)).catch(() => {});
    api.get('/posts/trending').then(r => { if (r.data.length > 0) setTrendingTopics(r.data); }).catch(() => {});
    api.get('/auth/profile').then(r => { if (r.data.cover_image) setCoverImage(r.data.cover_image); }).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) loadMore(feedOffset);
    }, { rootMargin: '200px' });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, feedOffset, loadMore]);

  useEffect(() => {
    clearTimeout(searchTimerRef.current);
    if (!searchQuery.trim()) { setSearchResults([]); setSearchOpen(false); return; }
    setSearchOpen(true);
    const queryAtTime = searchQuery;
    searchTimerRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await api.get(`/friends/search?q=${encodeURIComponent(queryAtTime)}`);
        if (searchQuery === queryAtTime) setSearchResults(res.data);
      } catch { if (searchQuery === queryAtTime) setSearchResults([]); }
      finally { if (searchQuery === queryAtTime) setSearchLoading(false); }
    }, 350);
  }, [searchQuery]);

  useEffect(() => {
    const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    try { await api.put('/notifications/read-all'); } catch {}
    setNotifCount(0);
  };

  const acceptFriendReq = async (userId) => {
    try {
      await api.put(`/friends/accept/${userId}`);
      setFriendRequests(prev => prev.filter(f => f.id !== userId));
      setStats(prev => ({ ...prev, friends: prev.friends + 1 }));
      addToast('Friend request accepted!', 'success');
    } catch { addToast('Failed to accept request.', 'error'); }
  };

  const sendRequest = async (userId) => {
    try {
      await api.post(`/friends/request/${userId}`);
      setAddedIds(prev => new Set([...prev, userId]));
    } catch {}
  };

  const aiEnhance = async () => {
    if (!postText.trim() || enhancing) return;
    setEnhancing(true);
    setEnhanceError('');
    try {
      const res = await api.post('/ai/enhance', { text: postText });
      setPostText(res.data.enhanced);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
      }
    } catch (err) {
      setEnhanceError(err.response?.data?.error || 'Enhancement failed. Try again.');
      setTimeout(() => setEnhanceError(''), 4000);
    } finally { setEnhancing(false); }
  };

  const submitPost = async () => {
    const hasPoll = showPollComposer && pollQuestion.trim() && pollOptions.filter(o => o.trim()).length >= 2;
    if ((!postText.trim() && !postImage && !postVideo && !hasPoll) || submitting) return;
    setSubmitting(true);
    try {
      const pollPayload = hasPoll ? {
        question: pollQuestion.trim(),
        options: pollOptions.filter(o => o.trim()),
        ends_at: pollEndsAt || null,
      } : null;
      const res = await api.post('/posts', {
        content: postText.trim() || null,
        image_url: postImage || null,
        video_url: postVideo || null,
        scheduled_at: scheduledAt || null,
        mention_ids: postMention.mentionIds,
        link_metadata: linkPreview || null,
        visibility: postVisibility,
        poll: pollPayload,
      });
      if (!scheduledAt) setPosts(p => [res.data, ...p]);
      setPostText('');
      setPostImage('');
      setPostVideo('');
      setScheduledAt(null);
      setComposerFocused(false);
      setLinkPreview(null);
      setLinkPreviewDismissed(false);
      setShowPollComposer(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      setPollEndsAt('');
      setPostVisibility('public');
      postMention.reset();
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      localStorage.removeItem('post_draft');
    } finally { setSubmitting(false); }
  };

  const handlePostImage = async (e) => {
    const file = e.target.files[0];
    if (!file || file.size > 10 * 1024 * 1024) return;
    e.target.value = '';
    try {
      const compressed = await compressImage(file);
      setPostImage(compressed); setPostVideo('');
    } catch { addToast('Failed to process image.', 'error'); }
  };

  const handlePostVideo = (e) => {
    const file = e.target.files[0];
    if (!file || file.size > 15 * 1024 * 1024) return addToast('Video must be under 15MB.', 'warning');
    const reader = new FileReader();
    reader.onload = ev => { setPostVideo(ev.target.result); setPostImage(''); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleTextChange = (e) => {
    const val = e.target.value;
    setPostText(val);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
    postMention.onType(val, e.target.selectionStart);

    // Link preview detection
    clearTimeout(linkPreviewTimerRef.current);
    const urlMatch = val.match(/https?:\/\/[^\s]+/);
    if (urlMatch && !linkPreviewDismissed) {
      const url = urlMatch[0];
      if (!linkPreview || linkPreview.url !== url) {
        linkPreviewTimerRef.current = setTimeout(async () => {
          setLinkPreviewLoading(true);
          try {
            const res = await api.post('/link-preview', { url });
            if (res.data?.title) setLinkPreview({ ...res.data, url });
          } catch {} finally { setLinkPreviewLoading(false); }
        }, 800);
      }
    } else if (!urlMatch) {
      setLinkPreview(null);
      setLinkPreviewDismissed(false);
    }
  };

  const handleReact = async (postId, type) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const removing = !type;
    const typeToSend = type || post.my_reaction;
    if (!typeToSend) return;
    const prevReaction = post.my_reaction;
    const prevCount = post.reactions_count;
    // Optimistic update
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
    } catch { addToast('Failed to delete post.', 'error'); }
  };

  const handleRepost = async (postId, repost_text) => {
    try {
      const res = await api.post(`/posts/${postId}/repost`, { repost_text });
      setPosts(p => [res.data, ...p]);
    } catch { addToast('Failed to repost.', 'error'); }
  };

  const handleCommentCountChange = (postId, delta) => {
    setPosts(p => p.map(x => x.id === postId
      ? { ...x, comments_count: Math.max(0, Number(x.comments_count) + delta) }
      : x));
  };

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('post_draft');
    if (draft) {
      try {
        const { text } = JSON.parse(draft);
        if (text) { setPostText(text); setComposerFocused(true); }
      } catch {}
    }
  }, []);

  // Auto-save draft
  useEffect(() => {
    if (postText.trim()) {
      localStorage.setItem('post_draft', JSON.stringify({ text: postText }));
    } else {
      localStorage.removeItem('post_draft');
    }
  }, [postText]);

  const hasMedia = postImage || postVideo;
  const composerExpanded = composerFocused || !!(postText || postImage || postVideo || scheduledAt || showPollComposer);

  return (
    <Layout>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes popUp {
          from { opacity: 0; transform: scale(0.85) translateY(4px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes subtle-float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.6; transform: scale(1.3); }
        }
      `}</style>

      {/* Far-right floating panel removed */}
      {false && <div className="hidden">
        <div className="relative flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl bg-white/40 backdrop-blur-sm border border-gray-100/30 shadow-lg">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/0 via-white/20 to-white/0 pointer-events-none dark:hidden" />

        {/* Live Clock */}
        <div className="relative group">
          <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-indigo-400/30 via-purple-400/30 to-teal-400/30 opacity-0 group-hover:opacity-100 blur-sm transition-all duration-500" />
          <div className="relative bg-white dark:bg-[#1A1A1A] rounded-xl border border-gray-200 dark:border-[#2A2A2A] px-3 py-2 shadow-sm group-hover:shadow-md transition-all cursor-default min-w-[60px] text-center">
            <div className="text-[18px] font-bold tracking-wider text-gray-900 dark:text-gray-100 leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {currentTime.toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'})}
            </div>
            <div className="text-[7px] font-semibold text-indigo-500 uppercase tracking-widest leading-tight mt-0.5">
              {currentTime.toLocaleTimeString('en',{second:'2-digit'})}
            </div>
          </div>
        </div>

        {/* Date */}
        <div className="relative date-far-btn">
          <button onClick={() => setDateOpen(o => !o)}
            className="flex flex-col items-center bg-white/80 backdrop-blur-sm border border-gray-100/50 rounded-xl px-2.5 py-2 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer min-w-[46px]">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{new Date().toLocaleDateString('en',{month:'short'})}</span>
            <span className="text-base font-bold text-gray-800 leading-none mt-px">{new Date().getDate()}</span>
            <span className="text-[6px] font-semibold text-gray-400 mt-0.5">{new Date().toLocaleDateString('en',{weekday:'short'})}</span>
          </button>
          {dateOpen && (
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white dark:bg-[#1A1A1A] rounded-xl border border-gray-100 dark:border-[#2A2A2A] shadow-xl z-50 w-52 overflow-hidden date-far-dropdown" style={{animation:'fadeInUp 0.15s ease'}}>
              <div className="p-3 text-center">
                <p className="text-[11px] font-bold text-gray-900 dark:text-gray-100">{new Date().toLocaleDateString('en',{weekday:'long',month:'long',day:'numeric'})}</p>
                <div className="grid grid-cols-7 gap-0.5 mt-3 text-[9px]">
                  {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <span key={d} className="font-bold text-gray-400 py-1">{d}</span>)}
                  {Array.from({length:35},(_,i)=>{const d=i-2;return<span key={i} className={`py-1 rounded-md ${d<1||d>30?'text-gray-200':'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-colors'} ${d===new Date().getDate()?'bg-indigo-100 text-indigo-700 font-bold':''}`}>{d>0&&d<31?d:''}</span>})}
                </div>
              </div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full border-y-4 border-l-4 border-y-transparent border-l-white" />
            </div>
          )}
        </div>

        <div className="w-[2px] h-4 rounded-full" style={{ background: 'linear-gradient(180deg,transparent,#6C5CE7)' }} />

        <div className="w-[2px] h-4 rounded-full" style={{ background: 'linear-gradient(180deg,transparent,#6C5CE7)' }} />

        {/* Streak */}
        <div className="relative streak-far-btn" style={{ animation: 'subtle-float 4s ease-in-out infinite', animationDelay: '0.5s' }}>
          <button onClick={() => setStreakOpen(o => !o)}
            className="flex flex-col items-center bg-white/80 backdrop-blur-sm border border-gray-100/50 rounded-xl px-3 py-2 shadow-sm hover:shadow-md hover:border-amber-200 transition-all cursor-pointer">
            <span className="text-xl">🔥</span>
            <span className="text-[8px] font-bold text-gray-400 mt-px">0</span>
          </button>
          {streakOpen && (
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white rounded-xl border border-gray-100 shadow-xl z-50 w-48 overflow-hidden streak-far-dropdown" style={{animation:'fadeInUp 0.15s ease'}}>
              <div className="p-4 text-center">
                <p className="text-[11px] font-bold text-gray-900 mb-2">🔥 Activity</p>
                <p className="text-[9px] text-gray-400">Start posting to build your streak!</p>
              </div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full border-y-4 border-l-4 border-y-transparent border-l-white" />
            </div>
          )}
        </div>

        {/* Tasks */}
        <div className="relative tasks-far-btn" style={{ animation: 'subtle-float 4s ease-in-out infinite', animationDelay: '2s' }}>
          <button onClick={() => setTasksOpen(o => !o)}
            className="flex flex-col items-center bg-white/80 backdrop-blur-sm border border-gray-100/50 rounded-xl px-3 py-2 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-emerald-500"><path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="text-[8px] font-bold text-gray-400 mt-px">Tasks</span>
          </button>
          {tasksOpen && (
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white rounded-xl border border-gray-100 shadow-xl z-50 w-52 overflow-hidden tasks-far-dropdown" style={{animation:'fadeInUp 0.15s ease'}}>
              <div className="px-3 py-2.5 border-b border-gray-50"><p className="text-[11px] font-bold text-gray-900">Today's Tasks</p></div>
              <div className="p-4 text-center">
                <p className="text-[9px] text-gray-400">No tasks yet. Stay productive!</p>
              </div>
              <Link to="/dashboard" onClick={() => setTasksOpen(false)} className="block w-full px-3 py-2 text-[10px] text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors text-center">Go to Dashboard →</Link>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full border-y-4 border-l-4 border-y-transparent border-l-white" />
            </div>
          )}
        </div>

        <div className="w-[2px] h-4 rounded-full" style={{ background: 'linear-gradient(180deg,transparent,#2EC4B6)' }} />

        {/* Notifications */}
        <div className="relative notif-far-btn" style={{ animation: 'subtle-float 4s ease-in-out infinite', animationDelay: '1s' }}>
          <button onClick={() => setNotifOpen(o=>!o)}
            className="flex flex-col items-center bg-white/80 backdrop-blur-sm border border-gray-100/50 rounded-xl px-3 py-2 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-indigo-500"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="text-[8px] font-bold text-gray-400 mt-px">{notifCount} new</span>
          </button>
          {notifCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full shadow-sm" />}
          {notifOpen && (
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white rounded-xl border border-gray-100 shadow-xl z-50 w-52 overflow-hidden notif-far-dropdown" style={{animation:'fadeInUp 0.15s ease'}}>
              <div className="px-3 py-2 border-b border-gray-50 flex items-center justify-between"><p className="text-[11px] font-bold text-gray-900">Notifications</p>{notifCount > 0 && <span className="text-[8px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full font-semibold">{notifCount}</span>}</div>
              {notifications.length === 0 ? (
                <div className="p-4 text-center"><p className="text-[9px] text-gray-400">No notifications yet</p></div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.slice(0, 5).map((n,i)=><div key={n.id||i} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 transition-colors cursor-pointer"><span className="text-sm">{n.icon||'🔔'}</span><div className="flex-1 min-w-0"><p className="text-[9px] text-gray-700 truncate">{n.content||n.message||n.text||'New notification'}</p><p className="text-[7px] text-gray-400">{timeAgo(n.created_at)}</p></div></div>)}
                </div>
              )}
              {notifCount > 0 && <button onClick={markAllRead} className="w-full px-3 py-1.5 text-[9px] text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors text-center">Mark all read</button>}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full border-y-4 border-l-4 border-y-transparent border-l-white" />
            </div>
          )}
        </div>

        <div className="w-[2px] h-4 rounded-full" style={{ background: 'linear-gradient(180deg,transparent,#BF5AF2)' }} />

        {/* Messages */}
        <div className="relative msg-far-btn">
          <button onClick={() => setMsgOpen(o=>!o)}
            className="flex flex-col items-center bg-white/80 backdrop-blur-sm border border-gray-100/50 rounded-xl px-3 py-2 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-blue-500"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="text-[8px] font-bold text-gray-400 mt-px">Chats</span>
          </button>
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full shadow-sm" />
          {msgOpen && (
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white rounded-xl border border-gray-100 shadow-xl z-50 w-52 overflow-hidden msg-far-dropdown" style={{animation:'fadeInUp 0.15s ease'}}>
              <div className="px-3 py-2 border-b border-gray-50 flex items-center justify-between"><p className="text-[11px] font-bold text-gray-900">Messages</p>{stats.unread > 0 && <span className="text-[8px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded-full font-semibold">{stats.unread} unread</span>}</div>
              {conversations.length === 0 ? (
                <div className="p-4 text-center"><p className="text-[9px] text-gray-400">No recent messages</p></div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {conversations.slice(0, 5).map((c,i)=><div key={c.other_id||i} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-[9px] flex-shrink-0">{c.other_name?.[0]||'?'}</div>
                    <div className="flex-1 min-w-0"><p className="text-[9px] font-semibold text-gray-800 truncate">{c.other_name}</p><p className="text-[7px] text-gray-400 truncate">{c.has_image ? '📷 Photo' : c.has_voice ? '🎤 Voice' : c.last_message||'No messages yet'}</p></div>
                    {Number(c.unread) > 0 && <span className="text-[8px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded-full font-semibold">{c.unread}</span>}
                  </div>)}
                </div>
              )}
              <Link to="/messages" onClick={() => setMsgOpen(false)} className="block w-full px-3 py-1.5 text-[9px] text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors text-center">Open Messages →</Link>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full border-y-4 border-l-4 border-y-transparent border-l-white" />
            </div>
          )}
        </div>

        {/* Friends */}
        <div className="relative friends-far-btn">
          <button onClick={() => setFriendsOpen(o=>!o)}
            className="flex flex-col items-center bg-white/80 backdrop-blur-sm border border-gray-100/50 rounded-xl px-3 py-2 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-emerald-500"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="text-[8px] font-bold text-gray-400 mt-px">Friends</span>
          </button>
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full shadow-sm" />
          {friendsOpen && (
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white rounded-xl border border-gray-100 shadow-xl z-50 w-52 overflow-hidden friends-far-dropdown" style={{animation:'fadeInUp 0.15s ease'}}>
              <div className="px-3 py-2 border-b border-gray-50 flex items-center justify-between"><p className="text-[11px] font-bold text-gray-900">Friend Requests</p><span className="text-[8px] bg-emerald-50 text-emerald-500 px-1.5 py-0.5 rounded-full font-semibold">{friendRequests.length} new</span></div>
              {friendRequests.length === 0 ? (
                <div className="p-4 text-center"><p className="text-[9px] text-gray-400">No pending requests</p></div>
              ) : (
              <div className="divide-y divide-gray-50">
                {friendRequests.map((f,i)=><div key={f.id||i} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-[9px] flex-shrink-0">{f.name?.[0]||'?'}</div>
                  <div className="flex-1 min-w-0"><p className="text-[9px] font-semibold text-gray-800">{f.name}</p></div>
                  <button onClick={() => acceptFriendReq(f.id)} className="text-[9px] bg-indigo-50 text-indigo-600 font-semibold px-2 py-0.5 rounded-lg hover:bg-indigo-100 transition-colors">Accept</button>
                </div>)}
              </div>
              )}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full border-y-4 border-l-4 border-y-transparent border-l-white" />
            </div>
          )}
        </div>



        </div>
      </div>}



      {scheduleModal && (
        <ScheduleModal
          onClose={() => setScheduleModal(false)}
          onSchedule={(dt) => setScheduledAt(dt)}
        />
      )}

      <div className="max-w-5xl mx-auto">

        {/* Search bar */}
        <div className="relative mb-3" ref={searchRef}>
          <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-2.5 focus-within:border-indigo-200 focus-within:ring-2 focus-within:ring-indigo-50 transition-all">
            <Search size={16} className="text-gray-400 flex-shrink-0" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim() && setSearchOpen(true)}
              placeholder="Search people..."
              className="flex-1 text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent"
            />
            {searchLoading && <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />}
            {searchQuery && !searchLoading && (
              <button onClick={() => { setSearchQuery(''); setSearchResults([]); setSearchOpen(false); }}
                className="text-gray-300 hover:text-gray-500 transition-colors">
                <X size={14} />
              </button>
            )}
            <div className="h-4 w-px bg-gray-200 flex-shrink-0" />
            <button onClick={() => setAdvancedOpen(o => !o)}
              className={`flex items-center gap-1.5 text-xs font-semibold flex-shrink-0 transition-colors whitespace-nowrap ${advancedOpen ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
              <SlidersHorizontal size={13} /><span className="hidden sm:inline">Advanced Search</span>
            </button>
          </div>

          {advancedOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-40 p-4"
              style={{ animation: 'fadeInUp 0.15s ease' }}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Filter Results</p>
              <div className="grid grid-cols-2 gap-2">
                {['All Users', 'Connected', 'Not Connected', 'Active Now'].map(f => (
                  <button key={f} onClick={() => setAdvancedOpen(false)}
                    className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-colors text-left">
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}

          {searchOpen && (searchResults.length > 0 || (searchQuery.trim() && !searchLoading)) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden"
              style={{ animation: 'fadeInUp 0.15s ease' }}>
              {searchResults.length === 0 ? (
                <div className="px-4 py-5 text-center">
                  <p className="text-sm text-gray-400">No results for "<span className="font-medium text-gray-600">{searchQuery}</span>"</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {searchResults.map(user => (
                    <Link key={user.id} to={`/friends/${user.id}`}
                      onClick={() => { setSearchQuery(''); setSearchOpen(false); }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                      <Avatar user={user} size="sm" showDot lastSeen={user.last_seen_at} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                        {user.location && <p className="text-xs text-gray-400 truncate">{user.location}</p>}
                      </div>
                      <span className={`text-xs font-medium flex-shrink-0 ${
                        user.friendship_status === 'accepted' ? 'text-emerald-600' :
                        user.friendship_status === 'pending'  ? 'text-gray-400' :
                        'text-indigo-600'
                      }`}>
                        {user.friendship_status === 'accepted' ? 'Connected' :
                         user.friendship_status === 'pending'  ? 'Pending' : '+ Connect'}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Trending Topics */}
        <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <div className="flex items-center gap-1.5 flex-shrink-0 text-xs font-bold text-gray-400">
            <Hash size={13} />Trending
          </div>
          <div className="w-px h-4 bg-gray-200 flex-shrink-0" />
          {trendingTopics.map(tag => (
            <button key={tag}
              onClick={() => setPostText(t => t ? `${t} ${tag}` : tag)}
              className="flex-shrink-0 px-3 py-1.5 bg-white border border-gray-100 rounded-full text-xs font-semibold text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all shadow-sm whitespace-nowrap">
              {tag}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Feed */}
          <div className="lg:col-span-2 space-y-4">

            {/* Stories Bar */}
            <StoriesBar myUser={myUser} />

            {/* Composer */}
            <div
              className={`bg-white rounded-2xl border shadow-sm transition-all duration-200 ${composerExpanded ? 'border-indigo-200 shadow-md' : 'border-gray-100'}`}
              style={{ animation: 'slideDown 0.3s ease' }}
            >
              {/* Top row */}
              <div className="flex gap-3 items-start p-4 pb-3">
                <Link to="/profile" className="flex-shrink-0 mt-0.5">
                  <Avatar user={myUser} size="md" />
                </Link>
                <div className="flex-1 relative">
                  <MentionSuggestions
                    suggestions={postMention.suggestions}
                    show={postMention.showSuggestions}
                    onSelect={u => postMention.pickMention(u, postText, setPostText)}
                  />
                  {!composerExpanded ? (
                    <button
                      onClick={() => setComposerFocused(true)}
                      className="w-full text-left px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-400 transition-colors"
                    >
                      What's on your mind, {myUser.name?.split(' ')[0] || ''}? (@ to mention)
                    </button>
                  ) : (
                    <>
                      <textarea
                        ref={el => { textareaRef.current = el; postMention.inputRef.current = el; }}
                        value={postText}
                        onChange={handleTextChange}
                        onKeyDown={e => e.key === 'Enter' && e.ctrlKey && submitPost()}
                        onBlur={() => { if (!postText.trim() && !postImage && !postVideo && !scheduledAt) setComposerFocused(false); }}
                        placeholder={`What's on your mind, ${myUser.name?.split(' ')[0] || ''}? (@ to mention)`}
                        rows={3}
                        autoFocus
                        className="w-full text-sm text-gray-800 placeholder-gray-400 resize-none outline-none leading-relaxed bg-transparent"
                        style={{ minHeight: '80px', maxHeight: '250px' }}
                      />
                      {postImage && (
                        <div className="relative mt-2 inline-block">
                          <img src={postImage} loading="lazy" alt="preview"
                            className="max-h-52 max-w-full rounded-xl object-cover border border-gray-200" />
                          <button onClick={() => setPostImage('')}
                            className="absolute top-2 right-2 w-6 h-6 bg-gray-800/75 text-white rounded-full flex items-center justify-center hover:bg-gray-900">
                            <X size={11} />
                          </button>
                        </div>
                      )}
                      {postVideo && (
                        <div className="relative mt-2">
                          <video src={postVideo} controls className="max-h-52 rounded-xl w-full bg-black" />
                          <button onClick={() => setPostVideo('')}
                            className="absolute top-2 right-2 w-6 h-6 bg-gray-800/75 text-white rounded-full flex items-center justify-center hover:bg-gray-900">
                            <X size={11} />
                          </button>
                        </div>
                      )}
                      {/* Link Preview card */}
                      {linkPreviewLoading && !linkPreview && (
                        <div className="mt-2 h-16 bg-gray-50 dark:bg-gray-800 rounded-xl animate-pulse border border-gray-100 dark:border-gray-700" />
                      )}
                      {linkPreview && !linkPreviewDismissed && (
                        <div className="mt-2 relative flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
                          {linkPreview.image && (
                            <img src={linkPreview.image} loading="lazy" alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{linkPreview.url}</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-1 mt-0.5">{linkPreview.title}</p>
                            {linkPreview.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">{linkPreview.description}</p>
                            )}
                          </div>
                          <button onClick={() => { setLinkPreview(null); setLinkPreviewDismissed(true); }}
                            className="absolute top-2 right-2 w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-300 transition-colors">
                            <X size={10} />
                          </button>
                        </div>
                      )}

                      {/* Poll Composer */}
                      {showPollComposer && (
                        <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl space-y-2">
                          <div className="flex items-center gap-2 mb-1">
                            <BarChart2 size={13} className="text-indigo-500" />
                            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">Poll</span>
                            <button onClick={() => setShowPollComposer(false)} className="ml-auto text-gray-400 hover:text-gray-600">
                              <X size={13} />
                            </button>
                          </div>
                          <input value={pollQuestion} onChange={e => setPollQuestion(e.target.value)}
                            placeholder="Ask a question…"
                            className="w-full px-3 py-2 text-sm border border-indigo-200 dark:border-indigo-700 rounded-xl bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                          {pollOptions.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <input value={opt} onChange={e => {
                                const o = [...pollOptions]; o[i] = e.target.value; setPollOptions(o);
                              }}
                                placeholder={`Option ${i + 1}`}
                                className="flex-1 px-3 py-1.5 text-sm border border-indigo-200 dark:border-indigo-700 rounded-xl bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                              {pollOptions.length > 2 && (
                                <button onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-400 transition-colors">
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          ))}
                          {pollOptions.length < 4 && (
                            <button onClick={() => setPollOptions([...pollOptions, ''])}
                              className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium">
                              <Plus size={12} />Add option
                            </button>
                          )}
                          <div className="flex items-center gap-2 pt-1">
                            <label className="text-xs text-gray-500 dark:text-gray-400">Ends:</label>
                            <input type="datetime-local" value={pollEndsAt} onChange={e => setPollEndsAt(e.target.value)}
                              min={new Date(Date.now() + 3600000).toISOString().slice(0, 16)}
                              className="text-xs border border-indigo-200 dark:border-indigo-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none" />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {composerExpanded && enhanceError && (
                <p className="text-xs text-red-500 mx-4 mb-2 flex items-center gap-1">
                  <span>⚠</span>{enhanceError}
                </p>
              )}

              {composerExpanded && scheduledAt && (
                <div className="mx-4 mb-2 flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-xl">
                  <CalendarClock size={13} className="text-indigo-500 flex-shrink-0" />
                  <span className="text-xs text-indigo-700 font-medium flex-1">
                    Scheduled for {new Date(scheduledAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button onClick={() => setScheduledAt(null)} className="text-indigo-400 hover:text-indigo-600">
                    <X size={12} />
                  </button>
                </div>
              )}

              {/* Action bar */}
              <div className={`flex items-center gap-2 px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-800 ${composerExpanded ? 'justify-between' : 'justify-start'}`}>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setComposerFocused(true); postFileRef.current?.click(); }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-sm text-gray-500 hover:bg-emerald-50 hover:text-emerald-600 transition-all active:scale-95">
                    <Image size={16} className="text-emerald-500" />
                    <span className="font-medium hidden sm:inline">Photo</span>
                  </button>
                  <button
                    onClick={() => { setComposerFocused(true); postVideoRef.current?.click(); }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-sm text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-all active:scale-95">
                    <Video size={16} className="text-blue-500" />
                    <span className="font-medium hidden sm:inline">Video</span>
                  </button>
                  <button
                    onClick={() => { setComposerFocused(true); setShowPollComposer(v => !v); }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-sm transition-all active:scale-95 ${showPollComposer ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'}`}>
                    <BarChart2 size={16} className="text-indigo-500" />
                    <span className="font-medium hidden sm:inline">Poll</span>
                  </button>
                  {/* Visibility */}
                  {composerExpanded && (
                    <div className="relative">
                      <button onClick={() => setShowVisibilityMenu(v => !v)}
                        className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                        {postVisibility === 'public' && <Globe size={13} className="text-emerald-500" />}
                        {postVisibility === 'friends' && <Users size={13} className="text-blue-500" />}
                        {postVisibility === 'private' && <Lock size={13} className="text-gray-400" />}
                        <span className="hidden sm:inline capitalize">{postVisibility}</span>
                        <ChevronDown size={11} />
                      </button>
                      {showVisibilityMenu && (
                        <div className="absolute bottom-full mb-1 left-0 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl z-20 overflow-hidden min-w-36"
                          style={{ animation: 'fadeInUp 0.12s ease' }}>
                          {[
                            { v: 'public', icon: Globe, label: 'Public', sub: 'Everyone can see', color: 'text-emerald-500' },
                            { v: 'friends', icon: Users, label: 'Friends', sub: 'Only your friends', color: 'text-blue-500' },
                            { v: 'private', icon: Lock, label: 'Only me', sub: 'Just you', color: 'text-gray-400' },
                          ].map(({ v, icon: Icon, label, sub, color }) => (
                            <button key={v} onClick={() => { setPostVisibility(v); setShowVisibilityMenu(false); }}
                              className={`w-full flex items-start gap-2.5 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left ${postVisibility === v ? 'bg-gray-50 dark:bg-white/5' : ''}`}>
                              <Icon size={14} className={`${color} flex-shrink-0 mt-0.5`} />
                              <div>
                                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{label}</p>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500">{sub}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {composerExpanded && (
                  <div className="flex items-center gap-1.5">
                    <button onClick={aiEnhance}
                      disabled={!postText.trim() || enhancing || submitting}
                      title="AI Enhance"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-40 text-white shadow-sm hover:opacity-90"
                      style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
                      {enhancing
                        ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <Sparkles size={13} />}
                      <span className="hidden sm:inline">{enhancing ? 'Enhancing...' : 'AI Enhance'}</span>
                    </button>

                    <button onClick={() => setScheduleModal(true)}
                      disabled={(!postText.trim() && !hasMedia) || submitting}
                      title="Schedule Post"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-40 bg-emerald-600 text-white shadow-sm">
                      <Clock size={13} />
                      <span className="hidden sm:inline">Schedule</span>
                    </button>

                    <button onClick={submitPost}
                      disabled={(!postText.trim() && !hasMedia && !(showPollComposer && pollQuestion.trim() && pollOptions.filter(o=>o.trim()).length>=2)) || submitting}
                      className="px-4 py-1.5 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all active:scale-95 disabled:opacity-40 shadow-sm" style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
                      {submitting
                        ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : 'Post'}
                    </button>
                  </div>
                )}
              </div>

              <input ref={postFileRef} type="file" accept="image/*" className="hidden" onChange={handlePostImage} />
              <input ref={postVideoRef} type="file" accept="video/*" className="hidden" onChange={handlePostVideo} />
            </div>

            {/* Feed posts */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4">
                    <div className="flex gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full animate-shimmer flex-shrink-0" />
                      <div className="flex-1 space-y-2 pt-1">
                        <div className="h-3 animate-shimmer rounded-full w-36" />
                        <div className="h-2 animate-shimmer rounded-full w-24" />
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="h-3 animate-shimmer rounded-full" />
                      <div className="h-3 animate-shimmer rounded-full w-5/6" />
                      <div className="h-3 animate-shimmer rounded-full w-3/4" />
                    </div>
                    <div className="h-40 animate-shimmer rounded-xl" />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100"
                style={{ animation: 'fadeInUp 0.4s ease' }}>
                <div className="text-6xl mb-4">✨</div>
                <p className="text-gray-800 font-bold text-lg">Your feed is empty</p>
                <p className="text-sm text-gray-400 mt-1.5 max-w-xs mx-auto">
                  Share your first post above, or add friends to see their updates here.
                </p>
                <Link to="/friends"
                  className="inline-flex items-center gap-2 mt-5 px-5 py-2 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all shadow-sm" style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
                  <Users size={14} />Find Friends
                </Link>
              </div>
            ) : (
              <>
                {posts.map((post, i) => (
                  <div key={post.id} style={{ animation: `fadeInUp ${0.2 + i * 0.04}s ease both` }}>
                    <PostCard
                      post={post}
                      myId={myUser.id}
                      onDelete={handleDelete}
                      onReact={handleReact}
                      onCommentCountChange={handleCommentCountChange}
                      onRepost={handleRepost}
                    />
                  </div>
                ))}
                <div ref={sentinelRef} className="py-2">
                  {loadingMore && (
                    <div className="flex justify-center py-4">
                      <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {!hasMore && posts.length > 0 && (
                    <p className="text-center text-xs text-gray-400 py-4">You've seen all posts</p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:flex flex-col gap-4 sticky top-6 self-start">
            <HomeSidebar
              myUser={myUser}
              coverImage={coverImage}
              stats={stats}
              friends={friends}
              suggestions={suggestions}
              addedIds={addedIds}
              sendRequest={sendRequest}
            />

            {/* Daily Inspiration */}
            <div className="relative overflow-hidden rounded-2xl p-5 text-white shadow-sm"
              style={{ background: 'linear-gradient(135deg, #2EC4B6 0%, #6C5CE7 50%, #BF5AF2 100%)' }}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-6 -translate-x-6" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">Daily Inspiration</p>
              <p className="text-sm font-medium leading-relaxed text-white/90">
                "The only way to do great work is to love what you do."
              </p>
              <p className="text-xs text-white/50 mt-2 font-medium">— Steve Jobs</p>
            </div>

            {/* Activity Streak */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-gray-900">This Week</p>
                <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Active</span>
              </div>
              <div className="flex items-end gap-1.5 h-16">
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, i) => {
                  const h = [40, 25, 55, 70, 35, 60, 45][i];
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full rounded-lg transition-all duration-500 hover:opacity-80"
                        style={{ height: `${h}%`, background: i === new Date().getDay() ? 'linear-gradient(180deg,#6C5CE7,#BF5AF2)' : 'linear-gradient(180deg,#2EC4B6,#6C5CE7)', opacity: i > new Date().getDay() ? 0.25 : 1 }} />
                      <span className="text-[9px] font-medium text-gray-400">{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-2">Pro Tip</p>
              <p className="text-xs text-gray-600 leading-relaxed">
                Use <span className="font-semibold text-indigo-600">@mentions</span> to connect with friends and <span className="font-semibold text-indigo-600">#hashtags</span> to join trending conversations.
              </p>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
