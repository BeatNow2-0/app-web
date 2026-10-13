// src/App.tsx


import React from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './Screens/Login Page/LoginPage';
import SignUpPage from "./Screens/Sign Up Page/SignUpPage";
import './App.css';
import Upload from "./Screens/UploadScreens/Upload";
import Dashboard from "./Screens/DashboardPage/Dashboard";
import BeatsPage from "./Screens/BeatsPage/BeatsPage";
import ForgotPwdPage from "./Screens/ForgotPwd Page/ForgotPwdPage";
import EmailConfirmationPage from "./Screens/Email Confirmation Page/EmailConfirmationPage";
import Stats from './Screens/StatsPage/Stats';
import NotFound from './Screens/NotFoundPage/NotFound';
import ProtectedRoute, { ProducerRoute } from './components/ProtectedRoute/ProtectedRoute';
import AppShell from './components/AppShell/AppShell';
import ExplorePage from './Screens/ExplorePage/ExplorePage';
import LyricsPage from './Screens/LyricsPage/LyricsPage';
import LibraryPage from './Screens/LibraryPage/LibraryPage';
import ProfilePage from './Screens/ProfilePage/ProfilePage';
import LegalPage from './Screens/Legal Page/LegalPage';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<SignUpPage />} />
                <Route path="/confirm-email" element={<EmailConfirmationPage />} />
                <Route path={"/ForgotPwd"} element={<ForgotPwdPage />} />
                <Route path="/reset-password" element={<ForgotPwdPage />} />
                <Route path="/legal/:document" element={<LegalPage />} />
                <Route element={<ProtectedRoute />}>
                  <Route element={<AppShell />}>
                    <Route element={<ProducerRoute />}><Route path="/upload" element={<Upload />} /><Route path="/beats" element={<BeatsPage />} /><Route path="/stats" element={<Stats />} /></Route>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/explore" element={<ExplorePage />} />
                    <Route path="/library" element={<LibraryPage />} /><Route path="/lyrics" element={<LyricsPage />} />
                    <Route path="/profile/:userId" element={<ProfilePage />} />
                  </Route>
                </Route>
                  <Route path="*" element={<NotFound />} />
            </Routes>
        </Router>
    );
}

export default App;
