export interface ApiErrorPayload {
  detail?: string | Array<{ msg?: string; loc?: Array<string | number> }> | {
    code?: string;
    message?: string;
    verification_token?: string;
    retry_after?: number;
  };
  code?: string;
  message?: string;
  request_id?: string;
  verification_token?: string;
  retry_after?: number;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
}

export interface User {
  _id?: string;
  id?: string;
  username: string;
  email: string;
  full_name?: string | null;
  bio?: string | null;
  is_active: boolean;
  role?: 'artist' | 'producer';
  avatar_key?: string | null;
  profile_image_url?: string | null;
  photo_profile?: string | null;
  followers?: number;
  following?: number;
  post_num?: number;
  is_following?: boolean;
}

export interface Beat {
  _id?: string;
  id?: string;
  post_id?: string;
  beat_id?: string;
  title: string;
  description?: string | null;
  publication_date: string;
  likes: number;
  saves: number;
  views?: number;
  plays?: number;
  processing_status?: 'processing' | 'ready' | 'failed';
  plays_7d?: number;
  likes_7d?: number;
  saves_7d?: number;
  tags?: string[];
  genre?: string | null;
  moods?: string[];
  instruments?: string[];
  bpm?: number;
  user_id: string;
  creator_username?: string | null;
  audio_format?: string;
  cover_format?: string;
  cover_image_url?: string | null;
  preview_url?: string | null;
  audio_url?: string | null;
  caratula?: string | null;
  isLiked?: boolean;
  isSaved?: boolean;
  price?: number;
  sales_count?: number;
  visibility?: 'published' | 'unpublished';
  license_type?: 'unavailable' | 'free_noncommercial' | 'contact';
  license_terms?: string;
  musical_key?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  limit: number;
  skip: number;
  hasMore: boolean;
}

export interface InteractionResponse {
  message: string;
  counted?: boolean;
  total_views?: number;
  post?: Beat;
}
