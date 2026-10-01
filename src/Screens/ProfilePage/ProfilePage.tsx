import React, { useEffect, useState } from 'react';
import { UserPlus, UserRoundCheck } from 'lucide-react';
import { useParams } from 'react-router-dom';
import BeatCard from '../../components/BeatCard/BeatCard';
import { CardSkeleton, EmptyState, ErrorState } from '../../components/States/EmptyState';
import { fetchPublicProfile } from '../../Model/api/auth';
import { setFollow } from '../../Model/api/discovery';
import { fetchProducerPosts } from '../../Model/api/posts';
import type { Beat, User } from '../../types/api';
import { getAvatarUrl } from '../../utils/entities';
import './ProfilePage.css';

export default function ProfilePage() {
  const { userId = '' } = useParams();
  const [user, setUser] = useState<User | null>(null); const [beats, setBeats] = useState<Beat[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [following, setFollowing] = useState(false); const [followPending, setFollowPending] = useState(false);
  useEffect(() => { const controller = new AbortController(); setLoading(true); setError(''); fetchPublicProfile(userId).then(async (profile) => { setUser(profile); setFollowing(Boolean(profile.is_following)); setBeats(await fetchProducerPosts('', profile.username, 50, 0, controller.signal)) }).catch((err) => { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Unable to load this creator.') }).finally(() => { if (!controller.signal.aborted) setLoading(false) }); return () => controller.abort() }, [userId]);
  const toggleFollow = async () => { if (!user || followPending) return; const next = !following; setFollowPending(true); setFollowing(next); setUser({ ...user, followers: Math.max(0, (user.followers || 0) + (next ? 1 : -1)) }); try { await setFollow(userId, next) } catch { setFollowing(!next); setUser(user) } finally { setFollowPending(false) } };
  if (loading) return <div className="page"><CardSkeleton count={6} /></div>;
  if (error || !user) return <div className="page"><ErrorState message={error || 'Profile not found.'} /></div>;
  return <div className="page"><section className="public-profile"><img src={getAvatarUrl(user)} onError={(event) => { event.currentTarget.src = '/avatar-fallback.svg' }} alt={`${user.username} profile`} /><div className="public-profile-copy"><p className="page-eyebrow">Creator profile</p><h1>{user.full_name || user.username}</h1><span>@{user.username}</span><p>{user.bio || 'This producer has not added a bio yet.'}</p><div className="profile-stats"><span><strong>{user.post_num || beats.length}</strong> beats</span><span><strong>{user.followers || 0}</strong> followers</span><span><strong>{user.following || 0}</strong> following</span></div></div><button className={`button ${following ? 'button--secondary' : ''}`} type="button" onClick={toggleFollow} disabled={followPending}>{following ? <UserRoundCheck size={18} /> : <UserPlus size={18} />}{followPending ? 'Updating…' : following ? 'Following' : 'Follow'}</button></section><div className="section-header"><div><h2>Beats by {user.username}</h2><p>{beats.length} published tracks</p></div></div>{beats.length ? <div className="card-grid">{beats.map((beat) => <BeatCard key={beat._id} beat={{ ...beat, creator_username: user.username }} />)}</div> : <EmptyState title="No beats yet" message="This creator has not published anything yet." />}</div>;
}
