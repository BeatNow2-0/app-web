import axios from 'axios';
import { buildApiUrl } from '../../config/apiConfig';

export interface Credentials {
  username: string;
  password: string;
}

export interface UserData {
  full_name: string;
  username: string;
  email: string;
  id: string;
  is_active: boolean;
  bio?: string | null;
  profile_image_url?: string | null;
}

export interface ProfileUpdatePayload {
  username?: string;
  full_name?: string;
  bio?: string | null;
}

export interface RegistrationPayload {
  full_name: string;
  username: string;
  email: string;
  password: string;
  is_active?: boolean;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
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

export async function requestLogin({ username, password }: Credentials): Promise<LoginResponse> {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  try {
    const response = await axios.post<LoginResponse>(buildApiUrl('/v1/api/users/login'), formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        accept: 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const { status } = error.response;
      if (status >= 400 && status < 500) {
        throw new Error(getApiErrorMessage(error, 'Invalid username or password.'));
      }
      if (status >= 500) {
        throw new Error('Server error. Please try again later.');
      }
    }
    throw new Error('Network error. Please check your connection.');
  }
}

export async function requestAccessToken({ username, password }: Credentials): Promise<string> {
  const response = await requestLogin({ username, password });
  return response.access_token;
}

export async function fetchUserProfile(token: string): Promise<UserData> {
  try {
    const response = await axios.get(buildApiUrl('/v1/api/users/users/me'), {
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      ...response.data,
      id: response.data.id ?? response.data._id ?? '',
    } satisfies UserData;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to retrieve user information.'));
  }
}

export async function updateUserProfile(token: string, payload: ProfileUpdatePayload): Promise<UserData> {
  try {
    const response = await axios.put(buildApiUrl('/v1/api/users/users/me'), payload, {
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      ...response.data,
      id: response.data.id ?? response.data._id ?? '',
    } satisfies UserData;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to update profile.'));
  }
}

export async function uploadProfilePhoto(token: string, file: File): Promise<UserData> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    await axios.put(buildApiUrl('/v1/api/users/change_photo_profile'), formData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return await fetchUserProfile(token);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to update profile photo.'));
  }
}

export async function resetProfilePhoto(token: string): Promise<UserData> {
  try {
    await axios.delete(buildApiUrl('/v1/api/users/delete_photo_profile'), {
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return await fetchUserProfile(token);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to reset profile photo.'));
  }
}

export async function registerUser(payload: RegistrationPayload): Promise<void> {
  try {
    await axios.post(buildApiUrl('/v1/api/users/register'), payload, {
      headers: { accept: 'application/json' },
    });
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Registration failed. Please try again.'));
  }
}

// The provided OpenAPI schema does not expose username/email availability endpoints.
// We keep this helper as a no-op so existing UI can remain responsive without calling invalid routes.
export async function checkAvailability(_type?: 'email' | 'username', _value?: string): Promise<boolean> {
  return true;
}

export async function sendConfirmationEmail(token: string): Promise<void> {
  if (!token) {
    return;
  }

  await axios.post(
    buildApiUrl('/v1/api/mail/send-confirmation'),
    {},
    {
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export async function confirmEmailCode(token: string, code: string): Promise<void> {
  await axios.post(
    buildApiUrl('/v1/api/mail/confirmation'),
    { code },
    {
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export async function requestPasswordReset(email: string): Promise<void> {
  await axios.post(
    buildApiUrl('/v1/api/mail/send-password-reset'),
    { email },
    {
      headers: { accept: 'application/json' },
    },
  );
}

export async function confirmPasswordReset(token: string, newPassword: string): Promise<void> {
  await axios.post(
    buildApiUrl('/v1/api/mail/password-change'),
    { token, new_password: newPassword },
    {
      headers: { accept: 'application/json' },
    },
  );
}
