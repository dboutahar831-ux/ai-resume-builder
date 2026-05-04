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

  return (
    <Layout>
      <div className="max-w-xl mx-auto space-y-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft size={16} />Back
        </button>

        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Cover */}
          <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600" />

          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="-mt-10 mb-4 flex items-end justify-between">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.name}
                  className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-600 border-4 border-white shadow-md flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">{profile.name?.[0]}</span>
                </div>
              )}

              {/* Actions */}
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

            <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
            {isFriend
              ? <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-0.5"><UserCheck size={12} />Connected</p>
              : <p className="text-xs text-gray-400 mt-0.5">ResumeAI member</p>
            }

            {/* Info rows */}
            <div className="mt-5 space-y-3 border-t border-gray-100 pt-5">
              {profile.location && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                    <MapPin size={14} className="text-gray-400" />
                  </div>
                  {profile.location}
                </div>
              )}
              {profile.linkedin && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                    <Link2 size={14} className="text-gray-400" />
                  </div>
                  <a href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`}
                    target="_blank" rel="noreferrer"
                    className="text-indigo-600 hover:underline truncate">
                    {profile.linkedin}
                  </a>
                </div>
              )}
              {profile.created_at && (
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                    <Calendar size={14} className="text-gray-400" />
                  </div>
                  Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
