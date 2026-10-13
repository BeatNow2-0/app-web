import type { Beat, User } from '../../types/api';
import { normalizeBeat } from '../../utils/entities';
import { apiClient, getApiErrorMessage } from './client';

export interface SearchFilters { genre?: string; bpm_min?: string; bpm_max?: string; moods?: string; instruments?: string; tags?: string; license_type?: string }
export async function searchBeats(query: string, limit = 20, skip = 0, signal?: AbortSignal, filters: SearchFilters = {}): Promise<Beat[]> {
  try {
    const { data } = await apiClient.get<Beat[]>('/v1/api/search/search_posts', {
      params: { ...filters, search: query || undefined, limit: Math.min(limit, 100), skip }, signal,
    });
    return data.map(normalizeBeat);
  } catch (error) { throw new Error(getApiErrorMessage(error, 'Unable to search beats.'), { cause: error }) }
}

export async function searchUsers(username: string, limit = 12, skip = 0, signal?: AbortSignal): Promise<User[]> {
  if (!username.trim()) return [];
  try {
    const { data } = await apiClient.get<User[]>('/v1/api/search/user/', {
      params: { username, limit: Math.min(limit, 100), skip }, signal,
    });
    return data;
  } catch (error) { throw new Error(getApiErrorMessage(error, 'Unable to search creators.'), { cause: error }) }
}

export async function fetchSavedBeats(limit = 20, skip = 0, signal?: AbortSignal): Promise<Beat[]> {
  try {
    const { data } = await apiClient.get<{ saved_posts: Beat[] }>('/v1/api/users/saved-posts', {
      params: { limit: Math.min(limit, 100), skip }, signal,
    });
    return (data.saved_posts || []).map(normalizeBeat);
  } catch (error) { throw new Error(getApiErrorMessage(error, 'Unable to load saved beats.'), { cause: error }) }
}

export async function setFollow(userId: string, following: boolean): Promise<void> {
  try {
    if (following) await apiClient.post(`/v1/api/follows/follow/${encodeURIComponent(userId)}`);
    else await apiClient.delete(`/v1/api/follows/unfollow/${encodeURIComponent(userId)}`);
  } catch (error) { throw new Error(getApiErrorMessage(error, 'Unable to update this follow.'), { cause: error }) }
}

export async function fetchConnections(id: string, kind: 'followers' | 'following', skip = 0): Promise<User[]> {
  try { const { data } = await apiClient.get(`/v1/api/follows/${kind}/${encodeURIComponent(id)}`, { params: { skip, limit: 20 } }); return data[kind]; }
  catch (error) { throw new Error(getApiErrorMessage(error), { cause: error }); }
}
