import { afterEach, describe, expect, it, vi } from 'vitest';
import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { apiClient, authClient, persistSessionTokens, getAccessToken, clearSessionTokens, removeLegacySession, restoreSession, getApiErrorMessage } from '../../src/Model/api/client';
import { confirmEmailCode } from '../../src/Model/api/auth';
import { uploadBeat } from '../../src/Model/api/posts';
const response = (config: InternalAxiosRequestConfig, data: unknown, status = 200) => ({ config, data, status, statusText: 'OK', headers: { 'content-type': 'application/json' } });
afterEach(() => { clearSessionTokens(); localStorage.clear(); sessionStorage.clear(); });
describe('API security and recovery', () => {
  it('stores no tokens in browser storage and removes legacy passwords', () => {
    localStorage.setItem('password', 'obsolete'); localStorage.setItem('token', 'obsolete');
    removeLegacySession(); persistSessionTokens({ access_token: 'memory-only', token_type: 'bearer' });
    expect(getAccessToken()).toBe('memory-only'); expect(localStorage.length).toBe(0); expect(sessionStorage.length).toBe(0);
  });
  it('preserves verification credentials instead of attaching the access bearer', async () => {
    persistSessionTokens({ access_token: 'access', token_type: 'bearer' });
    apiClient.defaults.adapter = async config => { expect(config.headers.Authorization).toBe('Bearer verification'); expect(config.skipAuthRefresh).toBe(true); return response(config, '', 204); };
    await confirmEmailCode('verification', '123456');
  });
  it('single-flights parallel 401 refreshes and retries each request once', async () => {
    let refreshes = 0;
    authClient.defaults.adapter = async config => { refreshes++; await new Promise(resolve => setTimeout(resolve, 5)); return response(config, { access_token: 'fresh' }); };
    apiClient.defaults.adapter = async config => {
      if (config.headers.Authorization !== 'Bearer fresh') throw new AxiosError('expired', 'ERR_BAD_REQUEST', config, null, response(config, {}, 401));
      return response(config, { ok: true });
    };
    const responses = await Promise.all([apiClient.get('/one'), apiClient.get('/two')]);
    expect(refreshes).toBe(1); expect(responses.map(item => item.data.ok)).toEqual([true, true]);
  });
  it('never refreshes verification or login requests and rejects HTML responses', async () => {
    const refresh = vi.fn(); authClient.defaults.adapter = refresh;
    apiClient.defaults.adapter = async config => { throw new AxiosError('invalid', 'ERR_BAD_REQUEST', config, null, response(config, {}, 401)); };
    await expect(apiClient.get('/verification', { skipAuthRefresh: true })).rejects.toThrow(); expect(refresh).not.toHaveBeenCalled();
    apiClient.defaults.adapter = async config => ({ ...response(config, '<html>Error</html>'), headers: { 'content-type': 'text/html' } });
    await expect(apiClient.get('/feed')).rejects.toThrow('unexpected response');
  });
  it('does not resurrect a session when logout races renewal', async () => {
    let complete!: (value: ReturnType<typeof response>) => void;
    let config!: InternalAxiosRequestConfig;
    authClient.defaults.adapter = async current => { config = current; return new Promise(resolve => { complete = resolve; }); };
    const promise = restoreSession(); await Promise.resolve(); clearSessionTokens(); complete(response(config, { access_token: 'late' }));
    await expect(promise).rejects.toThrow('Session ended'); expect(getAccessToken()).toBeNull();
  });
  it.each([401, 403, 404, 429, 500, 502, 503])('maps status %s without leaking the server body', status => {
    const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
    const error = new AxiosError('secret', '', config, null, response(config, { detail: 'private database password' }, status));
    expect(getApiErrorMessage(error)).not.toMatch(/private|database|password/);
  });
  it('sends files, rights, license and idempotency key and checks the returned beat', async () => {
    apiClient.defaults.adapter = async config => {
      const data = config.data as FormData;
      expect(data.get('rights_confirmed')).toBe('true'); expect(data.get('request_id')).toBe('operation-unique-id');
      expect(data.get('license_type')).toBe('free_noncommercial'); expect(data.get('audio_file')).toBeInstanceOf(File);
      expect(data.get('preview_start')).toBe('12.5'); expect(data.get('preview_end')).toBe('32');
      return response(config, { _id: 'beat-id', user_id: 'producer', title: 'Night' });
    };
    const file = new File(['audio'], 'beat.wav', { type: 'audio/wav' });
    const result = await uploadBeat({ title: 'Night', description: '', bpm: 90, genre: 'trap', tags: [], moods: [], instruments: [], coverFile: file, audioFile: file, license_type: 'free_noncommercial', request_id: 'operation-unique-id', preview_start: 12.5, preview_end: 32 });
    expect(result._id).toBe('beat-id');
  });
});
