import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Save, Check, AlertCircle, Camera, User, Mail, Phone,
  MapPin, Link2, Calendar, Pencil, X, Image as ImageIcon,
  FileText, Briefcase, Users, MessageSquare, Shield,
  Plus, Sparkles, Smile, Trash2, ChevronRight, Play,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import StoryViewer from '../components/StoryViewer';
import api from '../api/axios';
import { useApp } from '../context/AppContext';

/* ─── Helpers ─── */
function Avatar({ src, name, size = 'w-8 h-8', className = '' }) {
  return src
    ? <img src={src} alt={name} className={`${size} rounded-full object-cover ring-2 ring-white ${className}`} />
    : <div className={`${size} rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center ring-2 ring-white ${className}`}>
        <span className="text-white font-bold text-sm select-none">{name?.[0]?.toUpperCase()}</span>
      </div>;
}

/* ─── Note Bubble ─── */
function NoteBubble({ note, isOwn, onEdit, onDelete }) {
  if (!note && !isOwn) return null;
  return (
    <div className="absolute -top-11 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
      <div className={`px-3 py-1.5 rounded-2xl rounded-b-sm shadow-lg border text-xs font-medium max-w-[13rem] text-center whitespace-nowrap overflow-hidden text-ellipsis pointer-events-auto
        ${note ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200' : 'bg-gray-50 dark:bg-gray-800 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 cursor-pointer hover:border-indigo-300 hover:text-indigo-500 transition-colors'}
      `}
        onClick={!note && isOwn ? onEdit : undefined}
        title={note?.content}>
        {note ? note.content : '+ Add a note...'}
      </div>
      {note && isOwn && (
        <div className="flex gap-1 mt-0.5 pointer-events-auto">
          <button onClick={onEdit} className="text-[10px] text-gray-400 hover:text-indigo-500 transition-colors">Edit</button>
          <span className="text-gray-300 text-[10px]">·</span>
          <button onClick={onDelete} className="text-[10px] text-gray-400 hover:text-red-500 transition-colors">Delete</button>
        </div>
      )}
      {/* Tail */}
      <div className="w-2.5 h-2.5 -mt-0.5 bg-white dark:bg-gray-800 border-b border-r border-gray-100 dark:border-gray-700 rotate-45" />
    </div>
  );
}

/* ─── Note Edit Modal ─── */
function NoteModal({ current, onSave, onClose }) {
  const [val, setVal] = useState(current || '');
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-xs shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
          <Smile size={16} className="text-indigo-500" />
          <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">Your Note</p>
        </div>
        <div className="p-4">
          <input
            autoFocus
            value={val}
            onChange={e => setVal(e.target.value.slice(0, 60))}
            placeholder="What's on your mind? (60 chars)"
            className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:bg-gray-800 dark:text-gray-200 transition-all"
          />
          <p className="text-right text-xs text-gray-400 mt-1">{val.length}/60</p>
        </div>
        <div className="flex gap-3 px-4 pb-4">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400">Cancel</button>
          <button onClick={() => { if (val.trim()) { onSave(val.trim()); onClose(); } }}
            disabled={!val.trim()}
            className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-indigo-700 transition-colors">
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
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="relative w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex gap-1 mb-3">
          {items.map((_, i) => (
            <div key={i} className={`flex-1 h-0.5 rounded-full ${i <= idx ? 'bg-white' : 'bg-white/30'}`} />
          ))}
        </div>
        <div className="relative rounded-2xl overflow-hidden bg-black">
          {item.media_type === 'video'
            ? <video src={item.media_url} autoPlay controls className="w-full max-h-[70vh] object-contain" />
            : <img src={item.media_url} alt="" className="w-full max-h-[70vh] object-contain" />
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
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
                  : <img src={item.media_url} alt="" className="w-full h-full object-cover" />
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
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-indigo-700 transition-colors">
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
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
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
                <p className="text-xs text-gray-400 truncate">{f.location || 'ResumeAI'}</p>
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

  return (
    <div className={`rounded-full cursor-pointer ${ring}`} onClick={onClick}>
      <div className={`${ring ? 'p-1 bg-white dark:bg-gray-900 rounded-full' : ''}`}>
        {avatar
          ? <img src={avatar} alt={name} className={`${size} rounded-full object-cover border-4 border-white dark:border-gray-900 shadow-xl`} />
          : <div className={`${size} rounded-full bg-gradient-to-br from-indigo-400 to-indigo-700 border-4 border-white dark:border-gray-900 shadow-xl flex items-center justify-center`}>
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
  const { t } = useApp();
  const myId = JSON.parse(localStorage.getItem('user') || '{}').id;

  const [user, setUser]       = useState(null);
  const [stats, setStats]     = useState({ resumes: 0, jobs: 0, friends: 0, messages: 0 });
  const [friends, setFriends] = useState([]);
  const [form, setForm]       = useState({ name:'', age:'', phone:'', location:'', linkedin:'', avatar:'', bio:'', cover_image:'' });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');

  // Stories
  const [myStories, setMyStories]   = useState(null); // { stories, all_seen }
  const [storyViewer, setStoryViewer] = useState(false);
  const [coverModal, setCoverModal]  = useState(false);

  // Note
  const [note, setNote]         = useState(null);
  const [noteModal, setNoteModal] = useState(false);

  // Highlights
  const [highlights, setHighlights]       = useState([]);
  const [viewingHL, setViewingHL]         = useState(null);
  const [addHLModal, setAddHLModal]       = useState(false);

  // Friends modal
  const [friendsModal, setFriendsModal] = useState(false);

  const fileRef  = useRef();
  const coverRef = useRef();

  const loadAll = useCallback(async () => {
    const [profileRes, statsArr, storyRes, noteRes, hlRes, friendRes] = await Promise.allSettled([
      api.get('/auth/profile'),
      Promise.all([api.get('/resumes'), api.get('/jobs'), api.get('/friends'), api.get('/messages/unread/count')]),
      api.get('/stories/feed'),
      api.get(`/notes/${myId}`),
      api.get(`/highlights/${myId}`),
      api.get('/friends'),
    ]);

    if (profileRes.status === 'fulfilled') {
      const d = profileRes.value.data;
      setUser(d);
      setForm({ name: d.name||'', age: d.age||'', phone: d.phone||'', location: d.location||'', linkedin: d.linkedin||'', avatar: d.avatar||'', bio: d.bio||'', cover_image: d.cover_image||'' });
    }
    if (statsArr.status === 'fulfilled') {
      const [r, j, f, m] = statsArr.value;
      setStats({ resumes: r.data.length, jobs: j.data.length, friends: f.data.length, messages: m.data.count });
    }
    if (storyRes.status === 'fulfilled') {
      const mine = storyRes.value.data.find(u => u.user_id === myId);
      setMyStories(mine || null);
    }
    if (noteRes.status === 'fulfilled') setNote(noteRes.value.data);
    if (hlRes.status === 'fulfilled') setHighlights(hlRes.value.data);
    if (friendRes.status === 'fulfilled') setFriends(friendRes.value.data);
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
    if (user) setForm({ name: user.name||'', age: user.age||'', phone: user.phone||'', location: user.location||'', linkedin: user.linkedin||'', avatar: user.avatar||'', bio: user.bio||'', cover_image: user.cover_image||'' });
    setEditing(false); setError('');
  };

  const saveNote = async (content) => {
    const res = await api.put('/notes', { content });
    setNote(res.data);
  };

  const deleteNote = async () => {
    await api.delete('/notes');
    setNote(null);
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
    await api.delete(`/highlights/${id}`);
    setHighlights(prev => prev.filter(h => h.id !== id));
  };

  const inp = 'w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white dark:bg-gray-800 dark:text-gray-200 transition-all';

  if (!user) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  );

  const statCards = [
    { label: 'Resumes', value: stats.resumes, to: '/resumes',  icon: FileText,      color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/30'  },
    { label: 'Jobs',    value: stats.jobs,    to: '/jobs',     icon: Briefcase,     color: 'text-sky-500',    bg: 'bg-sky-50 dark:bg-sky-900/30'        },
    { label: 'Friends', value: stats.friends, to: '/friends',  icon: Users,         color: 'text-emerald-500',bg: 'bg-emerald-50 dark:bg-emerald-900/30'},
    { label: 'Unread',  value: stats.messages,to: '/messages', icon: MessageSquare, color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-900/30'    },
  ];

  const storyFeedEntry = myStories ? [myStories] : [];

  return (
    <Layout>
      <style>{`
        @keyframes fadeInDown { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

      {/* Modals */}
      {noteModal && <NoteModal current={note?.content} onSave={saveNote} onClose={() => setNoteModal(false)} />}
      {viewingHL && <HighlightViewer highlight={viewingHL} onClose={() => setViewingHL(null)} />}
      {addHLModal && <AddHighlightModal onSave={createHighlight} onClose={() => setAddHLModal(false)} />}
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
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setCoverModal(false)}>
          <img src={form.cover_image} alt="cover" className="max-w-3xl w-full rounded-2xl object-contain" />
        </div>
      )}

      <div className="max-w-3xl mx-auto space-y-4">

        {success && (
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-2xl text-sm border border-emerald-100 dark:border-emerald-800">
            <Check size={15} />{success}
          </div>
        )}

        {/* ── Hero card ── */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-visible">

          {/* Cover */}
          <div className="relative h-52 rounded-t-3xl overflow-hidden group">
            {form.cover_image
              ? <img src={form.cover_image} alt="cover" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" />
            }
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />

            {/* Cover actions */}
            <div className={`absolute top-3 right-3 flex gap-2 transition-all ${editing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              {form.cover_image && !editing && (
                <button onClick={() => setCoverModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-black/50 hover:bg-black/70 text-white text-xs font-medium rounded-xl backdrop-blur-md transition-all">
                  <Play size={11} />View
                </button>
              )}
              <button onClick={() => { if (!editing) setEditing(true); setTimeout(() => coverRef.current?.click(), 50); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-black/50 hover:bg-black/70 text-white text-xs font-medium rounded-xl backdrop-blur-md transition-all">
                <ImageIcon size={11} />{form.cover_image ? 'Change' : 'Add Cover'}
              </button>
              {form.cover_image && editing && (
                <button onClick={() => setForm(f => ({ ...f, cover_image: '' }))}
                  className="px-2.5 py-1.5 bg-black/50 hover:bg-red-600/80 text-white text-xs rounded-xl backdrop-blur-md transition-all">
                  <X size={11} />
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="px-6 sm:px-8 pb-8 overflow-visible">
            {/* Avatar row */}
            <div className="flex items-end justify-between -mt-14 mb-5 relative overflow-visible">

              {/* Avatar + Note + Story ring */}
              <div className="relative overflow-visible pt-14">
                {/* Note bubble */}
                <NoteBubble
                  note={note}
                  isOwn
                  onEdit={() => setNoteModal(true)}
                  onDelete={deleteNote}
                />

                {/* Avatar with story ring */}
                <div className="relative">
                  <StoryAvatar
                    avatar={form.avatar}
                    name={form.name}
                    hasStory={!!myStories?.story_count}
                    allSeen={myStories?.all_seen ?? false}
                    size="w-28 h-28"
                    onClick={() => {
                      if (myStories?.story_count) setStoryViewer(true);
                    }}
                  />
                  {/* Camera button */}
                  <button
                    onClick={() => { if (!editing) setEditing(true); setTimeout(() => fileRef.current?.click(), 50); }}
                    className="absolute -bottom-1 -right-1 w-8 h-8 bg-indigo-600 hover:bg-indigo-700 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 border-2 border-white dark:border-gray-900 z-10">
                    <Camera size={13} className="text-white" />
                  </button>
                </div>
              </div>

              {/* Edit / Save */}
              <div className="flex gap-2 pb-1">
                {!editing ? (
                  <button onClick={() => setEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-semibold transition-all shadow-sm shadow-indigo-200 hover:-translate-y-0.5">
                    <Pencil size={13} />Edit Profile
                  </button>
                ) : (
                  <>
                    <button onClick={handleCancel}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                      <X size={13} />Cancel
                    </button>
                    <button onClick={handleSave} disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-semibold transition-all shadow-sm shadow-indigo-200 disabled:opacity-60">
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">{user.name}</h1>
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
              </div>
            ) : (
              <div className="space-y-4 mt-2">
                {error && (
                  <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm border border-red-100 dark:border-red-800">
                    <AlertCircle size={14} />{error}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{t.fullName}</label>
                    <input className={inp} value={form.name} placeholder="Full name" onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
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
              </div>
            )}
          </div>

          <input ref={fileRef}  type="file" accept="image/*" className="hidden" onChange={e => { readFile(e.target.files[0], 2, 'avatar');  e.target.value=''; }} />
          <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={e => { readFile(e.target.files[0], 5, 'cover_image'); e.target.value=''; }} />
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-4 gap-3">
          {statCards.map(s => (
            <Link key={s.label} to={s.to}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 flex flex-col items-center gap-2 hover:shadow-md hover:-translate-y-0.5 transition-all group">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <s.icon size={18} className={s.color} />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{s.value}</p>
                <p className="text-xs text-gray-400 font-medium">{s.label}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Highlights ── */}
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
          <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
            {highlights.length === 0 && (
              <button onClick={() => setAddHLModal(true)}
                className="flex flex-col items-center gap-2 flex-shrink-0">
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-300 hover:border-indigo-300 hover:text-indigo-400 transition-colors">
                  <Plus size={18} />
                </div>
                <p className="text-[10px] text-gray-400">Add</p>
              </button>
            )}
            {highlights.map(hl => (
              <div key={hl.id} className="flex flex-col items-center gap-1.5 flex-shrink-0 group">
                <button onClick={() => hl.item_count > 0 && setViewingHL(hl)}
                  className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-400 transition-colors relative">
                  {hl.cover_url
                    ? <img src={hl.cover_url} alt={hl.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                        <Sparkles size={16} className="text-white" />
                      </div>
                  }
                </button>
                <div className="flex items-center gap-1">
                  <p className="text-[10px] font-medium text-gray-600 dark:text-gray-400 truncate max-w-[52px] text-center">{hl.title}</p>
                  <button onClick={() => deleteHighlight(hl.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all">
                    <X size={9} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Friends Grid ── */}
        {friends.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                Friends <span className="text-gray-400 font-normal">· {stats.friends}</span>
              </p>
              <button onClick={() => setFriendsModal(true)}
                className="text-xs text-indigo-600 font-semibold hover:underline">
                See all
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {friends.slice(0, 9).map(f => (
                <button key={f.id} onClick={() => setFriendsModal(true)}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                  <Avatar src={f.avatar} name={f.name} size="w-12 h-12" />
                  <p className="text-[10px] font-medium text-gray-700 dark:text-gray-300 truncate w-full text-center group-hover:text-indigo-600">{f.name?.split(' ')[0]}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Account info (view mode) ── */}
        {!editing && (
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
                { icon: Link2,    label: 'LinkedIn',   value: user.linkedin },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-4 px-6 py-3.5">
                  <div className="w-8 h-8 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <Icon size={14} className="text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    {value
                      ? <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{value}</p>
                      : <p className="text-sm text-gray-300 dark:text-gray-600">Not set</p>
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
