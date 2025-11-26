import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../../assets/Logo.png';
import UserSingleton from '../../Model/UserSingleton';
import CustomPopup from '../../components/Popup/CustomPopup';
import './Header.css';

function Header() {
  const [message, setMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const user = UserSingleton.getInstance();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();

  // RUTAS donde NO mostrar la foto de perfil.
  // Incluye '/' por si tu login está en la raíz.
  // Añade aquí cualquier otra ruta auth (p.e. '/auth', '/auth/login').
  const hideProfileOn = [
    '/',
    '/login',
    '/register',
    '/forgotPwd',
    '/auth',       // cubrir '/auth' base
    '/auth/login', // rutas anidadas
    '/auth/register'
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // cuando cambiamos de ruta cerramos el dropdown si estamos en páginas auth
    if (isAuthRoute()) {
      setDropdownOpen(false);
    }
  }, [location.pathname]);

  const toggleDropdown = () => {
    if (dropdownOpen) {
      closeDropdown();
    } else {
      setDropdownOpen(true);
    }
  };

  const closeDropdown = () => {
    setClosing(true);
    setTimeout(() => {
      setDropdownOpen(false);
      setClosing(false);
    }, 300);
  };

  const handleLogout = () => {
    closeDropdown();
    localStorage.removeItem('token');
    UserSingleton.getInstance().clear();
    window.location.href = '/';
  };

  const notAvailable = () => {
    setMessage('This feature is not available yet.');
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  const token = localStorage.getItem('token');

  // Devuelve true si la ruta actual es una de las de auth.
  function isAuthRoute() {
    const path = location.pathname.toLowerCase();
    // Normaliza: compara igualdad o prefijo para rutas base (ej. '/auth' cubre '/auth/login')
    return hideProfileOn.some((r) => {
      const rr = r.toLowerCase();
      if (rr === '/') {
        // si incluyes '/', úsalo solo si la ruta es exactamente '/' (evita ocultar en '/dashboard')
        return path === '/';
      }
      return path === rr || path.startsWith(rr + '/');
    });
  }

  // DEBUG: si lo necesitas, descomenta la línea para ver la ruta actual en consola
  // console.log('Header: current path =', location.pathname, 'isAuthRoute=', isAuthRoute(), 'token=', token);

  // Si la ruta actual es auth, ocultamos la sección de perfil incluso si hay token
  const shouldHideProfile = isAuthRoute();

  return (
    <header className="header">
      <div className="logo">
        {token === null ? (
          <Link to="/">
            <img className="logoPng" src={logo} alt="Logo" />
          </Link>
        ) : (
          <Link to="/dashboard">
            <img className="logoPng" src={logo} alt="Logo" />
          </Link>
        )}
      </div>

      {!shouldHideProfile && token !== null ? (
        <div className="nav-links">
          <div className="profile" onClick={toggleDropdown} ref={dropdownRef}>
            <img
              src={user.photoProfile || '/default-profile.png'}
              alt="Profile"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                if ((img.dataset as any).fallbackApplied === 'true') return;
                (img.dataset as any).fallbackApplied = 'true';
                img.src = '/default-profile.png';
              }}
            />
            {dropdownOpen && (
              <div className={`dropdown-content ${closing ? 'close' : 'open'}`}>
                <button type="button" onClick={notAvailable}>
                  Perfil
                </button>
                <button type="button" onClick={notAvailable}>
                  Ajustes
                </button>
                <button type="button" onClick={handleLogout}>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ width: 48 }} />
      )}

      {showPopup && <CustomPopup message={message} onClose={closePopup} />}
    </header>
  );
}

export default Header;
