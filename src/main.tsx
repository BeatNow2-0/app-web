import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';
import { PlayerProvider } from './contexts/PlayerContext';
import GlobalPlayer from './components/Player/GlobalPlayer';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <PlayerProvider>
      <App />
      <GlobalPlayer />
    </PlayerProvider>
  </React.StrictMode>,
);
