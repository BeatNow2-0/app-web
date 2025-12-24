import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../../Layout/Header/Header";
import LeftSlide from "../../Layout/LeftSlide/LeftSlide";
import UserSingleton from "../../Model/UserSingleton";
import "./Dashboard.css";
import CardDetails from "../../components/CardDetails/CardDetails";
import CustomPopup from "../../components/Popup/CustomPopup";
import { useNavigate } from "react-router-dom";
import { buildApiUrl } from "../../config/apiConfig";

interface Post {
  _id: string;
  title: string;
  publication_date: string;
  likes: number;
  saves: number;
  tags: string[];
  genre: string;
  moods: string[];
  instruments: string[];
  bpm: number;
  user_id: string;
  audio_format: string;
  cover_format: string;

  // campos opcionales que pueden venir del backend o calcularse frontend
  plays?: number;
  plays_7d?: number;
  likes_7d?: number;
  saves_7d?: number;
}

type PostWithScore = Post & { trendingScore?: number };

function Dashboard() {
  const BACKEND_BASE = "https://res.beatnow.app";

  const navigate = useNavigate();
  const [tokenExists, setTokenExists] = useState(true);
  const [posts, setPosts] = useState<PostWithScore[]>([]);
  const [popularPosts, setPopularPosts] = useState<PostWithScore[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    checkUsername();
    const username = UserSingleton.getInstance().getUsername();
    const token = localStorage.getItem("token");

    axios
      .get(buildApiUrl(`/v1/api/users/posts/${username}`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        const data: Post[] = response.data || [];

        // compute trending score for each post (uses optional plays_7d, likes_7d, saves_7d)
        const computeTrending = (post: Post): number => {
          const plays = (post as any).plays_7d || (post.plays || 0);
          const likes = (post as any).likes_7d || 0;
          const saves = (post as any).saves_7d || 0;
          const ageDays =
            (Date.now() - new Date(post.publication_date).getTime()) /
            (1000 * 60 * 60 * 24);
          // simple formula — puedes ajustar pesos
          const score = plays + likes * 2 + saves * 3 - ageDays * 0.2;
          return Math.max(0, score);
        };

        const withScore: PostWithScore[] = data.map((p) => ({
          ...p,
          trendingScore: computeTrending(p),
        }));

        // ordenar por trendingScore descendente
        const sortedByScore = [...withScore].sort(
          (a, b) => (b.trendingScore || 0) - (a.trendingScore || 0)
        );

        setPosts(withScore);
        setPopularPosts(sortedByScore);
      })
      .catch((error) => {
        console.error("There was an error!", error);
      });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");

    const url = buildApiUrl("/v1/api/users/users/me");
    const headers = {
      accept: "application/json",
      Authorization: `Bearer ${token}`,
    };
    axios
      .get(url, { headers })
      .then((response) => {
        if (response.status === 200) {
          console.log("Información del usuario:", response.data);
        }
      })
      .catch((error) => {
        console.error("Error al obtener la información del usuario.");
        setTokenExists(false);
        setShowPopup(true);
        localStorage.removeItem("token");
        navigate("/login");
      });
  }, [navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, []);

  function handleClick() {
    navigate("/Upload", { state: { token: localStorage.getItem("token") } });
  }

  const handleCardClick = (postId: string, layoutId: string) => {
    console.log(posts.find((post) => post._id === postId));
    setSelectedPostId(postId);
    setSelectedLayoutId(layoutId);
  };

  const handleCloseCardDetails = () => {
    setSelectedPostId(null);
    setSelectedLayoutId(null);
  };

  const selectedPost = posts.find((post) => post._id === selectedPostId);

  function checkUsername() {
    const username = UserSingleton.getInstance().getUsername();
    if (username === "" || username === null) {
      setMessage("Session has expired, redirecting to landing page.");
      setShowPopup(true);
    }
  }

  // Posts recientes ordenados por fecha sin mutar el state original
  const recentPosts = [...posts].sort(
    (a, b) =>
      new Date(b.publication_date).getTime() -
      new Date(a.publication_date).getTime()
  );

  // calcula un umbral dinámico para "isTrending" (top 20% de scores)
  const trendingThreshold = React.useMemo(() => {
    const scores = posts
      .map((p) => p.trendingScore || 0)
      .sort((a, b) => b - a);
    if (scores.length === 0) return 0;
    const idx = Math.max(0, Math.floor(scores.length * 0.2) - 1); // top 20%
    return scores[idx] ?? scores[scores.length - 1];
  }, [posts]);

const makeImageUrl = (post: Post) =>
  `${BACKEND_BASE}/beatnow/${UserSingleton.getInstance().getId()}/posts/${post._id}/caratula.${post.cover_format}`;

const makeAudioUrl = (post: Post) =>
  `${BACKEND_BASE}/beatnow/${UserSingleton.getInstance().getId()}/posts/${post._id}/audio.${post.audio_format}`;


  return (
    <div className="dashboard-page">
      {showPopup && (
        <CustomPopup
          message={message}
          onClose={() => (window.location.href = "/")}
        />
      )}
      <Header />
      <div className="dashboard-body">
        <div className="leftSlide">
          <LeftSlide />
        </div>

        <div className="content">
          <div className="dash-header">
            <div>
              <p className="dash-subtitle">Welcome back,</p>
              <h1 className="home">
                {UserSingleton.getInstance().getUsername()}
              </h1>
              <p className="dash-meta">
                Manage your beats, check performance and upload new drops.
              </p>
            </div>

            <div className="dash-right">
              <button
                className="uploadButton"
                onClick={handleClick}
                title="Upload a beat"
              >
                <i className="fa-solid fa-plus" />
                <span>Upload beat</span>
              </button>
            </div>
          </div>

          {posts.length === 0 ? (
            <div className="empty-state">
              <h2>Your dashboard is empty</h2>
              <p>Upload your first beat and start building your catalog.</p>
              <button className="empty-cta" onClick={handleClick}>
                <i className="fa-solid fa-plus" />
                Upload your first beat
              </button>
            </div>
          ) : (
            <>
              {/* Recent Uploads (vertical list) */}
              <div className="section-container">
                <h3>Recent uploads</h3>
                <div className="list-container">
                  {recentPosts.map((post) => {
                    const isNew =
                      Date.now() -
                        new Date(post.publication_date).getTime() <
                      1000 * 60 * 60 * 24 * 7;
                    const trendingScore = post.trendingScore || 0;
                    const isTrending = trendingScore >= trendingThreshold && trendingThreshold > 0;

                    return (
                      <motion.div
                        key={post._id}
                        className="list-row"
                        onClick={() =>
                          handleCardClick(post._id, `row-${post._id}`)
                        }
                        layoutId={`row-${post._id}`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 12 }}
                        transition={{ duration: 0.18 }}
                      >
                        <img
                          className="thumb"
                          src={makeImageUrl(post)}
                          alt={post.title}
                        />
                        <div className="row-main">
                          <div className="row-title">
                            <span className="row-title-text">{post.title}</span>
                            {isNew && <span className="badge new">New</span>}
                            {isTrending && (
                              <span className="badge trending">Trending</span>
                            )}
                          </div>

                          <div className="row-meta">
                            <span className="small-kpi">
                              <i className="fa-solid fa-play" />{" "}
                              {((post.plays) ?? (post as any)).plays || 0}
                            </span>
                            <span className="small-kpi">
                              <i className="fa-regular fa-heart" /> {post.likes}
                            </span>
                            <span className="small-kpi">
                              <i className="fa-regular fa-bookmark" /> {post.saves}
                            </span>
                            {/* placeholder para sparkline: puedes meter aquí un pequeño SVG o componente */}
                            <span className="small-kpi">Score: {Math.round(trendingScore)}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Popular / Trending Uploads — mostramos top 6 por score */}
              <div className="section-container">
                <h3>Popular uploads</h3>
                <div className="cards-container">
                  {popularPosts.slice(0, 6).map((post, index) => (
                    <motion.div
                      className={`card ${
                        selectedLayoutId === `popular-${index}` ? "hidden" : ""
                      }`}
                      key={post._id}
                      layoutId={`popular-${index}`}
                      onClick={() =>
                        handleCardClick(post._id, `popular-${index}`)
                      }
                      initial={{ opacity: 0, y: 25 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 25 }}
                      transition={{ duration: 0.25 }}
                    >
                      <img
                        className="post-picture"
                        src={makeImageUrl(post)}
                        alt={post.title}
                      />
                      <div className="card-title-row">
                        <h4 className="card-title">{post.title}</h4>
                        <p className="card-date">
                          {new Date(post.publication_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="card-meta">
                        <span>
                          <i className="fa-regular fa-heart" /> {post.likes}
                        </span>
                        <span>
                          <i className="fa-regular fa-bookmark" /> {post.saves}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedPost && selectedLayoutId && (
          <CardDetails
            post={selectedPost}
            image={makeImageUrl(selectedPost)}
            audio={makeAudioUrl(selectedPost)}
            layoutId={selectedLayoutId}
            onClose={handleCloseCardDetails}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default Dashboard;
