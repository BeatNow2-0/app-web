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
  const [genre, setGenre] = useState(beat.genre || '');
  const [bpm, setBpm] = useState<string>(beat.bpm ? String(beat.bpm) : '');
  const [tags, setTags] = useState<string[]>(beat.tags ?? []);
  const [moods, setMoods] = useState<string[]>(beat.moods ?? []);
  const [instruments, setInstruments] = useState<string[]>(beat.instruments ?? []);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(beat.title || '');
    setDescription(beat.description || '');
    setGenre(beat.genre || '');
    setBpm(beat.bpm ? String(beat.bpm) : '');
    setTags(beat.tags ?? []);
    setMoods(beat.moods ?? []);
    setInstruments(beat.instruments ?? []);
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

  return (
    <div className="beat-editor-overlay" role="dialog" aria-modal="true" aria-label="Edit beat" onClick={onClose}>
      <div className="beat-editor-modal" onClick={(event) => event.stopPropagation()}>
        <div className="beat-editor-header">
          <div>
            <p className="beat-editor-eyebrow">Edit beat</p>
            <h2>{beat.title}</h2>
            <p className="beat-editor-subtitle">Keep the audio file as-is and update the metadata with the same controls used on upload.</p>
          </div>
          <button type="button" className="beat-editor-close" onClick={onClose}>
            X
          </button>
        </div>

        <form className="beat-editor-form" onSubmit={handleSubmit}>
          <div className="beat-editor-cover-panel">
            <div className="beat-editor-cover-frame">
              {previewUrl ? <img src={previewUrl} alt={beat.title} /> : <div className="beat-editor-cover-empty">No cover</div>}
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
          </div>

          <div className="beat-editor-fields">
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

            <label className="beat-editor-field">
              <span>Description</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={5}
                maxLength={1000}
                placeholder="Describe the vibe, references or vocal pocket of this beat."
              />
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
