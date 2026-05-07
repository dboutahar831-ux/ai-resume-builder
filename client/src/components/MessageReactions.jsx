import { useState } from 'react';
import { Plus } from 'lucide-react';
import api from '../api/axios';
import EmojiPicker from './EmojiPicker';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export default function MessageReactions({ message, myId, onReacted }) {
  const [showPicker, setShowPicker] = useState(false);

  const react = async (emoji) => {
    try {
      const res = await api.post(`/messages/${message.id}/react`, { emoji });
      onReacted?.(message.id, emoji, res.data.action === 'removed');
    } catch {}
    setShowPicker(false);
  };

  const reactions = message.reactions || [];
  const grouped = {};
  reactions.forEach(r => {
    if (!grouped[r.emoji]) grouped[r.emoji] = [];
    grouped[r.emoji].push(r.user_id);
  });

  return (
    <div className="flex items-center gap-1 mt-1">
      {Object.entries(grouped).map(([emoji, userIds]) => (
        <button
          key={emoji}
          onClick={() => react(emoji)}
          className={`text-xs px-1.5 py-0.5 rounded-full border transition-all flex items-center gap-0.5 ${
            userIds.includes(myId)
              ? 'bg-indigo-900/30 border-indigo-700 text-indigo-300'
              : 'bg-[#1A1F2B] border-[#21262E] text-[#8B95A5] hover:bg-[#21262E]'
          }`}>
          <span>{emoji}</span>
          <span className="text-[10px]">{userIds.length}</span>
        </button>
      ))}
      <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setShowPicker(!showPicker)}
          className="text-xs w-5 h-5 rounded-full border border-[#21262E] text-[#5A6375] hover:bg-[#21262E] flex items-center justify-center transition-all">
          <Plus size={10} />
        </button>
        {showPicker && <div className="absolute bottom-6 left-0 z-50"><EmojiPicker onSelect={react} onClose={() => setShowPicker(false)} /></div>}
      </div>
    </div>
  );
}
