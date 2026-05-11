import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Send, MessageSquare, Search, ArrowLeft, X, Image, Mic, Check, CheckCheck, Play, Pause, Smile, UsersRound, Mail, Info, Reply, Trash2, Trash, Edit3 } from 'lucide-react';
import Layout from '../components/Layout';
import { getSocket } from '../services/socket';
import { useToast } from '../components/Toast';
import EmojiPicker from '../components/EmojiPicker';
import MessageReactions from '../components/MessageReactions';
import EmptyState from '../components/EmptyState';
import GroupsPanel, { GroupInfoModal } from '../components/GroupsPanel';
import api from '../api/axios';

const Avatar = React.memo(function Avatar({ user, size = 'sm' }) {
  const sz = size === 'lg' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs';
  return user?.avatar
    ? <img src={user.avatar} loading="lazy" alt={user.name} className={`${sz} rounded-full object-cover flex-shrink-0 ring-2 ring-white shadow-sm`} />
    : <div className={`${sz} rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm`}>
        {user?.name?.[0] || '?'}
      </div>;
});

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function isOnline(lastSeenAt) {
  return lastSeenAt && Date.now() - new Date(lastSeenAt).getTime() < 120000;
}

function formatLastSeen(lastSeenAt) {
  if (!lastSeenAt) return null;
  const diff = Date.now() - new Date(lastSeenAt).getTime();
  if (diff < 120000) return 'Active now';
  const m = Math.floor(diff / 60000);
  if (m < 60) return `Active ${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Active ${h}h ago`;
  return `Active ${Math.floor(h / 24)}d ago`;
}

const StatusDot = React.memo(function StatusDot({ lastSeenAt, glowing = false }) {
  const online = isOnline(lastSeenAt);
  if (!online) return <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white bg-gray-300" />;
  return (
    <span className={`absolute bottom-0 right-0 ${glowing ? 'status-pulse' : ''}`}>
      <span className="block w-2.5 h-2.5 rounded-full border-2 border-white bg-emerald-500 relative z-10" />
    </span>
  );
});

function TypingDots() {
  return (
    <div className="flex items-end justify-start mb-1">
      <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          {[0, 150, 300].map(d => (
            <span key={d} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: `${d}ms`, animationDuration: '1s' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

const VoicePlayer = React.memo(function VoicePlayer({ src }) {
  const audioRef = useRef();
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  return (
    <div className="flex items-center gap-2 min-w-[160px]">
      <audio ref={audioRef} src={src}
        onTimeUpdate={() => setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100 || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current.duration)}
        onEnded={() => { setPlaying(false); setProgress(0); }} />
      <button onClick={toggle}
        className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 hover:bg-white/30 transition-colors">
        {playing ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <div className="flex-1">
        <div className="w-full bg-white/20 rounded-full h-1.5 cursor-pointer"
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            audioRef.current.currentTime = pct * audioRef.current.duration;
          }}>
          <div className="h-1.5 rounded-full bg-white transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-[10px] mt-0.5 opacity-70">
          {duration ? `${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, '0')}` : '🎙️'}
        </p>
      </div>
    </div>
  );
});

export default function Messages() {
  const addToast = useToast();
  const myUserRef = useRef(JSON.parse(localStorage.getItem('user') || '{}'));
  const myUser = myUserRef.current;
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [friends, setFriends] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [query, setQuery] = useState('');
  const [mobileView, setMobileView] = useState('list');

  const [isTyping, setIsTyping] = useState(false);
  const [msgImage, setMsgImage] = useState('');
  const [recording, setRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const [pendingVoice, setPendingVoice] = useState(null);
  const [sendError, setSendError] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // { type: 'message' | 'conversation', payload: ... }
  const [activeGroup, setActiveGroup] = useState(null);
  const [groupMessages, setGroupMessages] = useState([]);
  const [groupSending, setGroupSending] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const editInputRef = useRef(null);

  const bottomRef = useRef();
  const inputRef = useRef();
  const activeUserRef = useRef(null);
  const fileRef = useRef();
  const mediaRecRef = useRef(null);
  const chunksRef = useRef([]);
  const recTimerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const prevMsgCountRef = useRef(0);
  const socketRef = useRef(null);
  const sendErrorTimeoutRef = useRef(null);
  const sendingTimeoutRef = useRef(null);
  const stickerPickerRef = useRef(null);
  const sendingLockRef = useRef(false);

  useEffect(() => { activeUserRef.current = activeUser; }, [activeUser]);

  useEffect(() => {
    return () => {
      clearTimeout(sendErrorTimeoutRef.current);
      clearTimeout(sendingTimeoutRef.current);
      clearInterval(recTimerRef.current);
      mediaRecRef.current?.stop();
      sendingLockRef.current = false;
    };
  }, []);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected');
    });

    socket.on('message:new', (msg) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      loadConversations();
    });

    socket.on('typing', ({ userId, typing }) => {
      if (userId === activeUserRef.current?.id) {
        setIsTyping(typing);
      }
    });

    socket.on('messages:seen', ({ byUserId }) => {
      if (byUserId === activeUserRef.current?.id) {
        setMessages(prev => {
          let changed = false;
          const next = prev.map(m => {
            if (m.sender_id === myUser.id && !m.read_at) {
              changed = true;
              return { ...m, read: true, read_at: new Date().toISOString() };
            }
            return m;
          });
          return changed ? next : prev;
        });
      }
    });

    socket.on('message:deleted', ({ messageId }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, deleted: true } : m));
    });

    socket.on('message:edited', ({ messageId, content }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content, edited: true } : m));
    });

    socket.on('conversation:cleared', () => {
      setMessages([]);
      loadConversations();
    });

    return () => {
      socket.off('message:new');
      socket.off('typing');
      socket.off('messages:seen');
      socket.off('message:deleted');
      socket.off('message:edited');
      socket.off('conversation:cleared');
    };
  }, []);

  // Close sticker picker on outside click
  useEffect(() => {
    if (!showStickers) return;
    const handler = (e) => {
      if (stickerPickerRef.current && !stickerPickerRef.current.contains(e.target)) {
        setShowStickers(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showStickers]);

  const loadConversations = useCallback(async () => {
    try {
      const [c, f] = await Promise.all([
        api.get('/messages/conversations'),
        api.get('/friends').catch(() => ({ data: [] })),
      ]);
      setConversations(prev => JSON.stringify(prev) === JSON.stringify(c.data) ? prev : c.data);
      setFriends(prev => JSON.stringify(prev) === JSON.stringify(f.data) ? prev : f.data);
      setActiveUser(prev => {
        if (!prev) return prev;
        const conv = c.data.find(x => x.other_id === prev.id);
        const newLastSeen = conv?.other_last_seen_at
          ?? f.data.find(x => x.id === prev.id)?.last_seen_at
          ?? prev.last_seen_at;
        if (newLastSeen === prev.last_seen_at) return prev;
        return { ...prev, last_seen_at: newLastSeen };
      });
    } catch {}
  }, []);

  const loadMessages = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const res = await api.get(`/messages/${userId}`);
      if (Array.isArray(res.data)) setMessages(res.data);
    } catch {}
  }, []);

  useEffect(() => {
    const init = async () => {
      try { await api.put('/auth/heartbeat'); } catch {}
      loadConversations();
    };
    init();
    const id = setInterval(async () => {
      try { await api.put('/auth/heartbeat'); } catch {}
      loadConversations();
    }, 30000);
    return () => clearInterval(id);
  }, [loadConversations]);

  useEffect(() => {
    const uid = searchParams.get('user');
    if (uid) openConversation(parseInt(uid));
  }, []);

  useEffect(() => {
    const len = messages.length;
    if (len > prevMsgCountRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: prevMsgCountRef.current === 0 ? 'instant' : 'smooth' });
    }
    prevMsgCountRef.current = len;
  }, [messages.length]);

  useEffect(() => {
    if (isTyping) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isTyping]);

  useEffect(() => {
    if (!activeUser?.id) return;
    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit('messages:read', { fromUserId: activeUser.id });
    }
  }, [activeUser?.id, messages.length]);

  const openConversation = async (userId) => {
    prevMsgCountRef.current = 0;
    setIsTyping(false);
    setInput('');
    setMsgImage('');
    setPendingVoice(null);
    setReplyTo(null);
    const fromFriends = friends.find(f => f.id === userId);
    const fromConvs = conversations.find(c => c.other_id === userId);
    let user = fromFriends
      || (fromConvs ? { id: fromConvs.other_id, name: fromConvs.other_name, avatar: fromConvs.other_avatar, last_seen_at: fromConvs.other_last_seen_at } : null);
    if (!user) {
      try { const r = await api.get(`/friends/profile/${userId}`); user = r.data; } catch { return; }
    }
    setActiveUser(user);
    setSearchParams({ user: userId }, { replace: true });
    await loadMessages(userId);
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'instant' }));
    setMobileView('chat');
    requestAnimationFrame(() => inputRef.current?.focus());
    if (activeGroup) { setActiveGroup(null); setGroupMessages([]); }
  };

  const handleGroupSelect = async (group) => {
    setActiveUser(null);
    setActiveGroup(group);
    setMessages([]);
    setActiveUser(null);
    try {
      const res = await api.get(`/groups/${group.id}/messages`);
      setGroupMessages(res.data);
    } catch {} finally { setMobileView('chat'); }
  };

  const sendGroupMessage = async () => {
    const hasContent = input.trim() || msgImage;
    if (!hasContent || !activeGroup || groupSending) return;
    setGroupSending(true);
    const payload = { content: input.trim() || null };
    if (msgImage) payload.image_url = msgImage;
    try {
      const res = await api.post(`/groups/${activeGroup.id}/messages`, payload);
      setGroupMessages(prev => [...prev, res.data]);
      setInput(''); setMsgImage('');
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'instant' }));
    } catch { addToast('Failed to send.', 'error'); }
    finally { setGroupSending(false); }
  };

  const sendMessage = async (opts = {}) => {
    const sticker = opts.sticker || null;
    const hasContent = input.trim() || msgImage || pendingVoice || sticker;
    if (!hasContent || !activeUser || sendingLockRef.current) return;
    sendingLockRef.current = true;
    setSending(true);
    clearTimeout(sendingTimeoutRef.current);
    sendingTimeoutRef.current = setTimeout(() => { sendingLockRef.current = false; setSending(false); }, 10000);
    const payload = {
      content: input.trim() || null,
      image_url: msgImage || null,
      voice_url: pendingVoice || null,
      sticker,
      reply_to_id: replyTo?.id || null,
    };
    const textSnapshot = input.trim();
    const imgSnapshot = msgImage;
    const voiceSnapshot = pendingVoice;
    const stickerSnapshot = sticker;
    const replySnapshot = replyTo;
    setInput('');
    setMsgImage('');
    setPendingVoice(null);
    setReplyTo(null);
    setShowStickers(false);
    if (inputRef.current) inputRef.current.style.height = 'auto';

    const socket = socketRef.current;
    if (socket?.connected) {
      const tempId = -Date.now();
      let optimistic = {
        id: tempId,
        sender_id: myUser.id,
        receiver_id: activeUser.id,
        content: payload.content,
        image_url: imgSnapshot,
        voice_url: voiceSnapshot,
        sticker: stickerSnapshot,
        reply_to_id: replySnapshot?.id || null,
        reply_to: replySnapshot ? { id: replySnapshot.id, sender_id: replySnapshot.sender_id, sender_name: replySnapshot.sender_name, content: replySnapshot.content, sticker: replySnapshot.sticker, image_url: replySnapshot.image_url } : null,
        read: false,
        read_at: null,
        created_at: new Date().toISOString(),
        sender_name: myUser.name,
        sender_avatar: myUser.avatar,
      };
      setMessages(prev => [...prev, optimistic]);

      socket.emit('message:send', {
        receiverId: activeUser.id,
        content: payload.content,
        image_url: payload.image_url,
        voice_url: payload.voice_url,
        sticker: payload.sticker,
        reply_to_id: payload.reply_to_id,
      }, (res) => {
        clearTimeout(sendingTimeoutRef.current);
        sendingLockRef.current = false;
        setSending(false);
        if (res?.ok) {
          setMessages(prev => prev.map(m => m.id === tempId ? { ...m, ...res.message, sticker: res.message.sticker ?? m.sticker } : m));
        } else {
          setMessages(prev => prev.filter(m => m.id !== tempId));
          sendViaRest(payload);
        }
        loadConversations().catch(() => {});
      });
    } else {
      sendViaRest(payload);
    }
  };

  const sendViaRest = async (payload) => {
    try {
      const res = await api.post(`/messages/${activeUser.id}`, payload);
      if (res.data?.id) setMessages(m => [...m, res.data]);
      loadConversations().catch(() => {});
    } catch (err) {
      const serverMsg = err?.response?.data?.error || err?.message || 'Unknown error';
      console.error('[sendViaRest] Error:', serverMsg);
      if (payload?.content) setInput(payload.content);
      if (payload?.image_url) setMsgImage(payload.image_url);
      if (payload?.voice_url) setPendingVoice(payload.voice_url);
      if (payload?.sticker) setShowStickers(true);
      setSendError('Failed: ' + serverMsg);
      clearTimeout(sendErrorTimeoutRef.current);
      sendErrorTimeoutRef.current = setTimeout(() => setSendError(''), 6000);
    } finally { sendingLockRef.current = false; setSending(false); }
  };

  const submitEdit = useCallback(async (msgId, content) => {
    if (!content?.trim()) return;
    const trimmed = content.trim();
    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit('message:edit', { messageId: msgId, content: trimmed }, (res) => {
        if (res?.ok) setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: trimmed, edited: true } : m));
      });
    } else {
      try {
        await api.put(`/messages/${msgId}`, { content: trimmed });
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: trimmed, edited: true } : m));
      } catch {}
    }
    setEditingMsgId(null);
    setEditContent('');
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    if (activeUser) {
      const socket = socketRef.current;
      if (socket?.connected) {
        socket.emit('typing:start', { toUserId: activeUser.id });
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          socket.emit('typing:stop', { toUserId: activeUser.id });
        }, 2000);
      } else {
        const now = Date.now();
        if (now - (lastTypingPost.current || 0) > 1500) {
          lastTypingPost.current = now;
          api.post(`/messages/typing/${activeUser.id}`).catch(() => {});
        }
      }
    }
  };
  const lastTypingPost = useRef(0);

  const handleImageFile = (e) => {
    const file = e.target.files[0];
    if (!file || file.size > 5 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = ev => setMsgImage(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      mediaRecRef.current.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = ev => setPendingVoice(ev.target.result);
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecRef.current.start();
      setRecording(true);
      setRecSeconds(0);
      recTimerRef.current = setInterval(() => setRecSeconds(s => s + 1), 1000);
    } catch { addToast('Microphone access denied.', 'error'); }
  };

  const stopRecording = () => {
    clearInterval(recTimerRef.current);
    mediaRecRef.current?.stop();
    setRecording(false);
  };

  const cancelVoice = () => {
    clearInterval(recTimerRef.current);
    if (recording && mediaRecRef.current) {
      mediaRecRef.current.onstop = null;
      mediaRecRef.current.stop();
      setRecording(false);
    }
    setPendingVoice(null);
  };

  const convUserIds = useMemo(() => conversations.map(c => c.other_id), [conversations]);
  const convUserIdsSet = useMemo(() => new Set(convUserIds), [convUserIds]);
  const friendsNotInConv = useMemo(() => friends.filter(f => !convUserIdsSet.has(f.id)), [friends, convUserIdsSet]);
  const filteredConvs = useMemo(() => conversations.filter(c => !query || c.other_name?.toLowerCase().includes(query.toLowerCase())), [conversations, query]);
  const filteredFriends = useMemo(() => friendsNotInConv.filter(f => !query || f.name?.toLowerCase().includes(query.toLowerCase())), [friendsNotInConv, query]);

  const lastMySentIdx = useMemo(() => messages.reduce((last, m, i) => m.sender_id === myUser.id ? i : last, -1), [messages, myUser.id]);

  const handleReaction = useCallback((msgId, emoji, removed) => {
    setMessages(prev => prev.map(m => m.id === msgId ? {
      ...m,
      reactions: removed
        ? (m.reactions || []).filter(r => r.user_id !== myUser.id)
        : [...(m.reactions || []).filter(r => r.user_id !== myUser.id), { emoji, user_id: myUser.id }]
    } : m));
  }, [myUser.id]);

  const handleTextareaKeyDown = useCallback((e) => {
    if (activeGroup) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendGroupMessage(); }
    } else handleKeyDown(e);
  }, [activeGroup, activeUser, sending, input, msgImage, pendingVoice, replyTo]);

  const fmtRec = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const lastMsgPreview = (c) => {
    if (c.has_voice) return '🎙️ Voice message';
    if (c.has_image) return '📷 Photo';
    if (c.has_sticker) return '🙂 Sticker';
    return c.last_message;
  };

  const totalUnread = useMemo(() => conversations.reduce((s, c) => s + (c.unread || 0), 0), [conversations]);

  return (
    <Layout>
      <div className="h-[calc(100vh-7rem)] -m-6 flex border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white">

        {/* Conversation list sidebar */}
        <div className={`w-full lg:w-72 xl:w-80 border-r border-gray-200 bg-white flex-shrink-0 flex flex-col ${mobileView === 'chat' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }} />
                <h1 className="text-base font-bold text-gray-900">Messages</h1>
              </div>
              {totalUnread > 0 && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-white shadow-sm" style={{ background: 'linear-gradient(90deg,#6C5CE7,#BF5AF2)' }}>
                  {totalUnread} new
                </span>
              )}
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all placeholder-gray-400" />
              {query && (
                <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          <GroupsPanel onSelectGroup={handleGroupSelect} activeGroupId={activeGroup?.id} />

          <div className="flex-1 overflow-y-auto custom-scrollbar py-1">
            {!activeGroup && filteredConvs.length === 0 && filteredFriends.length === 0 && (
              <EmptyState
                icon={<MessageSquare size={24} className="text-[#6C5CE7]" />}
                title="No conversations yet"
                description="Start chatting with your friends"
                action={<Link to="/friends" className="px-4 py-2 text-white text-xs font-semibold rounded-xl transition-all hover:opacity-90 shadow-sm" style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>Find friends</Link>}
              />
            )}

            {filteredConvs.map(c => (
              <button key={c.other_id} onClick={() => openConversation(c.other_id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 transition-all text-left group
                  ${activeUser?.id === c.other_id
                    ? 'bg-indigo-50 shadow-sm border-l-2 border-indigo-500'
                    : 'hover:bg-gray-50 hover:border-l-2 hover:border-gray-200 border-l-2 border-transparent'
                  }`}>
                <div className="relative flex-shrink-0">
                  <Avatar user={{ id: c.other_id, name: c.other_name, avatar: c.other_avatar }} />
                  {c.unread > 0
                    ? <span className="absolute -top-1 -right-1 w-4 h-4 text-white text-[10px] rounded-full flex items-center justify-center font-bold leading-none shadow-sm" style={{ background: 'linear-gradient(90deg,#6C5CE7,#BF5AF2)' }}>
                        {c.unread > 9 ? '9+' : c.unread}
                      </span>
                    : <StatusDot lastSeenAt={c.other_last_seen_at} glowing={activeUser?.id === c.other_id} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className={`text-sm truncate flex items-center gap-1.5 ${c.unread > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>
                      {c.other_name}
                      {c.unread > 0 && <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />}
                    </p>
                    <span className="text-[11px] text-gray-400 flex-shrink-0">{timeAgo(c.last_at)}</span>
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${c.unread > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                    {c.last_sender_id === myUser.id ? 'You: ' : ''}{lastMsgPreview(c)}
                  </p>
                </div>
              </button>
            ))}

            {filteredFriends.length > 0 && (
              <>
                <div className="flex items-center gap-2 px-4 pt-5 pb-2">
                  <div className="flex-1 h-px bg-gray-100" />
                  <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Friends</p>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                {filteredFriends.map(f => (
                  <button key={f.id} onClick={() => openConversation(f.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 transition-all text-left group
                      ${activeUser?.id === f.id
                        ? 'bg-indigo-50 shadow-sm border-l-2 border-indigo-500'
                        : 'hover:bg-gray-50 hover:border-l-2 hover:border-gray-200 border-l-2 border-transparent'
                      }`}>
                    <div className="relative flex-shrink-0">
                      <Avatar user={f} />
                      <StatusDot lastSeenAt={f.last_seen_at} glowing={activeUser?.id === f.id} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{f.name}</p>
                      {formatLastSeen(f.last_seen_at) && (
                        <p className={`text-xs mt-0.5 ${isOnline(f.last_seen_at) ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                          {formatLastSeen(f.last_seen_at)}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className={`flex-1 flex flex-col ${mobileView === 'list' ? 'hidden lg:flex' : 'flex'}`}>

          {/* Chat header */}
          {activeGroup ? (
            <div className="px-5 py-3.5 border-b border-gray-200 flex items-center gap-3 bg-white flex-shrink-0 shadow-sm">
              <button onClick={() => { setMobileView('list'); setActiveGroup(null); setGroupMessages([]); }} className="lg:hidden p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
                <ArrowLeft size={18} />
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#BF5AF2] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                {activeGroup.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm truncate">{activeGroup.name}</p>
                <p className="text-xs text-gray-500">{activeGroup.member_count || 0} members</p>
              </div>
              <button onClick={() => setShowGroupInfo(true)}
                className="p-1.5 text-gray-400 hover:text-[#6C5CE7] hover:bg-[#6C5CE7]/10 rounded-xl transition-all">
                <Info size={17} />
              </button>
            </div>
          ) : activeUser ? (
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3 bg-white flex-shrink-0 shadow-sm">
              <button onClick={() => setMobileView('list')} className="lg:hidden p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
                <ArrowLeft size={18} />
              </button>
              <Link to={`/friends/${activeUser.id}`} className="relative flex-shrink-0">
                <Avatar user={activeUser} size="lg" />
                <StatusDot lastSeenAt={activeUser.last_seen_at} glowing />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/friends/${activeUser.id}`}
                  className="font-bold text-gray-900 text-sm hover:text-indigo-600 transition-colors block truncate">
                  {activeUser.name}
                </Link>
                <p className={`text-xs font-medium ${isTyping ? 'text-emerald-500' : isOnline(activeUser.last_seen_at) ? 'text-emerald-500' : 'text-gray-400'}`}>
                  {isTyping ? '● typing...' : formatLastSeen(activeUser.last_seen_at)}
                </p>
              </div>
              {/* Clear conversation */}
              <button onClick={() => setConfirmDelete({ type: 'conversation', userId: activeUser.id })}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                title="Clear conversation">
                <Trash size={17} />
              </button>
            </div>
          ) : (
            <div className="px-5 py-3.5 border-b border-gray-200 bg-white flex-shrink-0 shadow-sm">
              <p className="text-sm font-semibold text-gray-400">Select a conversation</p>
            </div>
          )}

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-1.5 bg-gray-50/80">
            {!activeUser && !activeGroup && (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 flex items-center justify-center mb-5 shadow-sm backdrop-blur-sm">
                  <Mail size={40} className="text-indigo-400" />
                </div>
                <p className="text-gray-900 font-bold text-lg">Your Messages</p>
                <p className="text-sm text-gray-400 mt-1.5 max-w-xs leading-relaxed">
                  Select a conversation to start chatting, or find a friend to connect with
                </p>
                <Link to="/friends"
                  className="mt-6 px-5 py-2.5 text-white text-sm font-semibold rounded-xl shadow-sm hover:opacity-90 transition-all"
                  style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
                  Find friends
                </Link>
              </div>
            )}
            {activeGroup && groupMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 flex items-center justify-center mb-5 shadow-sm">
                  <UsersRound size={32} className="text-indigo-400" />
                </div>
                <p className="text-gray-900 font-bold text-base">No messages yet</p>
                <p className="text-sm text-gray-400 mt-1">Start the conversation in this group!</p>
              </div>
            )}
            {activeUser && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <Avatar user={activeUser} size="lg" />
                <p className="text-gray-900 font-bold mt-4 text-base">{activeUser.name}</p>
                <div className="mt-2 px-5 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <MessageSquare size={20} className="text-indigo-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No messages yet — say hello!</p>
                </div>
              </div>
            )}

            {(activeGroup ? groupMessages : messages).map((msg, i) => {
              const msgs = activeGroup ? groupMessages : messages;
              const isMe = msg.sender_id === myUser.id;
              const isLastMySent = isMe && i === lastMySentIdx;
              const showTime = i === 0 || (new Date(msg.created_at) - new Date(msgs[i - 1]?.created_at)) > 300000;
              const isDeleted = msg.deleted;

              if (isDeleted) {
                return (
                  <div key={msg.id}>
                    {showTime && (
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-gray-200" />
                        <p className="text-[11px] text-gray-400 font-medium">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <div className="flex-1 h-px bg-gray-200" />
                      </div>
                    )}
                    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
                      <div className="px-4 py-2 rounded-2xl text-xs italic text-gray-400 bg-gray-100 border border-gray-200 select-none">
                        This message was deleted
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id}>
                  {showTime && (
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-gray-200" />
                      <p className="text-[11px] text-gray-400 font-medium">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                  )}
                  <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1 group`}>
                    <div className={`max-w-xs lg:max-w-sm ${isMe ? 'order-1' : 'order-1'}`}>
                      {!isMe && activeGroup && (
                        <div className="flex items-center gap-2 mb-1.5 ml-1">
                          {msg.sender_avatar
                            ? <img src={msg.sender_avatar} loading="lazy" alt="" className="w-5 h-5 rounded-full object-cover ring-2 ring-white shadow-sm" />
                            : <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#BF5AF2] flex items-center justify-center text-white text-[9px] font-bold ring-2 ring-white shadow-sm">
                                {msg.sender_name?.[0] || '?'}
                              </div>
                          }
                          <span className="text-[11px] font-semibold text-gray-500">{msg.sender_name || 'Unknown'}</span>
                        </div>
                      )}

                      {/* Reply quote */}
                      {msg.reply_to && (
                        <div className={`mb-1.5 px-3 py-2 rounded-xl text-xs border-l-4 ${
                          isMe ? 'border-white/40 bg-white/10' : 'border-indigo-300 bg-indigo-50'
                        }`}>
                          <p className={`font-semibold ${isMe ? 'text-white/80' : 'text-indigo-600'}`}>
                            {msg.reply_to.sender_name}
                          </p>
                          {msg.reply_to.sticker && (
                            <span className="text-2xl">{msg.reply_to.sticker}</span>
                          )}
                          {msg.reply_to.image_url && (
                            <span className="text-gray-500">📷 Photo</span>
                          )}
                          {msg.reply_to.content && (
                            <p className={`truncate ${isMe ? 'text-white/70' : 'text-gray-500'}`}>
                              {msg.reply_to.content}
                            </p>
                          )}
                        </div>
                      )}

                      <div className={`relative group/message ${isMe ? 'flex items-end gap-1.5' : ''}`}>
                        {/* Edit + Delete buttons (own messages, on hover) */}
                        {isMe && !activeGroup && (
                          <div className="opacity-0 group-hover/message:opacity-100 transition-opacity flex items-center gap-0.5 pb-1">
                            {!msg.sticker && !msg.image_url && !msg.voice_url && (
                              <button onClick={() => { setEditingMsgId(msg.id); setEditContent(msg.content || ''); setTimeout(() => editInputRef.current?.focus(), 50); }}
                                className="p-1 text-gray-400 hover:text-indigo-400 hover:bg-indigo-50 rounded-lg transition-all"
                                title="Edit">
                                <Edit3 size={14} />
                              </button>
                            )}
                            <button onClick={() => setConfirmDelete({ type: 'message', id: msg.id })}
                              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}

                        {/* Reply button (non-group, on hover) */}
                        {!activeGroup && (
                          <div className={`${isMe ? 'order-first' : 'order-last'} opacity-0 group-hover/message:opacity-100 transition-opacity flex items-center gap-0.5 pb-1`}>
                            <button onClick={() => { setReplyTo(msg); inputRef.current?.focus(); }}
                              className={`p-1 rounded-lg transition-all ${isMe ? 'text-white/60 hover:text-white hover:bg-white/20' : 'text-gray-400 hover:text-indigo-500 hover:bg-indigo-50'}`}
                              title="Reply">
                              <Reply size={14} />
                            </button>
                          </div>
                        )}

                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words relative transition-shadow ${
                          isMe
                            ? 'text-white rounded-br-sm shadow-md'
                            : 'bg-white text-gray-900 border border-gray-100 rounded-bl-sm shadow-sm hover:shadow-md'
                        }`}
                          style={isMe ? { background: 'linear-gradient(135deg,#6C5CE7,#BF5AF2)' } : {}}>

                          {msg.sticker && (
                            <div className="text-5xl text-center select-none leading-none">{msg.sticker}</div>
                          )}

                          {!msg.sticker && msg.image_url && (
                            <img src={msg.image_url} loading="lazy" alt="img"
                              className="rounded-xl max-h-56 object-cover w-full mb-1" />
                          )}

                          {!msg.sticker && msg.voice_url && (
                            <div className="my-1">
                              <VoicePlayer src={msg.voice_url} />
                            </div>
                          )}

                          {msg.content && (
                            editingMsgId === msg.id ? (
                              <div className="flex flex-col gap-2 min-w-[180px]">
                                <textarea
                                  ref={editInputRef}
                                  value={editContent}
                                  onChange={e => setEditContent(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitEdit(msg.id, editContent); }
                                    if (e.key === 'Escape') { setEditingMsgId(null); setEditContent(''); }
                                  }}
                                  className="w-full px-3 py-2 text-sm text-white bg-white/20 border border-white/40 rounded-xl resize-none focus:outline-none focus:border-white/60 placeholder-white/50"
                                  rows={2}
                                />
                                <div className="flex gap-2 justify-end">
                                  <button onClick={() => { setEditingMsgId(null); setEditContent(''); }}
                                    className="px-2.5 py-1 text-[11px] text-white/60 hover:text-white transition-colors">Cancel</button>
                                  <button onClick={() => submitEdit(msg.id, editContent)}
                                    className="px-3 py-1 text-[11px] font-semibold bg-white/25 hover:bg-white/35 text-white rounded-lg transition-all">Save</button>
                                </div>
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap">
                                {msg.content}
                                {msg.edited && <span className={`ml-1.5 text-[10px] italic ${isMe ? 'text-white/50' : 'text-gray-400'}`}>edited</span>}
                              </p>
                            )
                          )}

                          {isMe && (
                            <span className="float-right ml-2 mt-1 opacity-70 flex-shrink-0">
                              {msg.read_at
                                ? <CheckCheck size={13} className="text-teal-300" />
                                : <Check size={13} className="text-white/60" />
                              }
                            </span>
                          )}
                        </div>
                      </div>

                      <MessageReactions message={msg} myId={myUser.id} onReacted={handleReaction} />

                      {isLastMySent && (
                        <div className="flex items-center justify-end gap-1 mt-0.5 pr-0.5">
                          {msg.read_at
                            ? <><CheckCheck size={11} style={{ color: '#2EC4B6' }} /><span className="text-[10px] font-medium" style={{ color: '#2EC4B6' }}>Seen {timeAgo(msg.read_at)}</span></>
                            : <><Check size={11} className="text-gray-400" /><span className="text-[10px] text-gray-400">Sent {timeAgo(msg.created_at)}</span></>
                          }
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {isTyping && activeUser && <TypingDots />}
            <div ref={bottomRef} />
          </div>

          {/* Error toast */}
          {sendError && (
            <div className="px-4 py-2.5 bg-red-50 border-b border-red-100 text-xs text-red-600 font-medium text-center animate-slide-up shadow-sm">
              {sendError}
            </div>
          )}

          {/* Input area */}
          {(activeUser || activeGroup) && (
            <div className="border-t border-gray-200 bg-white flex-shrink-0 shadow-sm">

              {msgImage && (
                <div className="px-5 pt-3 flex items-start gap-2">
                  <div className="relative inline-block">
                    <img src={msgImage} loading="lazy" alt="preview" className="h-20 rounded-xl object-cover border border-gray-200 shadow-sm" />
                    <button onClick={() => setMsgImage('')}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-700 text-white rounded-full flex items-center justify-center hover:bg-gray-900 shadow-sm transition-all">
                      <X size={10} />
                    </button>
                  </div>
                </div>
              )}

              {!activeGroup && recording && (
                <div className="px-5 py-2.5 flex items-center gap-3 bg-red-50/50">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                  <span className="text-sm font-semibold text-red-500">{fmtRec(recSeconds)}</span>
                  <span className="text-xs text-gray-400 flex-1">Recording…</span>
                  <button onClick={cancelVoice} className="text-gray-400 hover:text-red-500 transition-colors"><X size={16} /></button>
                  <button onClick={stopRecording}
                    className="flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-1.5 rounded-xl transition-all shadow-sm"
                    style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7)' }}>
                    Done
                  </button>
                </div>
              )}

              {!activeGroup && pendingVoice && !recording && (
                <div className="px-5 py-2.5 flex items-center gap-3 bg-indigo-50/50 border-b border-indigo-100">
                  <span className="text-xs text-indigo-600 font-semibold flex-shrink-0">🎙️ Voice</span>
                  <audio controls src={pendingVoice} className="flex-1 h-8" style={{ maxWidth: '200px' }} />
                  <button onClick={cancelVoice} className="text-gray-400 hover:text-red-500 transition-colors"><X size={16} /></button>
                </div>
              )}

              {/* Reply bar */}
              {!activeGroup && replyTo && (
                <div className="px-5 py-2.5 flex items-center gap-3 bg-indigo-50/70 border-b border-indigo-200">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-indigo-600">
                      <Reply size={12} className="inline mr-1" />
                      Replying to {replyTo.sender_name}
                    </p>
                    {replyTo.sticker && <span className="text-xl">{replyTo.sticker}</span>}
                    {replyTo.image_url && <span className="text-xs text-gray-500">📷 Photo</span>}
                    {replyTo.content && <p className="text-xs text-gray-500 truncate">{replyTo.content}</p>}
                  </div>
                  <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                    <X size={16} />
                  </button>
                </div>
              )}

              {!recording && (
                <div className="px-5 py-3.5 flex gap-2 items-end">
                  <div className="relative">
                    <button onClick={() => { setShowEmoji(!showEmoji); setShowStickers(false); }}
                      className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all flex-shrink-0 mb-0.5"
                      title="Emoji">
                      <Smile size={18} />
                    </button>
                    {showEmoji && <EmojiPicker onSelect={(emoji) => { setInput(prev => prev + emoji); inputRef.current?.focus(); }} onClose={() => setShowEmoji(false)} />}
                  </div>

                  {/* Sticker button */}
                  {!activeGroup && (
                    <div className="relative">
                      <button onClick={() => { setShowStickers(!showStickers); setShowEmoji(false); }}
                        className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all flex-shrink-0 mb-0.5"
                        title="Sticker">
                        <span className="text-lg leading-none">🙂</span>
                      </button>
                      {showStickers && (
                        <div ref={stickerPickerRef} className="absolute bottom-14 right-0 bg-white border border-gray-200 rounded-2xl shadow-xl p-2.5 z-50 max-h-56 overflow-y-auto">
                          <div className="flex flex-wrap justify-center gap-1.5 w-48">
                            {['😀','😍','😂','🤣','❤️','🔥','👍','🎉','💀','😭','🥺','😎','🤔','🙏','💯','✨','🎶','⭐','💪','🧠','👀','😈','🤡','💩','🫡'].map(e => (
                              <button key={e} onClick={() => { sendMessage({ sticker: e }); }}
                                className="w-9 h-9 flex items-center justify-center text-lg hover:bg-gray-100 rounded-lg flex-shrink-0"
                                title={e}>
                                {e}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <button onClick={() => fileRef.current?.click()}
                    className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all flex-shrink-0 mb-0.5"
                    title="Send image">
                    <Image size={18} />
                  </button>

                  {!activeGroup && !pendingVoice && (
                    <button onClick={startRecording}
                      className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all flex-shrink-0 mb-0.5"
                      title="Record voice message">
                      <Mic size={18} />
                    </button>
                  )}

                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleTextareaKeyDown}
                    placeholder={activeGroup ? `Message ${activeGroup.name}…` : pendingVoice ? 'Add a caption... (optional)' : activeUser ? `Message ${activeUser.name}…` : 'Type a message…'}
                    rows={1}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 bg-white text-gray-900 placeholder-gray-400 resize-none overflow-hidden leading-relaxed transition-shadow hover:shadow-sm"
                    style={{ minHeight: '42px', maxHeight: '120px' }}
                  />

                  <button onClick={activeGroup ? sendGroupMessage : sendMessage}
                    disabled={(!input.trim() && !msgImage && !pendingVoice && !replyTo && !showStickers) || sending || groupSending}
                    className="w-10 h-10 text-white rounded-xl flex items-center justify-center hover:opacity-90 hover:shadow-md transition-all disabled:opacity-40 flex-shrink-0 mb-0.5 shadow-sm"
                    style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
                    <Send size={16} />
                  </button>
                </div>
              )}

              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
            </div>
          )}
        </div>
      </div>

      {showGroupInfo && activeGroup && (
        <GroupInfoModal
          group={activeGroup}
          onClose={() => setShowGroupInfo(false)}
          onUpdated={() => {}}
          onDeleted={() => { setActiveGroup(null); setGroupMessages([]); setShowGroupInfo(false); }}
          onLeft={() => { setActiveGroup(null); setGroupMessages([]); setShowGroupInfo(false); }}
        />
      )}

      {/* Confirm dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 mx-4 max-w-sm w-full"
            onClick={e => e.stopPropagation()}>
            <p className="text-base font-bold text-gray-900 mb-2">
              {confirmDelete.type === 'message' ? 'Are you sure?' : 'Clear conversation?'}
            </p>
            <p className="text-sm text-gray-500 mb-5">
              {confirmDelete.type === 'message'
                ? 'This message will be deleted for everyone.'
                : 'All messages in this conversation will be deleted. This cannot be undone.'}
            </p>
            <div className="flex justify-end gap-2 flex-wrap">
              <button onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
                Cancel
              </button>
              {confirmDelete.type === 'message' && (
                <button onClick={() => {
                  const socket = socketRef.current;
                  if (socket?.connected) {
                    socket.emit('message:hide', { messageId: confirmDelete.id }, (res) => {
                      if (res?.ok) setMessages(prev => prev.filter(m => m.id !== confirmDelete.id));
                    });
                  } else {
                    api.post(`/messages/${confirmDelete.id}/hide`).then(() => {
                      setMessages(prev => prev.filter(m => m.id !== confirmDelete.id));
                    }).catch(() => {});
                  }
                  setConfirmDelete(null);
                }}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all">
                  Delete for me
                </button>
              )}
              <button onClick={() => {
                const socket = socketRef.current;
                if (confirmDelete.type === 'message') {
                  if (socket?.connected) {
                    socket.emit('message:delete', { messageId: confirmDelete.id }, (res) => {
                      if (res?.ok) setMessages(prev => prev.map(m => m.id === confirmDelete.id ? { ...m, deleted: true } : m));
                    });
                  } else {
                    api.delete(`/messages/${confirmDelete.id}`).then(() => {
                      setMessages(prev => prev.map(m => m.id === confirmDelete.id ? { ...m, deleted: true } : m));
                    }).catch(() => {});
                  }
                } else {
                  if (socket?.connected) {
                    socket.emit('conversation:clear', { targetUserId: confirmDelete.userId }, (res) => {
                      if (res?.ok) setMessages([]);
                    });
                  } else {
                    api.delete(`/messages/conversation/${confirmDelete.userId}`).then(() => setMessages([])).catch(() => {});
                  }
                }
                setConfirmDelete(null);
              }}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all shadow-sm">
                {confirmDelete.type === 'message' ? 'Delete for everyone' : 'Clear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
