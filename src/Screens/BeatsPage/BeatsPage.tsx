import React, { useEffect, useMemo, useState } from 'react';
import Header from '../../Layout/Header/Header';
import LeftSlide from '../../Layout/LeftSlide/LeftSlide';
import UserSingleton from '../../Model/UserSingleton';
import { BeatPost, fetchProducerPosts, updateBeat } from '../../Model/api/posts';
import BeatEditor from '../../components/BeatEditor/BeatEditor';
import CustomPopup from '../../components/Popup/CustomPopup';
import './BeatsPage.css';

const formatNumber = (value: number | undefined) => {
  if (!value) return '0';
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return `${value}`;
};

export default function BeatsPage() {
  const username = UserSingleton.getInstance().getUsername();
  const token = localStorage.getItem('token') || '';

  const [beats, setBeats] = useState<BeatPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedBeat, setSelectedBeat] = useState<BeatPost | null>(null);
  const [message, setMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (!token || !username) {
      setLoading(false);
      return;
    }

    fetchProducerPosts(token, username)
      .then(setBeats)
      .catch((error) => {
        setMessage(error instanceof Error ? error.message : 'Unable to load beats.');
        setShowPopup(true);
      })
      .finally(() => setLoading(false));
  }, [token, username]);

  const filteredBeats = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) {
      return beats;
    }

    return beats.filter((beat) => {
      const haystack = [
        beat.title,
        beat.genre,
        beat.description,
        ...(beat.tags || []),
        ...(beat.moods || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [beats, filter]);

  const handleSaveBeat = async (payload: Parameters<typeof updateBeat>[2]) => {
    if (!selectedBeat) {
      return;
    }

    const updated = await updateBeat(token, selectedBeat._id, payload);
    setBeats((current) => current.map((beat) => (beat._id === updated._id ? { ...beat, ...updated } : beat)));
    setSelectedBeat(null);
    setMessage('Beat updated successfully.');
    setShowPopup(true);
  };

  return (
    <div className="beats-page">
      <Header />
      <div className="beats-layout">
        <aside className="beats-sidebar">
          <LeftSlide />
        </aside>

        <main className="beats-content">
          <section className="beats-hero">
            <div>
              <p className="beats-eyebrow">Catalog</p>
              <h1>Your beats</h1>
              <p className="beats-subtitle">
                Keep your catalog clean, update metadata and covers, and make every beat easier to discover.
              </p>
            </div>

            <div className="beats-toolbar">
              <input
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder="Search title, tags or genre"
              />
              <a className="beats-upload-link" href="/Upload">
                Upload new beat
              </a>
            </div>
          </section>

          <section className="beats-summary">
            <div className="beats-kpi">
              <span>Published beats</span>
              <strong>{beats.length}</strong>
            </div>
            <div className="beats-kpi">
              <span>Total likes</span>
              <strong>{beats.reduce((sum, beat) => sum + (beat.likes || 0), 0)}</strong>
            </div>
            <div className="beats-kpi">
              <span>Total saves</span>
              <strong>{beats.reduce((sum, beat) => sum + (beat.saves || 0), 0)}</strong>
            </div>
            <div className="beats-kpi">
              <span>Estimated plays</span>
              <strong>{formatNumber(beats.reduce((sum, beat) => sum + (beat.views || beat.plays || 0), 0))}</strong>
            </div>
          </section>

          <section className="beats-table-shell">
            {loading ? (
              <div className="beats-empty">Loading beats...</div>
            ) : filteredBeats.length === 0 ? (
              <div className="beats-empty">No beats match that search yet.</div>
            ) : (
              <div className="beats-table">
                {filteredBeats.map((beat) => (
                  <article className="beats-row" key={beat._id}>
                    <div className="beats-cell beats-cell--identity">
                      <img
                        src={
                          beat.cover_image_url ||
                          `https://res.beatnow.app/beatnow/${beat.user_id}/posts/${beat._id}/caratula.${beat.cover_format || 'jpg'}`
                        }
                        alt={beat.title}
                      />
                      <div>
                        <h3>{beat.title}</h3>
                        <p>{beat.genre || 'No genre'} · {new Date(beat.publication_date).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="beats-cell">
                      <span className="beats-label">BPM</span>
                      <strong>{beat.bpm || '—'}</strong>
                    </div>

                    <div className="beats-cell">
                      <span className="beats-label">Likes</span>
                      <strong>{beat.likes || 0}</strong>
                    </div>

                    <div className="beats-cell">
                      <span className="beats-label">Saves</span>
                      <strong>{beat.saves || 0}</strong>
                    </div>

                    <div className="beats-cell">
                      <span className="beats-label">Plays</span>
                      <strong>{formatNumber(beat.views || beat.plays || 0)}</strong>
                    </div>

                    <div className="beats-cell beats-cell--actions">
                      <button type="button" onClick={() => setSelectedBeat(beat)}>
                        Edit metadata
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      {selectedBeat && (
        <BeatEditor beat={selectedBeat} onClose={() => setSelectedBeat(null)} onSave={handleSaveBeat} />
      )}

      {showPopup && <CustomPopup message={message} onClose={() => setShowPopup(false)} />}
    </div>
  );
}
