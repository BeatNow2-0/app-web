import React from 'react';
import { Pause, Play, Volume2, X } from 'lucide-react';
import { usePlayer } from '../../contexts/PlayerContext';
import { getCoverUrl } from '../../utils/entities';
import './GlobalPlayer.css';

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
};

export default function GlobalPlayer() {
  const player = usePlayer();
  if (!player.beat) return null;
  return (
    <section className="global-player" aria-label="Now playing">
      <img src={getCoverUrl(player.beat)} alt="" />
      <div className="player-track-copy">
        <strong>{player.beat.title}</strong>
        <span>{player.beat.creator_username || 'BeatNow creator'}</span>
      </div>
      <button className="player-main-control" type="button" onClick={player.toggle} aria-label={player.playing ? 'Pause' : 'Play'}>
        {player.loading ? <span className="mini-spinner" /> : player.playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
      </button>
      <span className="player-time">{formatTime(player.currentTime)}</span>
      <input className="player-progress" aria-label="Playback position" type="range" min={0} max={player.duration || 0} step={0.1} value={Math.min(player.currentTime, player.duration || 0)} onChange={(e) => player.seek(Number(e.target.value))} />
      <span className="player-time">{formatTime(player.duration)}</span>
      <div className="player-volume"><Volume2 size={18} /><input aria-label="Volume" type="range" min={0} max={1} step={0.05} value={player.volume} onChange={(e) => player.setVolume(Number(e.target.value))} /></div>
      {player.error && <span className="player-error" title={player.error}>Audio error</span>}
      <button className="player-close" type="button" onClick={player.close} aria-label="Close player"><X size={18} /></button>
    </section>
  );
}
