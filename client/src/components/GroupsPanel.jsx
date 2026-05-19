import { useState, useEffect, useRef } from 'react';
import { Plus, Users, X, Info, Edit3, Trash2, LogOut, Crown, User, Search, UserPlus } from 'lucide-react';
import api from '../api/axios';
import { useToast } from './Toast';

function AvatarCircle({ user, size = 'sm', groupName }) {
  const sz = size === 'lg' ? 'w-12 h-12 text-lg' : size === 'md' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs';
  if (user?.avatar) {
    return <img src={user.avatar} loading="lazy" alt={user.name} className={`${sz} rounded-full object-cover ring-2 ring-white shadow-sm flex-shrink-0`} />;
  }
  const initial = (user?.name?.[0] || groupName?.[0] || 'G').toUpperCase();
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#BF5AF2] flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm ring-2 ring-white`}>
      {initial}
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

function isOnline(lastSeenAt) {
  return lastSeenAt && Date.now() - new Date(lastSeenAt).getTime() < 120000;
}

function GroupInfoModal({ group, onClose, onUpdated, onDeleted, onLeft }) {
  const addToast = useToast();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [addSearch, setAddSearch] = useState('');
  const [availableFriends, setAvailableFriends] = useState([]);
  const [addingId, setAddingId] = useState(null);
  const myId = JSON.parse(localStorage.getItem('user') || '{}').id;

  useEffect(() => {
    loadDetails();
  }, [group.id]);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/groups/${group.id}`);
      setDetails(res.data);
      setEditName(res.data.name);
      setEditDesc(res.data.description || '');
    } catch {} finally { setLoading(false); }
  };

  const loadAvailableFriends = async () => {
    try {
      const [friendsRes, membersRes] = await Promise.all([
        api.get('/groups/available-friends'),
        api.get(`/groups/${group.id}/members`),
      ]);
      const memberIds = new Set(membersRes.data.map(m => m.user_id));
      setAvailableFriends(friendsRes.data.filter(f => !memberIds.has(f.id)));
    } catch {}
  };

  const handleAddMember = async (userId) => {
    setAddingId(userId);
    try {
      await api.post(`/groups/${group.id}/members`, { user_id: userId });
      addToast('Member added!', 'success');
      setAvailableFriends(prev => prev.filter(f => f.id !== userId));
      loadDetails();
    } catch (err) { addToast(err.response?.data?.error || 'Failed to add.', 'error'); }
    finally { setAddingId(null); }
  };

  const isAdmin = details?.my_role === 'admin';

  const handleEdit = async () => {
    if (!editName.trim()) return addToast('Name is required.', 'warning');
    setSaving(true);
    try {
      await api.patch(`/groups/${group.id}`, { name: editName.trim(), description: editDesc.trim() || null });
      addToast('Group updated!', 'success');
      setEditing(false);
      loadDetails();
      onUpdated?.();
    } catch (err) { addToast(err.response?.data?.error || 'Failed to update.', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this group forever? This cannot be undone.')) return;
    try {
      await api.delete(`/groups/${group.id}`);
      addToast('Group deleted.', 'success');
      onDeleted?.();
      onClose();
    } catch (err) { addToast(err.response?.data?.error || 'Failed to delete.', 'error'); }
  };

  const handleLeave = async () => {
    if (!confirm('Leave this group?')) return;
    try {
      await api.post(`/groups/${group.id}/leave`);
      addToast('Left group.', 'success');
      onLeft?.();
      onClose();
    } catch (err) { addToast(err.response?.data?.error || 'Failed to leave.', 'error'); }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member from the group?')) return;
    try {
      await api.delete(`/groups/${group.id}/members/${userId}`);
      addToast('Member removed.', 'success');
      loadDetails();
    } catch (err) { addToast(err.response?.data?.error || 'Failed to remove.', 'error'); }
  };

  const handlePromote = async (userId) => {
    try {
      await api.put(`/groups/${group.id}/members/${userId}/role`, { role: 'admin' });
      addToast('Member promoted to admin.', 'success');
      loadDetails();
    } catch (err) { addToast(err.response?.data?.error || 'Failed to promote.', 'error'); }
  };

  const RoleIcon = ({ role }) => {
    if (role === 'admin') return <Crown size={12} className="text-amber-500" />;
    return <User size={12} className="text-gray-400" />;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#2A2A2A] w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl animate-pop" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-[#2A2A2A]">
          <div className="flex items-center gap-3">
            <AvatarCircle groupName={group.name} user={null} size="lg" />
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{group.name}</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500">{details?.member_count || '...'} members</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
          {loading ? (
            <div className="space-y-4">
              <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse w-3/4" />
              <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse w-1/2" />
              <div className="space-y-2 pt-4">
                {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
              </div>
            </div>
          ) : (
            <>
              {/* Description */}
              {editing ? (
                <div className="space-y-3">
                  <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Group name" maxLength={100}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/30" />
                  <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Description (optional)" maxLength={200} rows={2}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/30 resize-none" />
                  <div className="flex gap-2">
                    <button onClick={handleEdit} disabled={saving || !editName.trim()}
                      className="flex-1 py-2 text-white text-xs font-semibold rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7)' }}>
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                    <button onClick={() => setEditing(false)}
                      className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-all">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{details?.description || <span className="text-gray-400 italic">No description</span>}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {isAdmin && !editing && (
                  <>
                    <button onClick={() => setEditing(true)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-xl transition-all">
                      <Edit3 size={13} /> Edit group
                    </button>
                    <button onClick={() => { setShowAddMember(v => !v); if (!showAddMember) loadAvailableFriends(); }}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-xl transition-all">
                      <UserPlus size={13} /> Add member
                    </button>
                    <button onClick={handleDelete}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-all">
                      <Trash2 size={13} /> Delete group
                    </button>
                  </>
                )}
                <button onClick={handleLeave}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-xl transition-all">
                  <LogOut size={13} /> Leave group
                </button>
              </div>

              {/* Add member panel */}
              {isAdmin && showAddMember && (
                <div className="bg-gray-50 dark:bg-[#1A1A1A] rounded-2xl p-3 border border-gray-100 dark:border-[#2A2A2A]">
                  <div className="relative mb-2">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={addSearch} onChange={e => setAddSearch(e.target.value)}
                      placeholder="Search friends…"
                      className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 dark:border-[#2A2A2A] rounded-xl bg-white dark:bg-[#111111] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/30 placeholder-gray-400" />
                  </div>
                  {availableFriends.length === 0 ? (
                    <p className="text-[11px] text-gray-400 text-center py-3">All friends are already members</p>
                  ) : (
                    <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1">
                      {availableFriends
                        .filter(f => !addSearch || f.name.toLowerCase().includes(addSearch.toLowerCase()))
                        .map(f => (
                          <div key={f.id} className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white dark:hover:bg-white/5 transition-all">
                            <AvatarCircle user={f} />
                            <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{f.name}</span>
                            <button onClick={() => handleAddMember(f.id)} disabled={addingId === f.id}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-white rounded-lg transition-all disabled:opacity-50"
                              style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7)' }}>
                              {addingId === f.id ? '…' : <><UserPlus size={11} /> Add</>}
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Members */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Members</p>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">{details?.member_count} total</span>
                </div>
                <div className="space-y-1">
                  {details?.members?.map(m => (
                    <div key={m.user_id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all group">
                      <div className="relative flex-shrink-0">
                        <AvatarCircle user={m} size="md" />
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#111111] ${isOnline(m.last_seen_at) ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{m.name}</p>
                          <RoleIcon role={m.role} />
                        </div>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">
                          {isOnline(m.last_seen_at) ? 'Active now' : timeAgo(m.last_seen_at) ? `Last seen ${timeAgo(m.last_seen_at)} ago` : 'Offline'}
                        </p>
                      </div>
                      {isAdmin && m.role !== 'admin' && m.user_id !== myId && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handlePromote(m.user_id)} title="Promote to admin"
                            className="p-1 text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-all">
                            <Crown size={13} />
                          </button>
                          <button onClick={() => handleRemoveMember(m.user_id)} title="Remove"
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
                            <X size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#2A2A2A] w-full max-w-md p-6 shadow-2xl animate-pop" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#BF5AF2] flex items-center justify-center text-white text-sm font-bold shadow-sm">
              <Users size={15} />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Create Group</h2>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Group name" maxLength={100}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/30 transition-all" />
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" maxLength={200}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/30 transition-all" />
          {friends.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2.5 uppercase tracking-wider">Add members ({selected.length} selected)</p>
              <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1 bg-gray-50 dark:bg-[#1A1A1A] rounded-xl p-1.5">
                {friends.map(f => (
                  <button key={f.id} onClick={() => toggle(f.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-left ${
                      selected.includes(f.id) ? 'bg-[#6C5CE7]/10 border border-[#6C5CE7]/30 shadow-sm' : 'hover:bg-white dark:hover:bg-white/5 border border-transparent'
                    }`}>
                    <AvatarCircle user={f} />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{f.name}</span>
                    {selected.includes(f.id) && <span className="ml-auto w-5 h-5 rounded-full bg-[#6C5CE7] text-white text-[10px] flex items-center justify-center font-bold flex-shrink-0">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button onClick={create} disabled={creating || !name.trim()}
            className="w-full py-2.5 text-white text-sm font-semibold rounded-xl transition-all hover:opacity-90 disabled:opacity-50 shadow-sm"
            style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
            {creating ? 'Creating…' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
}

export { GroupInfoModal };

export default function GroupsPanel({ onSelectGroup, activeGroupId }) {
  const [groups, setGroups] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showInfo, setShowInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.get('/groups');
      setGroups(res.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleGroupUpdated = () => load();
  const handleGroupDeleted = () => { setShowInfo(null); load(); };
  const handleGroupLeft = () => { setShowInfo(null); load(); };

  return (
    <>
      <div className="px-4 py-3 border-b border-gray-100 dark:border-[#2A2A2A]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7)' }} />
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Groups</p>
            {groups.length > 0 && <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">({groups.length})</span>}
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#6C5CE7] hover:bg-[#6C5CE7]/10 rounded-xl transition-all">
            <Plus size={13} /> New
          </button>
        </div>

        {loading ? (
          <div className="flex gap-2 py-1">
            {[1,2].map(i => <div key={i} className="h-8 w-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-shimmer" />)}
          </div>
        ) : groups.length === 0 ? (
          <p className="text-[10px] text-gray-400 dark:text-gray-500 py-2 text-center">No groups yet — create one!</p>
        ) : (
          <div className="space-y-1.5 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
            {groups.map(g => (
              <div key={g.id}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all group ${
                  activeGroupId === g.id
                    ? 'bg-gradient-to-r from-[#6C5CE7]/10 to-[#BF5AF2]/10 border border-[#6C5CE7]/30 shadow-sm'
                    : 'hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent'
                }`}>
                <button onClick={() => onSelectGroup(g)} className="flex items-center gap-2.5 flex-1 min-w-0">
                  <AvatarCircle groupName={g.name} user={null} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-sm truncate ${activeGroupId === g.id ? 'font-bold text-gray-900 dark:text-gray-100' : 'font-semibold text-gray-700 dark:text-gray-200'}`}>
                        {g.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">{g.member_count || 0} members</span>
                      {(g.last_message || g.last_at) && (
                        <>
                          <span className="text-[8px] text-gray-300 dark:text-gray-600">•</span>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate max-w-[100px]">{g.last_message || (g.last_at ? timeAgo(g.last_at) : '')}</p>
                        </>
                      )}
                    </div>
                  </div>
                </button>
                <button onClick={() => setShowInfo(g)}
                  className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-[#6C5CE7] hover:bg-[#6C5CE7]/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 flex-shrink-0">
                  <Info size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} onCreated={(g) => { setGroups(prev => [g, ...prev]); onSelectGroup(g); }} />}
      {showInfo && (
        <GroupInfoModal
          group={showInfo}
          onClose={() => setShowInfo(null)}
          onUpdated={handleGroupUpdated}
          onDeleted={handleGroupDeleted}
          onLeft={handleGroupLeft}
        />
      )}
    </>
  );
}
