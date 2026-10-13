import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { removeLegacySession } from './Model/api/client';
removeLegacySession();
import './styles/global.css';
import { PlayerProvider } from './contexts/PlayerContext';
import GlobalPlayer from './components/Player/GlobalPlayer';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider><PlayerProvider>
      <App />
      <GlobalPlayer />
    </PlayerProvider></AuthProvider>
  </React.StrictMode>,
);
