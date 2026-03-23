// src/components/Header/Header.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/Logo.png';
import UserSingleton from '../../Model/UserSingleton';
import Profile, { User as ProfileUser } from '../../components/Profile/Profile';
import CustomPopup from '../../components/Popup/CustomPopup';
import './Header.css';
import { buildApiUrl } from '../../config/apiConfig';

function Header() {
  const [message, setMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const user = UserSingleton.getInstance();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);


  // nuevo: estado para abrir modal de perfil y datos
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

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

  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

  // --- API endpoints (ajusta si cambian)
  const API_ME = buildApiUrl('/v1/api/users/users/me');
  const API_DELETE_ACCOUNT = buildApiUrl('/v1/api/users/delete');
  // Fetch user data when opening profile
  const openProfile = async () => {
    closeDropdown();
    setProfileOpen(true);
    setLoadingProfile(true);
    try {
      const t = localStorage.getItem('token');
      if (!t) throw new Error('No token available');

      const res = await fetch(API_ME, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${t}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('Error fetching profile:', res.status, text);
        setMessage('No se pudo obtener la información de usuario.');
        setShowPopup(true);
        setProfileUser(null);
        setProfileOpen(false);
        return;
      }

      const data = await res.json();
      const mapped: ProfileUser = {
        id: data.id ?? data._id ?? data.userId,
        username: data.username ?? data.user_name ?? data.email?.split('@')?.[0] ?? '',
        email: data.email ?? '',
        fullName: (data.full_name ?? data.fullName ?? data.name) || '',
        photoUrl: data.photoUrl ?? data.photo ?? data.avatar ?? undefined,
        password: data
      };
      setProfileUser(mapped);
    } catch (err) {
      console.error('openProfile error', err);
      setMessage('Error de red al obtener perfil.');
      setShowPopup(true);
      setProfileOpen(false);
    } finally {
      setLoadingProfile(false);
    }
  };

  // onSave: recibe el objeto actualizado (según Profile.tsx)
const handleSaveProfile = async (_updated: ProfileUser & { photoFile?: File | null; password?: string }) => {
  setMessage('La API pública actual no expone endpoints para editar perfil o cambiar la foto.');
  setShowPopup(true);
  throw new Error('Profile update is not supported by the current API schema.');
};



  // Change password handler
 const handleChangePassword = async (_payload: { currentPassword: string; newPassword: string }) => {
  setMessage('La API pública actual no expone un endpoint autenticado para cambiar la contraseña desde perfil. Usa el flujo de recuperación de contraseña.');
  setShowPopup(true);
  throw new Error('Authenticated password change is not supported by the current API schema.');
};


  // Delete account handler
  const handleDeleteAccount = async () => {
  if (!confirm('¿Estás seguro que quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) return;

  const t = localStorage.getItem('token');
  if (!t) {
    setMessage('Token no disponible. Vuelve a iniciar sesión.');
    setShowPopup(true);
    return;
  }

  try {
    const res = await fetch(API_DELETE_ACCOUNT, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${t}`,
        Accept: 'application/json',
      },
    });

    const text = await res.text().catch(() => '');
    if (!res.ok) {
      console.error('delete account failed', res.status, text);
      setMessage('No se pudo eliminar la cuenta: ' + (text || res.status));
      setShowPopup(true);
      throw new Error('Delete failed');
    }

    // success: logout and redirect home
    UserSingleton.getInstance().clear();
    localStorage.removeItem('token');
    window.location.href = '/';
  } catch (err) {
    console.error('handleDeleteAccount error', err);
    setMessage('Error al eliminar la cuenta. Revisa la consola.');
    setShowPopup(true);
    throw err;
  }
};


  return (
    <>
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
          <div />
        ) : (
          <div className="nav-links">
            <div className="profile" onClick={toggleDropdown} ref={dropdownRef}>
              <img src={user.photoProfile} alt="Profile" />
              {dropdownOpen && (
                <div className={`dropdown-content ${closing ? 'close' : 'open'}`}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openProfile();
                    }}
                  >
                    Perfil
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMessage('This feature is not available yet.');
                      setShowPopup(true);
                      closeDropdown();
                    }}
                  >
                    Ajustes
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLogout();
                    }}
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

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
