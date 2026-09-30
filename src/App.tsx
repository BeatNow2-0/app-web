// src/App.tsx

// APIS: Refer to API_BASE_URL in src/config/apiConfig.json (e.g., API_BASE_URL + '/docs#/')

import React from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './Screens/Login Page/LoginPage';
import SignUpPage from "./Screens/Sign Up Page/SignUpPage";
import './App.css';
import Upload from "./Screens/UploadScreens/Upload";
import Dashboard from "./Screens/DashboardPage/Dashboard";
import BeatsPage from "./Screens/BeatsPage/BeatsPage";
import ForgotPwdPage from "./Screens/ForgotPwd Page/ForgotPwdPage";
import Stats from './Screens/StatsPage/Stats';
import NotFound from './Screens/NotFoundPage/NotFound';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Navigate to={localStorage.getItem('token') ? '/dashboard' : '/login'} replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<SignUpPage />} />
                <Route path={"/ForgotPwd"} element={<ForgotPwdPage />} />
                <Route element={<ProtectedRoute />}>
                    <Route path="/upload" element={<Upload />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/beats" element={<BeatsPage />} />
                    <Route path="/stats" element={<Stats />} />
                </Route>
                  <Route path="*" element={<NotFound />} />
            </Routes>
        </Router>
    );
}

export default App;
