// src/components/Header/Header.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../../assets/Logo.png';
import UserSingleton from '../../Model/UserSingleton';
import Profile, { User as ProfileUser } from '../../components/Profile/Profile';
import CustomPopup from '../../components/Popup/CustomPopup';
import './Header.css';

function Header() {
  const [message, setMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const user = UserSingleton.getInstance();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      closeDropdown();
    }
  };

  useEffect(() => {
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

  const closePopup = () => {
    setShowPopup(false);
  };

  const token = localStorage.getItem('token');

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
      {token === null ? (
        <div>
          
        </div>
      ) : (
        <div className="nav-links">
          <div className="profile" onClick={toggleDropdown} ref={dropdownRef}>
            <img src={user.photoProfile} alt="Profile" />
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
      )}
      {showPopup && <CustomPopup message={message} onClose={closePopup} />}

      {/* Profile modal */}
      {profileOpen && profileUser && (
        <Profile
          user={profileUser}
          onClose={() => setProfileOpen(false)}
          onSave={handleSaveProfile}
          onChangePassword={handleChangePassword}
          onDelete={handleDeleteAccount}
          title={loadingProfile ? 'Cargando...' : 'Editar perfil'}
        />
      )}
    </>
  );
}

export default Header;
