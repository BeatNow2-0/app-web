import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Header from "../../Layout/Header/Header";
import LeftSlide from "../../Layout/LeftSlide/LeftSlide";
import UserSingleton from "../../Model/UserSingleton";
import "./Stats.css";
import { BeatPost, fetchProducerPosts } from "../../Model/api/posts";

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
  const navigate = useNavigate();
  const backendBase = "https://res.beatnow.app";
  const username = UserSingleton.getInstance().getUsername();
  const userId = UserSingleton.getInstance().getId();
  const token = localStorage.getItem("token");

  const [posts, setPosts] = useState<BeatPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // seguridad: si no hay username o token, evitamos la llamada y navegamos a login
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

    fetchProducerPosts(token || "", username)
      .then((data) => {
        setPosts(
          data.map((p) => ({
            plays: (p as any).plays || 0,
            plays_7d: (p as any).plays_7d || 0,
            likes_7d: (p as any).likes_7d || 0,
            saves_7d: (p as any).saves_7d || 0,
            price: (p as any).price || 0,
            sales_count: (p as any).sales_count || 0,
            ...p,
          }))
        );
      })
      .catch((err) => {
        console.error("Error fetching posts", err);
        setErrorMsg("No se pudieron cargar las estadísticas. Comprueba la conexión.");
      })
      .finally(() => setLoading(false));
  }, [username, token]);

  const totals = useMemo(() => {
    const totalPlays = posts.reduce((s, p) => s + (p.plays || 0), 0);
    const plays7d = posts.reduce((s, p) => s + ((p as any).plays_7d || 0), 0);
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

  const strongestBeat = topBeats[0];
  const saveRate = totals.totalPlays > 0 ? ((totals.totalSaves / totals.totalPlays) * 100).toFixed(1) : "0.0";

  const activitySeries = useMemo(() => {
    const days = 14;
    const arr = new Array(days).fill(0);
    const now = new Date();
    posts.forEach((p) => {
      const plays7 = (p as any).plays_7d || 0;
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

  const makeImageUrl = (post: BeatPost) =>
    post.cover_image_url ||
    `${backendBase}/beatnow/${userId}/posts/${post._id}/caratula.${post.cover_format || "jpg"}`;

  // CSV export (cliente)
  const exportCsv = () => {
    if (!posts || posts.length === 0) {
      return;
    }
    const headers = [
      "id",
      "title",
      "publication_date",
      "plays",
      "plays_7d",
      "likes",
      "saves",
      "price",
      "sales_count",
    ];
    const rows = posts.map((p) =>
      headers.map((h) => {
        // @ts-ignore
        return typeof p[h] === "string" ? `"${String(p[h]).replace(/"/g, '""')}"` : p[h] ?? "";
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
            </div>
          </div>

          {loading ? (
            <div className="loading">Cargando estadísticas…</div>
          ) : errorMsg ? (
            <div className="error">{errorMsg}</div>
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
                  <div className="sparkline-wrap">
                    <Sparkline points={activitySeries} />
                  </div>
                </div>
              </section>

              <section className="section">
                <h3>What to do next</h3>
                <div className="top-grid">
                  <div className="top-card">
                    <div className="top-info">
                      <div className="title">Best performing beat</div>
                      <div className="small">
                        {strongestBeat ? `${strongestBeat.title} is leading your catalog right now.` : "Upload more beats to identify your strongest performer."}
                      </div>
                      <div className="meta">
                        <span>{formatNumber(strongestBeat?.plays || strongestBeat?.views || 0)} plays</span>
                        <span>{strongestBeat?.likes || 0} likes</span>
                      </div>
                    </div>
                  </div>

                  <div className="top-card">
                    <div className="top-info">
                      <div className="title">Save rate</div>
                      <div className="small">
                        {saveRate}% of your plays are turning into saves. Improve covers and tags on underperforming beats.
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="section">
                <h3>Top beats</h3>
                <div className="top-grid">
                  {topBeats.map((p) => (
                    <motion.div className="top-card" key={p._id} whileHover={{ translateY: -6 }} layout>
                      <img src={makeImageUrl(p)} alt={p.title} className="top-thumb" />
                      <div className="top-info">
                        <div className="title">{p.title}</div>
                        <div className="meta">
                          <span>{formatNumber(p.plays || 0)} plays</span>
                          <span>{p.likes} ♥</span>
                          <span>{p.saves} 💾</span>
                        </div>
                        <div className="small">Publicado: {new Date(p.publication_date).toLocaleDateString()}</div>
                      </div>
                    </motion.div>
                  ))}
                  {topBeats.length === 0 && <div className="muted">Aún no hay beats publicados.</div>}
                </div>
              </section>

              <section className="section">
                <h3>Quick actions</h3>
                <div className="actions-row">
                  <button onClick={() => navigate("/Beats")}>Manage beats</button>
                  <button onClick={() => navigate("/Upload")}>Upload a new beat</button>
                  <button onClick={exportCsv}>Export CSV</button>
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
