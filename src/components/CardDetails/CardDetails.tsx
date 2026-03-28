import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import './CardDetails.css';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';

interface Post {
    title: string;
    tags?: string[];
    genre?: string;
    moods?: string[];
    instruments?: string[];
    bpm?: number;
    description?: string;
    user_id: string;
    publication_date: string;
    audio_format?: string;
    likes: number;
    saves: number;
    views?: number;
    _id: string;
}

interface CardDetailsProps {
    post: Post;
    audio: string;
    image: string;
    layoutId: string;
    onClose: () => void;
}

const CardDetails: React.FC<CardDetailsProps> = ({ post, audio, image, layoutId, onClose }) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    const formattedDate = new Date(post.publication_date).toLocaleDateString();
    const tags = (post.tags || []).join(' ');
    const metaCards = [
        { label: 'Genre', value: post.genre || 'Not set' },
        { label: 'Moods', value: (post.moods || []).join(', ') || 'Not set' },
        { label: 'Instruments', value: (post.instruments || []).join(', ') || 'Not set' },
        { label: 'BPM', value: post.bpm ? String(post.bpm) : 'Not set' },
    ];

    const statCards = [
        { label: 'Likes', value: post.likes },
        { label: 'Saves', value: post.saves },
        { label: 'Views', value: post.views ?? 0 },
        { label: 'Published', value: formattedDate },
    ];

    return (
        <motion.div
            className="card-details-popup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="card-details-content"
                layoutId={layoutId}
                initial={{ y: 32, opacity: 0, scale: 0.96 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 24, opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                onClick={(event) => event.stopPropagation()}
            >
                <div className="card-details-header">
                    <div className="card-details-heading">
                        <p className="card-details-eyebrow">Beat preview</p>
                        <h1>{post.title}</h1>
                        <p className="card-details-subtitle">A cleaner responsive view with all the key info visible at a glance.</p>
                    </div>
                    <button className="card-closeBtn" onClick={onClose} aria-label="Close beat details">
                        X
                    </button>
                </div>

                <div className="card-details-layout">
                    <section className="card-details-hero">
                        <div className="card-image-shell">
                            <img className="card-details-image" src={image} alt={`${post.title} cover`} />
                        </div>
                        <div className="card-details-player">
                            <AudioPlayer
                                autoPlay
                                loop={true}
                                src={audio}
                                showJumpControls={false}
                                showSkipControls={false}
                                showDownloadProgress={false}
                                customAdditionalControls={[]}
                                volume={0.2}
                            />
                        </div>
                    </section>

                    <section className="card-details-sidebar">
                        <div className="card-details-stat-grid">
                            {statCards.map((item) => (
                                <article key={item.label} className="card-stat">
                                    <span>{item.label}</span>
                                    <strong>{item.value}</strong>
                                </article>
                            ))}
                        </div>

                        <div className="card-details-meta-grid">
                            {metaCards.map((item) => (
                                <article key={item.label} className="card-meta-block">
                                    <span>{item.label}</span>
                                    <p>{item.value}</p>
                                </article>
                            ))}
                        </div>

                        <article className="card-meta-block card-meta-block-wide">
                            <span>Tags</span>
                            <p>{tags || 'No tags yet'}</p>
                        </article>

                        <article className="card-meta-block card-meta-block-wide">
                            <span>Description</span>
                            <p>{post.description || 'No description added yet.'}</p>
                        </article>
                    </section>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default CardDetails;
