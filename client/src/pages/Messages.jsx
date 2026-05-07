import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Send, MessageSquare, Search, ArrowLeft, X, Image, Mic, Check, CheckCheck, Play, Pause } from 'lucide-react';
import Layout from '../components/Layout';
import { getSocket } from '../services/socket';
import api from '../api/axios';

function Avatar({ user, size = 'sm' }) {
  const sz = size === 'lg' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs';
  return user?.avatar
    ? <img src={user.avatar} alt={user.name} className={`${sz} rounded-full object-cover flex-shrink-0 ring-2 ring-white dark:ring-gray-900`} />
    : <div className={`${sz} rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0`}>
        {user?.name?.[0] || '?'}
      </div>;
}

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

function StatusDot({ lastSeenAt }) {
  const online = isOnline(lastSeenAt);
  return <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-900 ${online ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`} />;
}

function TypingDots() {
  return (
    <div className="flex items-end justify-start">
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          {[0, 150, 300].map(d => (
            <span key={d} className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
              style={{ animationDelay: `${d}ms`, animationDuration: '1s' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function VoicePlayer({ src }) {
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
}

export default function Messages() {
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

  // New feature state
  const [isTyping, setIsTyping] = useState(false);
  const [msgImage, setMsgImage] = useState('');
  const [recording, setRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const [pendingVoice, setPendingVoice] = useState(null);

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

  useEffect(() => { activeUserRef.current = activeUser; }, [activeUser]);

  // Socket setup
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
      // Trigger conversation refresh
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

    return () => {
      socket.off('message:new');
      socket.off('typing');
      socket.off('messages:seen');
    };
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const [c, f] = await Promise.all([
        api.get('/messages/conversations'),
        api.get('/friends').catch(() => ({ data: [] })),
      ]);
      setConversations(c.data);
      setFriends(f.data);
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

  // Initial load + heartbeat
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

  // URL param
  useEffect(() => {
    const uid = searchParams.get('user');
    if (uid) openConversation(parseInt(uid));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll
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

  // Mark messages as read via socket when opening a conversation
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
  };

  const sendMessage = async () => {
    const hasContent = input.trim() || msgImage || pendingVoice;
    if (!hasContent || !activeUser || sending) return;
    setSending(true);
    const payload = {
      content: input.trim() || null,
      image_url: msgImage || null,
      voice_url: pendingVoice || null,
    };
    const textSnapshot = input.trim();
    const imgSnapshot = msgImage;
    const voiceSnapshot = pendingVoice;
    setInput('');
    setMsgImage('');
    setPendingVoice(null);
    if (inputRef.current) inputRef.current.style.height = 'auto';

    const socket = socketRef.current;
    if (socket?.connected) {
      // Optimistic add
      const tempId = -Date.now();
      let optimistic = {
        id: tempId,
        sender_id: myUser.id,
        receiver_id: activeUser.id,
        content: payload.content,
        image_url: imgSnapshot,
        voice_url: voiceSnapshot,
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
      }, (res) => {
        setSending(false);
        if (res?.ok) {
          // Replace optimistic with real message
          setMessages(prev => prev.map(m => m.id === tempId ? res.message : m));
        } else {
          // Remove optimistic on error — fallback to REST
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
    } catch {} finally { setSending(false); }
  };

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

  // Image handling
  const handleImageFile = (e) => {
    const file = e.target.files[0];
    if (!file || file.size > 5 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = ev => setMsgImage(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Voice recording
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
    } catch { alert('Microphone access denied.'); }
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

  const convUserIds = conversations.map(c => c.other_id);
  const friendsNotInConv = friends.filter(f => !convUserIds.includes(f.id));
  const filteredConvs = conversations.filter(c => !query || c.other_name?.toLowerCase().includes(query.toLowerCase()));
  const filteredFriends = friendsNotInConv.filter(f => !query || f.name?.toLowerCase().includes(query.toLowerCase()));

  const lastMySentIdx = messages.reduce((last, m, i) => m.sender_id === myUser.id ? i : last, -1);

  const fmtRec = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const lastMsgPreview = (c) => {
    if (c.has_voice) return '🎙️ Voice message';
    if (c.has_image) return '📷 Photo';
    return c.last_message;
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-7rem)] -m-6 flex border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-gray-900">

        {/* Conversation list */}
        <div className={`w-full lg:w-72 xl:w-80 border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0 flex flex-col ${mobileView === 'chat' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-base font-bold text-gray-900 dark:text-white">Messages</h1>
              {conversations.filter(c => c.unread > 0).length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: 'linear-gradient(90deg,#6C5CE7,#BF5AF2)' }}>
                  {conversations.reduce((s, c) => s + (c.unread || 0), 0)} unread
                </span>
              )}
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 transition-all" />
              {query && (
                <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConvs.length === 0 && filteredFriends.length === 0 && (
              <div className="text-center py-12 px-4">
                <MessageSquare size={28} className="text-gray-200 dark:text-gray-700 mx-auto mb-2" />
                <p className="text-sm text-gray-400 dark:text-gray-500">No conversations yet</p>
                <Link to="/friends" className="text-xs hover:underline mt-1 block" style={{ color: '#6C5CE7' }}>
                  Find friends to chat with
                </Link>
              </div>
            )}

            {filteredConvs.map(c => (
              <button key={c.other_id} onClick={() => openConversation(c.other_id)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left ${activeUser?.id === c.other_id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                <div className="relative flex-shrink-0">
                  <Avatar user={{ id: c.other_id, name: c.other_name, avatar: c.other_avatar }} />
                  {c.unread > 0
                    ? <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none" style={{ background: 'linear-gradient(90deg,#6C5CE7,#BF5AF2)' }}>
                        {c.unread > 9 ? '9+' : c.unread}
                      </span>
                    : <StatusDot lastSeenAt={c.other_last_seen_at} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${c.unread > 0 ? 'font-semibold text-gray-900 dark:text-gray-100' : 'font-medium text-gray-800 dark:text-gray-200'}`}>
                      {c.other_name}
                    </p>
                    <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2">{timeAgo(c.last_at)}</span>
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${c.unread > 0 ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
                    {c.last_sender_id === myUser.id ? 'You: ' : ''}{lastMsgPreview(c)}
                  </p>
                </div>
              </button>
            ))}

            {filteredFriends.length > 0 && (
              <>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider px-4 pt-4 pb-1">Friends</p>
                {filteredFriends.map(f => (
                  <button key={f.id} onClick={() => openConversation(f.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left ${activeUser?.id === f.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                    <div className="relative flex-shrink-0">
                      <Avatar user={f} />
                      <StatusDot lastSeenAt={f.last_seen_at} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{f.name}</p>
                      {formatLastSeen(f.last_seen_at) && (
                        <p className={`text-xs ${isOnline(f.last_seen_at) ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>
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

          {/* Header */}
          {activeUser ? (
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 bg-white dark:bg-gray-900 flex-shrink-0 shadow-sm">
              <button onClick={() => setMobileView('list')} className="lg:hidden p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">
                <ArrowLeft size={18} />
              </button>
              <Link to={`/friends/${activeUser.id}`} className="relative flex-shrink-0">
                <Avatar user={activeUser} size="lg" />
                <StatusDot lastSeenAt={activeUser.last_seen_at} />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/friends/${activeUser.id}`}
                  className="font-bold text-gray-900 dark:text-gray-100 text-sm hover:text-indigo-600 transition-colors block truncate">
                  {activeUser.name}
                </Link>
                <p className={`text-xs font-medium ${isTyping ? 'text-emerald-500' : isOnline(activeUser.last_seen_at) ? 'text-emerald-500' : 'text-gray-400 dark:text-gray-500'}`}>
                  {isTyping ? '● typing...' : formatLastSeen(activeUser.last_seen_at)}
                </p>
              </div>
            </div>
          ) : (
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0">
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Select a conversation</p>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-gray-50/60 dark:bg-[#0B0E14]">
            {!activeUser && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
                  <MessageSquare size={36} className="text-indigo-400" />
                </div>
                <p className="text-gray-700 dark:text-gray-300 font-bold text-base">Your Messages</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1.5 max-w-xs">Select a conversation to start chatting, or pick a friend from the list</p>
              </div>
            )}
            {activeUser && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Avatar user={activeUser} size="lg" />
                <p className="text-gray-700 dark:text-gray-200 font-bold mt-3 text-base">{activeUser.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">No messages yet — say hi!</p>
              </div>
            )}

            {messages.map((msg, i) => {
              const isMe = msg.sender_id === myUser.id;
              const isLastMySent = isMe && i === lastMySentIdx;
              const showTime = i === 0 || (new Date(msg.created_at) - new Date(messages[i - 1].created_at)) > 300000;

              return (
                <div key={msg.id}>
                  {showTime && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center my-3">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                  <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-0.5`}>
                    <div className="max-w-xs lg:max-w-sm">
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words relative ${
                        isMe
                          ? 'text-white rounded-br-sm'
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-bl-sm shadow-sm'
                      }`}
                        style={isMe ? { background: 'linear-gradient(135deg,#6C5CE7,#BF5AF2)' } : {}}>

                        {msg.image_url && (
                          <img src={msg.image_url} alt="img"
                            className="rounded-xl max-h-56 object-cover w-full mb-1" />
                        )}

                        {msg.voice_url && (
                          <div className="my-1">
                            <VoicePlayer src={msg.voice_url} />
                          </div>
                        )}

                        {msg.content && (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
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

          {/* Input area */}
          {activeUser && (
            <div className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0">

              {msgImage && (
                <div className="px-4 pt-3 flex items-start gap-2">
                  <div className="relative inline-block">
                    <img src={msgImage} alt="preview" className="h-20 rounded-xl object-cover border border-gray-200 dark:border-gray-700" />
                    <button onClick={() => setMsgImage('')}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-700 text-white rounded-full flex items-center justify-center hover:bg-gray-900">
                      <X size={10} />
                    </button>
                  </div>
                </div>
              )}

              {recording && (
                <div className="px-4 py-2 flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                  <span className="text-sm font-semibold text-red-500">{fmtRec(recSeconds)}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 flex-1">Recording…</span>
                  <button onClick={cancelVoice} className="text-gray-400 hover:text-red-500 transition-colors"><X size={16} /></button>
                  <button onClick={stopRecording}
                    className="flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-1.5 rounded-xl transition-all"
                    style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7)' }}>
                    Done
                  </button>
                </div>
              )}

              {pendingVoice && !recording && (
                <div className="px-4 py-2 flex items-center gap-3 bg-indigo-50 dark:bg-indigo-900/30 border-b border-indigo-100 dark:border-indigo-800">
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold flex-shrink-0">🎙️ Voice</span>
                  <audio controls src={pendingVoice} className="flex-1 h-8" style={{ maxWidth: '200px' }} />
                  <button onClick={cancelVoice} className="text-gray-400 hover:text-red-500 transition-colors"><X size={16} /></button>
                </div>
              )}

              {!recording && (
                <div className="px-4 py-3 flex gap-2 items-end">
                  <button onClick={() => fileRef.current?.click()}
                    className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all flex-shrink-0 mb-0.5"
                    title="Send image">
                    <Image size={18} />
                  </button>

                  {!pendingVoice && (
                    <button onClick={startRecording}
                      className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all flex-shrink-0 mb-0.5"
                      title="Record voice message">
                      <Mic size={18} />
                    </button>
                  )}

                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={pendingVoice ? 'Add a caption... (optional)' : `Message ${activeUser.name}…`}
                    rows={1}
                    className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500 resize-none overflow-hidden leading-relaxed"
                    style={{ minHeight: '42px', maxHeight: '120px' }}
                  />

                  <button onClick={sendMessage}
                    disabled={(!input.trim() && !msgImage && !pendingVoice) || sending}
                    className="w-10 h-10 text-white rounded-xl flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-40 flex-shrink-0 mb-0.5"
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
    </Layout>
  );
}
