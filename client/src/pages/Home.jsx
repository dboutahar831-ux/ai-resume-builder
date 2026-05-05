import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Image, X, Send, MessageSquare, Users, ThumbsUp,
  MoreHorizontal, Trash2, Briefcase, FileText, Bell,
  Repeat2, Video, CornerDownRight, Sparkles,
} from 'lucide-react';
import Layout from '../components/Layout';
import api from '../api/axios';

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
        ? <img src={user.avatar} alt={user.name} className={`${sz} rounded-full object-cover ring-2 ring-white`} />
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
          {comment.content && <p className="text-sm text-gray-800 mt-0.5 leading-relaxed">{comment.content}</p>}
          {comment.image_url && (
            <img src={comment.image_url} alt="comment" className="mt-2 rounded-xl max-h-48 object-cover" />
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
        <img src={post.original_image_url} alt="original" className="w-full max-h-60 object-cover" />
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
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
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
      });
      setComments(c => [...c, { ...res.data, parent_user_name: replyingTo?.user_name || null }]);
      setCommentText('');
      setCommentImage('');
      setReplyingTo(null);
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
              <p className="px-4 pb-3 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>
            )}
            {post.image_url && (
              <div className="cursor-pointer" onClick={() => setImgExpanded(v => !v)}>
                <img src={post.image_url} alt="post"
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
                    <img src={commentImage} alt="preview" className="h-24 rounded-xl object-cover" />
                    <button onClick={() => setCommentImage('')}
                      className="absolute top-3 right-3 w-5 h-5 bg-gray-700/80 text-white rounded-full flex items-center justify-center hover:bg-gray-800">
                      <X size={10} />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-1 px-1">
                  <input
                    ref={commentInputRef}
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendComment())}
                    placeholder={replyingTo ? `Reply to ${replyingTo.user_name}...` : 'Write a comment...'}
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

export default function Home() {
  const myUser = JSON.parse(localStorage.getItem('user') || '{}');
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
  const postFileRef = useRef();
  const postVideoRef = useRef();
  const textareaRef = useRef();

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
  }, []);

  useEffect(() => { load(); }, [load]);

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
      });
      setPosts(p => [res.data, ...p]);
      setPostText('');
      setPostImage('');
      setPostVideo('');
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
    if (!file || file.size > 15 * 1024 * 1024) return alert('Video must be under 15MB.');
    const reader = new FileReader();
    reader.onload = ev => { setPostVideo(ev.target.result); setPostImage(''); };
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

  const handleRepost = async (postId, repost_text) => {
    const res = await api.post(`/posts/${postId}/repost`, { repost_text });
    setPosts(p => [res.data, ...p]);
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
      `}</style>

      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Feed */}
          <div className="lg:col-span-2 space-y-4">

            {/* Composer */}
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

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1">
                  <button onClick={() => postFileRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-gray-500 hover:bg-emerald-50 hover:text-emerald-600 transition-all active:scale-95">
                    <Image size={15} className="text-emerald-500" />
                    <span className="font-medium">Photo</span>
                  </button>
                  <button onClick={() => postVideoRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-all active:scale-95">
                    <Video size={15} className="text-blue-500" />
                    <span className="font-medium">Video</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* AI Enhance button */}
                  <button
                    onClick={aiEnhance}
                    disabled={!postText.trim() || enhancing || submitting}
                    title="Enhance with AI"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed
                      bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600
                      text-white shadow-sm shadow-violet-200 hover:shadow-md hover:shadow-violet-200">
                    {enhancing
                      ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Enhancing...</>
                      : <><Sparkles size={14} />AI Enhance</>}
                  </button>

                  {/* Post button */}
                  <button onClick={submitPost}
                    disabled={(!postText.trim() && !hasMedia) || submitting}
                    className="px-5 py-1.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-indigo-200">
                    {submitting
                      ? <span className="flex items-center gap-1.5">
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Posting...
                        </span>
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
                    onRepost={handleRepost}
                  />
                </div>
              ))
            )}
          </div>

          {/* Sidebar */}
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
                    { label: 'Resumes', value: stats.resumes, to: '/resumes',  icon: FileText,      color: 'text-indigo-500' },
                    { label: 'Jobs',    value: stats.jobs,    to: '/jobs',     icon: Briefcase,     color: 'text-blue-500'   },
                    { label: 'Friends', value: stats.friends, to: '/friends',  icon: Users,         color: 'text-emerald-500'},
                    { label: 'Unread',  value: stats.unread,  to: '/messages', icon: Bell,          color: 'text-yellow-500' },
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

            {/* Friends online */}
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
                      <Avatar user={f} size="sm" showDot lastSeen={f.last_seen_at} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-indigo-700">{f.name}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {isOnline(f.last_seen_at) ? '🟢 Active now' : f.location || 'ResumeAI'}
                        </p>
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
