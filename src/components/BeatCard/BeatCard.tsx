import React, { useEffect, useState } from 'react';
import { Bookmark, Heart, Pause, Play } from 'lucide-react';
import type { Beat } from '../../types/api';
import { usePlayer } from '../../contexts/PlayerContext';
import { setBeatLike, setBeatSaved } from '../../Model/api/posts';
import { formatCompactNumber, getBeatId, getCoverUrl } from '../../utils/entities';
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
  const [pending, setPending] = useState<'like' | 'save' | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setLocalBeat(beat), [beat]);
  const update = (next: Beat) => { setLocalBeat(next); onChange?.(next) };

  const toggleLike = async () => {
    if (pending) return;
    const nextLiked = !localBeat.isLiked;
    const previous = localBeat;
    update({ ...localBeat, isLiked: nextLiked, likes: Math.max(0, localBeat.likes + (nextLiked ? 1 : -1)) });
    setPending('like');
    try { await setBeatLike(localBeat, nextLiked) } catch { update(previous) } finally { setPending(null) }
  };

  const toggleSave = async () => {
    if (pending) return;
    const nextSaved = !localBeat.isSaved;
    const previous = localBeat;
    update({ ...localBeat, isSaved: nextSaved, saves: Math.max(0, localBeat.saves + (nextSaved ? 1 : -1)) });
    setPending('save');
    try { await setBeatSaved(localBeat, nextSaved) } catch { update(previous) } finally { setPending(null) }
  };

  return (
    <article className={`beat-card ${compact ? 'beat-card--compact' : ''}`}>
      <div className="beat-card-cover">
        <img src={imageFailed ? '/cover-fallback.svg' : getCoverUrl(localBeat)} onError={() => setImageFailed(true)} alt={`${localBeat.title} cover`} loading="lazy" />
        <button type="button" onClick={() => player.playBeat(localBeat)} disabled={!localBeat.audio_url} aria-label={`${active && player.playing ? 'Pause' : 'Play'} ${localBeat.title}`}>
          {active && player.loading ? <span className="mini-spinner" /> : active && player.playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
        </button>
      </div>
      <div className="beat-card-body">
        <div className="beat-card-heading"><div><h3>{localBeat.title}</h3><p>{localBeat.creator_username || 'BeatNow creator'}</p></div>{localBeat.bpm ? <span>{localBeat.bpm} BPM</span> : null}</div>
        {!compact && <div className="beat-card-tags">{localBeat.genre && <span>{localBeat.genre}</span>}{(localBeat.tags || []).slice(0, 2).map((tag) => <span key={tag}>{tag.startsWith('#') ? tag : `#${tag}`}</span>)}</div>}
        <div className="beat-card-actions">
          <span>{formatCompactNumber(localBeat.views || localBeat.plays || 0)} plays</span>
          <div>
            <button type="button" className={localBeat.isLiked ? 'is-active' : ''} disabled={!interactive || Boolean(pending)} onClick={toggleLike} aria-label={localBeat.isLiked ? 'Unlike beat' : 'Like beat'}><Heart size={18} fill={localBeat.isLiked ? 'currentColor' : 'none'} /><span>{localBeat.likes}</span></button>
            <button type="button" className={localBeat.isSaved ? 'is-active' : ''} disabled={!interactive || Boolean(pending)} onClick={toggleSave} aria-label={localBeat.isSaved ? 'Remove from library' : 'Save to library'}><Bookmark size={18} fill={localBeat.isSaved ? 'currentColor' : 'none'} /><span>{localBeat.saves}</span></button>
          </div>
        </div>
      </div>
    </article>
  );
}
