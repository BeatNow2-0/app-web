import type { Beat, User } from '../types/api';

export function safeMediaUrl(value: unknown, allowBlob = false): string | null {
  if (typeof value !== 'string' || !value || value.includes('\\')) return null;
  if (/^\/(?!\/)/.test(value)) return value;
  if (allowBlob && value.startsWith('blob:')) return value;
  try {
    const url = new URL(value);
    if (url.username || url.password) return null;
    if (url.protocol === 'https:' || (import.meta.env.DEV && url.protocol === 'http:')) return value;
  } catch { /* invalid URL */ }
  return null;
}

export const DEFAULT_AVATAR_URL = '/avatar-fallback.svg';
export const DEFAULT_COVER_URL = '/cover-fallback.svg';

export function getUserId(user: Pick<User, '_id' | 'id'>): string {
  return user._id ?? user.id ?? '';
}

export function getBeatId(beat: Pick<Beat, '_id' | 'id' | 'post_id' | 'beat_id'>): string {
  return beat._id ?? beat.id ?? beat.post_id ?? beat.beat_id ?? '';
}

export function getAvatarUrl(user?: Partial<User> | null): string {
  return safeMediaUrl(user?.profile_image_url) || safeMediaUrl(user?.photo_profile) || DEFAULT_AVATAR_URL;
}

export function getCoverUrl(beat?: Partial<Beat> | null): string {
  return safeMediaUrl(beat?.cover_image_url, beat?.id === 'local-preview') || safeMediaUrl(beat?.caratula) || DEFAULT_COVER_URL;
}

export function getAudioUrl(beat?: Partial<Beat> | null): string | null {
  return safeMediaUrl(beat?.preview_url, beat?.id === 'local-preview') || safeMediaUrl(beat?.audio_url, beat?.id === 'local-preview');
}

export function canPlayBeat(beat?: Partial<Beat> | null): boolean {
  return Boolean(beat && (beat.id === 'local-preview' || beat.processing_status === 'ready') && getAudioUrl(beat));
}

export function getBeatPlayCount(beat: Partial<Beat>): number {
  return canPlayBeat(beat) ? Number(beat.views || beat.plays || 0) : 0;
}

export function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String).map((item) => item.trim()).filter(Boolean);
  } catch {
    // Legacy comma-separated values remain readable during migration.
  }
  return value.split(',').map((item) => item.replace(/[[\]"]/g, '').trim()).filter(Boolean);
}

export function normalizeBeat(raw: unknown): Beat {
  const beat = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const id = String(beat._id ?? beat.id ?? beat.post_id ?? beat.beat_id ?? '');
  if (!id || typeof beat.title !== 'string' || typeof beat.user_id !== 'string') throw new Error('The server returned an invalid beat. Please reload.');
  const rawBpm = beat.bpm;
  const bpm = typeof rawBpm === 'string' ? Number.parseInt(rawBpm.replace(/[^\d]/g, ''), 10) : rawBpm;
  const publicBeatFields = new Set([
    '_id', 'id', 'post_id', 'beat_id', 'title', 'description', 'publication_date', 'likes', 'saves', 'views', 'plays',
    'processing_status', 'plays_7d', 'likes_7d', 'saves_7d', 'tags', 'genre', 'moods', 'instruments', 'bpm', 'user_id',
    'creator_username', 'audio_format', 'cover_format', 'cover_image_url', 'preview_url', 'audio_url', 'caratula',
    'isLiked', 'isSaved', 'price', 'sales_count', 'visibility', 'license_type', 'license_terms', 'musical_key',
  ]);
  const safeFields = Object.fromEntries(Object.entries(beat).filter(([key]) => publicBeatFields.has(key)));
  const processingStatus = ['processing', 'ready', 'failed'].includes(String(beat.processing_status)) ? beat.processing_status as Beat['processing_status'] : undefined;
  return {
    ...(safeFields as unknown as Beat),
    _id: id || undefined,
    id: id || undefined,
    title: typeof beat.title === 'string' ? beat.title : 'Untitled beat',
    publication_date: typeof beat.publication_date === 'string' ? beat.publication_date : new Date(0).toISOString(),
    user_id: typeof beat.user_id === 'string' ? beat.user_id : '',
    likes: Math.max(0, Number(beat.likes) || 0),
    saves: Math.max(0, Number(beat.saves) || 0),
    views: Number(beat.views) || 0,
    plays: Number(beat.plays ?? beat.views) || 0,
    bpm: typeof bpm === 'number' && Number.isFinite(bpm) ? bpm : undefined,
    genre: typeof beat.genre === 'string' ? beat.genre.replace(/[[\]"]/g, '').trim() : undefined,
    tags: normalizeStringArray(beat.tags),
    moods: normalizeStringArray(beat.moods),
    instruments: normalizeStringArray(beat.instruments),
    processing_status: processingStatus,
    cover_image_url: typeof beat.cover_image_url === 'string' ? beat.cover_image_url : null,
    caratula: typeof beat.caratula === 'string' ? beat.caratula : null,
    preview_url: safeMediaUrl(beat.preview_url),
    audio_url: safeMediaUrl(beat.audio_url),
  };
}

export function formatCompactNumber(value = 0): string {
  return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(Math.max(0, value));
}
