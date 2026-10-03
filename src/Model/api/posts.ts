import type { AxiosProgressEvent } from 'axios';
import axios from 'axios';
import type { Beat, InteractionResponse } from '../../types/api';
import { getBeatId, normalizeBeat } from '../../utils/entities';
import { apiClient, getApiErrorMessage } from './client';

export type BeatPost = Beat;
export interface BeatUpdatePayload {
  title: string; description: string; genre: string; bpm: number | '';
  tags: string[]; moods: string[]; instruments: string[]; coverFile?: File | null;
}
export interface BeatUploadPayload extends BeatUpdatePayload { bpm: number; coverFile: File; audioFile: File }
export interface BeatFromAnalysisPayload {
  analysis_id: string;
  title: string;
  description: string;
  genre: string;
  bpm: number;
  tags: string[];
  moods: string[];
  instruments: string[];
  preview_start?: number;
  preview_end?: number;
}
export class BeatAnalysisExpiredError extends Error {
  constructor() { super('This analysis has expired. Please analyze the audio again. Your form details are still here.'); this.name = 'BeatAnalysisExpiredError'; }
}

function appendMetadata(formData: FormData, payload: BeatUpdatePayload): void {
  formData.append('title', payload.title);
  formData.append('description', payload.description);
  formData.append('genre', payload.genre);
  if (payload.bpm !== '') formData.append('bpm', String(payload.bpm));
  formData.append('tags', JSON.stringify(payload.tags));
  formData.append('moods', JSON.stringify(payload.moods));
  formData.append('instruments', JSON.stringify(payload.instruments));
}

export async function fetchProducerPosts(_token: string, username: string, limit = 50, skip = 0, signal?: AbortSignal): Promise<BeatPost[]> {
  try {
    const { data } = await apiClient.get<Beat[]>(`/v1/api/users/posts/${encodeURIComponent(username)}`, {
      params: { limit: Math.min(limit, 100), skip }, signal,
    });
    return (data || []).map(normalizeBeat);
  } catch (error) { throw new Error(getApiErrorMessage(error, 'Unable to load beats.')) }
}

export async function fetchFeed(limit = 8, excludeIds: string[] = [], signal?: AbortSignal): Promise<BeatPost[]> {
  try {
    const { data } = await apiClient.get<Beat[]>('/v1/api/posts/feed', {
      params: { limit: Math.min(limit, 20), exclude_ids: excludeIds.join(',') || undefined }, signal,
    });
    return (data || []).map(normalizeBeat);
  } catch (error) { throw new Error(getApiErrorMessage(error, 'Unable to load the feed.')) }
}

export async function updateBeat(_token: string, postId: string, payload: BeatUpdatePayload): Promise<BeatPost> {
  const formData = new FormData(); appendMetadata(formData, payload);
  if (payload.coverFile) formData.append('cover_file', payload.coverFile, payload.coverFile.name);
  try {
    const { data } = await apiClient.put<Beat>(`/v1/api/posts/update/${encodeURIComponent(postId)}`, formData);
    return normalizeBeat(data);
  } catch (error) { throw new Error(getApiErrorMessage(error, 'Unable to update this beat.')) }
}

export async function uploadBeat(payload: BeatUploadPayload, options: { signal?: AbortSignal; onProgress?: (value: number) => void } = {}): Promise<BeatPost> {
  const formData = new FormData(); appendMetadata(formData, payload);
  formData.append('cover_file', payload.coverFile, payload.coverFile.name);
  formData.append('audio_file', payload.audioFile, payload.audioFile.name);
  try {
    const { data } = await apiClient.post<Beat>('/v1/api/posts/upload', formData, {
      signal: options.signal, timeout: 10 * 60 * 1000,
      onUploadProgress: (event: AxiosProgressEvent) => {
        if (event.total) options.onProgress?.(Math.round((event.loaded / event.total) * 100));
      },
    });
    return normalizeBeat(data);
  } catch (error) { throw new Error(getApiErrorMessage(error, 'Unable to publish this beat.')) }
}

export async function publishBeatFromAnalysis(payload: BeatFromAnalysisPayload, options: { signal?: AbortSignal } = {}): Promise<BeatPost> {
  try {
    const { data } = await apiClient.post<Beat>('/api/v1/beats/from-analysis', payload, { timeout: 10 * 60 * 1000, signal: options.signal });
    return normalizeBeat(data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const body = error.response?.data;
      const detail = body && typeof body === 'object' ? JSON.stringify(body).toLowerCase() : '';
      if (error.response?.status === 410 || detail.includes('analysis_expired') || detail.includes('analysis expired')) throw new BeatAnalysisExpiredError();
    }
    throw new Error(getApiErrorMessage(error, 'Unable to publish this analyzed beat.'));
  }
}

export async function deleteBeat(_token: string, postId: string): Promise<void> {
  try { await apiClient.delete(`/v1/api/posts/${encodeURIComponent(postId)}`) }
  catch (error) { throw new Error(getApiErrorMessage(error, 'Unable to delete this beat.')) }
}

export async function setBeatLike(beat: Beat, liked: boolean): Promise<InteractionResponse> {
  const id = encodeURIComponent(getBeatId(beat));
  try {
    return liked
      ? (await apiClient.post<InteractionResponse>(`/v1/api/interactions/like/${id}`)).data
      : (await apiClient.delete<InteractionResponse>(`/v1/api/interactions/unlike/${id}`)).data;
  } catch (error) { throw new Error(getApiErrorMessage(error, 'Unable to update the like.')) }
}

export async function setBeatSaved(beat: Beat, saved: boolean): Promise<InteractionResponse> {
  const id = encodeURIComponent(getBeatId(beat));
  try {
    return saved
      ? (await apiClient.post<InteractionResponse>(`/v1/api/interactions/save/${id}`)).data
      : (await apiClient.delete<InteractionResponse>(`/v1/api/interactions/unsave/${id}`)).data;
  } catch (error) { throw new Error(getApiErrorMessage(error, 'Unable to update the saved state.')) }
}

export async function recordBeatView(beat: Beat): Promise<InteractionResponse> {
  return (await apiClient.post<InteractionResponse>(`/v1/api/interactions/view/${encodeURIComponent(getBeatId(beat))}`)).data;
}
