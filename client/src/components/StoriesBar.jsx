import { useEffect, useRef, useState } from 'react';
import { Plus, X, Music, Type } from 'lucide-react';
import { useToast } from './Toast';
import api from '../api/axios';
import StoryViewer from './StoryViewer';
import MentionSuggestions from './MentionSuggestions';
import { useMention } from '../hooks/useMention';

function AddStoryModal({ onClose, onAdded }) {
  const addToast = useToast();
  const [media, setMedia] = useState(null);
  const [mediaType, setMediaType] = useState('image');
  const [caption, setCaption] = useState('');
  const [musicFile, setMusicFile] = useState(null);
  const captionMention = useMention();
  const [musicName, setMusicName] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const audioRef = useRef();

  const pickFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    if (file.size > (isVideo ? 15 : 5) * 1024 * 1024)
      return addToast(`Max ${isVideo ? '15' : '5'}MB`, 'warning');
    const reader = new FileReader();
    reader.onload = ev => { setMedia(ev.target.result); setMediaType(isVideo ? 'video' : 'image'); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const pickMusic = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) return addToast('Max 3MB for music', 'warning');
    const reader = new FileReader();
    reader.onload = ev => { setMusicFile(ev.target.result); setMusicName(file.name.replace(/\.[^/.]+$/, '')); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const submit = async () => {
    if (!media || uploading) return;
    setUploading(true);
    try {
      const res = await api.post('/stories', {
        media_url: media,
        media_type: mediaType,
        caption: caption.trim() || null,
        music_url: musicFile || null,
        music_name: musicName || null,
      });
      onAdded(res.data);
      onClose();
    } catch { addToast('Failed to post story', 'error'); }
    finally { setUploading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <p className="font-bold text-gray-900 dark:text-gray-100">Add Story</p>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"><X size={16} /></button>
        </div>

        <div className="p-4 space-y-3">
          {!media ? (
            <button onClick={() => fileRef.current?.click()}
              className="w-full h-40 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors">
              <Plus size={24} />
              <span className="text-sm font-medium">Pick Photo or Video</span>
            </button>
          ) : (
            <div className="relative rounded-xl overflow-hidden">
              {mediaType === 'video'
                ? <video src={media} className="w-full max-h-48 object-contain bg-black rounded-xl" controls />
                : <img src={media} loading="lazy" alt="" className="w-full max-h-48 object-cover rounded-xl" />
              }
              <button onClick={() => { setMedia(null); setMusicFile(null); }}
                className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white">
                <X size={11} />
              </button>
            </div>
          )}

          {media && (
            <>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl relative">
                <MentionSuggestions
                  suggestions={captionMention.suggestions}
                  onSelect={u => captionMention.pickMention(u, caption, setCaption)}
                />
                <Type size={14} className="text-gray-400 flex-shrink-0" />
                <input
                  ref={captionMention.inputRef}
                  value={caption}
                  onChange={e => { setCaption(e.target.value); captionMention.onType(e.target.value, e.target.selectionStart); }}
                  placeholder="Add a caption... (@ to mention)"
                  maxLength={150}
                  className="flex-1 text-sm bg-transparent outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400"
                />
              </div>

              <button onClick={() => audioRef.current?.click()}
                className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm transition-colors ${musicFile ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-gray-50 dark:bg-gray-800 text-gray-500 hover:text-purple-600'}`}>
                <Music size={14} />
                <span className="flex-1 truncate text-left">{musicFile ? musicName : 'Add Music (mp3, max 3MB)'}</span>
                {musicFile && <button onClick={(e) => { e.stopPropagation(); setMusicFile(null); setMusicName(''); }} className="text-purple-400"><X size={12} /></button>}
              </button>
            </>
          )}
        </div>

        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400">
            Cancel
          </button>
          <button onClick={submit} disabled={!media || uploading}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
            {uploading
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Posting...</>
              : 'Share Story'}
          </button>
        </div>

        <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={pickFile} />
        <input ref={audioRef} type="file" accept="audio/*" className="hidden" onChange={pickMusic} />
      </div>
    </div>
  );
}

function StoryRing({ allSeen, hasStory, size = 'md' }) {
  const s = { sm: 'p-0.5', md: 'p-[2.5px]', lg: 'p-[3px]' }[size];
  if (!hasStory) return null;
  return (
    <div className={`rounded-full ${s} ${allSeen
      ? 'bg-gray-300 dark:bg-gray-600'
      : 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600'}`} />
  );
}

export { StoryRing };

export default function StoriesBar({ myUser }) {
  const [feed, setFeed] = useState([]);
  const [addModal, setAddModal] = useState(false);
  const [viewerIdx, setViewerIdx] = useState(null);

  const load = async () => {
    try {
      const res = await api.get('/stories/feed');
      setFeed(res.data);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const myStories = feed.find(u => u.user_id === myUser?.id);
  const hasMyStory = !!myStories;
  const myAllSeen = myStories?.all_seen ?? false;

  const handleAdded = (story) => {
    setFeed(prev => {
      const existing = prev.find(u => u.user_id === myUser.id);
      if (existing) {
        return prev.map(u => u.user_id === myUser.id
          ? { ...u, stories: [...u.stories, { ...story, viewed: true }], story_count: u.story_count + 1, all_seen: false }
          : u
        );
      }
      return [{ user_id: myUser.id, name: myUser.name, avatar: myUser.avatar, stories: [{ ...story, viewed: true }], story_count: 1, all_seen: false }, ...prev];
    });
  };

  const handleDelete = (storyId) => {
    setFeed(prev => prev.map(u => ({
      ...u,
      stories: u.stories.filter(s => s.id !== storyId),
      story_count: u.story_count - 1,
    })).filter(u => u.story_count > 0));
  };

  if (feed.length === 0 && !myUser) return null;

  return (
    <>
      {addModal && <AddStoryModal onClose={() => setAddModal(false)} onAdded={handleAdded} />}
      {viewerIdx !== null && (
        <StoryViewer
          userStories={feed}
          initialUserIndex={viewerIdx}
          myId={myUser?.id}
          onClose={() => setViewerIdx(null)}
          onDelete={handleDelete}
        />
      )}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-3 mb-4"
        style={{ animation: 'slideDown 0.3s ease' }}>
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">

          {/* My Story Card */}
          <div className="flex-shrink-0 cursor-pointer"
            onClick={() => hasMyStory ? setViewerIdx(feed.indexOf(myStories)) : setAddModal(true)}>
            <div className={`${hasMyStory ? (myAllSeen ? 'p-[2.5px] bg-gray-300 dark:bg-gray-600' : 'p-[2.5px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600') : ''} rounded-xl`}>
              <div className={`w-[76px] h-[124px] ${hasMyStory ? 'rounded-[10px]' : 'rounded-xl'} overflow-hidden relative bg-gray-100 dark:bg-gray-800`}>
                {myUser?.avatar && (
                  <img src={myUser.avatar} loading="lazy" alt="" className="absolute inset-0 w-full h-full object-cover" />
                )}
                {!myUser?.avatar && (
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-300 to-indigo-600" />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/65" />

                {hasMyStory ? (
                  <div className="absolute top-2 left-2 w-8 h-8 rounded-full overflow-hidden border-2 border-white dark:border-gray-900">
                    {myUser?.avatar
                      ? <img src={myUser.avatar} loading="lazy" alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center">
                          <span className="text-white font-bold text-xs">{myUser?.name?.[0]}</span>
                        </div>
                    }
                  </div>
                ) : (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2">
                    <div className="relative">
                      <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white">
                        {myUser?.avatar
                          ? <img src={myUser.avatar} loading="lazy" alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center">
                              <span className="text-white font-bold">{myUser?.name?.[0]}</span>
                            </div>
                        }
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-indigo-600 border-2 border-white dark:border-gray-800 rounded-full flex items-center justify-center">
                        <Plus size={10} className="text-white" />
                      </div>
                    </div>
                  </div>
                )}

                <p className="absolute bottom-2 left-0 right-0 text-center text-[10px] font-bold text-white truncate px-1 drop-shadow-sm">
                  {hasMyStory ? 'My Story' : 'Add Story'}
                </p>
              </div>
            </div>
          </div>

          {/* Friends' Story Cards */}
          {feed.filter(u => u.user_id !== myUser?.id).map((u) => (
            <div key={u.user_id}
              className="flex-shrink-0 cursor-pointer"
              onClick={() => setViewerIdx(feed.indexOf(u))}>
              <div className={`p-[2.5px] rounded-xl ${u.all_seen ? 'bg-gray-300 dark:bg-gray-600' : 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600'}`}>
                <div className="w-[76px] h-[124px] rounded-[10px] overflow-hidden relative">
                  {u.avatar
                    ? <img src={u.avatar} loading="lazy" alt={u.name} className="absolute inset-0 w-full h-full object-cover" />
                    : <div className="absolute inset-0 bg-gradient-to-br from-indigo-300 to-indigo-600" />
                  }
                  <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/65" />
                  <div className="absolute top-2 left-2 w-8 h-8 rounded-full overflow-hidden border-2 border-white dark:border-gray-900">
                    {u.avatar
                      ? <img src={u.avatar} loading="lazy" alt={u.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center">
                          <span className="text-white font-bold text-xs">{u.name?.[0]}</span>
                        </div>
                    }
                  </div>
                  <p className="absolute bottom-2 left-0 right-0 text-center text-[10px] font-bold text-white truncate px-1 drop-shadow-sm">
                    {u.name?.split(' ')[0]}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
