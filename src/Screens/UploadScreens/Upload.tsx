import React, { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileAudio, ImagePlus, LoaderCircle, UploadCloud, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TagsInput } from 'react-tag-input-component';
import GlobalSelect from '../../components/Select/GlobalSelect';
import CustomPopup from '../../components/Popup/CustomPopup';
import { genresList, instrumentsList, moodsList } from '../../constants/beatFormOptions';
import { analyzeBeat, discardBeatAnalysis } from '../../Model/api/beatAnalysis';
import { BeatAnalysisExpiredError, publishBeatFromAnalysis, updateBeat, uploadBeat } from '../../Model/api/posts';
import type { BeatAnalysisResponse } from '../../types/beatAnalysis';
import './Upload.css';
import './BeatAnalysis.css';

const AUDIO_TYPES = ['audio/wav', 'audio/x-wav', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a'];
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AUDIO = 50 * 1024 * 1024;
const MAX_IMAGE = 10 * 1024 * 1024;
type AnalysisStatus = 'idle' | 'uploading' | 'analyzing' | 'completed' | 'failed';
const sizeLabel = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const timeLabel = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
const unique = (items: string[]) => [...new Map(items.map((item) => [item.trim().toLowerCase(), item.trim()])).values()].filter(Boolean);
const optionValue = (value: string, options: { value: string; label: string }[]) => options.find((item) => item.value.toLowerCase() === value.trim().toLowerCase() || item.label.toLowerCase() === value.trim().toLowerCase())?.value;
const withSuggestedOptions = (options: { value: string; label: string }[], suggestions: string[] = []) => [
  ...options,
  ...suggestions.filter((value) => !optionValue(value, options)).map((value) => ({ value, label: value })),
];

export default function Upload() {
  const navigate = useNavigate();
  const controller = useRef<AbortController | null>(null);
  const analysisController = useRef<AbortController | null>(null);
  const audioInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [bpm, setBpm] = useState('');
  const [key, setKey] = useState('');
  const [keyEdited, setKeyEdited] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [moods, setMoods] = useState<string[]>([]);
  const [instruments, setInstruments] = useState<string[]>([]);
  const [audio, setAudio] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [terms, setTerms] = useState(false);
  const [rights, setRights] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);
  const [drag, setDrag] = useState<'audio' | 'cover' | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('idle');
  const [analysisResult, setAnalysisResult] = useState<BeatAnalysisResponse | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState('');
  const [manualOnly, setManualOnly] = useState(false);
  const [previewStart, setPreviewStart] = useState('');
  const [previewEnd, setPreviewEnd] = useState('');
  const preview = useMemo(() => cover ? URL.createObjectURL(cover) : '', [cover]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => () => { controller.current?.abort(); analysisController.current?.abort(); }, []);

  const validateAudio = (file: File | null) => {
    if (!file) return 'Choose an audio file.';
    if (!AUDIO_TYPES.includes(file.type) || !/\.(mp3|m4a|wav)$/i.test(file.name)) return 'Use an MP3, M4A or WAV file.';
    if (file.size === 0) return 'The audio file is empty.';
    if (file.size > MAX_AUDIO) return 'Audio must be 50 MB or smaller.';
    return '';
  };
  const validateCover = (file: File | null) => {
    if (!file) return 'Choose cover artwork.';
    if (!IMAGE_TYPES.includes(file.type) || !/\.(jpe?g|png|webp)$/i.test(file.name)) return 'Use a JPEG, PNG or WebP image.';
    if (file.size === 0) return 'The image file is empty.';
    if (file.size > MAX_IMAGE) return 'Cover artwork must be 10 MB or smaller.';
    return '';
  };

  const clearCurrentAnalysis = () => {
    analysisController.current?.abort();
    analysisController.current = null;
    if (analysisId) void discardBeatAnalysis(analysisId);
    setAnalysisId(null);
    setAnalysisResult(null);
    setAnalysisStatus('idle');
    setAnalysisError('');
    setPreviewStart('');
    setPreviewEnd('');
    setManualOnly(false);
  };

  const chooseAudio = (file: File | null) => {
    const error = validateAudio(file);
    if (error) { setMessage(error); return; }
    if (file === audio) return;
    clearCurrentAnalysis();
    setAudio(file);
    // Analyzer suggestions are only cleared when they still match what was suggested.
    if (analysisResult?.musical?.bpm && bpm === String(Math.round(analysisResult.musical.bpm))) setBpm('');
    const suggestedGenre = analysisResult?.suggested_metadata?.genre?.[0];
    if (suggestedGenre && (optionValue(suggestedGenre, genresList) || suggestedGenre).toLowerCase() === genre.toLowerCase()) setGenre('');
    const suggestedMoods = analysisResult?.suggested_metadata?.mood || [];
    if (suggestedMoods.length && suggestedMoods.every((item) => moods.some((mood) => mood.toLowerCase() === (optionValue(item, moodsList) || item).toLowerCase()))) {
      const suggested = new Set(suggestedMoods.map((item) => (optionValue(item, moodsList) || item).toLowerCase()));
      setMoods(moods.filter((item) => !suggested.has(item.toLowerCase())));
    }
    const suggestedTags = analysisResult?.suggested_metadata?.tags || [];
    if (suggestedTags.length && suggestedTags.every((item) => tags.includes(item))) setTags(tags.filter((item) => !suggestedTags.includes(item)));
    if (!keyEdited) setKey('');
  };
  const chooseCover = (file: File | null) => {
    const error = file ? validateCover(file) : '';
    if (error) { setMessage(error); return; }
    setCover(file);
  };

  const runAnalysis = async () => {
    if (!audio || analysisStatus === 'uploading' || analysisStatus === 'analyzing') return;
    const validationError = validateAudio(audio);
    if (validationError) { setAnalysisError(validationError); setAnalysisStatus('failed'); return; }
    if (analysisId) void discardBeatAnalysis(analysisId);
    setAnalysisId(null);
    setAnalysisResult(null);
    setAnalysisError('');
    setAnalysisStatus('uploading');
    const abort = new AbortController();
    analysisController.current = abort;
    try {
      const result = await analyzeBeat(audio, { signal: abort.signal, onUploadProgress: (value) => { setProgress(value); if (value >= 100) setAnalysisStatus('analyzing'); } });
      if (abort.signal.aborted) return;
      setAnalysisStatus('analyzing');
      setAnalysisResult(result);
      setAnalysisId(result.analysis_id);
      if (result.status === 'completed' || !result.status) {
        setAnalysisStatus('completed');
        const musical = result.musical;
        const metadata = result.suggested_metadata;
        if (!bpm && musical?.bpm != null) setBpm(String(Math.round(musical.bpm)));
        const detectedKey = [musical?.key, musical?.scale].filter(Boolean).join(' ');
        if (!key && detectedKey) setKey(detectedKey);
        if (!genre && metadata?.genre?.length) setGenre(optionValue(metadata.genre[0], genresList) || metadata.genre[0]);
        if (metadata?.mood?.length) setMoods((current) => unique([...current, ...metadata.mood!.map((item) => optionValue(item, moodsList) || item)]).slice(0, 20));
        if (metadata?.tags?.length) setTags((current) => unique([...current, ...metadata.tags!]).slice(0, 20));
        if (result.preview?.start_seconds != null) setPreviewStart(String(result.preview.start_seconds));
        if (result.preview?.end_seconds != null) setPreviewEnd(String(result.preview.end_seconds));
      } else {
        setAnalysisStatus('failed');
        setAnalysisError("We couldn't analyze this beat. You can try again or continue manually.");
      }
    } catch (error) {
      if (abort.signal.aborted) return;
      setAnalysisStatus('failed');
      setAnalysisError(error instanceof Error && error.message ? error.message : "We couldn't analyze this beat. You can try again or continue manually.");
    } finally {
      if (analysisController.current === abort) analysisController.current = null;
    }
  };

  const validate = () => {
    if (!title.trim()) return 'Add a title.';
    if (title.trim().length > 120) return 'Title must be 120 characters or less.';
    if (!genre) return 'Choose a genre.';
    const tempo = Number(bpm);
    if (!Number.isInteger(tempo) || tempo < 1 || tempo > 400) return 'BPM must be between 1 and 400.';
    if (tags.length === 0) return 'Add at least one tag.';
    if (tags.length > 20 || moods.length > 20 || instruments.length > 20) return 'Use no more than 20 values per metadata field.';
    if (description.length > 1000) return 'Description must be 1,000 characters or less.';
    const audioError = validateAudio(audio); if (audioError) return audioError;
    const coverError = validateCover(cover); if (coverError) return coverError;
    if (!terms || !rights) return 'Accept the terms and confirm that you own the upload rights.';
    return '';
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (publishing || analysisStatus === 'uploading' || analysisStatus === 'analyzing') return;
    const error = validate(); if (error) { setMessage(error); return; }
    setPublishing(true); setProgress(0); setDone(false);
    const abort = new AbortController(); controller.current = abort;
    try {
      let publishNotice = 'Your beat is live.';
      if (analysisId && analysisStatus === 'completed' && !manualOnly) {
        const published = await publishBeatFromAnalysis({
          analysis_id: analysisId, title: title.trim(), description: description.trim(), genre,
          bpm: Number(bpm), tags, moods, instruments,
          ...(previewStart !== '' ? { preview_start: Number(previewStart) } : {}),
          ...(previewEnd !== '' ? { preview_end: Number(previewEnd) } : {}),
        }, { signal: abort.signal });
        // The deployed from-analysis request has no cover field; attach artwork through the existing edit route.
        if (cover) {
          const postId = published._id || published.id || published.post_id || published.beat_id;
          if (!postId) publishNotice = 'Your beat is live, but its cover could not be attached. You can add artwork from your catalog.';
          else {
            try {
              await updateBeat(localStorage.getItem('token') || '', postId, {
                title: title.trim(), description: description.trim(), genre, bpm: Number(bpm), tags, moods, instruments, coverFile: cover,
              });
            } catch {
              publishNotice = 'Your beat is live, but its cover could not be attached. You can add artwork from your catalog.';
            }
          }
        }
      } else {
        await uploadBeat({ title: title.trim(), description: description.trim(), genre, bpm: Number(bpm), tags, moods, instruments, coverFile: cover!, audioFile: audio! }, {
          signal: abort.signal, onProgress: setProgress,
        });
      }
      if (analysisId) void discardBeatAnalysis(analysisId);
      setAnalysisId(null);
      setDone(true); setMessage(publishNotice);
      setTitle(''); setDescription(''); setGenre(''); setBpm(''); setKey(''); setKeyEdited(false); setTags([]); setMoods([]); setInstruments([]); setAudio(null); setCover(null); setTerms(false); setRights(false); setAnalysisResult(null); setAnalysisStatus('idle'); setPreviewStart(''); setPreviewEnd(''); setManualOnly(false);
    } catch (err) {
      const expired = err instanceof BeatAnalysisExpiredError;
      const errorMessage = err instanceof Error ? err.message : 'Upload failed.';
      setMessage(errorMessage);
      if (expired && analysisId) {
        setAnalysisStatus('failed');
        setAnalysisError('This analysis has expired. Please analyze the audio again. Your form details are still here.');
      }
    } finally { controller.current = null; setPublishing(false); }
  };

  const drop = (event: React.DragEvent, target: 'audio' | 'cover') => {
    event.preventDefault(); setDrag(null); const file = event.dataTransfer.files[0] || null;
    target === 'audio' ? chooseAudio(file) : chooseCover(file);
  };
  const result = analysisResult;
  const genreOptions = withSuggestedOptions(genresList, result?.suggested_metadata?.genre);
  const moodOptions = withSuggestedOptions(moodsList, result?.suggested_metadata?.mood);
  const confidence = result?.musical?.key_confidence;
  const energyLabel = result?.musical?.energy == null ? '' : result.musical.energy >= 0.7 ? 'High' : result.musical.energy >= 0.4 ? 'Medium' : 'Low';
  const stereoLabel = result?.stereo?.mono_risk ? `${result.stereo.mono_risk[0].toUpperCase()}${result.stereo.mono_risk.slice(1)} mono risk` : result?.stereo?.width == null ? '' : result.stereo.width >= 0.5 ? 'Wide' : 'Narrow';

  return <div className="page upload-page">
    <header className="page-header"><div><p className="page-eyebrow">Publish</p><h1 className="page-title">Release a new beat.</h1><p className="page-subtitle">High-quality audio, precise metadata and artwork that makes your sound recognizable.</p></div></header>
    <form className="upload-workspace" onSubmit={submit}>
      <section className="upload-files">
        <button className={`file-drop ${drag === 'audio' ? 'dragging' : ''}`} type="button" onClick={() => audioInput.current?.click()} onDragOver={(e) => { e.preventDefault(); setDrag('audio'); }} onDragLeave={() => setDrag(null)} onDrop={(e) => drop(e, 'audio')}>
          <input ref={audioInput} type="file" accept=".mp3,.m4a,.wav,audio/mpeg,audio/mp4,audio/wav" onChange={(e) => chooseAudio(e.target.files?.[0] || null)} />
          <FileAudio /><strong>{audio ? audio.name : 'Drop your audio here'}</strong><span>{audio ? `${sizeLabel(audio.size)} · ${audio.name.split('.').pop()?.toUpperCase()} · Click to replace` : 'MP3, M4A or WAV · max 50 MB'}</span>
        </button>
        <button className={`file-drop cover-drop ${drag === 'cover' ? 'dragging' : ''}`} type="button" onClick={() => coverInput.current?.click()} onDragOver={(e) => { e.preventDefault(); setDrag('cover'); }} onDragLeave={() => setDrag(null)} onDrop={(e) => drop(e, 'cover')}>
          <input ref={coverInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => chooseCover(e.target.files?.[0] || null)} />{preview ? <img src={preview} alt="Cover preview" /> : <ImagePlus />}
          <strong>{cover ? cover.name : 'Add cover artwork'}</strong><span>{cover ? `${sizeLabel(cover.size)} · Click to replace` : 'JPEG, PNG or WebP · max 10 MB'}</span>{cover && <span className="cover-remove" onClick={(e) => { e.stopPropagation(); setCover(null); }}><X size={16} /></span>}
        </button>
      </section>
      <section className="upload-form-panel">
        <div className="form-section analyzer-section">
          <div><h2>BeatNow analyzes it</h2><p>Get suggested metadata and a technical snapshot before publishing.</p></div>
          {audio && <div className="analysis-file"><FileAudio size={17} /><span>{audio.name} · {sizeLabel(audio.size)} · {audio.name.split('.').pop()?.toUpperCase()}</span></div>}
          <div className="analysis-actions">
            <button className="button" type="button" onClick={runAnalysis} disabled={!audio || analysisStatus === 'uploading' || analysisStatus === 'analyzing'}>
              {(analysisStatus === 'uploading' || analysisStatus === 'analyzing') && <LoaderCircle className="analysis-spinner" size={17} />}
              {analysisStatus === 'completed' ? 'Analyze again' : analysisStatus === 'uploading' || analysisStatus === 'analyzing' ? 'Analyzing your beat…' : analysisStatus === 'failed' ? 'Try again' : 'Analyze beat'}
            </button>
            {analysisStatus === 'failed' && <button className="button button--secondary" type="button" onClick={() => { setManualOnly(true); setAnalysisStatus('idle'); setAnalysisError(''); }}>Continue manually</button>}
            {manualOnly && <span className="analysis-manual-note">Manual publishing is ready.</span>}
          </div>
          {(analysisStatus === 'uploading' || analysisStatus === 'analyzing') && <p className="analysis-status" role="status">{analysisStatus === 'uploading' ? 'Uploading audio securely…' : 'Analyzing your beat. This may take a few seconds.'}</p>}
          {analysisStatus === 'failed' && <p className="analysis-error" role="alert"><AlertTriangle size={17} />{analysisError || "We couldn't analyze this beat. You can try again or continue manually."}</p>}
        </div>

        {analysisStatus === 'completed' && result && <section className="beat-analysis-panel" aria-label="Beat Analysis">
          <div className="analysis-panel-heading"><div><p className="page-eyebrow">BeatNow</p><h2>Beat Analysis</h2></div><span><CheckCircle2 size={16} /> Ready to publish</span></div>
          <div className="analysis-highlights">
            {result.musical?.bpm != null && <div><span>Detected BPM</span><strong>{Math.round(result.musical.bpm)} <small>BPM</small></strong></div>}
            {(result.musical?.key || result.musical?.scale) && <div><span>Detected key</span><strong>{[result.musical.key, result.musical.scale].filter(Boolean).join(' ')}</strong>{confidence != null && <small>{Math.round(confidence * 100)}% confidence</small>}</div>}
            {result.loudness?.integrated_lufs != null && <div><span>Integrated loudness</span><strong>{result.loudness.integrated_lufs.toFixed(1)} <small>LUFS</small></strong></div>}
            {result.loudness?.true_peak_dbtp != null && <div><span>True peak</span><strong>{result.loudness.true_peak_dbtp.toFixed(1)} <small>dBTP</small></strong></div>}
            {result.loudness?.dynamic_range_db != null && <div><span>Dynamics</span><strong>{result.loudness.dynamic_range_db.toFixed(1)} <small>dB</small></strong></div>}
            {stereoLabel && <div><span>Stereo</span><strong>{stereoLabel}</strong></div>}
            {energyLabel && <div><span>Energy</span><strong>{energyLabel}</strong></div>}
          </div>
          {result.audio?.duration_seconds != null && <p className="analysis-duration">Audio duration · {timeLabel(result.audio.duration_seconds)}</p>}
          {!!result.frequency_balance && <div className="frequency-balance"><h3>Frequency balance</h3><div>{([['sub', 'Sub'], ['bass', 'Bass'], ['low_mid', 'Low mids'], ['mid', 'Mids'], ['high_mid', 'High mids'], ['high', 'Highs']] as const).map(([field, label]) => {
            const value = result.frequency_balance?.[field];
            return value == null ? null : <div className="frequency-row" key={field}><span>{label}</span><div><i style={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }} /></div><small>{Math.round(value * 100)}%</small></div>;
          })}</div></div>}
          {result.preview?.start_seconds != null && result.preview.end_seconds != null && <div className="recommended-preview"><div><h3>Recommended preview</h3><strong>{timeLabel(Number(previewStart || result.preview.start_seconds))} → {timeLabel(Number(previewEnd || result.preview.end_seconds))}</strong></div><label>Start (sec)<input className="field-control" type="number" min="0" value={previewStart} onChange={(e) => setPreviewStart(e.target.value)} /></label><label>End (sec)<input className="field-control" type="number" min="0" value={previewEnd} onChange={(e) => setPreviewEnd(e.target.value)} /></label></div>}
          {!!result.insights?.length && <div className="analysis-insights"><h3>Suggestions</h3>{result.insights.map((insight, index) => <article key={`${insight.title || insight.message || 'insight'}-${index}`} className={`analysis-insight ${insight.type === 'warning' ? 'is-warning' : ''}`}><strong>{insight.type === 'warning' && <AlertTriangle size={16} />}{insight.title || (insight.type === 'warning' ? 'Suggestion' : 'Insight')}</strong>{(insight.message || insight.description) && <p>{insight.message || insight.description}</p>}{insight.suggestion && <p><b>Suggestion:</b> {insight.suggestion}</p>}</article>)}</div>}
        </section>}

        <div className="form-section"><div><h2>Beat details</h2><p>Make the essentials clear and searchable.</p></div>
          <label><span>Title</span><input className="field-control" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Midnight Signals" /></label>
          <div className="field-pair"><label><span>Genre</span><GlobalSelect options={genreOptions} value={genre} onChange={(selected) => setGenre(selected && !Array.isArray(selected) ? selected.value : '')} placeholder="Choose genre" isSearchable /></label><label><span>BPM</span><input className="field-control" type="number" min={1} max={400} value={bpm} onChange={(e) => setBpm(e.target.value)} placeholder="140" /></label></div>
          <label><span>Key / tonality {analysisStatus === 'completed' && confidence != null && <small>Detected · {Math.round(confidence * 100)}% confidence</small>}</span><input className="field-control" value={key} onChange={(e) => { setKey(e.target.value); setKeyEdited(true); }} placeholder="e.g. F# minor" /></label>
          <label><span>Tags</span><TagsInput value={tags} onChange={(next) => setTags(next.map((tag) => tag.replace(/^#/, '').trim()).filter(Boolean).slice(0, 20))} name="tags" placeHolder="Type and press Enter" /></label>
          <label><span>Moods</span><GlobalSelect options={moodOptions} isMulti value={moods.map((value) => ({ value, label: value }))} onChange={(selected) => setMoods(Array.isArray(selected) ? selected.map((item) => item.value).slice(0, 20) : [])} placeholder="Choose moods" /></label>
          <label><span>Instruments</span><GlobalSelect options={instrumentsList} isMulti value={instruments.map((value) => ({ value, label: value }))} onChange={(selected) => setInstruments(Array.isArray(selected) ? selected.map((item) => item.value).slice(0, 20) : [])} placeholder="Choose instruments" /></label>
        </div>
        <div className="form-section"><div><h2>Story and rights</h2><p>Add context for artists and confirm ownership.</p></div><label><span>Description <small>{description.length}/1000</small></span><textarea className="field-control" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} rows={6} placeholder="Describe the vibe, vocal pocket or inspiration…" /></label><label className="check-line"><input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} /><span>I accept BeatNow’s terms of use.</span></label><label className="check-line"><input type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} /><span>I own or control the rights to this audio and artwork.</span></label></div>
        <div className="publish-panel">{publishing && <div className="upload-progressbar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div>}<div><UploadCloud /><div><strong>{publishing ? analysisId ? 'Publishing analyzed beat…' : `Uploading ${progress}%` : 'Ready to publish?'}</strong><span>{publishing ? 'Keep this tab open until publishing completes.' : 'Review your files and metadata before publishing.'}</span></div></div><div className="publish-actions">{publishing && <button className="button button--secondary" type="button" onClick={() => controller.current?.abort()}>Cancel</button>}<button className="button" type="submit" disabled={publishing || analysisStatus === 'uploading' || analysisStatus === 'analyzing'}>{publishing ? 'Publishing…' : 'Publish beat'}</button></div></div>
      </section>
    </form>
    {message && <CustomPopup message={message} onClose={() => { setMessage(''); if (done) navigate('/beats'); }} />}
  </div>;
}
