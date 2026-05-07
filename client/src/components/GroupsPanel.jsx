import { useState, useEffect } from 'react';
import { Plus, Users, UsersRound, X, ChevronRight, MessageSquare } from 'lucide-react';
import api from '../api/axios';
import { useToast } from './Toast';

function AvatarCircle({ user, size = 'sm' }) {
  const sz = size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';
  return user?.avatar
    ? <img src={user.avatar} loading="lazy" alt={user.name} className={`${sz} rounded-full object-cover ring-2 ring-[#21262E]`} />
    : <div className={`${sz} rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#BF5AF2] flex items-center justify-center text-white font-bold text-xs`}>
        {user?.name?.[0] || 'G'}
      </div>;
}

function CreateGroupModal({ onClose, onCreated }) {
  const addToast = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [friends, setFriends] = useState([]);
  const [selected, setSelected] = useState([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api.get('/groups/available-friends').then(r => setFriends(r.data)).catch(() => {});
  }, []);

  const toggle = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const create = async () => {
    if (!name.trim()) return addToast('Group name is required.', 'warning');
    setCreating(true);
    try {
      const res = await api.post('/groups', { name: name.trim(), description: description.trim() || undefined, member_ids: selected });
      onCreated(res.data);
      onClose();
      addToast('Group created!', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to create group.', 'error');
    } finally { setCreating(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#151921] rounded-2xl border border-[#21262E] w-full max-w-md p-6 animate-pop" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#E8ECF1]">Create Group</h2>
          <button onClick={onClose} className="p-1 text-[#5A6375] hover:text-[#E8ECF1]"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Group name" maxLength={100}
            className="w-full px-4 py-2.5 bg-[#1A1F2B] border border-[#21262E] rounded-xl text-sm text-[#E8ECF1] placeholder-[#5A6375] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/30" />
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" maxLength={200}
            className="w-full px-4 py-2.5 bg-[#1A1F2B] border border-[#21262E] rounded-xl text-sm text-[#E8ECF1] placeholder-[#5A6375] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/30" />
          {friends.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[#8B95A5] mb-2">Add members ({selected.length} selected)</p>
              <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
                {friends.map(f => (
                  <button key={f.id} onClick={() => toggle(f.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all text-left ${
                      selected.includes(f.id) ? 'bg-[#6C5CE7]/20 border border-[#6C5CE7]/40' : 'hover:bg-[#1A1F2B] border border-transparent'
                    }`}>
                    <AvatarCircle user={f} />
                    <span className="text-sm text-[#E8ECF1]">{f.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <button onClick={create} disabled={creating || !name.trim()}
            className="w-full py-2.5 text-white text-sm font-semibold rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
            {creating ? 'Creating…' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
}

function timeAgo(d) {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function GroupsPanel({ onSelectGroup, activeGroupId }) {
  const [groups, setGroups] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.get('/groups');
      setGroups(res.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <>
      <div className="px-4 py-3 border-b border-[#21262E]">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold text-[#8B95A5] uppercase tracking-wider">Groups</p>
          <button onClick={() => setShowCreate(true)}
            className="p-1 text-[#5A6375] hover:text-[#6C5CE7] transition-colors">
            <Plus size={14} />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
          {groups.map(g => (
            <button key={g.id} onClick={() => onSelectGroup(g)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeGroupId === g.id ? 'bg-[#6C5CE7]/20 text-[#6C5CE7] border border-[#6C5CE7]/40' : 'bg-[#1A1F2B] text-[#8B95A5] hover:bg-[#21262E] border border-transparent'
              }`}>
              <UsersRound size={12} />
              <span className="truncate max-w-[80px]">{g.name}</span>
            </button>
          ))}
          {!loading && groups.length === 0 && (
            <p className="text-[10px] text-[#5A6375] py-1">No groups yet</p>
          )}
        </div>
      </div>
      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} onCreated={(g) => { setGroups(prev => [g, ...prev]); onSelectGroup(g); }} />}
    </>
  );
}
