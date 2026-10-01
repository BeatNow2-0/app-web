import React, { useEffect, useState } from 'react';
import './CustomPopup.css';

interface CustomPopupProps {
    message: string;
    onClose: () => void;
}

const CustomPopup: React.FC<CustomPopupProps> = ({ message, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') handleClose(); };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 150);
    };

    return (
        <div className={`custom-popup ${isVisible ? 'visible' : ''}`} role="alertdialog" aria-modal="true" aria-label="BeatNow message" onClick={handleClose}>
            <div className="custom-popup-content" onClick={(event) => event.stopPropagation()}>
                <h2>BeatNow</h2>
                <p>{message}</p>
                <button className="button" onClick={handleClose}>Got it</button>
            </div>
        </div>
    );
};

export default CustomPopup;
