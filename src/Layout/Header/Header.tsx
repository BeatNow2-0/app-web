import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, Settings, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/Logo.png';
import UserSingleton from '../../Model/UserSingleton';
import { deleteAccount, fetchUserProfile, requestLogout, resetProfilePhoto, updateUserProfile, uploadProfilePhoto } from '../../Model/api/auth';
import Profile, { User as ProfileUser } from '../../components/Profile/Profile';
import CustomPopup from '../../components/Popup/CustomPopup';
import './Header.css';

export default function Header() {
  const navigate = useNavigate();
  const singleton = UserSingleton.getInstance();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const openProfile = async () => {
    setOpen(false);
    try {
      const data = await fetchUserProfile();
      setProfileUser({ id: data.id, username: data.username, email: data.email, fullName: data.full_name, bio: data.bio ?? '', photoUrl: data.profile_image_url ?? undefined, password: '' });
      setProfileOpen(true);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to load your profile.') }
  };

  const saveProfile = async (updated: ProfileUser & { photoFile?: File | null }) => {
    const token = localStorage.getItem('token') || '';
    const previousPhoto = profileUser?.photoUrl;
    let refreshed = await updateUserProfile(token, { username: updated.username.trim(), full_name: updated.fullName.trim(), bio: updated.bio?.trim() || null });
    if (updated.photoFile) refreshed = await uploadProfilePhoto(token, updated.photoFile);
    else if (previousPhoto && !updated.photoUrl) refreshed = await resetProfilePhoto(token);
    singleton.setId(refreshed.id); singleton.setUsername(refreshed.username); singleton.setFullName(refreshed.full_name); singleton.setEmail(refreshed.email); singleton.setPhotoProfile(refreshed.profile_image_url || '/avatar-fallback.svg');
    setProfileUser({ id: refreshed.id, username: refreshed.username, email: refreshed.email, fullName: refreshed.full_name, bio: refreshed.bio ?? '', photoUrl: refreshed.profile_image_url ?? undefined, password: '' });
    setMessage('Profile updated.');
  };

  const logout = async () => {
    setOpen(false);
    try { await requestLogout() } finally { singleton.clear(); navigate('/login', { replace: true }) }
  };

  const removeAccount = async () => {
    await deleteAccount();
    singleton.clear();
    await requestLogout().catch(() => undefined);
    navigate('/register', { replace: true });
  };

  return <>
    <header className="header">
      <Link to="/dashboard" className="brand" aria-label="BeatNow home"><img src={logo} alt="" /><span>BeatNow</span></Link>
      <div className="header-tagline">Create. Connect. Be heard.</div>
      <div className="header-profile" ref={dropdownRef}>
        <button type="button" className="profile-trigger" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="menu">
          <img src={singleton.getPhotoProfile() || '/avatar-fallback.svg'} onError={(event) => { event.currentTarget.src = '/avatar-fallback.svg' }} alt="" />
          <span>{singleton.getUsername()}</span><ChevronDown size={16} />
        </button>
        {open && <div className="profile-menu" role="menu">
          <button type="button" onClick={openProfile}><UserRound size={17} />Edit profile</button>
          <button type="button" onClick={() => { setMessage('Account settings are managed from your profile.'); setOpen(false) }}><Settings size={17} />Settings</button>
          <button type="button" className="profile-menu-danger" onClick={logout}><LogOut size={17} />Sign out</button>
        </div>}
      </div>
    </header>
    {profileOpen && profileUser && <Profile user={profileUser} onClose={() => setProfileOpen(false)} onSave={saveProfile} onChangePassword={async () => { throw new Error('Use the password recovery flow. The current backend does not expose authenticated password changes.') }} onDelete={removeAccount} title="Edit profile" />}
    {message && <CustomPopup message={message} onClose={() => setMessage('')} />}
  </>;
}
