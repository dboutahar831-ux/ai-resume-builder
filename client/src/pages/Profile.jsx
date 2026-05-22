import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Save, Check, AlertCircle, Camera, User, Mail, Phone,
  MapPin, Link2, Calendar, Pencil, X, Image as ImageIcon,
  FileText, Briefcase, Users, MessageSquare, Shield,
  Plus, Sparkles, Smile, Trash2, ChevronRight, Play,
  Share2, Trophy, Star, Lightbulb,
  Navigation, Video, Send, ThumbsUp, ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import StoryViewer from '../components/StoryViewer';
import { useToast } from '../components/Toast';
import api from '../api/axios';
import { useApp } from '../context/AppContext';

/* ─── Deterministic gradient from name ─── */
const GRADIENT_PALETTES = [
  ['#2EC4B6','#6C5CE7','#BF5AF2'],
  ['#FF6B6B','#EE5A24','#F0932B'],
  ['#00B894','#00CEC9','#55EFC4'],
  ['#6C5CE7','#A29BFE','#FD79A8'],
  ['#0984E3','#74B9FF','#81ECEC'],
  ['#E17055','#FDCB6E','#FAB1A0'],
  ['#636E72','#B2BEC3','#DFE6E9'],
  ['#2D3436','#0984E3','#00CEC9'],
];

function getGradientColors(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0;
  }
  return GRADIENT_PALETTES[Math.abs(hash) % GRADIENT_PALETTES.length];
}

/* ─── Animated Counter ─── */
function AnimatedCounter({ value, duration = 800 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || started.current) return;
    started.current = true;

    const start = performance.now();
    const from = 0;
    const diff = value - from;

    const raf = () => {
      const t = Math.min((performance.now() - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + diff * ease));
      if (t < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [value, duration]);

  return <span ref={ref}>{display}</span>;
}

/* ─── Scroll Reveal ─── */
function ScrollReveal({ children, className = '' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}>
      {children}
    </div>
  );
}

/* ─── Availability Badge ─── */
function AvailabilityBadge({ status, size = 'sm' }) {
  if (!status || status === 'all') return null;
  const isOpen = status === 'open_to_work';
  const colors = isOpen
    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700';
  const dot = isOpen ? 'bg-emerald-500' : 'bg-gray-400';
  const label = isOpen ? 'Open to Work' : 'Not Looking';
  const s = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${s} ${colors}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

/* ─── Profile Tips ─── */
function ProfileTips({ user, onDismiss }) {
  const [idx, setIdx] = useState(0);
  if (!user) return null;

  const tips = [];
  if (!user.avatar) tips.push({ icon: Camera, msg: 'Add a profile picture to build trust', key: 'avatar' });
  if (!user.bio) tips.push({ icon: FileText, msg: 'Write a short bio to tell your story', key: 'bio' });
  if (!user.location) tips.push({ icon: MapPin, msg: 'Add your location for better networking', key: 'location' });
  if (!user.linkedin) tips.push({ icon: Link2, msg: 'Link your LinkedIn profile', key: 'linkedin' });
  if (!user.phone) tips.push({ icon: Phone, msg: 'Add a phone number for recruiters', key: 'phone' });
  if (!user.skills?.length) tips.push({ icon: Star, msg: 'List your skills to stand out', key: 'skills' });

  if (tips.length === 0 || idx >= tips.length) return null;
  const tip = tips[idx];

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-2xl border border-amber-100 dark:border-amber-800/30 p-3 flex items-start gap-3">
      <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Lightbulb size={13} className="text-amber-600 dark:text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
            <span className="text-[10px] opacity-60 mr-1">{idx + 1}/{tips.length}</span>
            {tip.msg}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex gap-1">
            {tips.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? 'bg-amber-400' : 'bg-amber-200 dark:bg-amber-700'}`} />
            ))}
          </div>
          <div className="flex gap-2 ml-auto">
            {idx < tips.length - 1 && (
              <button onClick={() => setIdx(i => i + 1)}
                className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline font-medium">
                Next
              </button>
            )}
            <button onClick={onDismiss}
              className="text-[10px] text-amber-400 hover:text-amber-600">
              <X size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ─── */
function Avatar({ src, name, size = 'w-8 h-8', className = '' }) {
  const [c1, c2] = getGradientColors(name);
  return src
    ? <img src={src} loading="lazy" alt={name} className={`${size} rounded-full object-cover ring-2 ring-white ${className}`} />
    : <div className={`${size} rounded-full flex items-center justify-center ring-2 ring-white ${className}`}
        style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
        <span className="text-white font-bold text-sm select-none">{name?.[0]?.toUpperCase()}</span>
      </div>;
}

/* ─── Note Bubble ─── */
function NoteBubble({ note, isOwn, onEdit, onDelete }) {
  if (!note && !isOwn) return null;
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 flex flex-col items-center pointer-events-none">
      <div className={`px-3 py-1.5 rounded-2xl shadow-md border text-xs font-medium max-w-[160px] text-center whitespace-nowrap overflow-hidden text-ellipsis pointer-events-auto
        ${note
          ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200'
          : 'bg-white/90 dark:bg-gray-800 border-dashed border-gray-300 dark:border-gray-600 text-gray-400 cursor-pointer hover:border-indigo-400 hover:text-indigo-500 transition-colors'
        }`}
        onClick={!note && isOwn ? onEdit : undefined}
        title={note?.content}>
        {note ? note.content : '+ Add a note...'}
      </div>
      {note && isOwn && (
        <div className="flex gap-1.5 mt-0.5 pointer-events-auto">
          <button onClick={onEdit} className="text-[10px] text-gray-400 hover:text-indigo-500 transition-colors">Edit</button>
          <span className="text-gray-300 dark:text-gray-600 text-[10px]">·</span>
          <button onClick={onDelete} className="text-[10px] text-gray-400 hover:text-red-500 transition-colors">Delete</button>
        </div>
      )}
      <div className="w-3 h-3 -mt-px bg-white dark:bg-gray-800 border-b border-r border-gray-200 dark:border-gray-700 rotate-45 rounded-br-sm" />
    </div>
  );
}

/* ─── Note Modal ─── */
function NoteModal({ current, onSave, onClose }) {
  const [val, setVal] = useState(current || '');
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-xs shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
          <Smile size={16} className="text-indigo-500" />
          <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">Your Note</p>
        </div>
        <div className="p-4">
          <input autoFocus value={val}
            onChange={e => setVal(e.target.value.slice(0, 60))}
            placeholder="What's on your mind? (60 chars)"
            className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:bg-gray-800 dark:text-gray-200 transition-all" />
          <p className="text-right text-xs text-gray-400 mt-1">{val.length}/60</p>
        </div>
        <div className="flex gap-3 px-4 pb-4">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400">Cancel</button>
          <button onClick={() => { if (val.trim()) { onSave(val.trim()); onClose(); } }}
            disabled={!val.trim()}
            className="flex-1 py-2 text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-colors" style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Highlight Viewer ─── */
function HighlightViewer({ highlight, onClose }) {
  const [idx, setIdx] = useState(0);
  const items = highlight.items || [];
  const item = items[idx];
  if (!item) return null;
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex gap-1 mb-3">
          {items.map((_, i) => (
            <div key={i} className={`flex-1 h-0.5 rounded-full ${i <= idx ? 'bg-white' : 'bg-white/30'}`} />
          ))}
        </div>
        <div className="relative rounded-2xl overflow-hidden bg-black">
          {item.media_type === 'video'
            ? <video src={item.media_url} autoPlay controls className="w-full max-h-[70vh] object-contain" />
            : <img src={item.media_url} loading="lazy" alt="" className="w-full max-h-[70vh] object-contain" />
          }
          {item.caption && (
            <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/70 to-transparent">
              <p className="text-white text-sm">{item.caption}</p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between mt-3">
          <p className="text-white/80 text-sm font-semibold">{highlight.title}</p>
          <div className="flex gap-2">
            <button onClick={() => setIdx(i => Math.max(0, i - 1))} className="text-white/70 hover:text-white p-1.5 hover:bg-white/10 rounded-lg"><ChevronRight size={16} className="rotate-180" /></button>
            <button onClick={() => { if (idx < items.length - 1) setIdx(i => i + 1); else onClose(); }} className="text-white/70 hover:text-white p-1.5 hover:bg-white/10 rounded-lg"><ChevronRight size={16} /></button>
            <button onClick={onClose} className="text-white/70 hover:text-white p-1.5 hover:bg-white/10 rounded-lg"><X size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Add Highlight Modal ─── */
function AddHighlightModal({ onSave, onClose }) {
  const [title, setTitle] = useState('');
  const [items, setItems] = useState([]);
  const fileRef = useRef();

  const addItem = (e) => {
    const file = e.target.files[0];
    if (!file || file.size > 5 * 1024 * 1024) return;
    const isVideo = file.type.startsWith('video/');
    const reader = new FileReader();
    reader.onload = ev => setItems(prev => [...prev, { media_url: ev.target.result, media_type: isVideo ? 'video' : 'image' }]);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <p className="font-bold text-gray-900 dark:text-gray-100">New Highlight</p>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"><X size={15} /></button>
        </div>
        <div className="p-4 space-y-3">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Highlight title..."
            className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-indigo-400 dark:bg-gray-800 dark:text-gray-200 transition-all" />
          <div className="grid grid-cols-3 gap-2">
            {items.map((item, i) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden relative">
                {item.media_type === 'video'
                  ? <video src={item.media_url} className="w-full h-full object-cover" />
                  : <img src={item.media_url} loading="lazy" alt="" className="w-full h-full object-cover" />
                }
                <button onClick={() => setItems(p => p.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white">
                  <X size={9} />
                </button>
              </div>
            ))}
            <button onClick={() => fileRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-300 hover:border-indigo-300 hover:text-indigo-400 transition-colors">
              <Plus size={20} />
            </button>
          </div>
        </div>
        <div className="flex gap-3 px-4 pb-4">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400">Cancel</button>
          <button onClick={() => { if (title.trim() && items.length) { onSave(title.trim(), items); onClose(); } }}
            disabled={!title.trim() || !items.length}
            className="flex-1 py-2.5 text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-colors" style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
            Create
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={addItem} />
      </div>
    </div>
  );
}

/* ─── Friends Modal ─── */
function FriendsModal({ friends, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <p className="font-bold text-gray-900 dark:text-gray-100">Friends · {friends.length}</p>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"><X size={15} /></button>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-80 overflow-y-auto">
          {friends.map(f => (
            <Link key={f.id} to={`/friends/${f.id}`} onClick={onClose}
              className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <Avatar src={f.avatar} name={f.name} size="w-10 h-10" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{f.name}</p>
                <p className="text-xs text-gray-400 truncate">{f.location || 'Nexly'}</p>
              </div>
              <ChevronRight size={14} className="text-gray-300 ml-auto flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Story ring around avatar ─── */
function StoryAvatar({ avatar, name, hasStory, allSeen, size = 'w-28 h-28', onClick }) {
  const ring = hasStory
    ? allSeen
      ? 'p-[3px] bg-gray-300 dark:bg-gray-600'
      : 'p-[3px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600'
    : '';
  const [c1, c2] = getGradientColors(name);

  return (
    <div className={`rounded-full cursor-pointer ${ring}`} onClick={onClick}>
      <div className={`${ring ? 'p-1 bg-white dark:bg-gray-900 rounded-full' : ''}`}>
        {avatar
          ? <img src={avatar} loading="lazy" alt={name} className={`${size} rounded-full object-cover border-4 border-white dark:border-gray-900 shadow-xl`} />
          : <div className={`${size} rounded-full border-4 border-white dark:border-gray-900 shadow-xl flex items-center justify-center`}
              style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
              <span className="text-4xl font-bold text-white select-none">{name?.[0]?.toUpperCase()}</span>
            </div>
        }
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Main Profile Page
═══════════════════════════════════════════════════════════ */
export default function Profile() {
  const addToast = useToast();
  const { t } = useApp();
  const myId = JSON.parse(localStorage.getItem('user') || '{}').id;

  const [user, setUser]       = useState(null);
  const [stats, setStats]     = useState({ friends: 0, messages: 0 });
  const [friends, setFriends] = useState([]);
  const [form, setForm]       = useState({ name:'', nickname:'', age:'', phone:'', location:'', linkedin:'', avatar:'', bio:'', cover_image:'', skills:[], availability_status:'all' });
  const [skillInput, setSkillInput] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');
  const [tipDismissed, setTipDismissed] = useState(false);

  // Posts
  const [posts, setPosts]         = useState([]);
  const [postText, setPostText]   = useState('');
  const [postImage, setPostImage] = useState('');
  const [postVideo, setPostVideo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const postImageRef = useRef();
  const postVideoRef = useRef();

  // Stories
  const [myStories, setMyStories]   = useState(null);
  const [storyViewer, setStoryViewer] = useState(false);
  const [coverModal, setCoverModal]  = useState(false);
  const [avatarModal, setAvatarModal] = useState(false);

  // Note
  const [note, setNote]         = useState(null);
  const [noteModal, setNoteModal] = useState(false);

  // Highlights
  const [highlights, setHighlights]       = useState([]);
  const [viewingHL, setViewingHL]         = useState(null);
  const [addHLModal, setAddHLModal]       = useState(false);

  // Friends modal
  const [friendsModal, setFriendsModal] = useState(false);

  // Projects
  const [projects, setProjects]             = useState([]);
  const [projectModal, setProjectModal]     = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectForm, setProjectForm]       = useState({ title: '', description: '', url: '' });
  const [projectSaving, setProjectSaving]   = useState(false);

  // Endorsements
  const [endorsements, setEndorsements] = useState([]);

  const fileRef  = useRef();
  const coverRef = useRef();

  const loadAll = useCallback(async () => {
    const [profileRes, statsArr, storyRes, noteRes, hlRes, friendRes, postsRes, projectsRes, endorsementsRes] = await Promise.allSettled([
      api.get('/auth/profile'),
      Promise.all([api.get('/friends'), api.get('/messages/unread/count')]),
      api.get('/stories/feed'),
      api.get(`/notes/${myId}`),
      api.get(`/highlights/${myId}`),
      api.get('/friends'),
      api.get(`/posts/user/${myId}`),
      api.get(`/projects/${myId}`),
      api.get(`/endorsements/${myId}`),
    ]);

    if (profileRes.status === 'fulfilled') {
      const d = profileRes.value.data;
      setUser(d);
      setForm({ name: d.name||'', nickname: d.nickname||'', age: d.age||'', phone: d.phone||'', location: d.location||'', linkedin: d.linkedin||'', avatar: d.avatar||'', bio: d.bio||'', cover_image: d.cover_image||'', skills: d.skills||[], availability_status: d.availability_status||'all' });
    }
    if (statsArr.status === 'fulfilled') {
      const [f, m] = statsArr.value;
      setStats({ friends: f.data.length, messages: m.data.count });
    }
    if (storyRes.status === 'fulfilled') {
      const mine = storyRes.value.data.find(u => u.user_id === myId);
      setMyStories(mine || null);
    }
    if (noteRes.status === 'fulfilled') setNote(noteRes.value.data);
    if (hlRes.status === 'fulfilled') setHighlights(hlRes.value.data);
    if (friendRes.status === 'fulfilled') setFriends(friendRes.value.data);
    if (postsRes.status === 'fulfilled') setPosts(postsRes.value.data);
    if (projectsRes.status === 'fulfilled') setProjects(projectsRes.value.data);
    if (endorsementsRes.status === 'fulfilled') setEndorsements(endorsementsRes.value.data);
  }, [myId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const readFile = (file, maxMb, key) => {
    if (!file) return;
    if (file.size > maxMb * 1024 * 1024) return setError(`File must be under ${maxMb}MB.`);
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, [key]: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await api.put('/auth/profile', form);
      setUser(u => ({ ...u, ...res.data }));
      localStorage.setItem('user', JSON.stringify({ ...JSON.parse(localStorage.getItem('user')||'{}'), ...res.data }));
      setSuccess('Profile updated!');
      setEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.response?.data?.error || 'Update failed.'); }
    finally { setSaving(false); }
  };

  const handleCancel = () => {
    if (user) setForm({ name: user.name||'', age: user.age||'', phone: user.phone||'', location: user.location||'', linkedin: user.linkedin||'', avatar: user.avatar||'', bio: user.bio||'', cover_image: user.cover_image||'', skills: user.skills||[], availability_status: user.availability_status||'all' });
    setEditing(false); setError(''); setSkillInput('');
  };

  const saveProject = async () => {
    if (!projectForm.title.trim() || projectSaving) return;
    setProjectSaving(true);
    try {
      if (editingProject) {
        const res = await api.put(`/projects/${editingProject.id}`, projectForm);
        setProjects(p => p.map(x => x.id === editingProject.id ? res.data : x));
      } else {
        const res = await api.post('/projects', projectForm);
        setProjects(p => [res.data, ...p]);
      }
      setProjectModal(false);
      setEditingProject(null);
      setProjectForm({ title: '', description: '', url: '' });
    } catch { addToast('Failed to save project.', 'error'); }
    finally { setProjectSaving(false); }
  };

  const deleteProject = async (id) => {
    try {
      await api.delete(`/projects/${id}`);
      setProjects(p => p.filter(x => x.id !== id));
    } catch { addToast('Failed to delete project.', 'error'); }
  };

  const saveNote = async (content) => {
    const res = await api.put('/notes', { content });
    setNote(res.data);
  };

  const deleteNote = async () => {
    try {
      await api.delete('/notes');
      setNote(null);
    } catch { addToast('Failed to delete note.', 'error'); }
  };

  const createHighlight = async (title, items) => {
    const res = await api.post('/highlights', { title });
    const hl = res.data;
    for (const item of items) {
      await api.post(`/highlights/${hl.id}/items`, item);
    }
    const updated = await api.get(`/highlights/${myId}`);
    setHighlights(updated.data);
  };

  const deleteHighlight = async (id) => {
    try {
      await api.delete(`/highlights/${id}`);
      setHighlights(prev => prev.filter(h => h.id !== id));
    } catch { addToast('Failed to delete highlight.', 'error'); }
  };

  const inp = 'w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white dark:bg-gray-800 dark:text-gray-200 transition-all';

  /* ─── Profile completeness ─── */
  const profileCompleteness = (() => {
    const fields = [
      { key: 'avatar', weight: 20 },
      { key: 'bio', weight: 20 },
      { key: 'location', weight: 15 },
      { key: 'linkedin', weight: 10 },
      { key: 'phone', weight: 10 },
      { key: 'cover_image', weight: 10 },
      { key: 'skills', weight: 15 },
    ];
    let score = 0;
    for (const f of fields) {
      const val = user?.[f.key];
      if (f.key === 'skills') {
        if (Array.isArray(val) && val.length > 0) score += f.weight;
      } else if (val && val.trim()) {
        score += f.weight;
      }
    }
    return Math.min(100, score);
  })();

  const handleShare = () => {
    const url = `${window.location.origin}/profile/${myId}`;
    navigator.clipboard.writeText(url).then(() => {
      setSuccess('Profile link copied!');
      setTimeout(() => setSuccess(''), 2000);
    }).catch(() => setSuccess('Could not copy link.'));
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) {
      setForm(f => ({ ...f, skills: [...f.skills, s] }));
    }
    setSkillInput('');
  };

  const removeSkill = (skill) => {
    setForm(f => ({ ...f, skills: f.skills.filter(s => s !== skill) }));
  };

  if (!user) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  );

  const statCards = [
    { label: 'Friends', value: stats.friends,  to: '/friends',  icon: Users,         color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
    { label: 'Posts',   value: posts.length,   to: null,         icon: MessageSquare, color: 'text-indigo-500',  bg: 'bg-indigo-50 dark:bg-indigo-900/30'   },
    { label: 'Unread',  value: stats.messages, to: '/messages', icon: MessageSquare, color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-900/30'     },
  ];

  const storyFeedEntry = myStories ? [myStories] : [];
  const [c1, c2, c3] = getGradientColors(user.name);

  return (
    <Layout>
      <style>{`
        @keyframes fadeInDown { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.9) } to { opacity:1; transform:scale(1) } }
        @keyframes slideIn { from { opacity:0; transform:translateX(-12px) } to { opacity:1; transform:translateX(0) } }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .animate-fade-up { animation: fadeInUp 0.4s ease-out both }
        .animate-scale-in { animation: scaleIn 0.3s ease-out both }
        .animate-slide-in { animation: slideIn 0.3s ease-out both }
        .stagger-1 { animation-delay:0.05s } .stagger-2 { animation-delay:0.1s } .stagger-3 { animation-delay:0.15s } .stagger-4 { animation-delay:0.2s } .stagger-5 { animation-delay:0.25s }
        .animate-shimmer { background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%); background-size: 200% 100%; animation: shimmer 2s ease-in-out infinite }
        /* Custom scrollbar */
        .profile-scroll::-webkit-scrollbar { width: 4px }
        .profile-scroll::-webkit-scrollbar-track { background: transparent }
        .profile-scroll::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #2EC4B6, #6C5CE7); border-radius: 99px }
      `}</style>

      {/* Modals */}
      {noteModal && <NoteModal current={note?.content} onSave={saveNote} onClose={() => setNoteModal(false)} />}
      {viewingHL && <HighlightViewer highlight={viewingHL} onClose={() => setViewingHL(null)} />}
      {addHLModal && <AddHighlightModal onSave={createHighlight} onClose={() => setAddHLModal(false)} />}

      {projectModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setProjectModal(false)}>
          <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#2A2A2A] w-full max-w-sm shadow-2xl p-5"
            onClick={e => e.stopPropagation()} style={{ animation: 'popUp 0.2s ease' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Briefcase size={15} className="text-indigo-500" />
                {editingProject ? 'Edit Project' : 'Add Project'}
              </h3>
              <button onClick={() => setProjectModal(false)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-all">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Title *</label>
                <input value={projectForm.title} onChange={e => setProjectForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="My Awesome Project"
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                <textarea value={projectForm.description} onChange={e => setProjectForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe your project..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">URL</label>
                <input value={projectForm.url} onChange={e => setProjectForm(f => ({ ...f, url: e.target.value }))}
                  placeholder="https://github.com/..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setProjectModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                Cancel
              </button>
              <button onClick={saveProject} disabled={!projectForm.title.trim() || projectSaving}
                className="flex-1 px-4 py-2 text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-all"
                style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7)' }}>
                {projectSaving ? 'Saving…' : editingProject ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
      {friendsModal && <FriendsModal friends={friends} onClose={() => setFriendsModal(false)} />}
      {storyViewer && storyFeedEntry.length > 0 && (
        <StoryViewer
          userStories={storyFeedEntry}
          initialUserIndex={0}
          myId={myId}
          onClose={() => setStoryViewer(false)}
          onDelete={(id) => setMyStories(prev => prev ? { ...prev, stories: prev.stories.filter(s => s.id !== id) } : null)}
        />
      )}

      {/* Cover view modal */}
      {coverModal && form.cover_image && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4" onClick={() => setCoverModal(false)}>
          <button onClick={() => setCoverModal(false)} className="absolute top-4 right-4 w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors">
            <X size={18} />
          </button>
          <img src={form.cover_image} loading="lazy" alt="cover" className="max-w-3xl w-full rounded-2xl object-contain" />
        </div>
      )}

      {/* Avatar view modal */}
      {avatarModal && form.avatar && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4" onClick={() => setAvatarModal(false)}>
          <button onClick={() => setAvatarModal(false)} className="absolute top-4 right-4 w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors">
            <X size={18} />
          </button>
          <img src={form.avatar} loading="lazy" alt="profile" className="w-72 h-72 rounded-full object-cover shadow-2xl ring-4 ring-white/20" />
        </div>
      )}

      <div className="max-w-3xl mx-auto space-y-4 profile-scroll">

        {success && (
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-2xl text-sm border border-emerald-100 dark:border-emerald-800 animate-fade-up">
            <Check size={15} />{success}
          </div>
        )}

        {/* ── Hero card ── */}
        <ScrollReveal>
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-visible">

            {/* Cover with glass overlay */}
            <div className="relative h-52 rounded-t-3xl overflow-hidden group">
              {form.cover_image
                ? <img src={form.cover_image} loading="lazy" alt="cover" className="w-full h-full object-cover" />
                : <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${c1}, ${c2}, ${c3})` }} />
              }
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />

              {/* Cover actions */}
              <div className={`absolute top-3 right-3 flex gap-2 transition-all ${editing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                {form.cover_image && !editing && (
                  <button onClick={() => setCoverModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-medium rounded-xl transition-all">
                    <Play size={11} />View
                  </button>
                )}
                <button onClick={() => { if (!editing) setEditing(true); setTimeout(() => coverRef.current?.click(), 50); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-medium rounded-xl transition-all">
                  <ImageIcon size={11} />{form.cover_image ? 'Change' : 'Add Cover'}
                </button>
                {form.cover_image && editing && (
                  <button onClick={() => setForm(f => ({ ...f, cover_image: '' }))}
                    className="px-2.5 py-1.5 bg-white/20 hover:bg-red-500/60 backdrop-blur-md text-white text-xs rounded-xl transition-all">
                    <X size={11} />
                  </button>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="px-6 sm:px-8 pb-8 overflow-visible">
              {/* Avatar row */}
              <div className="flex items-end justify-between -mt-14 mb-5 relative overflow-visible">
                <div className="relative overflow-visible" style={{ marginTop: '-56px', paddingTop: '56px' }}>
                  <div className="relative inline-block">
                    <NoteBubble
                      note={note}
                      isOwn
                      onEdit={() => setNoteModal(true)}
                      onDelete={deleteNote}
                    />
                    <StoryAvatar
                      avatar={form.avatar}
                      name={form.name}
                      hasStory={!!myStories?.story_count}
                      allSeen={myStories?.all_seen ?? false}
                      size="w-28 h-28"
                      onClick={() => {
                        if (myStories?.story_count) setStoryViewer(true);
                        else if (form.avatar && !editing) setAvatarModal(true);
                      }}
                    />
                    <button
                      onClick={() => { if (!editing) setEditing(true); setTimeout(() => fileRef.current?.click(), 50); }}
                      className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 hover:rotate-12 border-2 border-white dark:border-gray-900 z-10" style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
                      <Camera size={13} className="text-white" />
                    </button>
                  </div>
                </div>

                {/* Edit / Save / Share */}
                <div className="flex gap-2 pb-1">
                  {!editing ? (
                    <>
                      <button onClick={handleShare}
                        className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                        <Share2 size={12} />Share
                      </button>
                      <button onClick={() => setEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 text-white rounded-2xl text-sm font-semibold transition-all hover:opacity-90 hover:-translate-y-0.5 shadow-sm" style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
                        <Pencil size={13} />Edit Profile
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={handleCancel}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                        <X size={13} />Cancel
                      </button>
                      <button onClick={handleSave} disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 text-white rounded-2xl text-sm font-semibold transition-all hover:opacity-90 shadow-sm disabled:opacity-60" style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
                        {saving
                          ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
                          : <><Save size={13} />Save</>}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Name + info */}
              {!editing ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">{user.name}</h1>
                    {user.nickname && <span className="text-sm text-gray-400 dark:text-gray-500 font-medium">@{user.nickname}</span>}
                    <AvailabilityBadge status={user.availability_status} />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                  {user.bio && <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-lg">{user.bio}</p>}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    {user.location && <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400"><MapPin size={12} className="text-gray-400" />{user.location}</span>}
                    {user.linkedin && (
                      <a href={user.linkedin.startsWith('http') ? user.linkedin : `https://${user.linkedin}`}
                        target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs text-indigo-600 hover:underline">
                        <Link2 size={12} />LinkedIn
                      </a>
                    )}
                    <span className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Calendar size={12} />Member since {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Skills tags */}
                  {user.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {user.skills.map(skill => (
                        <span key={skill}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full border"
                          style={{
                            background: 'linear-gradient(135deg, rgba(46,196,182,0.08), rgba(108,92,231,0.08))',
                            borderColor: 'rgba(108,92,231,0.2)',
                            color: '#6C5CE7',
                          }}>
                          <Star size={9} className="opacity-60" />
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Profile completeness */}
                  <div className="pt-2">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden relative">
                        <div className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                          style={{
                            width: `${profileCompleteness}%`,
                            background: profileCompleteness === 100
                              ? 'linear-gradient(90deg, #2EC4B6, #6C5CE7)'
                              : 'linear-gradient(90deg, #2EC4B6, #6C5CE7)',
                          }}>
                          {profileCompleteness > 0 && profileCompleteness < 100 && (
                            <div className="absolute inset-0 animate-shimmer" />
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-gray-400 flex items-center gap-1">
                        {profileCompleteness === 100 ? <Trophy size={10} className="text-amber-500" /> : null}
                        {profileCompleteness}% complete
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 mt-2">
                  {error && (
                    <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm border border-red-100 dark:border-red-800">
                      <AlertCircle size={14} />{error}
                    </div>
                  )}

                  {/* Availability toggle */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Availability</label>
                    <div className="flex gap-2">
                      {[
                        { value: 'all', label: 'All', icon: Users },
                        { value: 'open_to_work', label: 'Open to Work', icon: Briefcase },
                        { value: 'not_looking', label: 'Not Looking', icon: Shield },
                      ].map(opt => (
                        <button key={opt.value} onClick={() => setForm(f => ({ ...f, availability_status: opt.value }))}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                            form.availability_status === opt.value
                              ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                              : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}>
                          <opt.icon size={12} />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{t.fullName}</label>
                      <input className={inp} value={form.name} placeholder="Full name" onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                    <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Nickname</label>
                      <input className={inp} value={form.nickname} placeholder="e.g. johnny" onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{t.age}</label>
                      <input className={inp} type="number" min="10" max="100" placeholder="Age" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} /></div>
                  </div>
                  <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{t.email}</label>
                    <input className={inp + ' opacity-50 cursor-not-allowed'} value={user.email} disabled /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{t.phone}</label>
                      <input className={inp} placeholder="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
                    <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{t.location}</label>
                      <input className={inp} placeholder="City, Country" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
                  </div>
                  <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{t.linkedin}</label>
                    <input className={inp} placeholder="linkedin.com/in/..." value={form.linkedin} onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))} /></div>
                  <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Bio</label>
                    <textarea className={inp + ' resize-none'} rows={3} placeholder="Tell people about yourself..." value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} /></div>

                  {/* Skills */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Skills</label>
                    <div className="flex gap-2 mb-2">
                      <input className={inp + ' flex-1'} placeholder="Add a skill..." value={skillInput}
                        onChange={e => setSkillInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} />
                      <button onClick={addSkill} disabled={!skillInput.trim()}
                        className="px-3 py-2 text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-all flex items-center gap-1" style={{ background: 'linear-gradient(135deg,#2EC4B6,#6C5CE7)' }}>
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                      {form.skills.map(skill => (
                        <span key={skill}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full border"
                          style={{
                            background: 'linear-gradient(135deg, rgba(46,196,182,0.08), rgba(108,92,231,0.08))',
                            borderColor: 'rgba(108,92,231,0.2)',
                            color: '#6C5CE7',
                          }}>
                          {skill}
                          <button onClick={() => removeSkill(skill)} className="hover:text-red-500 transition-colors">
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                      {form.skills.length === 0 && <span className="text-xs text-gray-300 dark:text-gray-600">No skills added yet</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <input ref={fileRef}  type="file" accept="image/*" className="hidden" onChange={e => { readFile(e.target.files[0], 2, 'avatar');  e.target.value=''; }} />
            <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={e => { readFile(e.target.files[0], 5, 'cover_image'); e.target.value=''; }} />
          </div>
        </ScrollReveal>

        {/* ── Stats ── */}
        <ScrollReveal>
          <div className="grid grid-cols-3 gap-3">
            {statCards.map((s) => {
              const inner = (
                <>
                  <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <s.icon size={18} className={s.color} />
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      <AnimatedCounter value={s.value} />
                    </p>
                    <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                  </div>
                </>
              );
              return s.to ? (
                <Link key={s.label} to={s.to}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 flex flex-col items-center gap-2 hover:shadow-md hover:-translate-y-0.5 transition-all group">
                  {inner}
                </Link>
              ) : (
                <div key={s.label}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 flex flex-col items-center gap-2 group">
                  {inner}
                </div>
              );
            })}
          </div>
        </ScrollReveal>

        {/* ── Share Profile ── */}
        <ScrollReveal>
          <button onClick={handleShare}
            className="w-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-3 flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all group text-left">
            <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Share2 size={16} className="text-emerald-500" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Share Profile</p>
              <p className="text-[10px] text-gray-400">Copy your profile link</p>
            </div>
          </button>
        </ScrollReveal>

        {/* ── Create Post ── */}
        <ScrollReveal>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
            <div className="flex items-start gap-3">
              <Avatar src={user.avatar} name={user.name} size="w-9 h-9" />
              <div className="flex-1">
                <textarea
                  value={postText}
                  onChange={e => setPostText(e.target.value)}
                  placeholder="Share something with your network..."
                  rows={postText ? 3 : 2}
                  className="w-full resize-none text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                />
                {(postImage || postVideo) && (
                  <div className="relative mt-2 rounded-xl overflow-hidden max-h-48">
                    {postImage && <img src={postImage} loading="lazy" alt="" className="w-full object-cover max-h-48" />}
                    {postVideo && <video src={postVideo} controls className="w-full max-h-48" />}
                    <button
                      onClick={() => { setPostImage(''); setPostVideo(''); }}
                      className="absolute top-2 right-2 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors">
                      <X size={12} />
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex gap-1">
                    <button onClick={() => postImageRef.current?.click()}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <ImageIcon size={13} />Photo
                    </button>
                    <button onClick={() => postVideoRef.current?.click()}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <Video size={13} />Video
                    </button>
                  </div>
                  <button
                    onClick={async () => {
                      if ((!postText.trim() && !postImage && !postVideo) || submitting) return;
                      setSubmitting(true);
                      try {
                        const res = await api.post('/posts', {
                          content: postText.trim() || null,
                          image_url: postImage || null,
                          video_url: postVideo || null,
                        });
                        setPosts(p => [res.data, ...p]);
                        setPostText(''); setPostImage(''); setPostVideo('');
                      } finally { setSubmitting(false); }
                    }}
                    disabled={(!postText.trim() && !postImage && !postVideo) || submitting}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-white text-xs font-semibold rounded-xl disabled:opacity-50 hover:opacity-90 transition-all"
                    style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
                    {submitting
                      ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Send size={12} />}
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
        <input ref={postImageRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = ev => { setPostImage(ev.target.result); setPostVideo(''); }; r.readAsDataURL(f); e.target.value=''; }} />
        <input ref={postVideoRef} type="file" accept="video/*" className="hidden" onChange={e => { const f = e.target.files[0]; if (!f || f.size > 50*1024*1024) return; const r = new FileReader(); r.onload = ev => { setPostVideo(ev.target.result); setPostImage(''); }; r.readAsDataURL(f); e.target.value=''; }} />

        {/* ── Profile Tips ── */}
        {!tipDismissed && !editing && (
          <ScrollReveal>
            <ProfileTips user={user} onDismiss={() => setTipDismissed(true)} />
          </ScrollReveal>
        )}

        {/* ── Highlights ── */}
        <ScrollReveal>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Sparkles size={14} className="text-amber-500" />Highlights
              </p>
              <button onClick={() => setAddHLModal(true)}
                className="flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-2 py-1 rounded-lg transition-colors">
                <Plus size={12} />New
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
              <button onClick={() => setAddHLModal(true)}
                className="flex-shrink-0 w-[88px] h-[112px] rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-1.5 text-gray-300 dark:text-gray-600 hover:border-indigo-300 hover:text-indigo-400 dark:hover:border-indigo-500 transition-colors">
                <Plus size={22} />
                <span className="text-[10px] font-medium">New</span>
              </button>

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
                  <button onClick={() => deleteHighlight(hl.id)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10">
                    <X size={10} />
                  </button>
                </div>
              )) : (
                <div className="flex items-center gap-3 px-3 py-2 text-gray-300 dark:text-gray-600">
                  <Sparkles size={16} className="opacity-50" />
                  <p className="text-xs">No highlights yet — click <span className="font-semibold">New</span> to add one</p>
                </div>
              )}
            </div>
          </div>
        </ScrollReveal>

        {/* ── Friends Grid ── */}
        <ScrollReveal>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Users size={14} className="text-emerald-500" />
                Friends <span className="text-gray-400 font-normal">· {stats.friends}</span>
              </p>
              {friends.length > 0 && (
                <button onClick={() => setFriendsModal(true)}
                  className="text-xs text-indigo-600 font-semibold hover:underline">
                  See all
                </button>
              )}
            </div>
            {friends.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {friends.slice(0, 9).map(f => (
                  <button key={f.id} onClick={() => setFriendsModal(true)}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                    <Avatar src={f.avatar} name={f.name} size="w-12 h-12" />
                    <p className="text-[10px] font-medium text-gray-700 dark:text-gray-300 truncate w-full text-center group-hover:text-indigo-600">{f.name?.split(' ')[0]}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-gray-300 dark:text-gray-600">
                <Users size={28} className="mb-2 opacity-50" />
                <p className="text-xs font-medium">No friends yet</p>
                <p className="text-[10px] mt-0.5">Connect with others to build your network</p>
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* ── Projects ── */}
        <ScrollReveal>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Briefcase size={14} className="text-indigo-500" />Projects
              </p>
              <button onClick={() => { setEditingProject(null); setProjectForm({ title: '', description: '', url: '' }); setProjectModal(true); }}
                className="flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-2 py-1 rounded-lg transition-colors">
                <Plus size={12} />Add
              </button>
            </div>
            {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-gray-300 dark:text-gray-600">
                <Briefcase size={28} className="mb-2 opacity-50" />
                <p className="text-xs font-medium">No projects yet</p>
                <button onClick={() => { setEditingProject(null); setProjectForm({ title: '', description: '', url: '' }); setProjectModal(true); }}
                  className="text-xs text-indigo-600 font-semibold mt-2 hover:underline">Add your first project</button>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map(p => (
                  <div key={p.id} className="flex items-start justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{p.title}</p>
                        {p.url && (
                          <a href={p.url} target="_blank" rel="noopener noreferrer"
                            className="text-indigo-500 hover:text-indigo-700 flex-shrink-0" onClick={e => e.stopPropagation()}>
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                      {p.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{p.description}</p>}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={() => { setEditingProject(p); setProjectForm({ title: p.title, description: p.description || '', url: p.url || '' }); setProjectModal(true); }}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all">
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => deleteProject(p.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* ── Skill Endorsements ── */}
        {endorsements.length > 0 && (
          <ScrollReveal>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-3">
                <Star size={14} className="text-amber-500" />Skill Endorsements
              </p>
              <div className="space-y-3">
                {endorsements.map(e => (
                  <div key={e.skill} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{e.skill}</span>
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full flex-shrink-0">{e.count}</span>
                    </div>
                    <div className="flex -space-x-1.5 flex-shrink-0">
                      {(e.endorsers || []).slice(0, 4).map(u => (
                        u.avatar
                          ? <img key={u.id} src={u.avatar} loading="lazy" alt={u.name} title={u.name} className="w-6 h-6 rounded-full object-cover ring-2 ring-white dark:ring-gray-900" />
                          : <div key={u.id} title={u.name} className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-[9px] font-bold ring-2 ring-white dark:ring-gray-900">
                              {u.name?.[0]?.toUpperCase()}
                            </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* ── Account info (view mode) ── */}
        {!editing && (
          <ScrollReveal>
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-800 flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                  <Shield size={14} className="text-indigo-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Account Information</p>
                  <p className="text-xs text-gray-400">Your personal details</p>
                </div>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {[
                  { icon: User,     label: 'Full Name',  value: user.name },
                  { icon: Mail,     label: 'Email',      value: user.email },
                  { icon: Calendar, label: 'Age',        value: user.age ? `${user.age} years old` : null },
                  { icon: Phone,    label: 'Phone',      value: user.phone },
                  { icon: MapPin,   label: 'Location',   value: user.location },
                  { icon: Navigation, label: 'Status',   value: user.availability_status === 'open_to_work' ? 'Open to Work' : user.availability_status === 'not_looking' ? 'Not Looking' : null, badge: user.availability_status },
                  { icon: Link2,    label: 'LinkedIn',   value: user.linkedin },
                  { icon: Star,     label: 'Skills',     value: user.skills?.length > 0 ? `${user.skills.length} skills` : null, extra: user.skills },
                ].map(({ icon: Icon, label, value, extra, badge }) => (
                  <div key={label} className="flex items-center gap-4 px-6 py-3.5">
                    <div className="w-8 h-8 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                      <Icon size={14} className="text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                      {badge ? (
                        <AvailabilityBadge status={badge} size="md" />
                      ) : label === 'Skills' && extra?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {extra.slice(0, 5).map(s => (
                            <span key={s} className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                              style={{ background: 'rgba(108,92,231,0.08)', color: '#6C5CE7' }}>{s}</span>
                          ))}
                          {extra.length > 5 && <span className="text-[10px] text-gray-400">+{extra.length - 5}</span>}
                        </div>
                      ) : value ? (
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{value}</p>
                      ) : (
                        <p className="text-sm text-gray-300 dark:text-gray-600">Not set</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* ── My Posts Feed ── */}
        <ScrollReveal>
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Posts</p>
              <span className="text-xs text-gray-400 font-normal">· {posts.length}</span>
            </div>
            {posts.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-10 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-3">
                  <MessageSquare size={22} className="text-indigo-400" />
                </div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">No posts yet</p>
                <p className="text-xs text-gray-400">Share something with your network above</p>
              </div>
            ) : (
              posts.map(post => (
                <div key={post.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center gap-2.5 mb-3">
                      <Avatar src={user.avatar} name={user.name} size="w-9 h-9" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user.name}</p>
                        <p className="text-xs text-gray-400">
                          {(() => {
                            const diff = Date.now() - new Date(post.created_at).getTime();
                            const m = Math.floor(diff / 60000);
                            if (m < 1) return 'Just now';
                            if (m < 60) return `${m}m`;
                            const h = Math.floor(m / 60);
                            if (h < 24) return `${h}h`;
                            return `${Math.floor(h / 24)}d`;
                          })()}
                        </p>
                      </div>
                    </div>
                    {post.content && <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{post.content}</p>}
                  </div>
                  {post.image_url && (
                    <img src={post.image_url} loading="lazy" alt="" className="w-full max-h-80 object-cover" />
                  )}
                  {post.video_url && (
                    <video src={post.video_url} controls className="w-full max-h-80" />
                  )}
                  <div className="px-4 py-2.5 flex items-center gap-4 border-t border-gray-50 dark:border-gray-800">
                    <span className="flex items-center gap-1.5 text-xs text-gray-400">
                      <ThumbsUp size={13} />{post.reactions_count || 0}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-gray-400">
                      <MessageSquare size={13} />{post.comments_count || 0}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollReveal>

      </div>
    </Layout>
  );
}
