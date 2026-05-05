import { useEffect, useRef, useState } from 'react';
import { X, Trash2, Music, ChevronLeft, ChevronRight, Volume2, VolumeX, Pause, Play } from 'lucide-react';
import api from '../api/axios';

function timeAgo(d) {
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

const DURATION = 5000;

export default function StoryViewer({ userStories, initialUserIndex = 0, myId, onClose, onDelete }) {
  const [uIdx, setUIdx] = useState(initialUserIndex);
  const [sIdx, setSIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const timerRef = useRef();
  const audioRef = useRef();
  const videoRef = useRef();

  const cur = userStories[uIdx];
  const story = cur?.stories?.[sIdx];

  const goNext = () => {
    if (sIdx < (cur?.stories?.length ?? 0) - 1) { setSIdx(s => s + 1); }
    else if (uIdx < userStories.length - 1) { setUIdx(u => u + 1); setSIdx(0); }
    else onClose();
  };

  const goPrev = () => {
    if (sIdx > 0) { setSIdx(s => s - 1); }
    else if (uIdx > 0) { setUIdx(u => u - 1); setSIdx(0); }
  };

  useEffect(() => {
    setProgress(0);
    clearInterval(timerRef.current);
    if (paused) return;
    timerRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { goNext(); return 0; }
        return p + (100 / (DURATION / 50));
      });
    }, 50);
    return () => clearInterval(timerRef.current);
  }, [uIdx, sIdx, paused]);

  useEffect(() => {
    if (story && cur.user_id !== myId) {
      api.post(`/stories/${story.id}/view`).catch(() => {});
    }
  }, [story?.id]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'ArrowRight') goNext(); if (e.key === 'ArrowLeft') goPrev(); if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [uIdx, sIdx]);

  if (!cur || !story) return null;

  const handleDelete = async () => {
    await api.delete(`/stories/${story.id}`);
    onDelete?.(story.id);
    goNext();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      {/* Prev/Next user buttons */}
      {uIdx > 0 && (
        <button onClick={() => { setUIdx(u => u - 1); setSIdx(0); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
          <ChevronLeft size={22} className="text-white" />
        </button>
      )}
      {uIdx < userStories.length - 1 && (
        <button onClick={() => { setUIdx(u => u + 1); setSIdx(0); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
          <ChevronRight size={22} className="text-white" />
        </button>
      )}

      {/* Story card */}
      <div className="relative w-full max-w-sm h-full sm:h-[90vh] sm:rounded-2xl overflow-hidden bg-black select-none">

        {/* Progress bars */}
        <div className="absolute top-3 left-3 right-3 z-30 flex gap-1">
          {cur.stories.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full"
                style={{
                  width: i < sIdx ? '100%' : i === sIdx ? `${progress}%` : '0%',
                  transition: i === sIdx ? 'none' : undefined,
                }} />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-7 left-3 right-3 z-30 flex items-center gap-2.5">
          {cur.avatar
            ? <img src={cur.avatar} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-white/80 flex-shrink-0" />
            : <div className="w-9 h-9 rounded-full bg-indigo-500 border-2 border-white/80 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">{cur.name?.[0]}</span>
              </div>
          }
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold leading-none">{cur.name}</p>
            <p className="text-white/60 text-xs mt-0.5">{timeAgo(story.created_at)}</p>
          </div>
          {cur.user_id === myId && (
            <button onClick={handleDelete}
              className="p-1.5 text-white/70 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors">
              <Trash2 size={15} />
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); setPaused(p => !p); }}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            {paused ? <Play size={15} /> : <Pause size={15} />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); setMuted(m => !m); }}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
          <button onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <X size={17} />
          </button>
        </div>

        {/* Media */}
        <div className="w-full h-full flex items-center justify-center bg-black">
          {story.media_type === 'video'
            ? <video ref={videoRef} src={story.media_url} autoPlay muted={muted} loop
                className="w-full h-full object-contain" />
            : <img src={story.media_url} alt="" className="w-full h-full object-contain" />
          }
        </div>

        {/* Pause overlay */}
        {paused && (
          <div className="absolute inset-0 z-25 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Pause size={28} className="text-white" />
            </div>
          </div>
        )}

        {/* Caption */}
        {story.caption && (
          <div className="absolute bottom-16 left-4 right-4 z-30">
            <p className="text-white text-sm text-center leading-relaxed drop-shadow-lg bg-black/20 rounded-xl px-3 py-2 backdrop-blur-sm">
              {story.caption}
            </p>
          </div>
        )}

        {/* Music bar */}
        {story.music_name && (
          <div className="absolute bottom-4 left-4 right-4 z-30 flex items-center gap-2.5 bg-black/50 backdrop-blur-md rounded-xl px-3 py-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
              <Music size={13} className="text-white" />
            </div>
            <p className="text-white text-xs font-medium truncate flex-1">{story.music_name}</p>
            {story.music_url && (
              <audio ref={audioRef} src={story.music_url} autoPlay muted={muted} loop className="hidden" />
            )}
          </div>
        )}

        {/* Tap zones — tap to navigate, hold to pause */}
        <div className="absolute inset-0 z-20 flex pointer-events-none">
          <div className="flex-1 pointer-events-auto"
            onClick={goPrev}
            onMouseDown={() => setPaused(true)} onMouseUp={() => setPaused(false)}
            onTouchStart={() => setPaused(true)} onTouchEnd={() => setPaused(false)} />
          <div className="flex-1 pointer-events-auto"
            onClick={goNext}
            onMouseDown={() => setPaused(true)} onMouseUp={() => setPaused(false)}
            onTouchStart={() => setPaused(true)} onTouchEnd={() => setPaused(false)} />
        </div>
      </div>
    </div>
  );
}
