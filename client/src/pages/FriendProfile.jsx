import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Link2, MessageSquare, UserPlus, UserCheck, Clock, UserX, Calendar } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../api/axios';

export default function FriendProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const myId = JSON.parse(localStorage.getItem('user') || '{}').id;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    try {
      const res = await api.get(`/friends/profile/${id}`);
      setProfile(res.data);
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
  const iAmRequester = requester_id === myId;
  const isFriend = status === 'accepted';

  const online = profile.last_seen_at && Date.now() - new Date(profile.last_seen_at).getTime() < 120000;
  const diff = profile.last_seen_at ? Date.now() - new Date(profile.last_seen_at).getTime() : null;
  const lastSeenLabel = !profile.last_seen_at ? null
    : online ? 'Active now'
    : diff < 3600000 ? `Active ${Math.floor(diff / 60000)}m ago`
    : diff < 86400000 ? `Active ${Math.floor(diff / 3600000)}h ago`
    : `Active ${Math.floor(diff / 86400000)}d ago`;

  return (
    <Layout>
      <div className="max-w-xl mx-auto space-y-5">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft size={16} />Back
        </button>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Cover */}
          <div className="h-48 relative">
            {profile.cover_image
              ? <img src={profile.cover_image} alt="cover" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" />
            }
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent" />
          </div>

          <div className="px-8 pb-8">
            <div className="-mt-16 mb-5 flex items-end justify-between">
              <div className="relative">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.name}
                    className="w-32 h-32 rounded-3xl object-cover border-4 border-white shadow-xl" />
                ) : (
                  <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-indigo-400 to-indigo-700 border-4 border-white shadow-xl flex items-center justify-center">
                    <span className="text-5xl font-bold text-white">{profile.name?.[0]}</span>
                  </div>
                )}
                <span className={`absolute bottom-1.5 right-1.5 w-4 h-4 rounded-full border-2 border-white shadow ${online ? 'bg-emerald-500' : 'bg-gray-300'}`} />
              </div>

              <div className="flex gap-2 mb-1">
                {isFriend && (
                  <Link to={`/messages?user=${id}`}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-all">
                    <MessageSquare size={15} />Message
                  </Link>
                )}
                {!status && (
                  <button onClick={() => handleAction('request')} disabled={actionLoading}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-60">
                    <UserPlus size={15} />Add Friend
                  </button>
                )}
                {status === 'pending' && iAmRequester && (
                  <span className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-500 text-sm font-medium rounded-xl">
                    <Clock size={15} />Request Sent
                  </span>
                )}
                {status === 'pending' && !iAmRequester && (
                  <>
                    <button onClick={() => handleAction('accept')} disabled={actionLoading}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-60">
                      <UserCheck size={15} />Accept
                    </button>
                    <button onClick={() => handleAction('reject')} disabled={actionLoading}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-xl hover:bg-red-100 transition-all disabled:opacity-60">
                      Decline
                    </button>
                  </>
                )}
                {isFriend && (
                  <button onClick={() => handleAction('unfriend')} disabled={actionLoading}
                    className="flex items-center gap-1.5 px-3 py-2 text-gray-400 hover:text-red-500 hover:bg-red-50 text-sm rounded-xl transition-all disabled:opacity-60">
                    <UserX size={15} />
                  </button>
                )}
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{profile.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {isFriend && (
                <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-semibold border border-emerald-100">
                  <UserCheck size={11} />Connected
                </span>
              )}
              {lastSeenLabel && (
                <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium border
                  ${online ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  {lastSeenLabel}
                </span>
              )}
              {!lastSeenLabel && (
                <span className="text-xs text-gray-400">ResumeAI member</span>
              )}
            </div>

            {profile.bio && (
              <p className="text-sm text-gray-600 mt-3 leading-relaxed max-w-md">{profile.bio}</p>
            )}

            <div className="mt-5 flex flex-wrap gap-4 border-t border-gray-100 pt-5">
              {profile.location && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                  {profile.location}
                </div>
              )}
              {profile.linkedin && (
                <a href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-indigo-600 hover:underline">
                  <Link2 size={14} className="flex-shrink-0" />LinkedIn
                </a>
              )}
              {profile.created_at && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Calendar size={14} className="flex-shrink-0" />
                  Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
