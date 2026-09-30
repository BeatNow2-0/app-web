// src/components/Loading/Loading.tsx

import React, { useEffect, useState } from 'react';
import './Loading.css';

interface LoadingPopupProps {
    message: string;
    detail?: string;
    onCancel?: () => void;
}

const LoadingPopup: React.FC<LoadingPopupProps> = ({ message, detail, onCancel }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
    };

    return (
        <div className={`loading-popup ${isVisible ? 'visible' : ''}`}>
            <div className="loading-popup-container">
                <div className="loading-popup-content">
                    <h2>{message}</h2>
                    {detail && <p role="status">{detail}</p>}
                    <div className="spinner"></div>
                    {onCancel && <button type="button" className="loading-cancel" onClick={onCancel}>Cancel</button>}
                </div>
            </div>
        </div>
    );
};

export default LoadingPopup;
