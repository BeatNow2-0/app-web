import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Beat } from '../types/api';
import { recordBeatView } from '../Model/api/posts';
import { canPlayBeat, getAudioUrl, getBeatId } from '../utils/entities';
interface PlayerValue {
  beat: Beat | null; playing: boolean; loading: boolean; error: string | null; currentTime: number; duration: number; volume: number;
  playBeat: (beat: Beat) => void; toggle: () => void; seek: (seconds: number) => void; setVolume: (volume: number) => void; close: () => void;
}
const PlayerContext = createContext<PlayerValue | null>(null);
export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null); const currentBeat = useRef<Beat | null>(null);
  const generation = useRef(0); const timer = useRef<ReturnType<typeof setTimeout> | null>(null); const viewed = useRef(new Set<string>());
  const [beat, setBeat] = useState<Beat | null>(null); const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0); const [duration, setDuration] = useState(0); const [volume, setVolumeState] = useState(0.8);
  const clearTimer = useCallback(() => { if (timer.current) clearTimeout(timer.current); timer.current = null; }, []);
  const fail = useCallback((message: string) => { clearTimer(); setError(message); setLoading(false); setPlaying(false); }, [clearTimer]);
  const close = useCallback(() => {
    generation.current++; clearTimer(); audioRef.current?.pause();
    if (audioRef.current) { audioRef.current.removeAttribute('src'); audioRef.current.load(); }
    currentBeat.current = null; setBeat(null); setCurrentTime(0); setDuration(0); setPlaying(false); setLoading(false); setError(null);
  }, [clearTimer]);
  const waitForAudio = useCallback(() => {
    clearTimer(); setLoading(true);
    timer.current = setTimeout(() => { audioRef.current?.pause(); fail('Audio timed out. Press play to retry.'); }, 20000);
  }, [clearTimer, fail]);
  useEffect(() => {
    const audio = new Audio(); audio.preload = 'metadata'; audio.volume = 0.8; audioRef.current = audio;
    const events: Record<string, () => void> = {
      timeupdate: () => setCurrentTime(audio.currentTime || 0), durationchange: () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0),
      waiting: waitForAudio,
      canplay: () => { clearTimer(); setLoading(false); },
      pause: () => setPlaying(false), ended: () => setPlaying(false),
      playing: () => {
        clearTimer(); setPlaying(true); setLoading(false); setError(null);
        const selected = currentBeat.current; const id = getBeatId(selected || {});
        if (selected && id && id !== 'local-preview' && !viewed.current.has(id)) {
          viewed.current.add(id); void recordBeatView(selected).catch(() => viewed.current.delete(id));
        }
      },
      error: () => fail('This audio is unavailable. Press play to retry or choose another beat.'),
    };
    for (const [event, handler] of Object.entries(events)) audio.addEventListener(event, handler);
    const expire = () => { viewed.current.clear(); close(); };
    window.addEventListener('beatnow:session-expired', expire);
    return () => { for (const [event, handler] of Object.entries(events)) audio.removeEventListener(event, handler); window.removeEventListener('beatnow:session-expired', expire); close(); audioRef.current = null; };
  }, [clearTimer, close, fail, waitForAudio]);
  const start = useCallback(() => {
    const audio = audioRef.current; if (!audio) return;
    const id = generation.current; setError(null); waitForAudio();
    void audio.play().catch(() => { if (generation.current === id) fail('Playback was blocked. Press play to retry.'); });
  }, [fail, waitForAudio]);
  const toggle = useCallback(() => {
    const audio = audioRef.current; if (!audio || !currentBeat.current) return;
    if (audio.paused) { if (audio.error) audio.load(); start(); } else { audio.pause(); clearTimer(); setLoading(false); }
  }, [start, clearTimer]);
  const playBeat = useCallback((next: Beat) => {
    const audio = audioRef.current; if (!audio) return;
    const url = getAudioUrl(next);
    if (!canPlayBeat(next) || !url) { close(); setBeat(next); fail(next.processing_status === 'processing' ? 'Preparando preview' : 'Preview no disponible'); return; }
    if (getBeatId(currentBeat.current || {}) === getBeatId(next) && audio.getAttribute('src') === url) { toggle(); return; }
    generation.current++; audio.pause(); currentBeat.current = next; setBeat(next); setCurrentTime(0); setDuration(0);
    audio.src = url; audio.load(); start();
  }, [close, fail, toggle, start]);
  const seek = useCallback((seconds: number) => { const audio = audioRef.current; if (audio && Number.isFinite(seconds) && Number.isFinite(audio.duration)) { audio.currentTime = Math.max(0, Math.min(seconds, audio.duration)); setCurrentTime(audio.currentTime); } }, []);
  const setVolume = useCallback((next: number) => { if (!Number.isFinite(next)) return; const value = Math.max(0, Math.min(1, next)); setVolumeState(value); if (audioRef.current) audioRef.current.volume = value; }, []);
  const value = useMemo(() => ({ beat, playing, loading, error, currentTime, duration, volume, playBeat, toggle, seek, setVolume, close }), [beat, playing, loading, error, currentTime, duration, volume, playBeat, toggle, seek, setVolume, close]);
  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}
export function usePlayer(): PlayerValue { const value = useContext(PlayerContext); if (!value) throw new Error('PlayerProvider is required'); return value; }
