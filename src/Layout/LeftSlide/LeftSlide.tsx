import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import '@fortawesome/fontawesome-free/css/all.min.css';
import './LeftSlide.css';

function LeftSlide() {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    if (isVisible) {
      setIsClosing(true);
      setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
      }, 300); // Duration of the closing animation
    } else {
      setIsVisible(true);
    }
  };

  // Opción B: cerrar con animación y luego navegar (suave)
  const navigateWithClose = (path: string) => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      navigate(path);
    }, 300); // debe coincidir con la duración CSS/JS
  };

  // Si prefieres navegación inmediata (Comportamiento A), usa Link directamente sin usar navigateWithClose.

  return (
    <div>
      <div
        className={`container1 ${isVisible ? 'expanded' : ''} ${isClosing ? 'closing' : ''}`}
        aria-expanded={isVisible}
      >
        <button
          className={`button ${isVisible ? "rotate" : ""}`}
          onClick={toggleMenu}
          aria-label={isVisible ? "Close menu" : "Open menu"}
        >
          {isVisible ? <i className="fas fa-times"></i> : <i className="fas fa-bars"></i>}
        </button>

        {isVisible && (
          <>
            <ul className="menu" role="menu" aria-hidden={!isVisible}>
              {/* Opción B: usamos onClick que primero cierra y luego navega */}
              <li className="menu-item slide-in" role="menuitem" onClick={() => navigateWithClose("/")}>
                <i className="fa-solid fa-house" /> <span className="menu-label">Home</span>
              </li>

              <li className="menu-item slide-in" role="menuitem" onClick={() => navigateWithClose("/beats")}>
                <i className="fa-solid fa-music" /> <span className="menu-label">Beats</span>
              </li>

              <li className="menu-item slide-in" role="menuitem" onClick={() => navigateWithClose("/Stats")}>
                <i className="fa-solid fa-chart-column" /> <span className="menu-label">Stats</span>
              </li>

              {/* Si prefieres usar Links directos (Comportamiento A), cámbialo por:
                <li className="menu-item slide-in"><Link to="/beats"><i ... /></Link></li>
              */}
            </ul>

            {/* Upload link - también con cierre animado */}
            <button
              className={`uploadBeat ${isVisible ? 'slide-in' : 'slide-out'}`}
              onClick={() => navigateWithClose("/Upload")}
              aria-label="Upload beat"
            >
              Upload
            </button>
          </>
        )}
      </div>

      {/* fondo oscuro que cierra el menú al click */}
      {isVisible && <div className="dark-background" onClick={toggleMenu} aria-hidden="true"></div>}
    </div>
  );
}

export default LeftSlide;
