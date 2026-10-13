import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PlayerProvider, usePlayer } from '../../src/contexts/PlayerContext';
import BeatCard from '../../src/components/BeatCard/BeatCard';
import type { Beat } from '../../src/types/api';
import { recordBeatView, setBeatSaved } from '../../src/Model/api/posts';
vi.mock('../../src/Model/api/posts', () => ({ recordBeatView: vi.fn(async () => ({})), setBeatSaved: vi.fn(), setBeatLike: vi.fn() }));
class TestAudio extends EventTarget {
  static instances: TestAudio[] = []; src = ''; paused = true; currentTime = 0; duration = 10; volume = 1; preload = ''; error = null;
  play = vi.fn(async () => { this.paused = false; this.dispatchEvent(new Event('playing')); });
  pause = vi.fn(() => { this.paused = true; this.dispatchEvent(new Event('pause')); });
  load = vi.fn(); getAttribute = () => this.src; removeAttribute = () => { this.src = ''; };
  constructor() { super(); TestAudio.instances.push(this); }
}
const beat: Beat = { _id: 'one', title: 'First beat', user_id: 'owner', publication_date: '', likes: 0, saves: 1, processing_status: 'ready', audio_url: '/audio.wav', isSaved: true };
function Controls() { const player = usePlayer(); return <><button onClick={() => player.playBeat(beat)}>first</button><button onClick={() => player.playBeat({ ...beat, _id: 'two', title: 'Second beat' })}>second</button><button onClick={() => player.playBeat({ ...beat, _id: 'processing', processing_status: 'processing' })}>processing</button><button onClick={() => player.playBeat({ ...beat, _id: 'failed', processing_status: 'failed' })}>failed</button><button onClick={() => player.playBeat({ ...beat, _id: 'missing', audio_url: null })}>missing preview</button><button onClick={player.toggle}>toggle</button><button onClick={() => player.seek(6)}>seek</button><output>{player.error || `${player.playing}:${player.currentTime}`}</output></>; }
beforeEach(() => { TestAudio.instances = []; vi.stubGlobal('Audio', TestAudio); });
describe('audio and interaction flows', () => {
  it('has a single audio element, pauses old tracks, seeks, resumes and stops on logout', async () => {
    const view = render(<PlayerProvider><Controls /></PlayerProvider>); const audio = TestAudio.instances[0];
    await act(async () => fireEvent.click(screen.getByText('first'))); expect(audio.paused).toBe(false);
    await act(async () => fireEvent.click(screen.getByText('second'))); expect(TestAudio.instances).toHaveLength(1); expect(audio.pause).toHaveBeenCalled();
    fireEvent.click(screen.getByText('seek')); expect(audio.currentTime).toBe(6);
    fireEvent.click(screen.getByText('toggle')); expect(audio.paused).toBe(true);
    await act(async () => fireEvent.click(screen.getByText('toggle'))); expect(audio.paused).toBe(false);
    act(() => window.dispatchEvent(new Event('beatnow:session-expired'))); expect(audio.src).toBe(''); expect(audio.paused).toBe(true);
    view.unmount(); expect(recordBeatView).toHaveBeenCalledTimes(2);
  });
  it('shows a rejected play and allows retry without an unhandled rejection', async () => {
    render(<PlayerProvider><Controls /></PlayerProvider>); const audio = TestAudio.instances[0]; audio.play.mockRejectedValueOnce(new Error('blocked'));
    await act(async () => fireEvent.click(screen.getByText('first'))); expect(screen.getByText(/Playback was blocked/)).toBeTruthy();
    await act(async () => fireEvent.click(screen.getByText('toggle'))); expect(audio.paused).toBe(false);
  });
  it('refuses processing, failed and preview-less beats', async () => {
    render(<PlayerProvider><Controls /></PlayerProvider>); const audio = TestAudio.instances[0];
    for (const [label, expected] of [['processing', 'Preparando preview'], ['failed', 'Preview no disponible'], ['missing preview', 'Preview no disponible']]) {
      await act(async () => fireEvent.click(screen.getByText(label)));
      expect(screen.getByText(expected)).toBeTruthy(); expect(audio.src).toBe(''); expect(audio.play).not.toHaveBeenCalled();
    }
    expect(recordBeatView).not.toHaveBeenCalled();
  });
  it('keeps a saved card when unsave fails and exposes a useful error', async () => {
    vi.mocked(setBeatSaved).mockRejectedValueOnce(new Error('Connection lost. Retry.')); const changed = vi.fn();
    render(<MemoryRouter><PlayerProvider><BeatCard beat={beat} onChange={changed} /></PlayerProvider></MemoryRouter>);
    await act(async () => fireEvent.click(screen.getByLabelText('Remove from library')));
    expect(changed).not.toHaveBeenCalled(); expect(screen.getByRole('alert').textContent).toContain('Retry'); expect(screen.getByLabelText('Remove from library')).toBeTruthy();
  });
});
