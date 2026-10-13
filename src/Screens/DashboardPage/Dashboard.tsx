import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Headphones, Heart, Plus, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import BeatCard from '../../components/BeatCard/BeatCard';
import { CardSkeleton, EmptyState, ErrorState } from '../../components/States/EmptyState';
import { useAuth } from '../../contexts/AuthContext';
import { fetchFeed, fetchProducerPosts } from '../../Model/api/posts';
import type { Beat } from '../../types/api';
import { canPlayBeat, formatCompactNumber, getBeatId, getBeatPlayCount } from '../../utils/entities';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const [catalog, setCatalog] = useState<Beat[]>([]);
  const [feed, setFeed] = useState<Beat[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const load = async (signal?: AbortSignal) => {
    setLoading(true); setError('');
    try {
      const [ownBeats, feedBeats] = await Promise.all([fetchProducerPosts('', user?.username || '', 50, 0, signal), fetchFeed(8, [], signal)]);
      setCatalog(ownBeats); setFeed(feedBeats); setHasMore(feedBeats.length === 8);
    } catch (err) { if (!signal?.aborted) setError(err instanceof Error ? err.message : 'Unable to load your home feed.') }
    finally { if (!signal?.aborted) setLoading(false) }
  };
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort() }, []);

  const totals = useMemo(() => ({
    plays: catalog.reduce((sum, beat) => sum + getBeatPlayCount(beat), 0),
    likes: catalog.reduce((sum, beat) => sum + (canPlayBeat(beat) ? beat.likes : 0), 0),
    saves: catalog.reduce((sum, beat) => sum + beat.saves, 0),
  }), [catalog]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return; setLoadingMore(true);
    try {
      const next = await fetchFeed(8, feed.map(getBeatId));
      setHasMore(next.length === 8);
      setFeed((current) => [...current, ...next.filter((beat) => !current.some((item) => getBeatId(item) === getBeatId(beat))) ]);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load more beats.') }
    finally { setLoadingMore(false) }
  };

  return <div className="page dashboard">
    <header className="dashboard-welcome"><div><p className="page-eyebrow">Your studio</p><h1>Welcome back, {user?.username}.</h1><p>Your catalog, your momentum, and new sounds from the community.</p></div>{user?.role === 'producer' && <Link className="button" to="/upload"><Plus size={18} />Upload beat</Link>}</header>
    {user?.role === 'producer' && <section className="dashboard-overview">
      <div className="dashboard-feature"><div className="feature-icon"><Sparkles /></div><p className="page-eyebrow">Studio pulse</p><h2>{catalog.length ? 'Your sound is live.' : 'Your first drop starts here.'}</h2><p>{catalog.length ? `${catalog.length} beats are building your presence on BeatNow. Keep the catalog moving.` : 'Upload a beat with a strong cover and precise metadata to start your catalog.'}</p><Link to={catalog.length ? '/beats' : '/upload'}> {catalog.length ? 'Manage catalog' : 'Publish your first beat'} <ArrowRight size={17} /></Link></div>
      <div className="metric-grid"><article><Headphones /><span>Plays in loaded catalog</span><strong>{formatCompactNumber(totals.plays)}</strong></article><article><Heart /><span>Likes in loaded catalog</span><strong>{formatCompactNumber(totals.likes)}</strong></article><article><Sparkles /><span>Saves in loaded catalog</span><strong>{formatCompactNumber(totals.saves)}</strong></article><article><span>Catalog</span><strong>{catalog.length}</strong><small>published beats</small></article></div>
    </section>}
    <div className="section-header"><div><h2>Community feed</h2><p>Fresh beats selected from creators across BeatNow</p></div><Link to="/explore">Explore all <ArrowRight size={16} /></Link></div>
    {loading ? <CardSkeleton count={8} /> : error && feed.length === 0 ? <ErrorState message={error} onRetry={load} /> : feed.length === 0 ? <EmptyState title="The feed is warming up" message="There are no community beats to show yet. Check again soon." /> : <><div className="card-grid">{feed.map((beat) => <BeatCard key={getBeatId(beat)} beat={beat} onChange={(next) => setFeed((items) => items.map((item) => getBeatId(item) === getBeatId(next) ? next : item))} />)}</div>{hasMore && <div className="load-more"><button className="button button--secondary" type="button" onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'Finding beats…' : 'More from the community'}</button></div>}</>}
  </div>;
}
