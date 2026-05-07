import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldOff, ShieldAlert, AlertTriangle } from 'lucide-react';
import Layout from '../components/Layout';
import ProfileCard from '../components/ProfileCard';
import api from '../api/axios';

export default function FriendProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const myId = JSON.parse(localStorage.getItem('user') || '{}').id;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const load = async () => {
    try {
      const res = await api.get(`/friends/profile/${id}`);
      setProfile(res.data);
      setIsBlocked(res.data.blocked || false);
    } catch { navigate('/friends'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handleAction = async (type) => {
    setActionLoading(true);
    try {
      if (type === 'request') await api.post(`/friends/request/${id}`);
      if (type === 'accept')  await api.put(`/friends/accept/${id}`);
      if (type === 'reject')  await api.put(`/friends/reject/${id}`);
      if (type === 'unfriend') await api.delete(`/friends/${id}`);
      if (type === 'block') {
        await api.post(`/friends/block/${id}`);
        setIsBlocked(true);
      }
      if (type === 'unblock') {
        await api.post(`/friends/unblock/${id}`);
        setIsBlocked(false);
      }
      await load();
    } finally { setActionLoading(false); }
  };

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  );

  if (!profile) return null;

  const { friendship_status: status, requester_id } = profile;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            <ArrowLeft size={16} />Back
          </button>

          {/* Block/Unblock button */}
          {!isBlocked ? (
            <button onClick={() => handleAction('block')} disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all disabled:opacity-60">
              <ShieldOff size={13} />Block
            </button>
          ) : (
            <button onClick={() => handleAction('unblock')} disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all disabled:opacity-60">
              <ShieldAlert size={13} />Unblock
            </button>
          )}
        </div>

        {isBlocked && (
          <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl px-5 py-4">
            <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">User Blocked</p>
              <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">
                You have blocked this user. They cannot see your profile, send you messages, or interact with your posts.
              </p>
            </div>
          </div>
        )}

        <ProfileCard
          profile={profile}
          coverImage={profile.cover_image}
          avatar={profile.avatar}
          name={profile.name}
          bio={profile.bio}
          location={profile.location}
          linkedin={profile.linkedin}
          skills={profile.skills}
          availabilityStatus={profile.availability_status}
          lastSeen={profile.last_seen_at}
          createdAt={profile.created_at}
          isOwn={false}
          isFriend={status === 'accepted'}
          friendshipStatus={isBlocked ? null : status}
          requesterId={requester_id}
          myId={myId}
          onMessage={() => navigate(`/messages?user=${id}`)}
          onAddFriend={() => handleAction('request')}
          onAccept={() => handleAction('accept')}
          onReject={() => handleAction('reject')}
          onUnfriend={() => handleAction('unfriend')}
          actionLoading={actionLoading}
        />
      </div>
    </Layout>
  );
}
