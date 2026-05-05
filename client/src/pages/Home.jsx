import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Image, X, Send, MessageSquare, Users, ThumbsUp,
  MoreHorizontal, Trash2, Briefcase, FileText, Bell
} from 'lucide-react';
import Layout from '../components/Layout';
import api from '../api/axios';

const REACTIONS = [
  { type: 'like',  emoji: '👍', label: 'Like',  color: 'text-indigo-600' },
  { type: 'laugh', emoji: '😂', label: 'Haha',  color: 'text-yellow-500' },
  { type: 'sad',   emoji: '😢', label: 'Sad',   color: 'text-blue-400'  },
  { type: 'angry', emoji: '😡', label: 'Angry', color: 'text-red-500'   },
];

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function Avatar({ user, size = 'sm' }) {
  const sz = { lg: 'w-12 h-12 text-lg', md: 'w-10 h-10 text-sm', sm: 'w-8 h-8 text-xs' }[size];
  return user?.avatar
    ? <img src={user.avatar} alt={user.name} className={`${sz} rounded-full object-cover flex-shrink-0 ring-2 ring-white`} />
    : <div className={`${sz} rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0`}>
        {user?.name?.[0] || '?'}
      </div>;
}

function ReactionPicker({ myReaction, onReact }) {
  const [open, setOpen] = useState(false);
  const timer = useRef();
  const myR = REACTIONS.find(r => r.type === myReaction);

  return (
    <div className="relative"
      onMouseEnter={() => { clearTimeout(timer.current); setOpen(true); }}
      onMouseLeave={() => { timer.current = setTimeout(() => setOpen(false), 250); }}>

      {open && (
        <div className="absolute bottom-10 left-0 flex items-end gap-1 bg-white border border-gray-100 rounded-2xl px-2.5 py-2 shadow-2xl z-20"
          style={{ animation: 'popUp 0.15s cubic-bezier(0.34,1.56,0.64,1)' }}>
          {REACTIONS.map(r => (
            <button key={r.type}
              onClick={() => { onReact(myReaction === r.type ? null : r.type); setOpen(false); }}
              title={r.label}
              className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-xl transition-all duration-150 hover:scale-125 ${myReaction === r.type ? 'scale-110 bg-gray-50' : ''}`}>
              <span className="text-2xl leading-none">{r.emoji}</span>
              <span className={`text-xs font-semibold ${r.color}`}>{r.label}</span>
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => onReact(myReaction === 'like' ? null : 'like')}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 hover:bg-gray-100 active:scale-95 ${myR ? myR.color : 'text-gray-500'}`}>
        {myR ? <span className="text-base leading-none">{myR.emoji}</span> : <ThumbsUp size={14} />}
        <span>{myR ? myR.label : 'Like'}</span>
      </button>
    </div>
  );
}

function ReactionSummary({ summary, count }) {
  if (!count) return null;
  const sorted = (summary || []).sort((a, b) => b.count - a.count).slice(0, 3);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex -space-x-0.5">
        {sorted.map(s => {
          const r = REACTIONS.find(x => x.type === s.type);
          return r ? <span key={s.type} className="text-sm">{r.emoji}</span> : null;
        })}
      </div>
      <span className="text-xs text-gray-400">{count}</span>
    </div>
  );
}

function CommentReactionPicker({ myReaction, onReact }) {
  const [open, setOpen] = useState(false);
  const timer = useRef();
  const myR = REACTIONS.find(r => r.type === myReaction);

  return (
    <div className="relative inline-block"
      onMouseEnter={() => { clearTimeout(timer.current); setOpen(true); }}
      onMouseLeave={() => { timer.current = setTimeout(() => setOpen(false), 250); }}>

      {open && (
        <div className="absolute bottom-6 left-0 flex items-end gap-0.5 bg-white border border-gray-100 rounded-xl px-1.5 py-1.5 shadow-xl z-20"
          style={{ animation: 'popUp 0.15s cubic-bezier(0.34,1.56,0.64,1)' }}>
          {REACTIONS.map(r => (
            <button key={r.type}
              onClick={() => { onReact(myReaction === r.type ? null : r.type); setOpen(false); }}
              title={r.label}
              className={`px-1 py-0.5 rounded-lg transition-all hover:scale-125 ${myReaction === r.type ? 'scale-110' : ''}`}>
              <span className="text-lg leading-none">{r.emoji}</span>
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => onReact(myReaction === 'like' ? null : 'like')}
        className={`text-xs font-semibold transition-colors ${myR ? myR.color : 'text-gray-400 hover:text-gray-600'}`}>
        {myR ? `${myR.emoji} ${myR.label}` : '👍 Like'}
      </button>
    </div>
  );
}

function CommentItem({ comment, postId, myId, onDelete, onReact }) {
  const totalReactions = (comment.reactions_summary || []).reduce((a, b) => a + Number(b.count), 0);

  return (
    <div className="flex gap-2.5 group" style={{ animation: 'fadeInUp 0.2s ease' }}>
      <Link to={comment.user_id === myId ? '/profile' : `/friends/${comment.user_id}`} className="flex-shrink-0">
        <Avatar user={{ name: comment.user_name, avatar: comment.user_avatar }} size="sm" />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-3 py-2.5 inline-block max-w-full">
          <Link to={comment.user_id === myId ? '/profile' : `/friends/${comment.user_id}`}
            className="text-xs font-bold text-gray-900 hover:text-indigo-600 transition-colors block">
            {comment.user_name}
          </Link>
          {comment.content && <p className="text-sm text-gray-800 mt-0.5 leading-relaxed">{comment.content}</p>}
          {comment.image_url && (
            <img src={comment.image_url} alt="comment" className="mt-2 rounded-xl max-h-48 object-cover" />
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 ml-1">
          <CommentReactionPicker myReaction={comment.my_reaction} onReact={(t) => onReact(comment.id, t)} />
          {totalReactions > 0 && <span className="text-xs text-gray-400">{totalReactions}</span>}
          <span className="text-xs text-gray-400">{timeAgo(comment.created_at)}</span>
          {comment.user_id === myId && (
            <button onClick={() => onDelete(comment.id)}
              className="text-xs text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PostCard({ post, myId, onDelete, onReact, onCommentCountChange }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentImage, setCommentImage] = useState('');
  const [sending, setSending] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [imgExpanded, setImgExpanded] = useState(false);
  const commentFileRef = useRef();
  const menuRef = useRef();

  const loadComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const res = await api.get(`/posts/${post.id}/comments`);
      setComments(res.data);
    } finally { setLoadingComments(false); }
  }, [post.id]);

  const toggleComments = () => {
    if (!showComments) loadComments();
    setShowComments(v => !v);
  };

  const sendComment = async () => {
    if ((!commentText.trim() && !commentImage) || sending) return;
    setSending(true);
    try {
      const res = await api.post(`/posts/${post.id}/comments`, {
        content: commentText.trim() || null,
        image_url: commentImage || null,
      });
      setComments(c => [...c, res.data]);
      setCommentText('');
      setCommentImage('');
      onCommentCountChange(post.id, 1);
    } finally { setSending(false); }
  };

  const handleCommentImage = (e) => {
    const file = e.target.files[0];
    if (!file || file.size > 3 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = ev => setCommentImage(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleDeleteComment = async (commentId) => {
    await api.delete(`/posts/${post.id}/comments/${commentId}`);
    setComments(c => c.filter(x => x.id !== commentId));
    onCommentCountChange(post.id, -1);
  };

  const handleCommentReact = async (commentId, type) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    const typeToSend = type || comment.my_reaction;
    if (!typeToSend) return;
    await api.post(`/posts/${post.id}/comments/${commentId}/react`, { type: typeToSend });
    setComments(c => c.map(x => x.id === commentId ? { ...x, my_reaction: type } : x));
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-visible transition-shadow duration-200 hover:shadow-md"
      style={{ animation: 'fadeInUp 0.3s ease' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <Link to={post.user_id === myId ? '/profile' : `/friends/${post.user_id}`}>
            <Avatar user={{ name: post.user_name, avatar: post.user_avatar }} size="md" />
          </Link>
          <div>
            <Link to={post.user_id === myId ? '/profile' : `/friends/${post.user_id}`}
              className="text-sm font-bold text-gray-900 hover:text-indigo-600 transition-colors">
              {post.user_name}
            </Link>
            <p className="text-xs text-gray-400 mt-0.5">{timeAgo(post.created_at)}</p>
          </div>
        </div>
        {post.user_id === myId && (
          <div className="relative" ref={menuRef}>
            <button onClick={() => setShowMenu(v => !v)}
              className="p-1.5 text-gray-300 hover:text-gray-500 hover:bg-gray-100 rounded-xl transition-all">
              <MoreHorizontal size={16} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-9 bg-white border border-gray-100 rounded-xl shadow-xl z-10 overflow-hidden min-w-28"
                style={{ animation: 'fadeInUp 0.15s ease' }}>
                <button onClick={() => { onDelete(post.id); setShowMenu(false); }}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full transition-colors">
                  <Trash2 size={13} />Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <p className="px-4 pb-3 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>
      )}
      {post.image_url && (
        <div className="cursor-pointer" onClick={() => setImgExpanded(v => !v)}>
          <img src={post.image_url} alt="post"
            className={`w-full object-cover transition-all duration-300 ${imgExpanded ? 'max-h-[600px]' : 'max-h-80'}`} />
        </div>
      )}

      {/* Reaction + comment summary */}
      {(Number(post.reactions_count) > 0 || Number(post.comments_count) > 0) && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-50">
          <ReactionSummary summary={post.reactions_summary} count={Number(post.reactions_count)} />
          {Number(post.comments_count) > 0 && (
            <button onClick={toggleComments}
              className="text-xs text-gray-400 hover:text-indigo-600 transition-colors">
              {post.comments_count} comment{Number(post.comments_count) !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center border-t border-gray-100 px-2 py-0.5">
        <ReactionPicker myReaction={post.my_reaction} onReact={(type) => onReact(post.id, type)} />
        <button onClick={toggleComments}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-all active:scale-95">
          <MessageSquare size={14} />Comment
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-3">
          {loadingComments ? (
            <div className="flex justify-center py-3">
              <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.map(c => (
            <CommentItem key={c.id} comment={c} postId={post.id} myId={myId}
              onDelete={handleDeleteComment} onReact={handleCommentReact} />
          ))}

          {/* Comment input */}
          <div className="flex gap-2 items-end pt-1">
            <Avatar user={JSON.parse(localStorage.getItem('user') || '{}')} size="sm" />
            <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
              {commentImage && (
                <div className="relative p-2 pb-0">
                  <img src={commentImage} alt="preview" className="h-24 rounded-xl object-cover" />
                  <button onClick={() => setCommentImage('')}
                    className="absolute top-3 right-3 w-5 h-5 bg-gray-700/80 text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors">
                    <X size={10} />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-1 px-1">
                <input value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendComment())}
                  placeholder="Write a comment..."
                  className="flex-1 px-2 py-2 text-sm bg-transparent outline-none" />
                <button onClick={() => commentFileRef.current?.click()}
                  className="p-1.5 text-gray-400 hover:text-indigo-500 transition-colors rounded-lg hover:bg-indigo-50">
                  <Image size={14} />
                </button>
                <button onClick={sendComment}
                  disabled={(!commentText.trim() && !commentImage) || sending}
                  className="p-1.5 text-indigo-500 hover:text-indigo-700 transition-colors rounded-lg hover:bg-indigo-50 disabled:opacity-30">
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
          <input ref={commentFileRef} type="file" accept="image/*" className="hidden" onChange={handleCommentImage} />
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const myUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({ resumes: 0, jobs: 0, friends: 0, unread: 0 });
  const [friends, setFriends] = useState([]);
  const postFileRef = useRef();
  const textareaRef = useRef();

  const load = useCallback(async () => {
    // Load posts separately so DB errors don't hide the whole page
    api.get('/posts/feed')
      .then(res => setPosts(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));

    Promise.all([
      api.get('/resumes'),
      api.get('/jobs'),
      api.get('/friends'),
      api.get('/messages/unread/count'),
    ]).then(([r, j, f, u]) => {
      setStats({ resumes: r.data.length, jobs: j.data.length, friends: f.data.length, unread: u.data.count });
      setFriends(f.data.slice(0, 7));
    }).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const submitPost = async () => {
    if ((!postText.trim() && !postImage) || submitting) return;
    setSubmitting(true);
    try {
      const res = await api.post('/posts', { content: postText.trim() || null, image_url: postImage || null });
      setPosts(p => [res.data, ...p]);
      setPostText('');
      setPostImage('');
      if (textareaRef.current) { textareaRef.current.style.height = 'auto'; }
    } finally { setSubmitting(false); }
  };

  const handlePostImage = (e) => {
    const file = e.target.files[0];
    if (!file || file.size > 5 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = ev => setPostImage(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleTextChange = (e) => {
    setPostText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
  };

  const handleReact = async (postId, type) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const typeToSend = type || post.my_reaction;
    if (!typeToSend) return;
    await api.post(`/posts/${postId}/react`, { type: typeToSend });
    const removing = !type || type === post.my_reaction;
    setPosts(p => p.map(x => x.id === postId ? {
      ...x,
      my_reaction: removing ? null : type,
      reactions_count: removing
        ? Math.max(0, Number(x.reactions_count) - 1)
        : post.my_reaction ? x.reactions_count : Number(x.reactions_count) + 1,
    } : x));
  };

  const handleDelete = async (postId) => {
    await api.delete(`/posts/${postId}`);
    setPosts(p => p.filter(x => x.id !== postId));
  };

  const handleCommentCountChange = (postId, delta) => {
    setPosts(p => p.map(x => x.id === postId
      ? { ...x, comments_count: Math.max(0, Number(x.comments_count) + delta) }
      : x));
  };

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
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Feed (left 2/3) ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Post Composer */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
              style={{ animation: 'slideDown 0.3s ease' }}>
              <div className="flex gap-3">
                <Link to="/profile" className="flex-shrink-0">
                  <Avatar user={myUser} size="md" />
                </Link>
                <div className="flex-1">
                  <textarea
                    ref={textareaRef}
                    value={postText}
                    onChange={handleTextChange}
                    onKeyDown={e => e.key === 'Enter' && e.ctrlKey && submitPost()}
                    placeholder={`What's on your mind, ${myUser.name?.split(' ')[0] || ''}?`}
                    rows={2}
                    className="w-full text-sm text-gray-800 placeholder-gray-400 resize-none outline-none leading-relaxed bg-transparent"
                    style={{ minHeight: '52px', maxHeight: '200px' }}
                  />
                  {postImage && (
                    <div className="relative mt-2 inline-block">
                      <img src={postImage} alt="preview"
                        className="max-h-52 max-w-full rounded-xl object-cover border border-gray-200" />
                      <button onClick={() => setPostImage('')}
                        className="absolute top-2 right-2 w-6 h-6 bg-gray-800/75 text-white rounded-full flex items-center justify-center hover:bg-gray-900 transition-colors">
                        <X size={11} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <button onClick={() => postFileRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-95">
                  <Image size={15} className="text-emerald-500" />
                  <span className="font-medium">Photo</span>
                </button>
                <button onClick={submitPost}
                  disabled={(!postText.trim() && !postImage) || submitting}
                  className="px-5 py-1.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-indigo-200">
                  {submitting
                    ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Posting...</span>
                    : 'Post'}
                </button>
              </div>
              <input ref={postFileRef} type="file" accept="image/*" className="hidden" onChange={handlePostImage} />
            </div>

            {/* Feed */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
                    <div className="flex gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-100 rounded-full w-32" />
                        <div className="h-2 bg-gray-100 rounded-full w-20" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-100 rounded-full" />
                      <div className="h-3 bg-gray-100 rounded-full w-4/5" />
                    </div>
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
                  className="inline-flex items-center gap-2 mt-5 px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200">
                  <Users size={14} />Find Friends
                </Link>
              </div>
            ) : (
              posts.map((post, i) => (
                <div key={post.id} style={{ animation: `fadeInUp ${0.2 + i * 0.04}s ease both` }}>
                  <PostCard
                    post={post}
                    myId={myUser.id}
                    onDelete={handleDelete}
                    onReact={handleReact}
                    onCommentCountChange={handleCommentCountChange}
                  />
                </div>
              ))
            )}
          </div>

          {/* ── Sidebar (right 1/3) ── */}
          <div className="hidden lg:flex flex-col gap-4 sticky top-6 self-start">

            {/* Profile card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              style={{ animation: 'slideDown 0.35s ease' }}>
              <div className="h-14 bg-gradient-to-r from-indigo-500 to-purple-500" />
              <div className="px-4 pb-4 -mt-7">
                <Link to="/profile" className="block w-14 h-14 rounded-2xl ring-4 ring-white mb-2 overflow-hidden">
                  {myUser.avatar
                    ? <img src={myUser.avatar} alt="me" className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">{myUser.name?.[0]}</span>
                      </div>
                  }
                </Link>
                <p className="text-sm font-bold text-gray-900">{myUser.name}</p>
                <Link to="/profile" className="text-xs text-indigo-600 hover:underline">View profile</Link>

                <div className="grid grid-cols-2 gap-1.5 mt-3">
                  {[
                    { label: 'Resumes', value: stats.resumes, to: '/resumes', icon: FileText, color: 'text-indigo-500' },
                    { label: 'Jobs',    value: stats.jobs,    to: '/jobs',    icon: Briefcase, color: 'text-blue-500' },
                    { label: 'Friends', value: stats.friends, to: '/friends', icon: Users,     color: 'text-emerald-500' },
                    { label: 'Unread',  value: stats.unread,  to: '/messages',icon: Bell,      color: 'text-yellow-500' },
                  ].map(s => (
                    <Link key={s.label} to={s.to}
                      className="flex flex-col items-center py-2 rounded-xl hover:bg-gray-50 transition-colors group">
                      <s.icon size={14} className={`${s.color} mb-0.5 group-hover:scale-110 transition-transform`} />
                      <span className="text-base font-bold text-gray-900">{s.value}</span>
                      <span className="text-xs text-gray-400">{s.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Friends */}
            {friends.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
                style={{ animation: 'slideDown 0.45s ease' }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-gray-900">Connections</p>
                  <Link to="/friends" className="text-xs text-indigo-600 hover:underline font-medium">See all</Link>
                </div>
                <div className="space-y-1">
                  {friends.map(f => (
                    <Link key={f.id} to={`/friends/${f.id}`}
                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-indigo-50 transition-colors group">
                      <div className="relative flex-shrink-0">
                        <Avatar user={f} size="sm" />
                        {f.last_seen_at && Date.now() - new Date(f.last_seen_at).getTime() < 120000 && (
                          <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border border-white" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-indigo-700 transition-colors">{f.name}</p>
                        <p className="text-xs text-gray-400 truncate">{f.location || 'ResumeAI'}</p>
                      </div>
                      <Link to={`/messages?user=${f.id}`} onClick={e => e.stopPropagation()}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-indigo-500 transition-all">
                        <MessageSquare size={12} />
                      </Link>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
}
