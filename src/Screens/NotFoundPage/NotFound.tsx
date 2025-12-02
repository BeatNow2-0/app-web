import React from "react";
import { Link } from "react-router-dom";
import "./NotFound.css";
import logo from "../../assets/Logo.png";

function NotFound() {
  const token = localStorage.getItem("token");

  return (
    <div className="notfound-page">
      <div className="notfound-container">
        <img src={logo} alt="BeatNow Logo" className="notfound-logo" />

        <h1 className="notfound-title">404</h1>
        <p className="notfound-subtitle">Oops! The page you’re looking for doesn’t exist.</p>

        <div className="notfound-actions">
          {token ? (
            <Link className="notfound-btn" to="/login">
              Go back to Login page
            </Link>
          ) : (
            <Link className="notfound-btn" to="/">
              Go back Home
            </Link>
          )}
        </div>

        <p className="notfound-hint">If you believe this is an error, please contact support.</p>
      </div>
    </div>
  );
}

export default NotFound;
