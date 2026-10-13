import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import BeatCard from '../../components/BeatCard/BeatCard';
import { CardSkeleton, EmptyState, ErrorState } from '../../components/States/EmptyState';
import { fetchPublicProfile } from '../../Model/api/auth';
import { setFollow, fetchConnections } from '../../Model/api/discovery';
import { fetchProducerPosts } from '../../Model/api/posts';
import { useAuth } from '../../contexts/AuthContext';
import type { Beat, User } from '../../types/api';
import { getAvatarUrl, getUserId } from '../../utils/entities';
import './ProfilePage.css';
export default function ProfilePage() {
  const { userId = '' } = useParams(); const { user: me } = useAuth();
  const [user, setUser] = useState<User | null>(null); const [beats, setBeats] = useState<Beat[]>([]);
  const [loading, setLoading] = useState(true); const [pending, setPending] = useState(false); const [more, setMore] = useState(false);
  const [error, setError] = useState(''); const [retry, setRetry] = useState(0);
  const [kind, setKind] = useState<'followers' | 'following' | null>(null); const [people, setPeople] = useState<User[]>([]); const [peopleMore, setPeopleMore] = useState(false);
  useEffect(() => { let active = true; const controller = new AbortController(); setLoading(true); setError(''); setKind(null);
    fetchPublicProfile(userId).then(async profile => { const posts = await fetchProducerPosts('', profile.username, 20, 0, controller.signal); if (active) { setUser(profile); setBeats(posts); setMore(posts.length === 20); } }).catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [userId, retry]);
  const toggleFollow = async () => {
    if (!user || pending) return; setPending(true); setError('');
    try { await setFollow(userId, !user.is_following); setUser(await fetchPublicProfile(userId)); }
    catch (err) { setError((err as Error).message); } finally { setPending(false); }
  };
  const loadMore = async () => { if (!user || pending) return; setPending(true); try { const next = await fetchProducerPosts('', user.username, 20, beats.length); setBeats(current => [...current, ...next]); setMore(next.length === 20); } catch (err) { setError((err as Error).message); } finally { setPending(false); } };
  const showPeople = async (nextKind: 'followers' | 'following', append = false) => { if (pending) return; setPending(true); setError(''); try { const next = await fetchConnections(userId, nextKind, append ? people.length : 0); setPeople(current => append ? [...current, ...next] : next); setKind(nextKind); setPeopleMore(next.length === 20); } catch (err) { setError((err as Error).message); } finally { setPending(false); } };
  if (loading) return <div className="page"><CardSkeleton count={6} /></div>;
  if (!user) return <div className="page"><ErrorState message={error || 'Profile not found.'} onRetry={() => setRetry(n => n + 1)} /></div>;
  return <div className="page">{error && <ErrorState message={error} onRetry={() => setRetry(n => n + 1)} />}<section className="public-profile"><img src={getAvatarUrl(user)} onError={e => { e.currentTarget.src = '/avatar-fallback.svg'; }} alt={`${user.username} profile`} /><div className="public-profile-copy"><p className="page-eyebrow">{user.role === 'producer' ? 'Producer' : 'Artist'} profile</p><h1>{user.full_name || user.username}</h1><span>@{user.username}</span><p>{user.bio || 'No bio yet.'}</p><div className="profile-stats"><span><strong>{user.post_num || 0}</strong> beats</span><button className="button button--secondary" disabled={pending} onClick={() => showPeople('followers')}>{user.followers || 0} followers</button><button className="button button--secondary" disabled={pending} onClick={() => showPeople('following')}>{user.following || 0} following</button></div></div>{me?.id !== userId && <button className="button" onClick={toggleFollow} disabled={pending}>{pending ? 'Updating…' : user.is_following ? 'Unfollow' : 'Follow'}</button>}</section>
    {kind && <section aria-label={kind}><h2>{kind}</h2>{people.length ? <ul>{people.map(person => <li key={getUserId(person)}><Link to={`/profile/${getUserId(person)}`}>@{person.username}</Link></li>)}</ul> : <p>No {kind} yet.</p>}{peopleMore && <button className="button button--secondary" disabled={pending} onClick={() => showPeople(kind, true)}>Load more people</button>}</section>}
    <h2>Beats by {user.username}</h2>{beats.length ? <div className="card-grid">{beats.map(beat => <BeatCard key={beat._id} beat={{ ...beat, creator_username: user.username }} />)}</div> : <EmptyState title="No beats yet" message="No published tracks are available." />}{more && <button className="button button--secondary" disabled={pending} onClick={loadMore}>Load more beats</button>}</div>;
}
