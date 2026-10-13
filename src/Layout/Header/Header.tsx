import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/Logo.png';
import { useAuth } from '../../contexts/AuthContext';
import { deleteAccount, fetchUserProfile, requestLogout, resetProfilePhoto, updateUserProfile, uploadProfilePhoto } from '../../Model/api/auth';
import Profile, { User as ProfileUser } from '../../components/Profile/Profile';
import CustomPopup from '../../components/Popup/CustomPopup';
import './Header.css';

export default function Header() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
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
      setProfileUser({ id: data.id, username: data.username, email: data.email, fullName: data.full_name, bio: data.bio ?? '', photoUrl: data.profile_image_url ?? undefined, });
      setProfileOpen(true);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to load your profile.') }
  };

  const saveProfile = async (updated: ProfileUser & { photoFile?: File | null }) => {
    const token = '';
    const previous = profileUser;
    const profileChanged = !previous
      || updated.username.trim() !== previous.username
      || updated.fullName.trim() !== previous.fullName
      || (updated.bio?.trim() || '') !== (previous.bio?.trim() || '');
    const updateProfile = () => updateUserProfile(token, { username: updated.username.trim(), full_name: updated.fullName.trim(), bio: updated.bio?.trim() || null });
    let refreshed: Awaited<ReturnType<typeof fetchUserProfile>>;
    if (updated.photoFile) {
      if (profileChanged) await updateProfile();
      refreshed = await uploadProfilePhoto(token, updated.photoFile);
    } else if (previous?.photoUrl && !updated.photoUrl) {
      if (profileChanged) await updateProfile();
      refreshed = await resetProfilePhoto(token);
    } else if (profileChanged) refreshed = await updateProfile();
    else refreshed = await fetchUserProfile(token);
    setUser(refreshed);
    setProfileUser({ id: refreshed.id, username: refreshed.username, email: refreshed.email, fullName: refreshed.full_name, bio: refreshed.bio ?? '', photoUrl: refreshed.profile_image_url ?? undefined, });
    setMessage('Profile updated.');
  };

  const logout = async () => {
    setOpen(false);
    try { await requestLogout(); navigate('/login', { replace: true }); } catch { setMessage('Local session ended. Server logout could not be confirmed; reconnect and retry signing out.'); } finally { setUser(null); }
  };

  const removeAccount = async () => {
    await deleteAccount();
    setUser(null);
    await requestLogout().catch(() => undefined);
    navigate('/register', { replace: true });
  };

  return <>
    <header className="header">
      <Link to="/dashboard" className="brand" aria-label="BeatNow home"><img src={logo} alt="" /><span>BeatNow</span></Link>
      <div className="header-tagline">Create. Connect. Be heard.</div>
      <div className="header-profile" ref={dropdownRef}>
        <button type="button" className="profile-trigger" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="menu">
          <img src={user?.profile_image_url || '/avatar-fallback.svg'} onError={(event) => { event.currentTarget.src = '/avatar-fallback.svg' }} alt="" />
          <span>{user?.username}</span><ChevronDown size={16} />
        </button>
        {open && <div className="profile-menu" role="menu">
          <Link to={`/profile/${user?.id}`} onClick={() => setOpen(false)}>View profile</Link>
          <button type="button" onClick={openProfile}><UserRound size={17} />Edit profile</button>
          <button type="button" className="profile-menu-danger" onClick={logout}><LogOut size={17} />Sign out</button>
        </div>}
      </div>
    </header>
    {profileOpen && profileUser && <Profile user={profileUser} onClose={() => setProfileOpen(false)} onSave={saveProfile} onDelete={removeAccount} title="Edit profile" />}
    {message && <CustomPopup message={message} onClose={() => setMessage('')} />}
  </>;
}
