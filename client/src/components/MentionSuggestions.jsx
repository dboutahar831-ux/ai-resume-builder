export default function MentionSuggestions({ suggestions, onSelect }) {
  if (!suggestions.length) return null;
  return (
    <div className="absolute z-50 bottom-full mb-1 left-0 w-60 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden"
      style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
      <p className="px-3 pt-2 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mention</p>
      {suggestions.map(user => (
        <button
          key={user.id}
          type="button"
          onMouseDown={e => { e.preventDefault(); onSelect(user); }}
          className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-indigo-50 transition-colors text-left"
        >
          {user.avatar
            ? <img src={user.avatar} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
            : <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#6C5CE7,#BF5AF2)' }}>
                {user.name?.[0]}
              </div>
          }
          <span className="text-sm font-medium text-gray-800">{user.name}</span>
        </button>
      ))}
    </div>
  );
}
