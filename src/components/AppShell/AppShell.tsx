import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../../Layout/Header/Header';
import LeftSlide from '../../Layout/LeftSlide/LeftSlide';
import './AppShell.css';

export default function AppShell() {
  return <div className="app-shell"><Header /><LeftSlide /><main className="app-content"><Outlet /></main></div>;
}
