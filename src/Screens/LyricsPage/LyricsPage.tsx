import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listLyrics, saveLyric, deleteLyric, type Lyric, type LyricInput } from '../../Model/api/lyrics';
import { fetchBeat } from '../../Model/api/posts';
import { searchBeats } from '../../Model/api/discovery';
import type { Beat } from '../../types/api';
import { getBeatId } from '../../utils/entities';
import { usePlayer } from '../../contexts/PlayerContext';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import './LyricsPage.css';
const blank: LyricInput = { title: '', lyrics: '', post_id: null };
export default function LyricsPage() {
  const [params] = useSearchParams(); const player = usePlayer();
  const [items, setItems] = useState<Lyric[]>([]); const [selected, setSelected] = useState<Lyric | null>(null);
  const [draft, setDraft] = useState<LyricInput>(blank); const [saved, setSaved] = useState(JSON.stringify(blank));
  const [beat, setBeat] = useState<Beat | null>(null); const [query, setQuery] = useState(''); const [results, setResults] = useState<Beat[]>([]);
  const [busy, setBusy] = useState(false); const [loading, setLoading] = useState(true); const [more, setMore] = useState(false);
  const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const offset = useRef(0); const dirty = JSON.stringify(draft) !== saved; useUnsavedChanges(dirty);
  const load = async (reset = false) => {
    setLoading(true); setError('');
    try { const next = await listLyrics(reset ? 0 : offset.current); setItems(current => reset ? next : [...current, ...next]); offset.current = (reset ? 0 : offset.current) + next.length; setMore(next.length === 20); }
    catch (err) { setError((err as Error).message); } finally { setLoading(false); }
  };
  useEffect(() => { void load(true); }, []);
  useEffect(() => {
    const id = params.get('beat'); if (id) setDraft(current => ({ ...current, post_id: id }));
  }, [params]);
  useEffect(() => {
    setBeat(null); if (!draft.post_id) return;
    const controller = new AbortController();
    fetchBeat(draft.post_id, controller.signal).then(setBeat).catch(err => { if (!controller.signal.aborted) setError(err.message); });
    return () => controller.abort();
  }, [draft.post_id]);
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const controller = new AbortController();
    const timer = setTimeout(() => { searchBeats(query, 10, 0, controller.signal).then(next => { if (!controller.signal.aborted) setResults(next); }).catch(err => { if (!controller.signal.aborted) setError(err.message); }); }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);
  const choose = (lyric: Lyric | null) => {
    if (dirty && !confirm('Discard unsaved changes?')) return;
    const next = lyric ? { title: lyric.title, lyrics: lyric.lyrics, post_id: lyric.post_id } : blank;
    setSelected(lyric); setDraft(next); setSaved(JSON.stringify(next)); setError(''); setNotice('');
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); if (busy) return; setBusy(true); setError('');
    try {
      const next = await saveLyric({ ...draft, title: draft.title.trim() }, selected?._id);
      setItems(current => selected ? current.map(item => item._id === next._id ? next : item) : [next, ...current]);
      if (!selected) offset.current++;
      setSelected(next); const confirmed = { title: next.title, lyrics: next.lyrics, post_id: next.post_id };
      setDraft(confirmed); setSaved(JSON.stringify(confirmed)); setNotice('Saved to your account.');
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!selected || busy || !confirm('Delete this lyric? This cannot be undone.')) return;
    setBusy(true); setError('');
    try { await deleteLyric(selected._id); setItems(current => current.filter(item => item._id !== selected._id)); offset.current = Math.max(0, offset.current - 1); setSelected(null); setDraft(blank); setSaved(JSON.stringify(blank)); setNotice('Lyric deleted.'); }
    catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  };
  return <div className="page"><header className="page-header"><div><p className="page-eyebrow">Writing room</p><h1 className="page-title">Your lyrics</h1><p>Private drafts, connected to the beat you choose.</p></div><button className="button" disabled={busy} onClick={() => choose(null)}>New lyric</button></header>
    {error && <div role="alert" className="error-state"><p>{error}</p><button className="button button--secondary" onClick={() => load(true)} disabled={loading}>Reload list</button></div>}
    <div className="lyrics-workspace"><aside aria-label="Saved lyrics">{loading && <p role="status">Loading lyrics…</p>}{!loading && !items.length && <p>No lyrics yet. Write your first verse.</p>}{items.map(item => <button className="lyric-item" key={item._id} onClick={() => choose(item)} disabled={busy} aria-current={selected?._id === item._id}>{item.title}</button>)}{more && <button className="button button--secondary" disabled={loading} onClick={() => load()}>Load more lyrics</button>}</aside>
      <form onSubmit={save} className="lyric-editor"><fieldset disabled={busy}><label>Title<input className="field-control" required maxLength={120} value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} /></label>
        <div className="lyric-beat"><strong>{beat?.title || (draft.post_id ? 'Associated beat unavailable' : 'No beat selected')}</strong>{beat && <button className="button button--secondary" type="button" onClick={() => player.playBeat(beat)}>Play / pause beat</button>}{draft.post_id && <button type="button" className="button button--secondary" onClick={() => setDraft({ ...draft, post_id: null })}>Unlink beat</button>}</div>
        <label>Find a beat<input className="field-control" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by title or tag" /></label>{results.length > 0 && <ul className="beat-picker">{results.map(item => <li key={getBeatId(item)}><button type="button" onClick={() => { setDraft({ ...draft, post_id: getBeatId(item) }); setQuery(''); }}>{item.title} · {item.bpm || '—'} BPM</button></li>)}</ul>}
        <label>Lyrics<textarea className="field-control lyric-text" rows={16} maxLength={50000} value={draft.lyrics} onChange={e => setDraft({ ...draft, lyrics: e.target.value })} placeholder="Start with a line…" /></label>
        <p role="status">{dirty ? 'Unsaved changes — save before leaving.' : notice || 'All changes saved.'}</p><div className="lyric-actions"><button className="button" disabled={busy || !draft.title.trim()}>{busy ? 'Saving…' : 'Save lyric'}</button>{selected && <button className="button button--danger" type="button" onClick={remove}>Delete lyric</button>}</div>
      </fieldset></form></div></div>;
}
