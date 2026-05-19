import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Image, X, Send, MessageSquare, ThumbsUp,
  MoreHorizontal, Trash2, Repeat2, CornerDownRight, Pencil, Check, Bookmark,
} from 'lucide-react';
import MentionSuggestions from './MentionSuggestions';
import { useMention } from '../hooks/useMention';
import { useToast } from './Toast';
import api from '../api/axios';
import { compressImage } from '../utils/imageUtils';

export const REACTIONS = [
  { type: 'like',  emoji: '👍', label: 'Like',  color: 'text-indigo-600', bg: 'bg-indigo-50',  ring: 'ring-indigo-200' },
  { type: 'heart', emoji: '❤️', label: 'Love',  color: 'text-rose-500',   bg: 'bg-rose-50',    ring: 'ring-rose-200'   },
  { type: 'laugh', emoji: '😂', label: 'Haha',  color: 'text-amber-500',  bg: 'bg-amber-50',   ring: 'ring-amber-200'  },
  { type: 'sad',   emoji: '😢', label: 'Sad',   color: 'text-sky-500',    bg: 'bg-sky-50',     ring: 'ring-sky-200'    },
  { type: 'angry', emoji: '😡', label: 'Angry', color: 'text-orange-500', bg: 'bg-orange-50',  ring: 'ring-orange-200' },
];

export function timeAgo(dateStr) {
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

export function isOnline(lastSeen) {
  return lastSeen && Date.now() - new Date(lastSeen).getTime() < 120000;
}

export function renderWithMentions(text) {
  if (!text) return null;
  // Split on @[name](id), @word, or #word
  const parts = text.split(/(@\[[^\]]+\]\(\d+\)|@\S+|#\w+)/g);
  return parts.map((part, i) => {
    // New format: @[name](id)
    const richMatch = part.match(/^@\[([^\]]+)\]\((\d+)\)$/);
    if (richMatch) {
      const [, name, id] = richMatch;
      return <Link key={i} to={`/friends/${id}`} className="font-semibold hover:underline" style={{ color: '#6C5CE7' }}>@{name}</Link>;
    }
    // Legacy format: @name — link to search
    if (part.startsWith('@'))
      return <Link key={i} to={`/search?q=${encodeURIComponent(part.slice(1))}`} className="font-semibold hover:underline" style={{ color: '#6C5CE7' }}>{part}</Link>;
    if (part.startsWith('#'))
      return <Link key={i} to={`/hashtag/${part.slice(1)}`} className="font-semibold hover:underline" style={{ color: '#2EC4B6' }}>{part}</Link>;
    return part;
  });
}

export function Avatar({ user, size = 'sm', showDot = false, lastSeen = null }) {
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

function ReactionPicker({ myReaction, onReact }) {
  const [open, setOpen] = useState(false);
  const timer = useRef();
  const myR = REACTIONS.find(r => r.type === myReaction);

  return (
    <div className="relative"
      onMouseEnter={() => { clearTimeout(timer.current); setOpen(true); }}
      onMouseLeave={() => { timer.current = setTimeout(() => setOpen(false), 200); }}>

      {open && (
        <div className="absolute bottom-10 left-0 flex items-end gap-1 bg-white border border-gray-100 rounded-2xl shadow-2xl z-30 px-3 py-2"
          style={{ animation: 'popUp 0.15s cubic-bezier(0.34,1.56,0.64,1)' }}>
          {REACTIONS.map(r => (
            <button key={r.type}
              onClick={() => { onReact(myReaction === r.type ? null : r.type); setOpen(false); }}
              title={r.label}
              className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-xl transition-all duration-150 select-none
                hover:scale-125 active:scale-110
                ${myReaction === r.type ? `scale-115 ${r.bg} ring-1 ${r.ring}` : 'hover:bg-gray-50'}`}>
              <span className="text-2xl leading-none">{r.emoji}</span>
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
      <div className="flex items-center gap-0.5">
        {sorted.map(s => {
          const r = REACTIONS.find(x => x.type === s.type);
          return r ? <span key={s.type} className="text-sm leading-none">{r.emoji}</span> : null;
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
        {myR ? `${myR.emoji} ${myR.label}` : 'React'}
      </button>
    </div>
  );
}

function CommentItem({ comment, postId, myId, onDelete, onReact, onReply }) {
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
            className="flex-1 px-4 py-2 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
            {loading
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><Repeat2 size={14} />Share</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PostCard({ post, myId, onDelete, onReact, onCommentCountChange, onRepost }) {
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
  const [editingPost, setEditingPost] = useState(false);
  const [editPostContent, setEditPostContent] = useState(post.content || '');
  const [editPostSaving, setEditPostSaving] = useState(false);
  const [localContent, setLocalContent] = useState(post.content || '');
  const [localEdited, setLocalEdited] = useState(!!post.edited);
  const [isBookmarked, setIsBookmarked] = useState(!!post.is_bookmarked);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
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

  const handleBookmark = async () => {
    if (bookmarkLoading) return;
    setBookmarkLoading(true);
    const prev = isBookmarked;
    setIsBookmarked(!prev);
    try {
      if (prev) await api.delete(`/posts/${post.id}/bookmark`);
      else await api.post(`/posts/${post.id}/bookmark`);
    } catch { setIsBookmarked(prev); addToast('Failed to update bookmark.', 'error'); }
    finally { setBookmarkLoading(false); }
  };

  const handleEditPost = async () => {
    if (!editPostContent.trim() || editPostSaving) return;
    setEditPostSaving(true);
    try {
      await api.patch(`/posts/${post.id}`, { content: editPostContent.trim() });
      setLocalContent(editPostContent.trim());
      setLocalEdited(true);
      setEditingPost(false);
    } catch { addToast('Failed to edit post.', 'error'); }
    finally { setEditPostSaving(false); }
  };

  const handleCommentImage = async (e) => {
    const file = e.target.files[0];
    if (!file || file.size > 3 * 1024 * 1024) return;
    e.target.value = '';
    try {
      const compressed = await compressImage(file, 800, 0.80);
      setCommentImage(compressed);
    } catch { addToast('Failed to process image.', 'error'); }
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
    try {
      await api.post(`/posts/${post.id}/comments/${commentId}/react`, { type: typeToSend });
      setComments(c => c.map(x => x.id === commentId ? { ...x, my_reaction: type } : x));
    } catch { addToast('Failed to react.', 'error'); }
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

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-visible transition-shadow duration-200 hover:shadow-md"
        style={{ animation: 'fadeInUp 0.3s ease' }}>

        {isRepost && <RepostBadge post={post} />}

        {!isRepost && (
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex items-center gap-3">
              <Link to={post.user_id === myId ? '/profile' : `/friends/${post.user_id}`}>
                <Avatar user={{ name: post.user_name, avatar: post.user_avatar }} size="md" showDot lastSeen={post.user_last_seen_at} />
              </Link>
              <div>
                <Link to={post.user_id === myId ? '/profile' : `/friends/${post.user_id}`}
                  className="text-sm font-bold text-gray-900 dark:text-gray-100 hover:text-indigo-600 transition-colors">
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
                  <div className="absolute right-0 top-9 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl z-10 overflow-hidden min-w-28"
                    style={{ animation: 'fadeInUp 0.15s ease' }}>
                    <button onClick={() => { setEditingPost(true); setEditPostContent(post.content || ''); setShowMenu(false); }}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 w-full transition-colors">
                      <Pencil size={13} />Edit
                    </button>
                    <button onClick={() => { onDelete(post.id); setShowMenu(false); }}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 w-full transition-colors">
                      <Trash2 size={13} />Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {isRepost && (
          <div className="flex items-center justify-between px-4 pb-2">
            <div className="flex items-center gap-2">
              <Avatar user={{ name: post.user_name, avatar: post.user_avatar }} size="sm" showDot lastSeen={post.user_last_seen_at} />
              <div>
                <Link to={post.user_id === myId ? '/profile' : `/friends/${post.user_id}`}
                  className="text-xs font-bold text-gray-900 dark:text-gray-100 hover:text-indigo-600">{post.user_name}</Link>
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
                  <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl z-10 overflow-hidden min-w-28">
                    <button onClick={() => { onDelete(post.id); setShowMenu(false); }}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 w-full">
                      <Trash2 size={13} />Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {isRepost && <OriginalPostBox post={post} />}

        {!isRepost && (
          <>
            {editingPost ? (
              <div className="px-4 pb-3">
                <textarea
                  value={editPostContent}
                  onChange={e => setEditPostContent(e.target.value)}
                  rows={3}
                  className="w-full text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none"
                />
                <div className="flex gap-2 mt-2 justify-end">
                  <button onClick={() => setEditingPost(false)}
                    className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleEditPost} disabled={editPostSaving || !editPostContent.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors">
                    <Check size={12} />{editPostSaving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {localContent && (
                  <p className="px-4 pb-3 text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {renderWithMentions(localContent)}
                    {localEdited && <span className="text-[10px] text-gray-400 ml-1">(edited)</span>}
                  </p>
                )}
              </>
            )}
            {post.image_url && (
              <div className="cursor-pointer" onClick={() => setImgExpanded(v => !v)}>
                <img src={post.image_url} loading="lazy" alt="post"
                  className={`w-full object-cover transition-all duration-300 ${imgExpanded ? 'max-h-[700px]' : 'max-h-96'}`} />
              </div>
            )}
            {post.video_url && (
              <video src={post.video_url} controls className="w-full max-h-96 bg-black" style={{ display: 'block' }} />
            )}
            {/* Link Preview */}
            {post.link_metadata?.title && !post.image_url && !post.video_url && (
              <a href={post.link_metadata.url} target="_blank" rel="noopener noreferrer"
                className="mx-4 mb-3 flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors overflow-hidden">
                {post.link_metadata.image && (
                  <img src={post.link_metadata.image} loading="lazy" alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{post.link_metadata.url}</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-1 mt-0.5">{post.link_metadata.title}</p>
                  {post.link_metadata.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">{post.link_metadata.description}</p>
                  )}
                </div>
              </a>
            )}
          </>
        )}

        {(Number(post.reactions_count) > 0 || Number(post.comments_count) > 0) && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-gray-50 dark:border-gray-800">
            <ReactionSummary summary={post.reactions_summary} count={Number(post.reactions_count)} />
            {Number(post.comments_count) > 0 && (
              <button onClick={toggleComments}
                className="text-xs text-gray-400 hover:text-indigo-600 transition-colors font-medium">
                {post.comments_count} comment{Number(post.comments_count) !== 1 ? 's' : ''}
              </button>
            )}
          </div>
        )}

        <div className="flex items-center border-t border-gray-100 dark:border-gray-800 px-2 py-0.5">
          <ReactionPicker myReaction={post.my_reaction} onReact={(type) => onReact(post.id, type)} />
          <button onClick={toggleComments}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-all active:scale-95">
            <MessageSquare size={14} />Comment
          </button>
          <button onClick={() => setRepostModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-95 ml-auto">
            <Repeat2 size={14} />Share
          </button>
          <button onClick={handleBookmark} disabled={bookmarkLoading}
            className={`flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${isBookmarked ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
            <Bookmark size={14} fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>

        {showComments && (
          <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-3 space-y-3">
            {loadingComments ? (
              <div className="flex justify-center py-3">
                <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (() => {
              const topLevel = comments.filter(c => !c.parent_id);
              const repliesByParent = comments.reduce((acc, c) => {
                if (c.parent_id) { if (!acc[c.parent_id]) acc[c.parent_id] = []; acc[c.parent_id].push(c); }
                return acc;
              }, {});
              return topLevel.map(c => (
                <div key={c.id}>
                  <CommentItem comment={c} postId={post.id} myId={myId} onDelete={handleDeleteComment} onReact={handleCommentReact} onReply={handleReply} />
                  {repliesByParent[c.id]?.map(reply => (
                    <CommentItem key={reply.id} comment={reply} postId={post.id} myId={myId} onDelete={handleDeleteComment} onReact={handleCommentReact} onReply={handleReply} />
                  ))}
                </div>
              ));
            })()}

            <div className="flex gap-2 items-end pt-1">
              <Avatar user={JSON.parse(localStorage.getItem('user') || '{}')} size="sm" />
              <div className="flex-1 relative">
                <MentionSuggestions
                  suggestions={commentMention.suggestions}
                  show={commentMention.showSuggestions}
                  onSelect={u => commentMention.pickMention(u, commentText, setCommentText)}
                />
                <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
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
                  <div className="flex items-center gap-1 px-1">
                    <input
                      ref={el => { commentInputRef.current = el; commentMention.inputRef.current = el; }}
                      value={commentText}
                      onChange={e => { setCommentText(e.target.value); commentMention.onType(e.target.value, e.target.selectionStart); }}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendComment())}
                      placeholder={replyingTo ? `Reply to ${replyingTo.user_name}...` : 'Write a comment... (@ to mention)'}
                      className="flex-1 px-2 py-2 text-sm bg-transparent outline-none dark:text-gray-200 dark:placeholder-gray-500"
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
            </div>
            <input ref={commentFileRef} type="file" accept="image/*" className="hidden" onChange={handleCommentImage} />
          </div>
        )}
      </div>
    </>
  );
}
