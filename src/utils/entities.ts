import type { Beat, User } from '../types/api';

export const DEFAULT_AVATAR_URL = '/avatar-fallback.svg';
export const DEFAULT_COVER_URL = '/cover-fallback.svg';

export function getUserId(user: Pick<User, '_id' | 'id'>): string {
  return user._id ?? user.id ?? '';
}

export function getBeatId(beat: Pick<Beat, '_id' | 'id' | 'post_id' | 'beat_id'>): string {
  return beat._id ?? beat.id ?? beat.post_id ?? beat.beat_id ?? '';
}

export function getAvatarUrl(user?: Partial<User> | null): string {
  return user?.profile_image_url || user?.photo_profile || DEFAULT_AVATAR_URL;
}

export function getCoverUrl(beat?: Partial<Beat> | null): string {
  return beat?.cover_image_url || beat?.caratula || DEFAULT_COVER_URL;
}

export function getAudioUrl(beat?: Partial<Beat> | null): string | null {
  return beat?.audio_url || null;
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
  return value.split(',').map((item) => item.replace(/[\[\]"]/g, '').trim()).filter(Boolean);
}

export function normalizeBeat(raw: unknown): Beat {
  const beat = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const id = String(beat._id ?? beat.id ?? beat.post_id ?? beat.beat_id ?? '');
  const rawBpm = beat.bpm;
  const bpm = typeof rawBpm === 'string' ? Number.parseInt(rawBpm.replace(/[^\d]/g, ''), 10) : rawBpm;
  return {
    ...(beat as unknown as Beat),
    _id: id || undefined,
    id: id || undefined,
    title: typeof beat.title === 'string' ? beat.title : 'Untitled beat',
    publication_date: typeof beat.publication_date === 'string' ? beat.publication_date : new Date(0).toISOString(),
    user_id: typeof beat.user_id === 'string' ? beat.user_id : '',
    likes: Number(beat.likes) || 0,
    saves: Number(beat.saves) || 0,
    views: Number(beat.views) || 0,
    plays: Number(beat.plays ?? beat.views) || 0,
    bpm: typeof bpm === 'number' && Number.isFinite(bpm) ? bpm : undefined,
    genre: typeof beat.genre === 'string' ? beat.genre.replace(/[\[\]"]/g, '').trim() : undefined,
    tags: normalizeStringArray(beat.tags),
    moods: normalizeStringArray(beat.moods),
    instruments: normalizeStringArray(beat.instruments),
    cover_image_url: typeof beat.cover_image_url === 'string' ? beat.cover_image_url : null,
    caratula: typeof beat.caratula === 'string' ? beat.caratula : null,
    audio_url: typeof beat.audio_url === 'string' ? beat.audio_url : null,
  };
}

export function formatCompactNumber(value = 0): string {
  return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(Math.max(0, value));
}
