import React, { useEffect, useMemo, useState } from 'react';
import { BeatPost, BeatUpdatePayload } from '../../Model/api/posts';
import './BeatEditor.css';

interface BeatEditorProps {
  beat: BeatPost;
  onClose: () => void;
  onSave: (payload: BeatUpdatePayload) => Promise<void>;
}

const toCsvInput = (values?: string[]) => (values && values.length ? values.join(', ') : '');

const parseCsvInput = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export default function BeatEditor({ beat, onClose, onSave }: BeatEditorProps) {
  const [title, setTitle] = useState(beat.title || '');
  const [description, setDescription] = useState(beat.description || '');
  const [genre, setGenre] = useState(beat.genre || '');
  const [bpm, setBpm] = useState<number | ''>(beat.bpm ?? '');
  const [tags, setTags] = useState(toCsvInput(beat.tags));
  const [moods, setMoods] = useState(toCsvInput(beat.moods));
  const [instruments, setInstruments] = useState(toCsvInput(beat.instruments));
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(beat.title || '');
    setDescription(beat.description || '');
    setGenre(beat.genre || '');
    setBpm(beat.bpm ?? '');
    setTags(toCsvInput(beat.tags));
    setMoods(toCsvInput(beat.moods));
    setInstruments(toCsvInput(beat.instruments));
    setCoverFile(null);
    setError(null);
  }, [beat]);

  const previewUrl = useMemo(() => {
    if (!coverFile) {
      return beat.cover_image_url;
    }
    return URL.createObjectURL(coverFile);
  }, [beat.cover_image_url, coverFile]);

  useEffect(() => {
    return () => {
      if (coverFile && previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [coverFile, previewUrl]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('The beat title is required.');
      return;
    }

    if (!genre.trim()) {
      setError('Please add a genre.');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        genre: genre.trim(),
        bpm,
        tags: parseCsvInput(tags),
        moods: parseCsvInput(moods),
        instruments: parseCsvInput(instruments),
        coverFile,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save this beat.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="beat-editor-overlay" role="dialog" aria-modal="true" aria-label="Edit beat">
      <div className="beat-editor-modal">
        <div className="beat-editor-header">
          <div>
            <p className="beat-editor-eyebrow">Edit beat</p>
            <h2>{beat.title}</h2>
          </div>
          <button type="button" className="beat-editor-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form className="beat-editor-form" onSubmit={handleSubmit}>
          <div className="beat-editor-cover">
            {previewUrl ? <img src={previewUrl} alt={beat.title} /> : <div className="beat-editor-cover-empty">No cover</div>}
            <label className="beat-editor-upload">
              Replace cover
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                onChange={(event) => setCoverFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <p className="beat-editor-note">Audio stays untouched. Only metadata and cover can change here.</p>
          </div>

          <div className="beat-editor-fields">
            <label>
              <span>Title</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} />
            </label>

            <label>
              <span>Description</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                maxLength={1000}
              />
            </label>

            <div className="beat-editor-grid">
              <label>
                <span>Genre</span>
                <input value={genre} onChange={(event) => setGenre(event.target.value)} maxLength={60} />
              </label>
              <label>
                <span>BPM</span>
                <input
                  type="number"
                  min={1}
                  max={400}
                  value={bpm}
                  onChange={(event) => setBpm(event.target.value ? Number(event.target.value) : '')}
                />
              </label>
            </div>

            <label>
              <span>Tags</span>
              <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="drill, dark, melodic" />
            </label>

            <label>
              <span>Moods</span>
              <input value={moods} onChange={(event) => setMoods(event.target.value)} placeholder="aggressive, nocturnal" />
            </label>

            <label>
              <span>Instruments</span>
              <input value={instruments} onChange={(event) => setInstruments(event.target.value)} placeholder="808, piano, synth" />
            </label>

            {error && <div className="beat-editor-error">{error}</div>}

            <div className="beat-editor-actions">
              <button type="button" className="ghost" onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
