import { apiClient, getApiErrorMessage } from './client';
export interface Lyric { _id: string; title: string; lyrics: string; post_id: string | null; user_id: string }
export type LyricInput = Pick<Lyric, 'title' | 'lyrics' | 'post_id'>;
function parseLyric(value: unknown): Lyric {
  const lyric = value as Lyric;
  if (!lyric || !lyric._id || typeof lyric.title !== 'string' || typeof lyric.lyrics !== 'string') throw new Error('The server returned an invalid lyric. Please reload.');
  return lyric;
}
export async function listLyrics(skip = 0, signal?: AbortSignal): Promise<Lyric[]> {
  try { const { data } = await apiClient.get('/v1/api/lyrics/user', { params: { skip, limit: 20 }, signal }); return data.map(parseLyric); }
  catch (error) { throw new Error(getApiErrorMessage(error), { cause: error }); }
}
export async function saveLyric(input: LyricInput, id?: string): Promise<Lyric> {
  try { const { data } = id ? await apiClient.put(`/v1/api/lyrics/${encodeURIComponent(id)}`, input) : await apiClient.post('/v1/api/lyrics/', input); return parseLyric(data); }
  catch (error) { throw new Error(getApiErrorMessage(error), { cause: error }); }
}
export async function deleteLyric(id: string): Promise<void> {
  try { await apiClient.delete(`/v1/api/lyrics/${encodeURIComponent(id)}`); }
  catch (error) { throw new Error(getApiErrorMessage(error), { cause: error }); }
}
