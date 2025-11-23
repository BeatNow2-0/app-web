// src/App.tsx

// APIS: Refer to API_BASE_URL in src/config/apiConfig.json (e.g., API_BASE_URL + '/docs#/')

import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import LoginPage from './Screens/Login Page/LoginPage';
import SignUpPage from "./Screens/Sign Up Page/SignUpPage";
import './App.css';
import Upload from "./Screens/UploadScreens/Upload";
import Dashboard from "./Screens/DashboardPage/Dashboard";
import CustomPopup from './components/Popup/CustomPopup';
import ForgotPwdPage from "./Screens/ForgotPwd Page/ForgotPwdPage";

const CheckToken = () => {
    const timeout = 3000;
    const location = useLocation();
    const [showPopup, setShowPopup] = useState(false);
    const intervalRef = useRef<number | null>(null);
    const logout = () => {
        localStorage.removeItem("token");
        setShowPopup(true);
    }

    const checkToken = () => {
        intervalRef.current = window.setInterval(() => {
            const token = localStorage.getItem("token");
if (!token) return; // no borrar nada

        }, timeout);
    }

    useEffect(() => {
        if (location.pathname !== "/" &&
            location.pathname !== "/login" &&
            location.pathname !== "/register" &&
            location.pathname !== "/forgotPwd") {
            checkToken();
        }
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }
    }, [location]);

    return (
        <>
            {showPopup && <CustomPopup message="Session has expired, redirecting to landing page." onClose={() => window.location.href = "/"} />}
        </>
    );
}

function App() {
    return (
        <Router>
            <CheckToken />
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<SignUpPage />} />
                <Route path="*" element={<LoginPage />} />
                <Route path="/Upload" element={<Upload />} />
                <Route path={"/Dashboard"} element={<Dashboard />} />
                <Route path={"/ForgotPwd"} element={<ForgotPwdPage />} />
            </Routes>
        </Router>
    );
}

export default App;