// Stats.tsx (adaptado a tus endpoints)
import React, { useEffect, useMemo, useRef, useState } from "react";
import axios, { AxiosInstance } from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../../Layout/Header/Header";
import LeftSlide from "../../Layout/LeftSlide/LeftSlide";
import UserSingleton from "../../Model/UserSingleton";
import "./ProducerStats.css";

/**
 * CONFIG — ajusta aquí si en algún momento cambian hosts/puertos.
 */
const API_BASE = "https://51.91.109.185:8001"; // para /v1/api
const ASSETS_BASE = "https://51.91.109.185"; // para /beatnow/... (imagenes/audio)

/** Tipos */
interface Post {
  _id: string;
  title: string;
  publication_date: string;
  likes: number;
  saves: number;
  plays?: number;
  plays_7d?: number;
  likes_7d?: number;
  saves_7d?: number;
  audio_format?: string;
  cover_format?: string;
  price?: number;
  sales_count?: number;
  user_id?: string;
}

function formatNumber(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
}

const Sparkline: React.FC<{ points: number[]; height?: number; width?: number }> = ({
  points,
  height = 40,
  width = 160,
}) => {
  if (!points || points.length === 0) return <svg width={width} height={height} />;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = Math.max(1, max - min);
  const step = width / Math.max(1, points.length - 1);
  const path = points
    .map((p, i) => {
      const x = i * step;
      const y = height - ((p - min) / range) * height;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} className="sparkline" role="img" aria-label="Sparkline">
      <path d={path} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
};

export default function Stats() {
  const username = UserSingleton.getInstance().getUsername();
  const userId = UserSingleton.getInstance().getId();
  const token = localStorage.getItem("token") || "";

  // axios instance with token
  const apiRef = useRef<AxiosInstance | null>(null);
  if (!apiRef.current) {
    apiRef.current = axios.create({
      baseURL: API_BASE,
      timeout: 15000,
    });
    apiRef.current.interceptors.request.use((cfg) => {
  if (token) {
    (cfg.headers as any) = {
      ...(cfg.headers as Record<string, any>),
      Authorization: `Bearer ${token}`,
    };
  }
  return cfg;
});
  }
  const api = apiRef.current!;

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    if (!username) {
      setErrorMsg("Usuario no identificado. Por favor inicia sesión.");
      setLoading(false);
      return;
    }
    if (!token) {
      setErrorMsg("Sesión expirada. Inicia sesión de nuevo.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    (async () => {
      try {
        const res = await api.get(`/v1/api/users/posts/${username}`, { signal: controller.signal });
        // según tu ejemplo la API devuelve un array de posts o en ocasiones un objeto por item
        // asumimos que res.data puede ser array o single-object; adaptamos:
        const raw = res.data;
        let arr: Post[] = [];
        if (Array.isArray(raw)) arr = raw;
        else if (raw && typeof raw === "object" && raw._id) arr = [raw];
        else if (Array.isArray(raw.posts)) arr = raw.posts;
        else arr = [];

        // normalizamos y aseguramos campos numéricos
        const norm = arr.map((p) => ({
          plays: (p as any).plays || 0,
          plays_7d: (p as any).plays_7d || 0,
          likes_7d: (p as any).likes_7d || 0,
          saves_7d: (p as any).saves_7d || 0,
          price: (p as any).price || 0,
          sales_count: (p as any).sales_count || 0,
          ...p,
        }));
        setPosts(norm);
      } catch (err: any) {
        if (controller.signal.aborted) return;
        console.error("Error fetching posts", err);
        setErrorMsg("No se pudieron cargar las estadísticas. Comprueba la conexión.");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [username, token, refreshKey]);

  // Totales y derivados
  const totals = useMemo(() => {
    const totalPlays = posts.reduce((s, p) => s + (p.plays || 0), 0);
    const plays7d = posts.reduce((s, p) => s + ((p.plays_7d || 0) as number), 0);
    const estimatedPlays30d = plays7d * 4;
    const totalLikes = posts.reduce((s, p) => s + (p.likes || 0), 0);
    const totalSaves = posts.reduce((s, p) => s + (p.saves || 0), 0);
    const totalSales = posts.reduce((s, p) => s + ((p.sales_count || 0) * (p.price || 0)), 0);
    const estRevenue = totalSales;
    return {
      totalPlays,
      plays7d,
      estimatedPlays30d,
      totalLikes,
      totalSaves,
      estRevenue,
      totalPosts: posts.length,
    };
  }, [posts]);

  const topBeats = useMemo(() => {
    return [...posts].sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 6);
  }, [posts]);

  const activitySeries = useMemo(() => {
    const days = 14;
    const arr = new Array(days).fill(0);
    const now = new Date();
    posts.forEach((p) => {
      const plays7 = (p.plays_7d || 0) as number;
      for (let i = 0; i < 7; i++) {
        const idx = Math.max(0, days - 1 - i);
        arr[idx] += plays7 / 7;
      }
      const pub = new Date(p.publication_date);
      const diffDays = Math.floor((now.getTime() - pub.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < days) {
        arr[days - 1 - diffDays] += (p.plays || 0) * 0.25;
      }
    });
    return arr.map((v) => Math.round(v));
  }, [posts]);

  // Construcción URLs de assets — usamos user_id del post si está, o el userId global.
  const makeImageUrl = (post: Post) => {
    const uid = post.user_id || userId || "";
    const ext = post.cover_format || "jpg";
    // normalize double slashes
    return `${ASSETS_BASE}/beatnow/${uid}/posts/${post._id}/caratula.${ext}`.replace(/([^:]\/)\/+/g, "$1");
  };

  const makeAudioUrl = (post: Post) => {
    const uid = post.user_id || userId || "";
    const ext = post.audio_format || "mp3";
    // possible filename: audio.{ext} (si tu servidor usa otro nombre cambia aquí)
    return `${ASSETS_BASE}/beatnow/${uid}/posts/${post._id}/audio.${ext}`.replace(/([^:]\/)\/+/g, "$1");
  };

  // CSV export
  const exportCsv = () => {
    if (!posts || posts.length === 0) return;
    const headers = ["id", "title", "publication_date", "plays", "plays_7d", "likes", "saves", "price", "sales_count"];
    const rows = posts.map((p) =>
      headers.map((h) => {
        // @ts-ignore
        const val = p[h] ?? "";
        if (typeof val === "string") return `"${String(val).replace(/"/g, '""')}"`;
        return String(val);
      })
    );
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${username || "producer"}-stats.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRefresh = () => setRefreshKey((k) => k + 1);

  const togglePlay = async (post: Post) => {
    try {
      if (!audioRef.current) {
        audioRef.current = document.createElement("audio");
        audioRef.current.preload = "none";
        audioRef.current.onended = () => setPlayingId(null);
      }
      if (playingId === post._id) {
        audioRef.current.pause();
        setPlayingId(null);
        return;
      }
      audioRef.current.src = makeAudioUrl(post);
      await audioRef.current.play();
      setPlayingId(post._id);
    } catch (e) {
      console.error("Error playing preview", e);
      setErrorMsg("No se pudo reproducir la vista previa.");
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = "/assets/default-cover.jpg";
  };

  return (
    <div className="producer-page">
      <Header />
      <div className="producer-body">
        <aside className="producer-left">
          <LeftSlide />
        </aside>

        <main className="producer-content">
          <div className="prod-top">
            <div>
              <h2>Stats de productor</h2>
              <p className="muted">Resumen de rendimiento de tus beats</p>
            </div>

            <div className="prod-actions">
              <button className="primary" onClick={() => (window.location.href = "/Upload")}>
                Subir beat
              </button>
              <button className="secondary" onClick={exportCsv} title="Descargar CSV">
                Exportar CSV
              </button>
              <button className="secondary" onClick={handleRefresh} title="Refrescar">
                Refrescar
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading">Cargando estadísticas…</div>
          ) : errorMsg ? (
            <div className="error">
              {errorMsg} <button className="linkish" onClick={() => handleRefresh()}>Reintentar</button>
            </div>
          ) : (
            <>
              <section className="kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-label">Total plays</div>
                  <div className="kpi-value">{formatNumber(totals.totalPlays)}</div>
                  <div className="kpi-sub">Últimos 7 días: {formatNumber(totals.plays7d)}</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-label">Beats publicados</div>
                  <div className="kpi-value">{totals.totalPosts}</div>
                  <div className="kpi-sub">Guardados: {formatNumber(totals.totalSaves)}</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-label">Likes</div>
                  <div className="kpi-value">{formatNumber(totals.totalLikes)}</div>
                  <div className="kpi-sub">Tendencia 7d</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-label">Estimación ingresos</div>
                  <div className="kpi-value">€ {totals.estRevenue.toFixed(2)}</div>
                  <div className="kpi-sub">Ventas licencias incluidas</div>
                </div>

                <div className="kpi-card wide">
                  <div className="kpi-label">Actividad (últimos 14 días)</div>
                  <div className="sparkline-wrap"><Sparkline points={activitySeries} /></div>
                </div>
              </section>

              <section className="section">
                <h3>Top beats</h3>
                <div className="top-grid">
                  {topBeats.map((p) => (
                    <motion.div className="top-card" key={p._id} whileHover={{ translateY: -6 }} layout>
                      <img
                        src={makeImageUrl(p)}
                        alt={p.title}
                        className="top-thumb"
                        loading="lazy"
                        onError={handleImageError}
                      />
                      <div className="top-info">
                        <div className="title">{p.title}</div>
                        <div className="meta">
                          <span>{formatNumber(p.plays || 0)} plays</span>
                          <span>{p.likes} ♥</span>
                          <span>{p.saves} 💾</span>
                        </div>
                        <div className="small">Publicado: {new Date(p.publication_date).toLocaleDateString()}</div>

                        <div className="top-actions">
                          <button onClick={() => (window.location.href = `/post/${p._id}`)}>Ver</button>
                          <button onClick={() => togglePlay(p)} aria-pressed={playingId === p._id}>
                            {playingId === p._id ? "Pausar" : "Escuchar"}
                          </button>
                          <a className="linkish" href={makeAudioUrl(p)} target="_blank" rel="noreferrer">Abrir audio</a>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {topBeats.length === 0 && <div className="muted">Aún no hay beats publicados.</div>}
                </div>
              </section>

              <section className="section">
                <h3>Detalles y acciones</h3>
                <div className="actions-row">
                  <button onClick={() => (window.location.href = "/profile")}>Ver perfil público</button>
                  <button onClick={() => (window.location.href = "/sales")}>Ver ventas / licencias</button>
                  <button onClick={exportCsv}>Exportar CSV</button>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
      <AnimatePresence />
    </div>
  );
}
