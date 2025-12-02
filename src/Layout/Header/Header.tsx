// src/components/Header/Header.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
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

  const token = localStorage.getItem('token');

  // --- API endpoints (ajusta si cambian)
  const API_ME = 'https://51.91.109.185:8001/v1/api/users/users/me';
  const API_UPDATE = 'https://51.91.109.185:8001/v1/api/users/update';
  // Photo endpoint: si tu server de fotos está en otro host/puerto, cámbialo.
  const API_CHANGE_PHOTO = 'https://51.91.109.185:8001/v1/api/users/change_photo_profile';
  const API_DELETE_ACCOUNT = 'https://51.91.109.185:8001/v1/api/users/delete';
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
        password: ''
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
const handleSaveProfile = async (updated: ProfileUser & { photoFile?: File | null }) => {
  const t = localStorage.getItem('token');
  if (!t) {
    setMessage('Token no disponible. Vuelve a iniciar sesión.');
    setShowPopup(true);
    throw new Error('No token');
  }

  const singleton = UserSingleton.getInstance();

  try {
    let uploadedPhotoUrl: string | undefined;

    // 1) Subir foto si hay archivo
    if (updated.photoFile) {
      const form = new FormData();
      form.append('file', updated.photoFile, updated.photoFile.name);

      const resUpload = await fetch(API_CHANGE_PHOTO, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${t}` },
        body: form,
      });

      const uploadText = await resUpload.text().catch(() => '');

      if (!resUpload.ok) {
        console.error('Upload failed:', resUpload.status, uploadText);
        setMessage(`Error subiendo la foto: ${resUpload.status}. ${uploadText?.slice(0,150)}`);
        setShowPopup(true);
        throw new Error(`Error subiendo la foto: ${resUpload.status} - ${uploadText}`);
      }

      // Forzar cache-busting: la ruta de la foto en tu app depende del id
      uploadedPhotoUrl = singleton.getPhotoProfile() + '?v=' + Date.now();
    }

    // 2) Preparar payload para /update (sin password)
const payload: any = {
  _id: updated.id,
  full_name: updated.fullName,
  username: updated.username,
  email: updated.email,
};


    if (uploadedPhotoUrl) {
      payload.photo = uploadedPhotoUrl;
      payload.photoUrl = uploadedPhotoUrl;
    }

    // 3) Llamada a /update
    const resUpdate = await fetch(API_UPDATE, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${t}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const updateText = await resUpdate.text().catch(() => '');

    if (!resUpdate.ok) {
      console.error('Error updating profile', resUpdate.status, updateText);
      setMessage(`Error actualizando perfil: ${resUpdate.status}. ${updateText ? updateText.slice(0,150) : ''}`);
      setShowPopup(true);
      throw new Error(`Error actualizando perfil: ${resUpdate.status} - ${updateText}`);
    }

    let respJson: any = {};
    try { respJson = updateText ? JSON.parse(updateText) : {}; } catch (e) { respJson = {}; }

    const newUserData = {
      id: respJson._id ?? respJson.id ?? updated.id,
      username: respJson.username ?? updated.username,
      email: respJson.email ?? updated.email,
      fullName: respJson.full_name ?? respJson.fullName ?? updated.fullName,
      photoUrl: respJson.photoUrl ?? respJson.photo ?? uploadedPhotoUrl ?? updated.photoUrl ?? undefined,
      is_active: respJson.is_active ?? undefined,
    };

    if (newUserData.fullName) singleton.setFullName(newUserData.fullName);
    if (newUserData.username) singleton.setUsername(newUserData.username);
    if (newUserData.email) singleton.setEmail(newUserData.email);
    if (newUserData.id) singleton.setId(newUserData.id);
    if (typeof newUserData.is_active === 'boolean') singleton.setIsActive(newUserData.is_active);

    if (newUserData.photoUrl) {
      singleton.photoProfile = newUserData.photoUrl + '?v=' + Date.now();
    }

    setProfileUser((prev) => (prev ? { ...prev, ...newUserData } : prev));
    setProfileOpen(false);
  } catch (err) {
    console.error('handleSaveProfile error', err);
    if (!showPopup) {
      setMessage('No se pudo guardar el perfil. Comprueba la consola para más detalles.');
      setShowPopup(true);
    }
    throw err;
  }
};


  // Change password handler
 const handleChangePassword = async (payload: { currentPassword: string; newPassword: string }) => {
  const t = localStorage.getItem('token');
  if (!t) {
    setMessage('Token no disponible. Vuelve a iniciar sesión.');
    setShowPopup(true);
    throw new Error('No token');
  }

  try {
    // Tu backend acepta password via /update -> enviamos _id + password (new)
    const body: any = {
      _id: profileUser?.id ?? UserSingleton.getInstance().getId?.() ?? undefined,
      password: payload.newPassword,
    };

    // IMPORTANTE: Si quieres añadir currentPassword para algún logging o verificación
    // backend actual no lo espera en /update, pero no hace daño enviarlo:
    // body.current_password = payload.currentPassword; // opcional

    const res = await fetch(API_UPDATE, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${t}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    const text = await res.text().catch(() => '');

    if (!res.ok) {
      console.error('Change password via update failed', res.status, text);
      setMessage('No se pudo cambiar la contraseña: ' + (text || res.status));
      setShowPopup(true);
      throw new Error(text || `Error ${res.status}`);
    }

    // success
    setMessage('Contraseña cambiada correctamente.');
    setShowPopup(true);
  } catch (err) {
    console.error('handleChangePassword error', err);
    throw err;
  }
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
