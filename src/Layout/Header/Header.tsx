// src/components/Header/Header.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/Logo.png';
import UserSingleton from '../../Model/UserSingleton';
import Profile, { User as ProfileUser } from '../../components/Profile/Profile';
import CustomPopup from '../../components/Popup/CustomPopup';
import './Header.css';
import {
  fetchUserProfile,
  resetProfilePhoto,
  updateUserProfile,
  uploadProfilePhoto,
} from '../../Model/api/auth';
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
  // Fetch user data when opening profile
  const openProfile = async () => {
    closeDropdown();
    setProfileOpen(true);
    setLoadingProfile(true);
    try {
      const t = localStorage.getItem('token');
      if (!t) throw new Error('No token available');

      const data = await fetchUserProfile(t);
      const mapped: ProfileUser = {
        id: data.id,
        username: data.username,
        email: data.email,
        fullName: data.full_name || '',
        bio: data.bio ?? '',
        photoUrl: data.profile_image_url ?? undefined,
        password: '',
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
const handleSaveProfile = async (updated: ProfileUser & { photoFile?: File | null; password?: string }) => {
  const t = localStorage.getItem('token');
  if (!t) {
    throw new Error('Session expired. Please sign in again.');
  }

  const currentProfile = profileUser;
  const normalizedBio = updated.bio?.trim() || null;

  await updateUserProfile(t, {
    username: updated.username.trim(),
    full_name: updated.fullName.trim(),
    bio: normalizedBio,
  });

  let refreshedProfile = await fetchUserProfile(t);

  if (updated.photoFile) {
    refreshedProfile = await uploadProfilePhoto(t, updated.photoFile);
  } else if (currentProfile?.photoUrl && !updated.photoUrl) {
    refreshedProfile = await resetProfilePhoto(t);
  }

  user.setId(refreshedProfile.id);
  user.setUsername(refreshedProfile.username);
  user.setFullName(refreshedProfile.full_name);
  user.setEmail(refreshedProfile.email);
  user.setIsActive(refreshedProfile.is_active);
  user.setPhotoProfile((refreshedProfile.profile_image_url || user.getPhotoProfile()) + `?v=${Date.now()}`);

  setProfileUser({
    id: refreshedProfile.id,
    username: refreshedProfile.username,
    email: refreshedProfile.email,
    fullName: refreshedProfile.full_name || '',
    bio: refreshedProfile.bio || '',
    photoUrl: refreshedProfile.profile_image_url || undefined,
    password: '',
  });
  setMessage('Perfil actualizado correctamente.');
  setShowPopup(true);
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
    const res = await fetch(buildApiUrl('/v1/api/users/delete'), {
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
