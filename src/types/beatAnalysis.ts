export interface BeatAnalysisAudio {
  duration_seconds?: number;
  sample_rate?: number;
  channels?: number;
  file_size?: number;
}

export interface BeatAnalysisMusical {
  bpm?: number;
  key?: string;
  scale?: string;
  key_confidence?: number;
  energy?: number;
}

export interface BeatAnalysisLoudness {
  integrated_lufs?: number;
  true_peak_dbtp?: number;
  peak_dbfs?: number;
  dynamic_range_db?: number;
  clipping_detected?: boolean;
  clipped_ratio?: number;
}

export interface BeatAnalysisStereo {
  correlation?: number;
  width?: number;
  mono_risk?: string;
}

export interface BeatAnalysisFrequencyBalance {
  sub?: number;
  bass?: number;
  low_mid?: number;
  mid?: number;
  high_mid?: number;
  high?: number;
}

export interface BeatAnalysisPreview {
  start_seconds?: number;
  end_seconds?: number;
  confidence?: number;
}

export interface BeatAnalysisInsight {
  type?: 'info' | 'warning' | string;
  title?: string;
  message?: string;
  description?: string;
  suggestion?: string;
}

export interface BeatAnalysisSuggestedMetadata {
  genre?: string[];
  mood?: string[];
  tags?: string[];
}

/** The deployed OpenAPI leaves the analysis response schema empty. These fields
 * describe the response currently returned by the Beat Analyzer service. */
export interface BeatAnalysisResponse {
  analysis_id: string;
  status: string;
  expires_at?: string;
  analysis_version?: string;
  audio?: BeatAnalysisAudio;
  musical?: BeatAnalysisMusical;
  loudness?: BeatAnalysisLoudness;
  stereo?: BeatAnalysisStereo;
  frequency_balance?: BeatAnalysisFrequencyBalance;
  preview?: BeatAnalysisPreview;
  suggested_metadata?: BeatAnalysisSuggestedMetadata;
  insights?: BeatAnalysisInsight[];
}
