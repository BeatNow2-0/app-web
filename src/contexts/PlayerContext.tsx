import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Beat } from '../types/api';
import { recordBeatView } from '../Model/api/posts';
import { getAudioUrl, getBeatId } from '../utils/entities';

interface PlayerValue {
  beat: Beat | null;
  playing: boolean;
  loading: boolean;
  error: string | null;
  currentTime: number;
  duration: number;
  volume: number;
  playBeat: (beat: Beat) => void;
  toggle: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  close: () => void;
}

const PlayerContext = createContext<PlayerValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const viewedRef = useRef(new Set<string>());
  const [beat, setBeat] = useState<Beat | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volumeState, setVolumeState] = useState(0.8);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = volumeState;
    audioRef.current = audio;

    const onTime = () => setCurrentTime(audio.currentTime || 0);
    const onDuration = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onWaiting = () => setLoading(true);
    const onCanPlay = () => setLoading(false);
    const onPause = () => setPlaying(false);
    const onPlay = () => { setPlaying(true); setLoading(false) };
    const onEnded = () => setPlaying(false);
    const onError = () => { setLoading(false); setPlaying(false); setError('This audio could not be played.') };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('durationchange', onDuration);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    return () => {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('durationchange', onDuration);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audioRef.current = null;
    };
  }, []);

  const playBeat = useCallback((nextBeat: Beat) => {
    const audio = audioRef.current;
    const url = getAudioUrl(nextBeat);
    if (!audio || !url) { setError('This beat does not have a playable audio URL.'); return }
    const nextId = getBeatId(nextBeat);
    if (getBeatId(beat || {}) === nextId && audio.src) {
      if (audio.paused) void audio.play(); else audio.pause();
      return;
    }
    setBeat(nextBeat);
    setError(null);
    setCurrentTime(0);
    setDuration(0);
    setLoading(true);
    audio.src = url;
    audio.load();
    void audio.play().catch(() => {
      setLoading(false);
      setPlaying(false);
      setError('Playback was blocked. Press play to try again.');
    });
    if (nextId && !viewedRef.current.has(nextId)) {
      viewedRef.current.add(nextId);
      void recordBeatView(nextBeat).catch(() => viewedRef.current.delete(nextId));
    }
  }, [beat]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;
    if (audio.paused) void audio.play(); else audio.pause();
  }, []);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (audio && Number.isFinite(seconds)) audio.currentTime = Math.max(0, Math.min(seconds, audio.duration || seconds));
  }, []);

  const setVolume = useCallback((volume: number) => {
    const normalized = Math.max(0, Math.min(1, volume));
    setVolumeState(normalized);
    if (audioRef.current) audioRef.current.volume = normalized;
  }, []);

  const close = useCallback(() => {
    audioRef.current?.pause();
    if (audioRef.current) { audioRef.current.removeAttribute('src'); audioRef.current.load() }
    setBeat(null); setCurrentTime(0); setDuration(0); setError(null);
  }, []);

  const value = useMemo(() => ({ beat, playing, loading, error, currentTime, duration, volume: volumeState, playBeat, toggle, seek, setVolume, close }),
    [beat, playing, loading, error, currentTime, duration, volumeState, playBeat, toggle, seek, setVolume, close]);
  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerValue {
  const value = useContext(PlayerContext);
  if (!value) throw new Error('usePlayer must be used within PlayerProvider');
  return value;
}
