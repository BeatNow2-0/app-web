import axios from 'axios';
import { buildApiUrl } from '../../config/apiConfig';

export interface BeatPost {
  _id: string;
  title: string;
  publication_date: string;
  likes: number;
  saves: number;
  views?: number;
  plays?: number;
  plays_7d?: number;
  likes_7d?: number;
  saves_7d?: number;
  tags?: string[];
  genre?: string;
  moods?: string[];
  instruments?: string[];
  bpm?: number;
  description?: string;
  user_id: string;
  audio_format?: string;
  cover_format?: string;
  cover_image_url?: string;
  audio_url?: string;
  price?: number;
  sales_count?: number;
}

export interface BeatUpdatePayload {
  title: string;
  description: string;
  genre: string;
  bpm: number | '';
  tags: string[];
  moods: string[];
  instruments: string[];
  coverFile?: File | null;
}

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    if (Array.isArray(detail) && detail.length > 0) {
      return detail.map((item) => item.msg || 'Validation error').join(', ');
    }
  }
  return fallback;
};

const normalizeStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value !== 'string') {
    return [];
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
  } catch {
    return trimmed
      .split(',')
      .map((item) => item.replace(/[[\]"]/g, '').trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeBeatPost = (beat: any): BeatPost => ({
  ...beat,
  tags: normalizeStringArray(beat?.tags),
  moods: normalizeStringArray(beat?.moods),
  instruments: normalizeStringArray(beat?.instruments),
  genre: typeof beat?.genre === 'string' ? beat.genre.replace(/[[\]"]/g, '').trim() : beat?.genre,
  bpm:
    typeof beat?.bpm === 'string'
      ? Number.parseInt(beat.bpm.replace(/[^\d]/g, ''), 10) || undefined
      : beat?.bpm,
});

export async function fetchProducerPosts(token: string, username: string): Promise<BeatPost[]> {
  try {
    const response = await axios.get<BeatPost[]>(buildApiUrl(`/v1/api/users/posts/${username}`), {
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return (response.data || []).map(normalizeBeatPost);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to fetch beats.'));
  }
}

export async function updateBeat(token: string, postId: string, payload: BeatUpdatePayload): Promise<BeatPost> {
  const formData = new FormData();
  formData.append('title', payload.title);
  formData.append('description', payload.description);
  formData.append('genre', payload.genre);
  if (payload.bpm !== '') {
    formData.append('bpm', String(payload.bpm));
  }
  formData.append('tags', JSON.stringify(payload.tags));
  formData.append('moods', JSON.stringify(payload.moods));
  formData.append('instruments', JSON.stringify(payload.instruments));

  if (payload.coverFile) {
    formData.append('cover_file', payload.coverFile);
  }

  try {
    const response = await axios.put<BeatPost>(buildApiUrl(`/v1/api/posts/update/${postId}`), formData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return normalizeBeatPost(response.data);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to update beat.'));
  }
}
