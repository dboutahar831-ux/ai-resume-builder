import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Image, X, Send, MessageSquare, Users, ThumbsUp,
  MoreHorizontal, Trash2,
  Repeat2, Video, CornerDownRight, Sparkles, Search,
  Clock, Hash, SlidersHorizontal, CalendarClock,
} from 'lucide-react';
import Layout from '../components/Layout';
import StoriesBar from '../components/StoriesBar';
import MentionSuggestions from '../components/MentionSuggestions';
import HomeSidebar from '../components/HomeSidebar';
import { useMention } from '../hooks/useMention';
import { useToast } from '../components/Toast';
import api from '../api/axios';

function renderWithMentions(text) {
  if (!text) return null;
  const parts = text.split(/(@\S+|#\w+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('@'))
      return <span key={i} className="font-semibold cursor-pointer hover:underline" style={{ color: '#6C5CE7' }}>{part}</span>;
    if (part.startsWith('#'))
      return <Link key={i} to={`/home?tag=${part.slice(1)}`} className="font-semibold hover:underline" style={{ color: '#2EC4B6' }}>{part}</Link>;
    return part;
  });
}

const REACTIONS = [
  { type: 'like',  emoji: '👍', label: 'Like',  color: 'text-indigo-600', bg: 'bg-indigo-50',  ring: 'ring-indigo-200' },
  { type: 'heart', emoji: '❤️', label: 'Love',  color: 'text-rose-500',   bg: 'bg-rose-50',    ring: 'ring-rose-200'   },
  { type: 'laugh', emoji: '😂', label: 'Haha',  color: 'text-amber-500',  bg: 'bg-amber-50',   ring: 'ring-amber-200'  },
  { type: 'sad',   emoji: '😢', label: 'Sad',   color: 'text-sky-500',    bg: 'bg-sky-50',     ring: 'ring-sky-200'    },
  { type: 'angry', emoji: '😡', label: 'Angry', color: 'text-orange-500', bg: 'bg-orange-50',  ring: 'ring-orange-200' },
];

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isOnline(lastSeen) {
  return lastSeen && Date.now() - new Date(lastSeen).getTime() < 120000;
}

function Avatar({ user, size = 'sm', showDot = false, lastSeen = null }) {
  const sz = {
    xl: 'w-14 h-14 text-xl',
    lg: 'w-12 h-12 text-lg',
    md: 'w-10 h-10 text-sm',
    sm: 'w-8 h-8 text-xs',
  }[size];
  const dotSz = { xl: 'w-3.5 h-3.5 border-2', lg: 'w-3 h-3 border-2', md: 'w-2.5 h-2.5 border-2', sm: 'w-2 h-2 border' }[size];
  const online = showDot && isOnline(lastSeen);

  return (
    <div className="relative flex-shrink-0">
      {user?.avatar
        ? <img src={user.avatar} loading="lazy" alt={user.name} className={`${sz} rounded-full object-cover ring-2 ring-white`} />
        : <div className={`${sz} rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold`}>
            {user?.name?.[0] || '?'}
          </div>
      }
      {showDot && (
        <span className={`absolute bottom-0 right-0 ${dotSz} rounded-full border-white ${online ? 'bg-emerald-500' : 'bg-gray-300'}`} />
      )}
    </div>
  );
}

function ReactionPicker({ myReaction, onReact, small = false }) {
  const [open, setOpen] = useState(false);
  const timer = useRef();
  const myR = REACTIONS.find(r => r.type === myReaction);

  return (
    <div className="relative"
      onMouseEnter={() => { clearTimeout(timer.current); setOpen(true); }}
      onMouseLeave={() => { timer.current = setTimeout(() => setOpen(false), 200); }}>

      {open && (
        <div className={`absolute bottom-10 left-0 flex items-end gap-1 bg-white border border-gray-100 rounded-2xl shadow-2xl z-30 ${small ? 'px-2 py-1.5' : 'px-3 py-2'}`}
          style={{ animation: 'popUp 0.15s cubic-bezier(0.34,1.56,0.64,1)' }}>
          {REACTIONS.map(r => (
            <button key={r.type}
              onClick={() => { onReact(myReaction === r.type ? null : r.type); setOpen(false); }}
              title={r.label}
              className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-xl transition-all duration-150 select-none
                hover:scale-125 active:scale-110
                ${myReaction === r.type ? `scale-115 ${r.bg} ring-1 ${r.ring}` : 'hover:bg-gray-50'}`}>
              <span className={`${small ? 'text-xl' : 'text-2xl'} leading-none`}>{r.emoji}</span>
              <span className={`text-[10px] font-bold ${r.color}`}>{r.label}</span>
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => onReact(myReaction === 'like' ? null : 'like')}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 hover:bg-gray-100 active:scale-95
          ${myR ? myR.color : 'text-gray-500'}`}>
        {myR
          ? <span className="text-base leading-none">{myR.emoji}</span>
          : <ThumbsUp size={14} />}
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
      <div className="flex -space-x-1">
        {sorted.map(s => {
          const r = REACTIONS.find(x => x.type === s.type);
          return r ? (
            <span key={s.type}
              className={`w-5 h-5 rounded-full ${r.bg} border border-white flex items-center justify-center text-xs leading-none shadow-sm`}>
              {r.emoji}
            </span>
          ) : null;
        })}
      </div>
      <span className="text-xs text-gray-400 font-medium">{count}</span>
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
      onMouseLeave={() => { timer.current = setTimeout(() => setOpen(false), 200); }}>

      {open && (
        <div className="absolute bottom-6 left-0 flex items-end gap-0.5 bg-white border border-gray-100 rounded-xl px-2 py-1.5 shadow-xl z-30"
          style={{ animation: 'popUp 0.15s cubic-bezier(0.34,1.56,0.64,1)' }}>
          {REACTIONS.map(r => (
            <button key={r.type}
              onClick={() => { onReact(myReaction === r.type ? null : r.type); setOpen(false); }}
              title={r.label}
              className={`px-1 py-0.5 rounded-lg transition-all hover:scale-125 select-none ${myReaction === r.type ? `scale-115 ${r.bg}` : ''}`}>
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

function CommentItem({ comment, postId, myId, onDelete, onReact, onReply, allComments }) {
  const totalReactions = (comment.reactions_summary || []).reduce((a, b) => a + Number(b.count), 0);
  const isReply = !!comment.parent_id;

  return (
    <div className={`flex gap-2.5 group ${isReply ? 'ml-10 pl-2 border-l-2 border-gray-100' : ''}`}
      style={{ animation: 'fadeInUp 0.2s ease' }}>
      <Link to={comment.user_id === myId ? '/profile' : `/friends/${comment.user_id}`} className="flex-shrink-0">
        <Avatar user={{ name: comment.user_name, avatar: comment.user_avatar }} size="sm" />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-3 py-2.5 inline-block max-w-full">
          <Link to={comment.user_id === myId ? '/profile' : `/friends/${comment.user_id}`}
            className="text-xs font-bold text-gray-900 hover:text-indigo-600 transition-colors block">
            {comment.user_name}
          </Link>
          {isReply && comment.parent_user_name && (
            <span className="text-xs text-indigo-400 font-medium">@{comment.parent_user_name} </span>
          )}
          {comment.content && <p className="text-sm text-gray-800 mt-0.5 leading-relaxed">{renderWithMentions(comment.content)}</p>}
          {comment.image_url && (
            <img src={comment.image_url} loading="lazy" alt="comment" className="mt-2 rounded-xl max-h-48 object-cover" />
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 ml-1">
          <CommentReactionPicker myReaction={comment.my_reaction} onReact={(t) => onReact(comment.id, t)} />
          {totalReactions > 0 && <span className="text-xs text-gray-400">{totalReactions}</span>}
          <button onClick={() => onReply(comment)}
            className="text-xs text-gray-400 hover:text-indigo-600 font-semibold transition-colors flex items-center gap-0.5">
            <CornerDownRight size={11} />Reply
          </button>
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

function RepostBadge({ post }) {
  if (!post.original_post_id) return null;
  return (
    <div className="px-4 pt-3 pb-1">
      <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
        <Repeat2 size={13} className="text-gray-400" />
        <span>{post.user_name} shared a post</span>
      </div>
      {post.repost_text && (
        <p className="text-sm text-gray-700 mt-1 leading-relaxed">{post.repost_text}</p>
      )}
    </div>
  );
}

function OriginalPostBox({ post }) {
  if (!post.original_post_id) return null;
  const hasContent = post.original_content || post.original_image_url || post.original_video_url;
  if (!hasContent) {
    return (
      <div className="mx-4 mb-3 rounded-xl border border-gray-200 px-4 py-3 bg-gray-50 text-xs text-gray-400 italic">
        Original post is no longer available.
      </div>
    );
  }
  return (
    <div className="mx-4 mb-3 rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
      <div className="flex items-center gap-2 px-3 pt-3 pb-1">
        <Avatar user={{ name: post.original_user_name, avatar: post.original_user_avatar }} size="sm" />
        <div>
          <Link to={`/friends/${post.original_user_id}`} className="text-xs font-bold text-gray-900 hover:text-indigo-600">
            {post.original_user_name}
          </Link>
          <p className="text-[10px] text-gray-400">{timeAgo(post.original_created_at)}</p>
        </div>
      </div>
      {post.original_content && (
        <p className="px-3 pb-2 text-sm text-gray-700 leading-relaxed">{post.original_content}</p>
      )}
      {post.original_image_url && (
        <img src={post.original_image_url} loading="lazy" alt="original" className="w-full max-h-60 object-cover" />
      )}
      {post.original_video_url && (
        <video src={post.original_video_url} controls className="w-full max-h-60 bg-black" />
      )}
    </div>
  );
}

function RepostModal({ post, onClose, onRepost }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'popUp 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <p className="font-bold text-gray-900">Share Post</p>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
            <X size={16} />
          </button>
        </div>
        <div className="p-4">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Say something about this post... (optional)"
            rows={3}
            className="w-full text-sm text-gray-800 placeholder-gray-400 resize-none outline-none border border-gray-200 rounded-xl px-3 py-2.5 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
          />
          <div className="mt-3 p-3 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-500 truncate">
            <span className="font-semibold text-gray-700">{post.user_name}</span>: {post.content || '📷 Photo/Video'}
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-4">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
            Cancel
          </button>
          <button
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              try { await onRepost(text); onClose(); } finally { setLoading(false); }
            }}
            className="flex-1 px-4 py-2 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2" style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
            {loading
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><Repeat2 size={14} />Share</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function PostCard({ post, myId, onDelete, onReact, onCommentCountChange, onRepost }) {
  const addToast = useToast();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentImage, setCommentImage] = useState('');
  const [sending, setSending] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [imgExpanded, setImgExpanded] = useState(false);
  const [repostModal, setRepostModal] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const commentFileRef = useRef();
  const commentInputRef = useRef();
  const commentMention = useMention();

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
        parent_id: replyingTo?.id || null,
        mention_ids: commentMention.mentionIds,
      });
      setComments(c => [...c, { ...res.data, parent_user_name: replyingTo?.user_name || null }]);
      setCommentText('');
      setCommentImage('');
      setReplyingTo(null);
      commentMention.reset();
      onCommentCountChange(post.id, 1);
    } finally { setSending(false); }
  };

  const handleCommentImage = (e) => {
    const file = e.target.files[0];
    if (!file || file.size > 3 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = ev => setCommentImage(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/posts/${post.id}/comments/${commentId}`);
      setComments(c => c.filter(x => x.id !== commentId));
      onCommentCountChange(post.id, -1);
    } catch { addToast('Failed to delete comment.', 'error'); }
  };

  const handleCommentReact = async (commentId, type) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    const typeToSend = type || comment.my_reaction;
    if (!typeToSend) return;
    await api.post(`/posts/${post.id}/comments/${commentId}/react`, { type: typeToSend });
    setComments(c => c.map(x => x.id === commentId ? { ...x, my_reaction: type } : x));
  };

  const handleReply = (comment) => {
    setReplyingTo(comment);
    if (!showComments) { loadComments(); setShowComments(true); }
    setTimeout(() => commentInputRef.current?.focus(), 100);
  };

  const isRepost = !!post.original_post_id;

  return (
    <>
      {repostModal && (
        <RepostModal
          post={post}
          onClose={() => setRepostModal(false)}
          onRepost={async (text) => onRepost(post.id, text)}
        />
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-visible transition-shadow duration-200 hover:shadow-md"
        style={{ animation: 'fadeInUp 0.3s ease' }}>

        {/* Repost header */}
        {isRepost && <RepostBadge post={post} />}

        {/* Author header — hide when it's a repost (original author shown inside) */}
        {!isRepost && (
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex items-center gap-3">
              <Link to={post.user_id === myId ? '/profile' : `/friends/${post.user_id}`}>
                <Avatar
                  user={{ name: post.user_name, avatar: post.user_avatar }}
                  size="md"
                  showDot
                  lastSeen={post.user_last_seen_at}
                />
              </Link>
              <div>
                <Link to={post.user_id === myId ? '/profile' : `/friends/${post.user_id}`}
                  className="text-sm font-bold text-gray-900 hover:text-indigo-600 transition-colors">
                  {post.user_name}
                </Link>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs text-gray-400">{timeAgo(post.created_at)}</p>
                  {isOnline(post.user_last_seen_at) && (
                    <span className="text-[10px] text-emerald-500 font-semibold">· Active now</span>
                  )}
                </div>
              </div>
            </div>
            {post.user_id === myId && (
              <div className="relative">
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
        )}

        {/* For reposts: show reposter header above the original box */}
        {isRepost && (
          <div className="flex items-center justify-between px-4 pb-2">
            <div className="flex items-center gap-2">
              <Avatar user={{ name: post.user_name, avatar: post.user_avatar }} size="sm" showDot lastSeen={post.user_last_seen_at} />
              <div>
                <Link to={post.user_id === myId ? '/profile' : `/friends/${post.user_id}`}
                  className="text-xs font-bold text-gray-900 hover:text-indigo-600">{post.user_name}</Link>
                <p className="text-[10px] text-gray-400">{timeAgo(post.created_at)}</p>
              </div>
            </div>
            {post.user_id === myId && (
              <div className="relative">
                <button onClick={() => setShowMenu(v => !v)}
                  className="p-1 text-gray-300 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-all">
                  <MoreHorizontal size={14} />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-8 bg-white border border-gray-100 rounded-xl shadow-xl z-10 overflow-hidden min-w-28">
                    <button onClick={() => { onDelete(post.id); setShowMenu(false); }}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full">
                      <Trash2 size={13} />Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Original post box (for reposts) */}
        {isRepost && <OriginalPostBox post={post} />}

        {/* Regular post content */}
        {!isRepost && (
          <>
            {post.content && (
              <p className="px-4 pb-3 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{renderWithMentions(post.content)}</p>
            )}
            {post.image_url && (
              <div className="cursor-pointer" onClick={() => setImgExpanded(v => !v)}>
                <img src={post.image_url} loading="lazy" alt="post"
                  className={`w-full object-cover transition-all duration-300 ${imgExpanded ? 'max-h-[700px]' : 'max-h-96'}`} />
              </div>
            )}
            {post.video_url && (
              <video src={post.video_url} controls
                className="w-full max-h-96 bg-black"
                style={{ display: 'block' }} />
            )}
          </>
        )}

        {/* Reaction + comment count */}
        {(Number(post.reactions_count) > 0 || Number(post.comments_count) > 0) && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-gray-50">
            <ReactionSummary summary={post.reactions_summary} count={Number(post.reactions_count)} />
            {Number(post.comments_count) > 0 && (
              <button onClick={toggleComments}
                className="text-xs text-gray-400 hover:text-indigo-600 transition-colors font-medium">
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
          <button onClick={() => setRepostModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-all active:scale-95 ml-auto">
            <Repeat2 size={14} />Share
          </button>
        </div>

        {/* Comments section */}
        {showComments && (
          <div className="border-t border-gray-100 px-4 py-3 space-y-3">
            {loadingComments ? (
              <div className="flex justify-center py-3">
                <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : comments.map(c => (
              <CommentItem
                key={c.id}
                comment={c}
                postId={post.id}
                myId={myId}
                onDelete={handleDeleteComment}
                onReact={handleCommentReact}
                onReply={handleReply}
                allComments={comments}
              />
            ))}

            {/* Comment input */}
            <div className="flex gap-2 items-end pt-1">
              <Avatar user={JSON.parse(localStorage.getItem('user') || '{}')} size="sm" />
              <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                {replyingTo && (
                  <div className="flex items-center gap-2 px-3 pt-2">
                    <span className="text-xs text-indigo-500 font-semibold flex items-center gap-1">
                      <CornerDownRight size={11} />Replying to {replyingTo.user_name}
                    </span>
                    <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-gray-600 ml-auto">
                      <X size={11} />
                    </button>
                  </div>
                )}
                {commentImage && (
                  <div className="relative p-2 pb-0">
                    <img src={commentImage} loading="lazy" alt="preview" className="h-24 rounded-xl object-cover" />
                    <button onClick={() => setCommentImage('')}
                      className="absolute top-3 right-3 w-5 h-5 bg-gray-700/80 text-white rounded-full flex items-center justify-center hover:bg-gray-800">
                      <X size={10} />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-1 px-1 relative">
                  <MentionSuggestions
                    suggestions={commentMention.suggestions}
                    onSelect={u => commentMention.pickMention(u, commentText, setCommentText)}
                  />
                  <input
                    ref={el => { commentInputRef.current = el; commentMention.inputRef.current = el; }}
                    value={commentText}
                    onChange={e => { setCommentText(e.target.value); commentMention.onType(e.target.value, e.target.selectionStart); }}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendComment())}
                    placeholder={replyingTo ? `Reply to ${replyingTo.user_name}...` : 'Write a comment... (@ to mention)'}
                    className="flex-1 px-2 py-2 text-sm bg-transparent outline-none"
                  />
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
    </>
  );
}

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
  const [stats, setStats] = useState({ resumes: 0, jobs: 0, friends: 0, unread: 0 });
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
  const [notifOpen, setNotifOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [streakOpen, setStreakOpen] = useState(false);
  const [tasksOpen, setTasksOpen] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [jobsOpen, setJobsOpen] = useState(false);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [taskChecked, setTaskChecked] = useState([true, false, false, false]);
  const [notifCount, setNotifCount] = useState(3);
  const [friendRequests, setFriendRequests] = useState([
    { n: 'Ahmad K.', mutual: 5, id: '1' },
    { n: 'Yasmine R.', mutual: 12, id: '2' }
  ]);
  const [weatherOpen, setWeatherOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scheduledAt, setScheduledAt] = useState(null);
  const postFileRef = useRef();
  const postVideoRef = useRef();
  const textareaRef = useRef();
  const searchRef = useRef();
  const searchTimerRef = useRef();
  const postMention = useMention();
  const addToast = useToast();

  const load = useCallback(async () => {
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
    api.get('/friends/suggestions').then(r => setSuggestions(r.data)).catch(() => {});
    api.get('/posts/trending').then(r => { if (r.data.length > 0) setTrendingTopics(r.data); }).catch(() => {});
    api.get('/auth/profile').then(r => { if (r.data.cover_image) setCoverImage(r.data.cover_image); }).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

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

  useEffect(() => {
    const closeAll = (e) => {
      const closers = ['notif','date','streak','tasks','msg','resume','jobs','friends','weather'];
      closers.forEach(c => {
        const btn = e.target.closest(`.${c}-far-btn`);
        const dd = e.target.closest(`.${c}-far-dropdown`);
        if (!btn && !dd) {
          const setter = { notif: setNotifOpen, date: setDateOpen, streak: setStreakOpen, tasks: setTasksOpen, msg: setMsgOpen, resume: setResumeOpen, jobs: setJobsOpen, friends: setFriendsOpen, weather: setWeatherOpen }[c];
          setter?.(false);
        }
      });
    };
    document.addEventListener('mousedown', closeAll);
    return () => document.removeEventListener('mousedown', closeAll);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const toggleTask = (i) => setTaskChecked(prev => prev.map((c, idx) => idx === i ? !c : c));

  const markAllRead = () => {
    setNotifCount(0);
    setNotifOpen(false);
  };

  const acceptFriendReq = async (name) => {
    setFriendRequests(prev => prev.filter(f => f.n !== name));
    addToast(`Friend request from ${name} accepted!`, 'success');
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
    if ((!postText.trim() && !postImage && !postVideo) || submitting) return;
    setSubmitting(true);
    try {
      const res = await api.post('/posts', {
        content: postText.trim() || null,
        image_url: postImage || null,
        video_url: postVideo || null,
        scheduled_at: scheduledAt || null,
        mention_ids: postMention.mentionIds,
      });
      if (!scheduledAt) setPosts(p => [res.data, ...p]);
      setPostText('');
      setPostImage('');
      setPostVideo('');
      setScheduledAt(null);
      postMention.reset();
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } finally { setSubmitting(false); }
  };

  const handlePostImage = (e) => {
    const file = e.target.files[0];
    if (!file || file.size > 10 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = ev => { setPostImage(ev.target.result); setPostVideo(''); };
    reader.readAsDataURL(file);
    e.target.value = '';
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
    setPostText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
    postMention.onType(e.target.value, e.target.selectionStart);
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

  const hasMedia = postImage || postVideo;

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

      {/* Far-right floating decorative panel */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-center">
        <div className="relative flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl bg-white/40 backdrop-blur-sm border border-gray-100/30 shadow-lg max-h-[calc(100vh-8rem)] overflow-y-auto">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/0 via-white/20 to-white/0 pointer-events-none" />

        {/* Live Clock */}
        <div className="relative group">
          <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-indigo-400/30 via-purple-400/30 to-teal-400/30 opacity-0 group-hover:opacity-100 blur-sm transition-all duration-500" />
          <div className="relative bg-white rounded-xl border border-gray-200 px-3 py-2 shadow-sm group-hover:shadow-md transition-all cursor-default min-w-[60px] text-center">
            <div className="text-[18px] font-bold tracking-wider text-gray-900 leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>
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
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white rounded-xl border border-gray-100 shadow-xl z-50 w-52 overflow-hidden date-far-dropdown" style={{animation:'fadeInUp 0.15s ease'}}>
              <div className="p-3 text-center">
                <p className="text-[11px] font-bold text-gray-900">{new Date().toLocaleDateString('en',{weekday:'long',month:'long',day:'numeric'})}</p>
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
            <span className="text-[8px] font-bold text-gray-400 mt-px">Day 12</span>
          </button>
          {streakOpen && (
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white rounded-xl border border-gray-100 shadow-xl z-50 w-48 overflow-hidden streak-far-dropdown" style={{animation:'fadeInUp 0.15s ease'}}>
              <div className="p-3">
                <p className="text-[11px] font-bold text-gray-900 mb-2">🔥 Streak History</p>
                <div className="flex items-center gap-1.5 mb-2">
                  {Array.from({length:7},(_,i)=><div key={i} className={`w-5 h-5 rounded-md text-[8px] font-bold flex items-center justify-center ${i<5?'bg-amber-100 text-amber-700':'bg-gray-50 text-gray-300'}`}>{i<5?'🔥':i+1}</div>)}
                </div>
                <p className="text-[9px] text-gray-500">Best streak: <span className="font-bold text-amber-600">21 days</span></p>
                <p className="text-[9px] text-gray-400 mt-0.5">Keep going! 🎯</p>
              </div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full border-y-4 border-l-4 border-y-transparent border-l-white" />
            </div>
          )}
        </div>

        {/* Weather */}
        <div className="relative weather-far-btn" style={{ animation: 'subtle-float 4s ease-in-out infinite', animationDelay: '0.8s' }}>
          <button onClick={() => setWeatherOpen(o => !o)}
            className="flex flex-col items-center bg-white/80 backdrop-blur-sm border border-gray-100/50 rounded-xl px-3 py-2 shadow-sm hover:shadow-md hover:border-sky-200 transition-all cursor-pointer">
            <span className="text-xl">🌤️</span>
            <span className="text-[8px] font-bold text-gray-400 mt-px">24°C</span>
          </button>
          {weatherOpen && (
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white rounded-xl border border-gray-100 shadow-xl z-50 w-52 overflow-hidden weather-far-dropdown" style={{animation:'fadeInUp 0.15s ease'}}>
              <div className="p-3 text-center" style={{background:'linear-gradient(135deg,#38BDF8,#818CF8)'}}>
                <p className="text-white font-bold text-sm">☀️ 24°C</p>
                <p className="text-white/80 text-[9px] mt-0.5">Sunny · Feels like 26°</p>
              </div>
              <div className="divide-y divide-gray-50">
                {[{d:'Mon',t:'🌤️',h:'26°',l:'18°'},{d:'Tue',t:'⛅',h:'23°',l:'16°'},{d:'Wed',t:'🌧️',h:'19°',l:'14°'}].map((w,i)=><div key={i} className="flex items-center gap-2 px-3 py-2">
                  <span className="text-[10px] font-semibold text-gray-600 w-7">{w.d}</span>
                  <span className="text-sm flex-1">{w.t}</span>
                  <span className="text-[10px] text-gray-500 font-medium">{w.h}/{w.l}</span>
                </div>)}
              </div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full border-y-4 border-l-4 border-y-transparent border-l-white" />
            </div>
          )}
        </div>

        <div className="w-[2px] h-4 rounded-full" style={{ background: 'linear-gradient(180deg,transparent,#BF5AF2)' }} />

        {/* Tasks */}
        <div className="relative tasks-far-btn" style={{ animation: 'subtle-float 4s ease-in-out infinite', animationDelay: '2s' }}>
          <button onClick={() => setTasksOpen(o => !o)}
            className="flex flex-col items-center bg-white/80 backdrop-blur-sm border border-gray-100/50 rounded-xl px-3 py-2 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer">
            <svg viewBox="0 0 36 36" className="w-7 h-7"><path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E5E7EB" strokeWidth="3"/><path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#2EC4B6" strokeWidth="3" strokeDasharray={`${(taskChecked.filter(Boolean).length / taskChecked.length) * 100},100`} strokeLinecap="round"/></svg>
            <span className="text-[8px] font-bold text-gray-400 mt-px">{taskChecked.filter(Boolean).length}/{taskChecked.length}</span>
          </button>
          {tasksOpen && (
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white rounded-xl border border-gray-100 shadow-xl z-50 w-56 overflow-hidden tasks-far-dropdown" style={{animation:'fadeInUp 0.15s ease'}}>
              <div className="px-3 py-2.5 border-b border-gray-50"><p className="text-[11px] font-bold text-gray-900">Today's Tasks</p></div>
              <div className="divide-y divide-gray-50">
                {[{t:'Review resume drafts',d:'80%'},{t:'Update cover letter',d:'30%'},{t:'Apply to 5 jobs',d:'0%'},{t:'Network with 3 people',d:'0%'}].map((t,i)=><label key={i} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors cursor-pointer">
                  <input type="checkbox" checked={taskChecked[i]} onChange={() => toggleTask(i)} className="w-3 h-3 rounded border-gray-300 text-indigo-600 accent-indigo-600" />
                  <div className="flex-1 min-w-0"><p className={`text-[10px] ${taskChecked[i]?'text-gray-400 line-through':'text-gray-700'}`}>{t.t}</p><div className="h-1 rounded-full bg-gray-100 mt-1 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-indigo-500" style={{width:taskChecked[i]?'100%':t.d}} /></div></div>
                </label>)}
              </div>
              <Link to="/dashboard" onClick={() => setTasksOpen(false)} className="block w-full px-3 py-2 text-[10px] text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors text-center">View all tasks →</Link>
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
              <div className="divide-y divide-gray-50">
                {[{text:'Sara liked your post',icon:'❤️',time:'2m'},{text:'Omar commented',icon:'💬',time:'15m'},{text:'Friend request from Lina',icon:'👋',time:'1h'}].map((n,i)=><div key={i} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 transition-colors cursor-pointer"><span className="text-sm">{n.icon}</span><div className="flex-1 min-w-0"><p className="text-[9px] text-gray-700 truncate">{n.text}</p><p className="text-[7px] text-gray-400">{n.time}</p></div></div>)}
              </div>
              <button onClick={markAllRead} className="w-full px-3 py-1.5 text-[9px] text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors text-center">{notifCount > 0 ? 'Mark all read' : 'All clear ✓'}</button>
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
              <div className="px-3 py-2 border-b border-gray-50 flex items-center justify-between"><p className="text-[11px] font-bold text-gray-900">Messages</p>              <span className="text-[8px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded-full font-semibold">{stats.unread} unread</span></div>
              <div className="divide-y divide-gray-50">
                {[{name:'Sara',msg:'Hey! Are you free?',time:'2m',dot:true},{name:'Omar',msg:'Thanks for the help 🙌',time:'1h',dot:true},{name:'Lina',msg:'Let me check that file',time:'3h',dot:false}].map((c,i)=><div key={i} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-[9px] flex-shrink-0">{c.name[0]}</div>
                  <div className="flex-1 min-w-0"><p className="text-[9px] font-semibold text-gray-800 truncate">{c.name} <span className="font-normal text-gray-400">{c.msg}</span></p><p className="text-[7px] text-gray-400">{c.time}</p></div>
                  {c.dot && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />}
                </div>)}
              </div>
              <Link to="/messages" onClick={() => setMsgOpen(false)} className="block w-full px-3 py-1.5 text-[9px] text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors text-center">View all messages →</Link>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full border-y-4 border-l-4 border-y-transparent border-l-white" />
            </div>
          )}
        </div>

        <div className="w-[2px] h-4 rounded-full" style={{ background: 'linear-gradient(180deg,transparent,#2EC4B6)' }} />

        {/* Resumes */}
        <div className="relative resume-far-btn">
          <button onClick={() => setResumeOpen(o=>!o)}
            className="flex flex-col items-center bg-white/80 backdrop-blur-sm border border-gray-100/50 rounded-xl px-3 py-2 shadow-sm hover:shadow-md hover:border-teal-200 transition-all cursor-pointer">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-teal-500"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="text-[8px] font-bold text-gray-400 mt-px">Resumes</span>
          </button>
          {resumeOpen && (
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white rounded-xl border border-gray-100 shadow-xl z-50 w-52 overflow-hidden resume-far-dropdown" style={{animation:'fadeInUp 0.15s ease'}}>
              <div className="px-3 py-2 border-b border-gray-50"><p className="text-[11px] font-bold text-gray-900">Your Resumes</p></div>
              <div className="divide-y divide-gray-50">
                {[{n:'Software Engineer',s:'92%',c:'2 days ago'},{n:'Full Stack Dev',s:'78%',c:'1 week ago'},{n:'Data Analyst',s:'45%',c:'Draft'}].map((r,i)=><div key={i} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="w-6 h-6 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 text-[9px] font-bold flex-shrink-0">{r.n[0]}</div>
                  <div className="flex-1 min-w-0"><p className="text-[9px] font-semibold text-gray-800 truncate">{r.n}</p><p className="text-[7px] text-gray-400">{r.c}</p></div>
                  <span className="text-[8px] font-bold text-teal-600">{r.s}</span>
                </div>)}
              </div>
              <Link to="/resumes" onClick={() => setResumeOpen(false)} className="block w-full px-3 py-1.5 text-[9px] text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors text-center">Manage resumes →</Link>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full border-y-4 border-l-4 border-y-transparent border-l-white" />
            </div>
          )}
        </div>

        <div className="w-[2px] h-4 rounded-full" style={{ background: 'linear-gradient(180deg,transparent,#BF5AF2)' }} />

        {/* Jobs */}
        <div className="relative jobs-far-btn">
          <button onClick={() => setJobsOpen(o=>!o)}
            className="flex flex-col items-center bg-white/80 backdrop-blur-sm border border-gray-100/50 rounded-xl px-3 py-2 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-blue-500"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="text-[8px] font-bold text-gray-400 mt-px">Jobs</span>
          </button>
          {jobsOpen && (
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white rounded-xl border border-gray-100 shadow-xl z-50 w-52 overflow-hidden jobs-far-dropdown" style={{animation:'fadeInUp 0.15s ease'}}>
              <div className="px-3 py-2 border-b border-gray-50 flex items-center justify-between"><p className="text-[11px] font-bold text-gray-900">Job Tracker</p><span className="text-[8px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded-full font-semibold">{stats.jobs} saved</span></div>
              <div className="divide-y divide-gray-50">
                {[{c:'Google',r:'Applied',color:'text-amber-600',bg:'bg-amber-50'},{c:'Meta',r:'Interview',color:'text-emerald-600',bg:'bg-emerald-50'},{c:'Amazon',r:'Saved',color:'text-gray-400',bg:'bg-gray-50'}].map((j,i)=><div key={i} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 text-[9px] font-bold flex-shrink-0">{j.c[0]}</div>
                  <div className="flex-1 min-w-0"><p className="text-[9px] font-semibold text-gray-800">{j.c}</p></div>
                  <span className={`text-[8px] font-bold ${j.color} ${j.bg} px-1.5 py-0.5 rounded-full`}>{j.r}</span>
                </div>)}
              </div>
              <Link to="/jobs" onClick={() => setJobsOpen(false)} className="block w-full px-3 py-1.5 text-[9px] text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors text-center">View all jobs →</Link>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full border-y-4 border-l-4 border-y-transparent border-l-white" />
            </div>
          )}
        </div>

        <div className="w-[2px] h-4 rounded-full" style={{ background: 'linear-gradient(180deg,transparent,#2EC4B6)' }} />

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
              <div className="divide-y divide-gray-50">
                {friendRequests.map((f,i)=><div key={i} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-[9px] flex-shrink-0">{f.n[0]}</div>
                  <div className="flex-1 min-w-0"><p className="text-[9px] font-semibold text-gray-800">{f.n}</p><p className="text-[7px] text-gray-400">{f.mutual} mutual friends</p></div>
                  <button onClick={() => acceptFriendReq(f.n)} className="text-[9px] bg-indigo-50 text-indigo-600 font-semibold px-2 py-0.5 rounded-lg hover:bg-indigo-100 transition-colors">Accept</button>
                </div>)}
              </div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full border-y-4 border-l-4 border-y-transparent border-l-white" />
            </div>
          )}
        </div>



        {/* Bottom accent */}
        <div className="w-[2px] h-8 rounded-full" style={{ background: 'linear-gradient(180deg,#6C5CE7,transparent)' }} />
        </div>
      </div>



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
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
              style={{ animation: 'slideDown 0.3s ease' }}>
              <div className="flex gap-3">
                <Link to="/profile" className="flex-shrink-0">
                  <Avatar user={myUser} size="md" />
                </Link>
                <div className="flex-1 relative">
                  <MentionSuggestions
                    suggestions={postMention.suggestions}
                    onSelect={u => postMention.pickMention(u, postText, setPostText)}
                  />
                  <textarea
                    ref={el => { textareaRef.current = el; postMention.inputRef.current = el; }}
                    value={postText}
                    onChange={handleTextChange}
                    onKeyDown={e => e.key === 'Enter' && e.ctrlKey && submitPost()}
                    placeholder={`What's on your mind, ${myUser.name?.split(' ')[0] || ''}? (@ to mention)`}
                    rows={2}
                    className="w-full text-sm text-gray-800 placeholder-gray-400 resize-none outline-none leading-relaxed bg-transparent"
                    style={{ minHeight: '52px', maxHeight: '200px' }}
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
                </div>
              </div>

              {enhanceError && (
                <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                  <span>⚠</span>{enhanceError}
                </p>
              )}

              {scheduledAt && (
                <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-xl">
                  <CalendarClock size={13} className="text-indigo-500 flex-shrink-0" />
                  <span className="text-xs text-indigo-700 font-medium flex-1">
                    Scheduled for {new Date(scheduledAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button onClick={() => setScheduledAt(null)} className="text-indigo-400 hover:text-indigo-600">
                    <X size={12} />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 gap-2">
                <div className="flex items-center gap-1">
                  <button onClick={() => postFileRef.current?.click()}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-sm text-gray-500 hover:bg-emerald-50 hover:text-emerald-600 transition-all active:scale-95">
                    <Image size={16} className="text-emerald-500" />
                    <span className="font-medium hidden sm:inline">Photo</span>
                  </button>
                  <button onClick={() => postVideoRef.current?.click()}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-sm text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-all active:scale-95">
                    <Video size={16} className="text-blue-500" />
                    <span className="font-medium hidden sm:inline">Video</span>
                  </button>
                </div>

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
                    disabled={(!postText.trim() && !hasMedia) || submitting}
                    className="px-4 py-1.5 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all active:scale-95 disabled:opacity-40 shadow-sm" style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
                    {submitting
                      ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : 'Post'}
                  </button>
                </div>
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
              posts.map((post, i) => (
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
              ))
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
