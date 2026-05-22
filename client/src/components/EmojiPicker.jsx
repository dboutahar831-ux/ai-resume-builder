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
  const [pos, setPos] = useState({ bottom: '3.5rem', left: 0 });

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const vw = window.innerWidth;
      if (rect.right > vw - 8) {
        setPos(p => ({ ...p, left: -(rect.right - vw + 8) }));
      }
    }
  }, []);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose?.(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const filtered = search ? EMOJIS.filter(e => e.includes(search)) : EMOJIS;

  return (
    <div
      ref={ref}
      style={{ bottom: pos.bottom, left: pos.left }}
      className="absolute z-50 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl shadow-2xl p-3 w-64 sm:w-72 animate-pop"
    >
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search emojis..."
        className="w-full px-3 py-1.5 mb-2 rounded-lg bg-gray-100 dark:bg-[#222] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none"
      />
      <div className="grid grid-cols-7 sm:grid-cols-8 gap-1 max-h-44 overflow-y-auto custom-scrollbar">
        {filtered.map(emoji => (
          <button
            key={emoji}
            onClick={() => { onSelect(emoji); onClose?.(); }}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-lg text-lg transition-all">
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
