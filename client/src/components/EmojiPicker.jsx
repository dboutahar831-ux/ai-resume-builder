import { useState, useRef, useEffect } from 'react';

const EMOJIS = [
  '😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','🥰','😘','😗',
  '😙','😚','🙂','🤗','🤩','🤔','🤨','😐','😑','😶','🙄','😏','😣','😥','😮','🤐',
  '😯','😪','😫','😴','😌','😛','😜','😝','🤤','😒','😓','😔','😕','🙃','🤑','😲',
  '☹️','🙁','😖','😞','😟','😤','😢','😭','😦','😧','😨','😩','🤯','😬','😰','😱',
  '🥵','🥶','😳','🤪','😵','😡','😠','🤬','👍','👎','👊','✊','🤛','🤜','👏','🙌',
  '👐','🤲','🤝','🙏','✌️','🤟','🤘','👌','❤️','🧡','💛','💚','💙','💜','🖤','🤍',
  '💔','❣️','💕','💞','💓','💗','💖','💘','💝','🎉','🎊','🎈','🔥','⭐','✨','💯',
];

export default function EmojiPicker({ onSelect, onClose }) {
  const ref = useRef();
  const [search, setSearch] = useState('');

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose?.(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const filtered = search ? EMOJIS.filter(e => e.includes(search)) : EMOJIS;

  return (
    <div ref={ref} className="absolute bottom-14 left-0 z-50 bg-white border border-gray-200 rounded-2xl shadow-2xl p-3 w-72 animate-pop">
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search emojis..."
        className="w-full px-3 py-1.5 mb-2 rounded-lg bg-gray-100 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none"
      />
      <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto custom-scrollbar">
        {filtered.map(emoji => (
          <button
            key={emoji}
            onClick={() => { onSelect(emoji); onClose?.(); }}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-lg text-lg transition-all">
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
