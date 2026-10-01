import React from 'react';
import { BarChart3, Bookmark, Compass, Disc3, Home, Upload, Waves } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import './LeftSlide.css';

const items = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/upload', label: 'Upload', icon: Upload },
  { to: '/library', label: 'Library', icon: Bookmark },
  { to: '/beats', label: 'My beats', icon: Disc3 },
  { to: '/stats', label: 'Stats', icon: BarChart3 },
];

export default function LeftSlide() {
  return <>
    <aside className="app-nav" aria-label="Primary navigation">
      <div className="nav-label"><Waves size={18} />Studio</div>
      <nav>{items.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'active' : ''}><Icon size={20} /><span>{label}</span></NavLink>)}</nav>
      <div className="nav-foot"><span>BEATNOW</span><small>Producer workspace</small></div>
    </aside>
    <nav className="mobile-nav" aria-label="Mobile navigation">{items.slice(0, 5).map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'active' : ''}><Icon size={21} /><span>{label === 'My beats' ? 'Beats' : label}</span></NavLink>)}</nav>
  </>;
}
