import { describe, expect, it } from 'vitest';
import { validateApiBaseUrl } from '../../src/config/apiConfig';
import { normalizeBeat, normalizeStringArray, safeMediaUrl, getBeatId, getAudioUrl, canPlayBeat } from '../../src/utils/entities';
import { licenseFor } from '../../src/constants/licenses';

describe('configuration and response contracts', () => {
  it('uses same-origin or HTTPS in production and rejects credentialed URLs', () => {
    const credentialedUrl = new URL('https://example.test');
    credentialedUrl.username = 'test-user';
    credentialedUrl.password = 'test-password';
    expect(validateApiBaseUrl('', true)).toBe('');
    expect(validateApiBaseUrl('https://api.example.test/', true)).toBe('https://api.example.test');
    expect(() => validateApiBaseUrl('http://api.example.test', true)).toThrow();
    expect(() => validateApiBaseUrl(credentialedUrl.toString(), true)).toThrow();
    expect(() => validateApiBaseUrl('//evil.example.test', true)).toThrow();
  });
  it('rejects missing beat identity and normalizes legacy metadata', () => {
    expect(() => normalizeBeat('<html>proxy error</html>')).toThrow();
    const beat = normalizeBeat({ _id: 'one', user_id: 'owner', title: 'Night', bpm: '140 BPM', tags: '["trap", "dark"]', likes: -10 });
    expect(beat.bpm).toBe(140); expect(beat.tags).toEqual(['trap', 'dark']); expect(beat.likes).toBe(0);
    expect(getBeatId(beat)).toBe('one'); expect(normalizeStringArray('piano, drums')).toEqual(['piano', 'drums']);
  });
  it('rejects executable or protocol-relative media and grants no default license', () => {
    expect(safeMediaUrl('javascript:alert(1)')).toBeNull(); expect(safeMediaUrl('//tracker.test/a')).toBeNull();
    expect(safeMediaUrl('data:text/html,test')).toBeNull(); expect(safeMediaUrl('/cover-fallback.svg')).toBe('/cover-fallback.svg');
    expect(licenseFor(normalizeBeat({ id: 'id', user_id: 'owner', title: 'Beat' })).label).toBe('Listening only');
  });
  it('prefers the protected preview URL and keeps audio_url as a temporary fallback', () => {
    const current = normalizeBeat({ _id: 'preview', user_id: 'owner', title: 'Preview', preview_url: 'https://media.example.test/signed-preview', audio_url: 'https://legacy.example.test/alias' });
    expect(getAudioUrl(current)).toBe('https://media.example.test/signed-preview');
    const legacy = normalizeBeat({ _id: 'legacy', user_id: 'owner', title: 'Legacy', processing_status: 'ready', audio_url: 'https://media.example.test/alias' });
    expect(getAudioUrl(legacy)).toBe('https://media.example.test/alias');
  });
  it('allows playback only for ready beats with a preview and strips private storage fields', () => {
    const ready = normalizeBeat({ _id: 'ready', user_id: 'owner', title: 'Ready', processing_status: 'ready', preview_url: 'https://media.example.test/preview', master_key: 'private', audio_path: '/private/master.wav', cover_key: 'internal', internal_debug: 'secret', creator_id: 'internal-id' });
    const processing = normalizeBeat({ _id: 'processing', user_id: 'owner', title: 'Processing', processing_status: 'processing', preview_url: 'https://media.example.test/preview' });
    const failed = normalizeBeat({ _id: 'failed', user_id: 'owner', title: 'Failed', processing_status: 'failed', audio_url: 'https://media.example.test/alias' });
    const noPreview = normalizeBeat({ _id: 'none', user_id: 'owner', title: 'No preview', processing_status: 'ready' });
    const unknownState = normalizeBeat({ _id: 'unknown', user_id: 'owner', title: 'Unknown state', preview_url: 'https://media.example.test/preview' });
    expect(canPlayBeat(ready)).toBe(true);
    expect(canPlayBeat(processing)).toBe(false);
    expect(canPlayBeat(failed)).toBe(false);
    expect(canPlayBeat(noPreview)).toBe(false);
    expect(canPlayBeat(unknownState)).toBe(false);
    expect(ready).not.toHaveProperty('master_key');
    expect(ready).not.toHaveProperty('audio_path');
    expect(ready).not.toHaveProperty('cover_key');
    expect(ready).not.toHaveProperty('internal_debug');
    expect(ready).not.toHaveProperty('creator_id');
  });
});
