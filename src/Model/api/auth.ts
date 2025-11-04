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
}

export interface RegistrationPayload {
  full_name: string;
  username: string;
  email: string;
  password: string;
  is_active?: boolean;
}

export async function requestLogin({ username, password }: Credentials): Promise<void> {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  try {
    await axios.post(buildApiUrl('/v1/api/users/login'), formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const { status } = error.response;
      if (status >= 400 && status < 500) {
        throw new Error('Invalid username or password.');
      }
      if (status >= 500) {
        throw new Error('Server error. Please try again later.');
      }
    }
    throw new Error('Network error. Please check your connection.');
  }
}

export async function requestAccessToken({ username, password }: Credentials): Promise<string> {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  try {
    const response = await axios.post<{ access_token: string }>(
      buildApiUrl('/token'),
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          accept: 'application/json',
        },
      },
    );
    return response.data.access_token;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error('Unable to authenticate. Please try again.');
    }
    throw new Error('Network error. Please check your connection.');
  }
}

export async function fetchUserProfile(token: string): Promise<UserData> {
  try {
    const response = await axios.get<UserData>(buildApiUrl('/v1/api/users/users/me'), {
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.detail) {
      throw new Error(String(error.response.data.detail));
    }
    throw new Error('Unable to retrieve user information.');
  }
}

export async function registerUser(payload: RegistrationPayload): Promise<void> {
  await axios.post(buildApiUrl('/v1/api/users/register'), payload);
}

export async function checkAvailability(type: 'email' | 'username', value: string): Promise<boolean> {
  if (!value) {
    return true;
  }

  const endpoint = type === 'email' ? '/v1/api/users/check-email' : '/v1/api/users/check-username';

  try {
    const response = await axios.get<{ status: string }>(buildApiUrl(endpoint), {
      params: { [type]: value },
    });
    return response.data.status === 'ok';
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Error checking ${type}:`, error.message);
    }
    return false;
  }
}

export async function sendConfirmationEmail(token: string): Promise<void> {
  if (!token) {
    return;
  }

  await axios.post(
    buildApiUrl('/v1/api/mail/send-confirmation/'),
    {},
    {
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  );
}
