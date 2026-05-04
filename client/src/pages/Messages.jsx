import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Send, MessageSquare, Search, ArrowLeft, X } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../api/axios';

// Defined OUTSIDE the component so React never treats them as new types
function Avatar({ user, size = 'sm' }) {
  const sz = size === 'lg' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs';
  return user?.avatar
    ? <img src={user.avatar} alt={user.name} className={`${sz} rounded-full object-cover flex-shrink-0`} />
    : <div className={`${sz} rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold flex-shrink-0`}>
        {user?.name?.[0] || '?'}
      </div>;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function Messages() {
  const myUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [friends, setFriends] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [query, setQuery] = useState('');
  const [mobileView, setMobileView] = useState('list');
  const bottomRef = useRef();
  const inputRef = useRef();
  const pollRef = useRef();
  const activeUserRef = useRef(null);

  // Keep ref in sync so poll callback doesn't capture stale state
  useEffect(() => { activeUserRef.current = activeUser; }, [activeUser]);

  const loadConversations = useCallback(async () => {
    const [c, f] = await Promise.all([
      api.get('/messages/conversations'),
      api.get('/friends'),
    ]);
    setConversations(c.data);
    setFriends(f.data);
  }, []);

  const loadMessages = useCallback(async (userId) => {
    if (!userId) return;
    const res = await api.get(`/messages/${userId}`);
    setMessages(res.data);
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Open from URL param on mount only
  useEffect(() => {
    const uid = searchParams.get('user');
    if (uid) openConversation(parseInt(uid));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll for new messages every 3s when a conversation is open
  useEffect(() => {
    if (!activeUser) return;
    pollRef.current = setInterval(() => {
      loadMessages(activeUserRef.current?.id);
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [activeUser, loadMessages]);

  const openConversation = async (userId) => {
    clearInterval(pollRef.current);
    const fromFriends = friends.find(f => f.id === userId);
    const fromConvs = conversations.find(c => c.other_id === userId);
    let user = fromFriends
      || (fromConvs ? { id: fromConvs.other_id, name: fromConvs.other_name, avatar: fromConvs.other_avatar } : null);
    if (!user) {
      try { const r = await api.get(`/friends/profile/${userId}`); user = r.data; }
      catch { return; }
    }
    setActiveUser(user);
    setSearchParams({ user: userId }, { replace: true });
    await loadMessages(userId);
    setMobileView('chat');
    // Small delay to let React commit before focusing
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeUser || sending) return;
    setSending(true);
    const text = input.trim();
    setInput('');
    requestAnimationFrame(() => inputRef.current?.focus());
    try {
      const res = await api.post(`/messages/${activeUser.id}`, { content: text });
      setMessages(m => [...m, res.data]);
      loadConversations();
    } finally { setSending(false); }
  };

  // Enter = send, Shift+Enter = new line
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const convUserIds = conversations.map(c => c.other_id);
  const friendsNotInConv = friends.filter(f => !convUserIds.includes(f.id));
  const filteredConvs = conversations.filter(c =>
    !query || c.other_name?.toLowerCase().includes(query.toLowerCase())
  );
  const filteredFriends = friendsNotInConv.filter(f =>
    !query || f.name?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Layout>
      <div className="h-[calc(100vh-7rem)] -m-6 flex border border-gray-100 rounded-2xl overflow-hidden shadow-sm">

        {/* ── Conversation list ── */}
        <div className={`w-full lg:w-72 xl:w-80 border-r border-gray-100 bg-white flex-shrink-0 flex flex-col ${mobileView === 'chat' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-100">
            <h1 className="text-lg font-bold text-gray-900 mb-3">Messages</h1>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
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
                <MessageSquare size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No conversations yet</p>
                <Link to="/friends" className="text-xs text-indigo-600 hover:underline mt-1 block">
                  Find friends to chat with
                </Link>
              </div>
            )}

            {filteredConvs.map(c => (
              <button key={c.other_id} onClick={() => openConversation(c.other_id)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${activeUser?.id === c.other_id ? 'bg-indigo-50' : ''}`}>
                <div className="relative flex-shrink-0">
                  <Avatar user={{ id: c.other_id, name: c.other_name, avatar: c.other_avatar }} />
                  {c.unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">
                      {c.unread > 9 ? '9+' : c.unread}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${c.unread > 0 ? 'font-semibold text-gray-900' : 'font-medium text-gray-800'}`}>
                      {c.other_name}
                    </p>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{timeAgo(c.last_at)}</span>
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${c.unread > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                    {c.last_sender_id === myUser.id ? 'You: ' : ''}{c.last_message}
                  </p>
                </div>
              </button>
            ))}

            {filteredFriends.length > 0 && (
              <>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider px-4 pt-4 pb-1">Friends</p>
                {filteredFriends.map(f => (
                  <button key={f.id} onClick={() => openConversation(f.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${activeUser?.id === f.id ? 'bg-indigo-50' : ''}`}>
                    <Avatar user={f} />
                    <p className="text-sm font-medium text-gray-800">{f.name}</p>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* ── Chat area ── */}
        <div className={`flex-1 flex flex-col ${mobileView === 'list' ? 'hidden lg:flex' : 'flex'}`}>
          {/* Header */}
          {activeUser ? (
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 bg-white flex-shrink-0">
              <button onClick={() => setMobileView('list')} className="lg:hidden p-1 text-gray-400 hover:text-gray-600">
                <ArrowLeft size={18} />
              </button>
              <Link to={`/friends/${activeUser.id}`}>
                <Avatar user={activeUser} size="lg" />
              </Link>
              <Link to={`/friends/${activeUser.id}`}
                className="font-semibold text-gray-900 text-sm hover:text-indigo-600 transition-colors">
                {activeUser.name}
              </Link>
            </div>
          ) : (
            <div className="px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">
              <p className="text-sm font-semibold text-gray-500">Select a conversation</p>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
            {!activeUser && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageSquare size={40} className="text-gray-200 mb-3" />
                <p className="text-gray-400 font-medium">Select a conversation</p>
                <p className="text-sm text-gray-300 mt-1">Or start a new one from your friends list</p>
              </div>
            )}
            {activeUser && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Avatar user={activeUser} size="lg" />
                <p className="text-gray-600 font-medium mt-3">{activeUser.name}</p>
                <p className="text-xs text-gray-400 mt-1">No messages yet — say hi! 👋</p>
              </div>
            )}
            {messages.map((msg, i) => {
              const isMe = msg.sender_id === myUser.id;
              const showTime = i === 0
                || (new Date(msg.created_at) - new Date(messages[i - 1].created_at)) > 300000;
              return (
                <div key={msg.id}>
                  {showTime && (
                    <p className="text-xs text-gray-400 text-center my-3">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                  <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      isMe
                        ? 'bg-indigo-600 text-white rounded-br-sm'
                        : 'bg-white text-gray-900 border border-gray-100 rounded-bl-sm shadow-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input — textarea with Enter=send, Shift+Enter=newline */}
          {activeUser && (
            <div className="px-4 py-3 border-t border-gray-100 bg-white flex gap-2 items-end flex-shrink-0">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${activeUser.name}… (Enter to send, Shift+Enter for new line)`}
                rows={1}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white resize-none overflow-hidden leading-relaxed"
                style={{ minHeight: '42px', maxHeight: '120px' }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-all disabled:opacity-40 flex-shrink-0 mb-0.5">
                <Send size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
