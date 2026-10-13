import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import BeatCard from '../../components/BeatCard/BeatCard';
import { CardSkeleton, EmptyState, ErrorState } from '../../components/States/EmptyState';
import { searchBeats, searchUsers, type SearchFilters } from '../../Model/api/discovery';
import { genresList, moodsList, instrumentsList } from '../../constants/beatFormOptions';
import { licenses } from '../../constants/licenses';
import type { Beat, User } from '../../types/api';
import { getAvatarUrl, getUserId } from '../../utils/entities';
import './ExplorePage.css';
const PAGE_SIZE = 20;
export default function ExplorePage() {
  const [params, setParams] = useSearchParams(); const query = params.get('q') || '';
  const filterKey = params.toString(); const latest = useRef(filterKey); latest.current = filterKey;
  const filters: SearchFilters = Object.fromEntries(['genre', 'bpm_min', 'bpm_max', 'moods', 'instruments', 'tags', 'license_type'].filter(key => params.get(key)).map(key => [key, params.get(key)!]));
  const [beats, setBeats] = useState<Beat[]>([]); const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true); const [pending, setPending] = useState(false); const [more, setMore] = useState(false);
  const [usersMore, setUsersMore] = useState(false); const [error, setError] = useState(''); const [retry, setRetry] = useState(0);
  const change = (key: string, value: string) => { setParams(previous => { const next = new URLSearchParams(previous); if (value) next.set(key, value); else next.delete(key); return next; }, { replace: true }); };
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(''); setPending(false);
    const timer = setTimeout(async () => {
      try {
        const [next, creators] = await Promise.all([searchBeats(query.trim(), PAGE_SIZE, 0, controller.signal, filters), query.trim().length >= 2 ? searchUsers(query.trim(), 20, 0, controller.signal) : Promise.resolve([])]);
        if (controller.signal.aborted) return;
        setBeats(next); setUsers(creators); setMore(next.length === PAGE_SIZE); setUsersMore(creators.length === 20);
      } catch (err) { if (!controller.signal.aborted) setError((err as Error).message); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 300);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [filterKey, retry]);
  const loadMore = async (kind: 'beats' | 'users') => {
    if (pending) return; setPending(true); setError(''); const key = filterKey;
    try {
      if (kind === 'beats') { const next = await searchBeats(query.trim(), PAGE_SIZE, beats.length, undefined, filters); if (latest.current !== key) return; setBeats(current => [...current, ...next]); setMore(next.length === PAGE_SIZE); }
      else { const next = await searchUsers(query.trim(), 20, users.length); if (latest.current !== key) return; setUsers(current => [...current, ...next]); setUsersMore(next.length === 20); }
    } catch (err) { if (latest.current === key) setError((err as Error).message); } finally { if (latest.current === key) setPending(false); }
  };
  return <div className="page explore-page"><header className="page-header"><div><p className="page-eyebrow">Discovery</p><h1 className="page-title">Find your next sound.</h1><p className="page-subtitle">Search beats and producers. Copy this page’s URL to share your filters.</p></div></header>
    <label className="explore-search"><span className="sr-only">Search beats and creators</span><input value={query} maxLength={100} onChange={e => change('q', e.target.value)} placeholder="Search beats, tags or creators" /></label>
    <div className="search-filters">{([['genre','Genre',genresList],['moods','Mood',moodsList],['instruments','Instrument',instrumentsList]] as const).map(([key,label,options]) => <label key={key}>{label}<select className="field-control" value={params.get(key) || ''} onChange={e => change(key, e.target.value)}><option value="">All</option>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>)}
      <label>Minimum BPM<input className="field-control" type="number" min={1} max={400} value={params.get('bpm_min') || ''} onChange={e => change('bpm_min', e.target.value)} /></label><label>Maximum BPM<input className="field-control" type="number" min={1} max={400} value={params.get('bpm_max') || ''} onChange={e => change('bpm_max', e.target.value)} /></label>
      <label>License<select className="field-control" value={params.get('license_type') || ''} onChange={e => change('license_type', e.target.value)}><option value="">All conditions</option>{Object.entries(licenses).map(([key,value]) => <option key={key} value={key}>{value.label}</option>)}</select></label>
      <label>Tags<input className="field-control" maxLength={200} placeholder="Comma-separated tags" value={params.get('tags') || ''} onChange={e => change('tags', e.target.value)} /></label><button className="button button--secondary" onClick={() => setParams({})}>Clear filters</button></div>
    {error && <ErrorState message={error} onRetry={() => setRetry(value => value + 1)} />}
    {loading ? <CardSkeleton count={8} /> : <>{users.length > 0 && <section><h2>Creators</h2><div className="creator-strip">{users.map(user => <Link to={`/profile/${getUserId(user)}`} className="creator-card" key={getUserId(user)}><img src={getAvatarUrl(user)} onError={e => { e.currentTarget.src = '/avatar-fallback.svg'; }} alt="" /><div><strong>{user.full_name || user.username}</strong><span>@{user.username}</span></div></Link>)}</div>{usersMore && <button className="button button--secondary" disabled={pending} onClick={() => loadMore('users')}>More creators</button>}</section>}
    <section><h2>Beats</h2>{!error && !beats.length ? <EmptyState title="No beats found" message="Try a broader search or clear a filter." /> : <div className="card-grid">{beats.map(beat => <BeatCard key={beat._id} beat={beat} />)}</div>}{more && <div className="load-more"><button className="button button--secondary" disabled={pending} onClick={() => loadMore('beats')}>{pending ? 'Loading…' : 'Load more beats'}</button></div>}</section></>}
  </div>;
}
