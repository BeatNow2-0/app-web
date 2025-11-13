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
}

function Dashboard() {
  const navigate = useNavigate();
  const [tokenExists, setTokenExists] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);
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
        const data: Post[] = response.data;
        setPosts(data);

        const sortedPosts = [...data].sort(
          (a, b) => b.likes + b.saves - (a.likes + a.saves)
        );
        setPopularPosts(sortedPosts);
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
              <span className="rt-clock">
                {currentTime.toLocaleTimeString("en-US", { hour12: false })}
              </span>
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
              {/* Recent Uploads */}
              <div className="section-container">
                <h3>Recent uploads</h3>
                <div className="cards-container">
                  {recentPosts.map((post, index) => (
                    <motion.div
                      className={`card ${
                        selectedLayoutId === `post-${index}` ? "hidden" : ""
                      }`}
                      key={post._id}
                      layoutId={`post-${index}`}
                      onClick={() =>
                        handleCardClick(post._id, `post-${index}`)
                      }
                      initial={{ opacity: 0, y: 25 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 25 }}
                      transition={{ duration: 0.25 }}
                    >
                      <img
                        className="post-picture"
                        src={`http://172.203.251.28/beatnow/${UserSingleton.getInstance().getId()}/posts/${post._id}/caratula.${post.cover_format}`}
                        alt={post.title}
                      />
                      <div className="card-title-row">
                        <h4 className="card-title">{post.title}</h4>
                        <p className="card-date">
                          {new Date(
                            post.publication_date
                          ).toLocaleDateString()}
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

              {/* Popular Uploads */}
              <div className="section-container">
                <h3>Popular uploads</h3>
                <div className="cards-container">
                  {popularPosts.map((post, index) => (
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
                        src={`http://172.203.251.28/beatnow/${UserSingleton.getInstance().getId()}/posts/${post._id}/caratula.${post.cover_format}`}
                        alt={post.title}
                      />
                      <div className="card-title-row">
                        <h4 className="card-title">{post.title}</h4>
                        <p className="card-date">
                          {new Date(
                            post.publication_date
                          ).toLocaleDateString()}
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
            image={`http://172.203.251.28/beatnow/${UserSingleton.getInstance().getId()}/posts/${selectedPost._id}/caratula.${selectedPost.cover_format}`}
            audio={`http://172.203.251.28/beatnow/${UserSingleton.getInstance().getId()}/posts/${selectedPost._id}/audio.${selectedPost.audio_format}`}
            layoutId={selectedLayoutId}
            onClose={handleCloseCardDetails}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default Dashboard;
