import React, { useEffect, useMemo, useState } from 'react';
import { BeatPost, BeatUpdatePayload } from '../../Model/api/posts';
import GlobalSelect from '../Select/GlobalSelect';
import { TagsInput } from 'react-tag-input-component';
import { genresList, instrumentsList, moodsList } from '../../constants/beatFormOptions';
import './BeatEditor.css';

interface BeatEditorProps {
  beat: BeatPost;
  onClose: () => void;
  onSave: (payload: BeatUpdatePayload) => Promise<void>;
}

const maxBpm = 500;
const normalizeList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value !== 'string') {
    return [];
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
  } catch {
    return trimmed
      .split(',')
      .map((item) => item.replace(/[[\]"]/g, '').trim())
      .filter(Boolean);
  }

  return [];
};

const toSelectValue = (value: string) => genresList.find((option) => option.value === value) ?? null;
const toMultiSelectValue = (values?: string[]) =>
  (values ?? []).map((value) => {
    const option = [...moodsList, ...instrumentsList].find((item) => item.value === value);
    return option ?? { value, label: value.charAt(0).toUpperCase() + value.slice(1) };
  });
const normalizeTag = (tag: string) => (tag.startsWith('#') ? tag.replace(/\s/g, '') : `#${tag.replace(/\s/g, '')}`);

export default function BeatEditor({ beat, onClose, onSave }: BeatEditorProps) {
  const [title, setTitle] = useState(beat.title || '');
  const [description, setDescription] = useState(beat.description || '');
  const [genre, setGenre] = useState(typeof beat.genre === 'string' ? beat.genre.replace(/[[\]"]/g, '').trim() : '');
  const [bpm, setBpm] = useState<string>(beat.bpm ? String(beat.bpm) : '');
  const [tags, setTags] = useState<string[]>(normalizeList(beat.tags));
  const [moods, setMoods] = useState<string[]>(normalizeList(beat.moods));
  const [instruments, setInstruments] = useState<string[]>(normalizeList(beat.instruments));
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(beat.title || '');
    setDescription(beat.description || '');
    setGenre(typeof beat.genre === 'string' ? beat.genre.replace(/[[\]"]/g, '').trim() : '');
    setBpm(beat.bpm ? String(beat.bpm) : '');
    setTags(normalizeList(beat.tags));
    setMoods(normalizeList(beat.moods));
    setInstruments(normalizeList(beat.instruments));
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
      setError('Please select a genre.');
      return;
    }

    if (instruments.length === 0) {
      setError('Please select at least one instrument.');
      return;
    }

    if (tags.length === 0) {
      setError('Please add at least one tag.');
      return;
    }

    if (!bpm) {
      setError('Please add the beat tempo.');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        genre: genre.trim(),
        bpm: bpm ? Number(bpm) : '',
        tags,
        moods,
        instruments,
        coverFile,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save this beat.');
    } finally {
      setSaving(false);
    }
  };

  const beatDate = beat.publication_date ? new Date(beat.publication_date).toLocaleDateString() : 'No date';
  const beatPlays = beat.views || beat.plays || 0;

  return (
    <div className="beat-editor-overlay" role="dialog" aria-modal="true" aria-label="Edit beat" onClick={onClose}>
      <div className="beat-editor-modal" onClick={(event) => event.stopPropagation()}>
        <div className="beat-editor-header">
          <div>
            <p className="beat-editor-eyebrow">Edit beat</p>
            <h2>{title || beat.title}</h2>
            <p className="beat-editor-subtitle">Update the metadata with the same field types used on upload, without touching the original audio.</p>
          </div>
          <button type="button" className="beat-editor-close" onClick={onClose} aria-label="Close edit modal">
            X
          </button>
        </div>

        <form className="beat-editor-form" onSubmit={handleSubmit}>
          <aside className="beat-editor-cover-panel">
            <div className="beat-editor-cover-frame">
              {previewUrl ? <img src={previewUrl} alt={beat.title} /> : <div className="beat-editor-cover-empty">No cover</div>}
            </div>
            <div className="beat-editor-summary-card">
              <div className="beat-editor-summary-row">
                <span>Published</span>
                <strong>{beatDate}</strong>
              </div>
              <div className="beat-editor-summary-grid">
                <div>
                  <span>Likes</span>
                  <strong>{beat.likes || 0}</strong>
                </div>
                <div>
                  <span>Saves</span>
                  <strong>{beat.saves || 0}</strong>
                </div>
                <div>
                  <span>Plays</span>
                  <strong>{beatPlays}</strong>
                </div>
                <div>
                  <span>BPM</span>
                  <strong>{bpm || '--'}</strong>
                </div>
              </div>
            </div>
            <label className="beat-editor-upload">
              Replace cover
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                onChange={(event) => setCoverFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <p className="beat-editor-note">Audio stays untouched. Only metadata and cover can change here.</p>
          </aside>

          <section className="beat-editor-fields">
            <div className="beat-editor-panel">
              <div className="beat-editor-panel-header">
                <h3>Core details</h3>
                <p>Keep the beat searchable and recognizable across the catalog.</p>
              </div>

              <label className="beat-editor-field">
                <span>Title</span>
                <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} />
              </label>

              <div className="beat-editor-grid">
                <label className="beat-editor-field">
                  <span>Genre</span>
                  <GlobalSelect
                    options={genresList}
                    isSearchable={true}
                    isMulti={false}
                    placeholder="Genres"
                    value={toSelectValue(genre)}
                    onChange={(selected) => setGenre(selected && !Array.isArray(selected) ? selected.value : '')}
                  />
                </label>
                <label className="beat-editor-field">
                  <span>BPM</span>
                  <input
                    type="number"
                    min={0}
                    max={maxBpm}
                    value={bpm}
                    placeholder="Tempo"
                    onChange={(event) => {
                      if (event.target.value === '') {
                        setBpm('');
                        return;
                      }
                      const value = Number(event.target.value);
                      if (value >= 0 && value <= maxBpm) {
                        setBpm(String(value));
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="beat-editor-panel">
              <div className="beat-editor-panel-header">
                <h3>Discovery metadata</h3>
                <p>Use the same controlled inputs as upload to avoid malformed values.</p>
              </div>

              <label className="beat-editor-field">
                <span>Tags</span>
                <TagsInput
                  value={tags}
                  onChange={(updatedTags) => setTags(updatedTags.map(normalizeTag))}
                  beforeAddValidate={(tag, existingTags) => !existingTags.includes(tag) && !existingTags.includes(`#${tag}`)}
                  name="tags"
                  placeHolder="#Tags"
                />
              </label>

              <label className="beat-editor-field">
                <span>Moods</span>
                <GlobalSelect
                  options={moodsList}
                  isSearchable={true}
                  isMulti={true}
                  placeholder="Mood"
                  value={toMultiSelectValue(moods)}
                  onChange={(selected) =>
                    setMoods(Array.isArray(selected) ? selected.map((item) => item.value) : [])
                  }
                />
              </label>

              <label className="beat-editor-field">
                <span>Instruments</span>
                <GlobalSelect
                  options={instrumentsList}
                  isSearchable={true}
                  isMulti={true}
                  placeholder="Instruments"
                  value={toMultiSelectValue(instruments)}
                  onChange={(selected) =>
                    setInstruments(Array.isArray(selected) ? selected.map((item) => item.value) : [])
                  }
                />
              </label>
            </div>

            <div className="beat-editor-panel">
              <div className="beat-editor-panel-header">
                <h3>Description</h3>
                <p>Add context about the vibe, references or vocal pocket of the beat.</p>
              </div>

              <label className="beat-editor-field">
                <span>Beat description</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={5}
                  maxLength={1000}
                  placeholder="Describe the vibe, references or vocal pocket of this beat."
                />
              </label>
            </div>

            {error && <div className="beat-editor-error">{error}</div>}

            <div className="beat-editor-actions">
              <button type="button" className="ghost" onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
}
