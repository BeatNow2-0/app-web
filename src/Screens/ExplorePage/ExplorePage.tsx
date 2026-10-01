import React, { useEffect, useState } from 'react';
import { Search, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import BeatCard from '../../components/BeatCard/BeatCard';
import { CardSkeleton, EmptyState, ErrorState } from '../../components/States/EmptyState';
import { searchBeats, searchUsers } from '../../Model/api/discovery';
import type { Beat, User } from '../../types/api';
import { getAvatarUrl, getUserId } from '../../utils/entities';
import './ExplorePage.css';

const PAGE_SIZE = 20;
export default function ExplorePage() {
  const [query, setQuery] = useState('');
  const [beats, setBeats] = useState<Beat[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true); setError('');
      try {
        const [nextBeats, nextUsers] = await Promise.all([
          searchBeats(query.trim(), PAGE_SIZE, 0, controller.signal),
          query.trim().length >= 2 ? searchUsers(query.trim(), 8, 0, controller.signal) : Promise.resolve([]),
        ]);
        setBeats(nextBeats); setUsers(nextUsers); setHasMore(nextBeats.length === PAGE_SIZE);
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Search failed.');
      } finally { if (!controller.signal.aborted) setLoading(false) }
    }, query ? 350 : 0);
    return () => { controller.abort(); window.clearTimeout(timer) };
  }, [query]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const next = await searchBeats(query.trim(), PAGE_SIZE, beats.length);
      setBeats((current) => [...current, ...next]); setHasMore(next.length === PAGE_SIZE);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load more results.') }
    finally { setLoadingMore(false) }
  };

  return <div className="page explore-page">
    <header className="page-header"><div><p className="page-eyebrow">Discovery</p><h1 className="page-title">Find your next sound.</h1><p className="page-subtitle">Explore creators, moods and beats from across BeatNow.</p></div></header>
    <label className="explore-search"><Search aria-hidden="true" /><span className="sr-only">Search beats and creators</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search beats, tags or creators" autoComplete="off" /></label>
    {users.length > 0 && <section><div className="section-header"><div><h2>Creators</h2><p>People matching your search</p></div></div><div className="creator-strip">{users.map((user) => <Link to={`/profile/${getUserId(user)}`} className="creator-card" key={getUserId(user)}><img src={getAvatarUrl(user)} alt="" loading="lazy" /><div><strong>{user.full_name || user.username}</strong><span>@{user.username}</span></div><UserRound size={18} /></Link>)}</div></section>}
    <section><div className="section-header"><div><h2>{query ? 'Beat results' : 'Explore beats'}</h2><p>{query ? `Results for “${query}”` : 'Fresh sounds outside your catalog'}</p></div></div>
      {loading ? <CardSkeleton count={8} /> : error ? <ErrorState message={error} /> : beats.length === 0 ? <EmptyState title="No beats found" message="Try a different title, tag or genre." /> : <><div className="card-grid">{beats.map((beat) => <BeatCard key={beat._id} beat={beat} onChange={(next) => setBeats((items) => items.map((item) => item._id === next._id ? next : item))} />)}</div>{hasMore && <div className="load-more"><button className="button button--secondary" type="button" onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'Loading…' : 'Load more'}</button></div>}</>}
    </section>
  </div>;
}
