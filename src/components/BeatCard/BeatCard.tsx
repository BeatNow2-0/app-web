import React, { useEffect, useState } from 'react';
import { Bookmark, Heart, Pause, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { licenseFor } from '../../constants/licenses';
import type { Beat } from '../../types/api';
import { usePlayer } from '../../contexts/PlayerContext';
import { setBeatLike, setBeatSaved } from '../../Model/api/posts';
import { canPlayBeat, formatCompactNumber, getBeatId, getCoverUrl } from '../../utils/entities';
import './BeatCard.css';

interface BeatCardProps {
  beat: Beat;
  interactive?: boolean;
  onChange?: (beat: Beat) => void;
  compact?: boolean;
}

export default function BeatCard({ beat, interactive = true, onChange, compact = false }: BeatCardProps) {
  const player = usePlayer();
  const active = getBeatId(player.beat || {}) === getBeatId(beat);
  const [localBeat, setLocalBeat] = useState(beat);
  const [error, setError] = useState('');
  const [pending, setPending] = useState<'like' | 'save' | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const playable = canPlayBeat(localBeat);
  useEffect(() => setLocalBeat(beat), [beat]);
  const update = (next: Beat) => { setLocalBeat(next); onChange?.(next) };

  const toggleLike = async () => {
    if (pending) return;
    const nextLiked = !localBeat.isLiked;
    const previous = localBeat;
    setError('');
    setPending('like');
    try { const result = await setBeatLike(localBeat, nextLiked); update({ ...previous, ...result.post, isLiked: nextLiked, isSaved: previous.isSaved }); } catch (err) { setError((err as Error).message); } finally { setPending(null); }
  };

  const toggleSave = async () => {
    if (pending) return;
    const nextSaved = !localBeat.isSaved;
    const previous = localBeat;
    setError('');
    setPending('save');
    try { const result = await setBeatSaved(localBeat, nextSaved); update({ ...previous, ...result.post, isSaved: nextSaved, isLiked: previous.isLiked }); } catch (err) { setError((err as Error).message); } finally { setPending(null); }
  };

  return (
    <article className={`beat-card ${compact ? 'beat-card--compact' : ''}`}>
      <div className="beat-card-cover">
        <img src={imageFailed ? '/cover-fallback.svg' : getCoverUrl(localBeat)} onError={() => setImageFailed(true)} alt={`${localBeat.title} cover`} loading="lazy" />
        <button type="button" onClick={() => player.playBeat(localBeat)} disabled={!playable} aria-label={`${active && player.playing ? 'Pause' : 'Play'} ${localBeat.title}`}>
          {active && player.loading ? <span className="mini-spinner" /> : active && player.playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
        </button>
      </div>
      <div className="beat-card-body">
        <div className="beat-card-heading"><div><h3>{localBeat.title}</h3><p><Link to={`/profile/${localBeat.user_id}`}>{localBeat.creator_username || 'View producer'}</Link></p></div>{localBeat.bpm ? <span>{localBeat.bpm} BPM</span> : null}</div>
        {!playable && <p className="preview-status" role="status">{localBeat.processing_status === 'processing' ? 'Preparando preview' : 'Preview no disponible'}</p>}
        {!compact && <div className="beat-card-tags">{localBeat.genre && <span>{localBeat.genre}</span>}{(localBeat.tags || []).slice(0, 2).map((tag) => <span key={tag}>{tag.startsWith('#') ? tag : `#${tag}`}</span>)}</div>}
        <details className="beat-license"><summary>{licenseFor(localBeat).label}</summary><p>{licenseFor(localBeat).terms}</p>{localBeat.license_terms && <p>Producer notes: {localBeat.license_terms}</p>}<Link to={`/profile/${localBeat.user_id}`}>View producer</Link></details>
        <Link className="write-lyrics" to={`/lyrics?beat=${getBeatId(localBeat)}`}>Write lyrics</Link>
        {error && <p role="alert" className="field-error">{error}</p>}
        <div className="beat-card-actions">
          <span>{formatCompactNumber(playable ? localBeat.views || localBeat.plays || 0 : 0)} plays</span>
          <div>
            <button type="button" className={localBeat.isLiked ? 'is-active' : ''} disabled={!interactive || !playable || Boolean(pending)} onClick={toggleLike} aria-label={localBeat.isLiked ? 'Unlike beat' : 'Like beat'}><Heart size={18} fill={localBeat.isLiked ? 'currentColor' : 'none'} /><span>{localBeat.likes}</span></button>
            <button type="button" className={localBeat.isSaved ? 'is-active' : ''} disabled={!interactive || Boolean(pending)} onClick={toggleSave} aria-label={localBeat.isSaved ? 'Remove from library' : 'Save to library'}><Bookmark size={18} fill={localBeat.isSaved ? 'currentColor' : 'none'} /><span>{localBeat.saves}</span></button>
          </div>
        </div>
      </div>
    </article>
  );
}
