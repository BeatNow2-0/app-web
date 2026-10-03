import type { BeatAnalysisResponse } from '../../types/beatAnalysis';
import { apiClient, getApiErrorMessage } from './client';

export async function analyzeBeat(file: File, options: { signal?: AbortSignal; onUploadProgress?: (value: number) => void } = {}): Promise<BeatAnalysisResponse> {
  const formData = new FormData();
  formData.append('file', file, file.name);
  try {
    const { data } = await apiClient.post<BeatAnalysisResponse>('/api/v1/beat-analysis', formData, {
      signal: options.signal,
      timeout: 10 * 60 * 1000,
      onUploadProgress: (event) => {
        if (event.total) options.onUploadProgress?.(Math.round((event.loaded / event.total) * 100));
      },
    });
    if (!data?.analysis_id) throw new Error('The analysis response did not include an analysis ID.');
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'We could not analyze this beat.'));
  }
}

export async function discardBeatAnalysis(analysisId: string): Promise<void> {
  try {
    await apiClient.delete(`/api/v1/beat-analysis/${encodeURIComponent(analysisId)}`);
  } catch {
    // Expired or already discarded analyses are harmless; replacing the file must remain available.
  }
}
