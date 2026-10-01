import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BeatCard from '../../components/BeatCard/BeatCard';
import { CardSkeleton, EmptyState, ErrorState } from '../../components/States/EmptyState';
import { fetchSavedBeats } from '../../Model/api/discovery';
import type { Beat } from '../../types/api';

const PAGE_SIZE = 20;
export default function LibraryPage() {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async (reset = false) => {
    setError(''); if (reset) setLoading(true);
    try {
      const next = await fetchSavedBeats(PAGE_SIZE, reset ? 0 : beats.length);
      setBeats((current) => reset ? next : [...current, ...next]); setMore(next.length === PAGE_SIZE);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load your library.') }
    finally { setLoading(false) }
  }, [beats.length]);
  useEffect(() => { const controller = new AbortController(); fetchSavedBeats(PAGE_SIZE, 0, controller.signal).then((next) => { setBeats(next); setMore(next.length === PAGE_SIZE) }).catch((err) => { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Unable to load your library.') }).finally(() => { if (!controller.signal.aborted) setLoading(false) }); return () => controller.abort() }, []);
  return <div className="page"><header className="page-header"><div><p className="page-eyebrow">Your collection</p><h1 className="page-title">Saved beats</h1><p className="page-subtitle">The tracks you want to revisit, all in one place.</p></div></header>{loading ? <CardSkeleton count={8} /> : error ? <ErrorState message={error} onRetry={() => load(true)} /> : beats.length === 0 ? <EmptyState title="Your library is quiet" message="Save beats while exploring and they will appear here." action={<Link className="button" to="/explore">Explore beats</Link>} /> : <><div className="card-grid">{beats.map((beat) => <BeatCard key={beat._id} beat={{ ...beat, isSaved: true }} onChange={(next) => setBeats((items) => next.isSaved === false ? items.filter((item) => item._id !== next._id) : items.map((item) => item._id === next._id ? next : item))} />)}</div>{more && <div className="load-more"><button className="button button--secondary" type="button" onClick={() => load(false)}>Load more</button></div>}</>}</div>;
}
