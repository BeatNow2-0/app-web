import type { AuthResponse, User } from '../../types/api';
import { getUserId } from '../../utils/entities';
import { apiClient, clearSessionTokens, getApiErrorMessage, getRefreshToken, persistSessionTokens } from './client';

export interface Credentials { username: string; password: string }
export type UserData = User & { id: string; full_name: string };
export interface ProfileUpdatePayload { username?: string; full_name?: string; bio?: string | null }
export interface RegistrationPayload { full_name: string; username: string; email: string; password: string }

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
    const { data } = await apiClient.post<AuthResponse>('/v1/api/users/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      skipAuthRefresh: true,
    });
    return data;
  } catch (error) {
    const status = (error as { response?: { status?: number } }).response?.status;
    if (status === 401) throw new Error('Incorrect username or password.');
    if (status === 403) throw new Error('This account is not active yet. Check your email for activation instructions.');
    throw new Error(getApiErrorMessage(error, 'Unable to sign in.'));
  }
}

export async function requestAccessToken(credentials: Credentials): Promise<string> {
  return (await requestLogin(credentials)).access_token;
}

export function persistSession(session: AuthResponse): void { persistSessionTokens(session) }
export function clearStoredSession(): void { clearSessionTokens() }

export async function requestLogout(): Promise<void> {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) await apiClient.post('/v1/api/users/logout', { refresh_token: refreshToken });
  } finally {
    clearSessionTokens();
  }
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
    throw new Error(getApiErrorMessage(error, 'Unable to load this profile.'));
  }
}

export async function updateUserProfile(_token: string, payload: ProfileUpdatePayload): Promise<UserData> {
  try {
    const { data } = await apiClient.put<User>('/v1/api/users/users/me', payload);
    return normalizeUser(data);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to update your profile.'));
  }
}

export async function uploadProfilePhoto(_token: string, file: File): Promise<UserData> {
  const formData = new FormData();
  formData.append('file', file);
  try {
    await apiClient.put('/v1/api/users/change_photo_profile', formData);
    return fetchUserProfile();
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to update your profile photo.'));
  }
}

export async function resetProfilePhoto(_token: string): Promise<UserData> {
  try {
    await apiClient.delete('/v1/api/users/delete_photo_profile');
    return fetchUserProfile();
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to remove your profile photo.'));
  }
}

export async function deleteAccount(): Promise<void> {
  try { await apiClient.delete('/v1/api/users/delete') }
  catch (error) { throw new Error(getApiErrorMessage(error, 'Unable to delete your account.')) }
}

export async function registerUser(payload: RegistrationPayload): Promise<User> {
  try {
    const { data } = await apiClient.post<User>('/v1/api/users/register', payload);
    return data;
  } catch (error) {
    const response = (error as { response?: { status?: number; data?: { detail?: unknown } } }).response;
    if (response?.status === 400 && typeof response.data?.detail === 'string' && /username|email/i.test(response.data.detail)) {
      throw new Error('That username or email is already in use.');
    }
    throw new Error(getApiErrorMessage(error, 'Registration failed. Please try again.'));
  }
}

export async function checkAvailability(_field?: 'email' | 'username', _value?: string): Promise<boolean> { return true }

export async function sendConfirmationEmail(_token?: string): Promise<void> {
  try { await apiClient.post('/v1/api/mail/send-confirmation') }
  catch (error) { throw new Error(getApiErrorMessage(error, 'Unable to send a new confirmation code.')) }
}

export async function confirmEmailCode(_token: string, code: string): Promise<void> {
  try { await apiClient.post('/v1/api/mail/confirmation', { code }) }
  catch (error) { throw new Error(getApiErrorMessage(error, 'The code is invalid or expired.')) }
}

export async function requestPasswordReset(email: string): Promise<void> {
  try { await apiClient.post('/v1/api/mail/send-password-reset', { email }) }
  catch (error) { throw new Error(getApiErrorMessage(error, 'Unable to request a password reset.')) }
}

export async function confirmPasswordReset(token: string, newPassword: string): Promise<void> {
  try { await apiClient.post('/v1/api/mail/password-change', { token, new_password: newPassword }) }
  catch (error) { throw new Error(getApiErrorMessage(error, 'Unable to change your password.')) }
}

declare module 'axios' {
  export interface AxiosRequestConfig { skipAuthRefresh?: boolean }
}
