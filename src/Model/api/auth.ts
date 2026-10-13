import type { AuthResponse, User } from '../../types/api';
import { getUserId } from '../../utils/entities';
import { apiClient, clearSessionTokens, getApiErrorMessage, persistSessionTokens } from './client';

export interface Credentials { username: string; password: string }
export type UserData = User & { id: string; full_name: string };
export interface ProfileUpdatePayload { username?: string; full_name?: string; bio?: string | null }
export interface RegistrationPayload { full_name: string; username: string; email: string; password: string }
export interface RegistrationResponse { user?: User; verification_token: string }
export interface ConfirmationEmailResponse { retryAfter?: number }

type ApiErrorDetail = {
  code?: string;
  message?: string;
  verification_token?: string;
  retry_after?: number;
};

type ApiErrorResponse = {
  status?: number;
  data?: {
    detail?: string | ApiErrorDetail | Array<{ msg?: string }>;
    code?: string;
    message?: string;
    verification_token?: string;
    retry_after?: number;
  };
  headers?: Record<string, string | number | undefined>;
};

export class AccountNotVerifiedError extends Error {
  verificationToken: string;

  constructor(verificationToken: string, message = 'Confirm your email to activate this account.') {
    super(message);
    this.name = 'AccountNotVerifiedError';
    this.verificationToken = verificationToken;
  }
}

export class ConfirmationRateLimitError extends Error {
  retryAfter: number;

  constructor(retryAfter: number, message = `Please wait ${retryAfter} seconds before requesting a new code.`) {
    super(message);
    this.name = 'ConfirmationRateLimitError';
    this.retryAfter = retryAfter;
  }
}

// Email verification credentials are deliberately kept only in JS memory. A
// reload requires signing in again, which is preferable to persisting a bearer
// credential in sessionStorage, localStorage or browser history.
let pendingVerificationToken = '';
export function rememberVerificationToken(token: string): void { pendingVerificationToken = token; }
export function getVerificationTokenFromMemory(): string { return pendingVerificationToken; }
export function forgetVerificationToken(): void { pendingVerificationToken = ''; }

function normalizeUser(user: User): UserData {
  return {
    ...user,
    id: getUserId(user),
    full_name: user.full_name ?? '',
    profile_image_url: user.profile_image_url ?? user.photo_profile ?? null,
  };
}

export async function requestLogin({ username, password }: Credentials): Promise<AuthResponse> {
  const formData = new URLSearchParams({ username: username.trim(), password });
  try {
    const { data } = await apiClient.post<AuthResponse>('/v1/api/users/web/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      skipAuthRefresh: true,
    });
    return data;
  } catch (error) {
    const response = (error as { response?: ApiErrorResponse }).response;
    const status = response?.status;
    const errorCode = getApiErrorCode(response);
    const verificationToken = getVerificationToken(response);
    if (status === 401) throw new Error('Incorrect username or password.', { cause: error });
    if (status === 403 && errorCode === 'ACCOUNT_NOT_VERIFIED' && verificationToken) {
      throw new AccountNotVerifiedError(verificationToken);
    }
    if (status === 403) throw new Error('This account is not active yet. Check your email for activation instructions.', { cause: error });
    throw new Error(getApiErrorMessage(error, 'Unable to sign in.'), { cause: error });
  }
}

export async function requestAccessToken(credentials: Credentials): Promise<string> {
  return (await requestLogin(credentials)).access_token;
}

export function persistSession(session: AuthResponse): void { persistSessionTokens(session) }
export function clearStoredSession(): void { clearSessionTokens() }

export async function requestLogout(): Promise<void> {
  try { await apiClient.post('/v1/api/users/web/logout', undefined, { skipAuthRefresh: true }); }
  finally { clearSessionTokens(); }
}

export async function fetchUserProfile(_token?: string, signal?: AbortSignal): Promise<UserData> {
  try {
    const { data } = await apiClient.get<User>('/v1/api/users/users/me', { signal });
    return normalizeUser(data);
  } catch (error) {
    const profileError = new Error(getApiErrorMessage(error, 'Unable to load your profile.')) as Error & { status?: number };
    profileError.status = (error as { response?: { status?: number } }).response?.status;
    throw profileError;
  }
}

export async function fetchPublicProfile(userId: string): Promise<User> {
  try {
    const { data } = await apiClient.get<User>(`/v1/api/users/profile/${encodeURIComponent(userId)}`);
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to load this profile.'), { cause: error });
  }
}

export async function updateUserProfile(_token: string, payload: ProfileUpdatePayload): Promise<UserData> {
  try {
    const { data } = await apiClient.put<User>('/v1/api/users/users/me', payload);
    return normalizeUser(data);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to update your profile.'), { cause: error });
  }
}

export async function uploadProfilePhoto(_token: string, file: File): Promise<UserData> {
  const formData = new FormData();
  formData.append('file', file);
  try {
    await apiClient.put('/v1/api/users/change_photo_profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 10 * 60 * 1000,
    });
    return fetchUserProfile();
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to update your profile photo.'), { cause: error });
  }
}

export async function resetProfilePhoto(_token: string): Promise<UserData> {
  try {
    await apiClient.delete('/v1/api/users/delete_photo_profile');
    return fetchUserProfile();
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to remove your profile photo.'), { cause: error });
  }
}

export async function deleteAccount(): Promise<void> {
  try { await apiClient.delete('/v1/api/users/delete') }
  catch (error) { throw new Error(getApiErrorMessage(error, 'Unable to delete your account.'), { cause: error }) }
}

export async function registerUser(payload: RegistrationPayload): Promise<User> {
  try {
    const { data } = await apiClient.post<User | RegistrationResponse>('/v1/api/users/register', payload, { skipAuthRefresh: true });
    return getRegisteredUser(data);
  } catch (error) {
    const response = (error as { response?: { status?: number; data?: { detail?: unknown } } }).response;
    if (response?.status === 400 && typeof response.data?.detail === 'string' && /username|email/i.test(response.data.detail)) {
      throw new Error('That username or email is already in use.', { cause: error });
    }
    throw new Error(getApiErrorMessage(error, 'Registration failed. Please try again.'), { cause: error });
  }
}

export async function registerUserForConfirmation(payload: RegistrationPayload): Promise<RegistrationResponse> {
  try {
    const { data } = await apiClient.post<User | RegistrationResponse>('/v1/api/users/register', payload, { skipAuthRefresh: true });
    const verificationToken = getVerificationToken({ data: data as ApiErrorResponse['data'] });
    if (!verificationToken) {
      throw new Error('BeatNow did not return a verification token for this account.');
    }
    const user = getRegisteredUser(data);
    return { user, verification_token: verificationToken };
  } catch (error) {
    if (error instanceof Error && error.message.includes('verification token')) throw error;
    const response = (error as { response?: { status?: number; data?: { detail?: unknown } } }).response;
    if (response?.status === 400 && typeof response.data?.detail === 'string' && /username|email/i.test(response.data.detail)) {
      throw new Error('That username or email is already in use.', { cause: error });
    }
    throw new Error(getApiErrorMessage(error, 'Registration failed. Please try again.'), { cause: error });
  }
}



export async function sendConfirmationEmail(token: string): Promise<ConfirmationEmailResponse> {
  try {
    const { data } = await apiClient.post('/v1/api/mail/send-confirmation', undefined, getVerificationAuthConfig(token));
    return { retryAfter: getRetryAfter({ data }) };
  } catch (error) {
    const retryAfter = getRetryAfter((error as { response?: ApiErrorResponse }).response);
    if (retryAfter) throw new ConfirmationRateLimitError(retryAfter);
    throw new Error(getApiErrorMessage(error, 'Unable to send a new confirmation code.'), { cause: error });
  }
}

export async function confirmEmailCode(token: string, code: string): Promise<void> {
  try { await apiClient.post('/v1/api/mail/confirmation', { code }, getVerificationAuthConfig(token)) }
  catch (error) { throw new Error(getApiErrorMessage(error, 'The code is invalid or expired.'), { cause: error }) }
}

export async function requestPasswordReset(email: string): Promise<void> {
  try { await apiClient.post('/v1/api/mail/send-password-reset', { email }, { skipAuthRefresh: true }) }
  catch (error) { throw new Error(getApiErrorMessage(error, 'Unable to request a password reset.'), { cause: error }) }
}

export async function confirmPasswordReset(token: string, newPassword: string): Promise<void> {
  try { await apiClient.post('/v1/api/mail/password-change', { token, new_password: newPassword }, { skipAuthRefresh: true }) }
  catch (error) { throw new Error(getApiErrorMessage(error, 'Unable to change your password.'), { cause: error }) }
}

declare module 'axios' {
  export interface AxiosRequestConfig { skipAuthRefresh?: boolean }
}

function getRegisteredUser(data: User | RegistrationResponse): User {
  return 'user' in data && data.user ? data.user : data as User;
}

function getVerificationAuthConfig(token: string) {
  return {
    headers: { Authorization: `Bearer ${token}` },
    skipAuthRefresh: true,
  };
}

function getApiErrorCode(response?: ApiErrorResponse): string | undefined {
  const detail = response?.data?.detail;
  if (detail && !Array.isArray(detail) && typeof detail === 'object') return detail.code || response?.data?.code;
  if (typeof detail === 'string' && detail === 'ACCOUNT_NOT_VERIFIED') return detail;
  return response?.data?.code;
}

function getVerificationToken(response?: Pick<ApiErrorResponse, 'data'>): string | undefined {
  const detail = response?.data?.detail;
  if (detail && !Array.isArray(detail) && typeof detail === 'object' && detail.verification_token) {
    return detail.verification_token;
  }
  return response?.data?.verification_token;
}

function getRetryAfter(response?: Pick<ApiErrorResponse, 'data' | 'headers'>): number | undefined {
  const detail = response?.data?.detail;
  const bodyRetryAfter = detail && !Array.isArray(detail) && typeof detail === 'object'
    ? detail.retry_after ?? response?.data?.retry_after
    : response?.data?.retry_after;
  const headerRetryAfter = response?.headers?.['retry-after'] ?? response?.headers?.['Retry-After'];
  const parsed = Number(bodyRetryAfter ?? headerRetryAfter);
  return Number.isFinite(parsed) && parsed > 0 ? Math.ceil(parsed) : undefined;
}
