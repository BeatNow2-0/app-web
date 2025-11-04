// src/Screens/Landing Page/LandingPage.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './LandingPage.css';
import Header from '../../Layout/Header/Header';
import logo from '../../assets/Logo.png';
import studio from '../../assets/Studio 2.jpeg';
import qr from '../../assets/qrbeatnow.png';
import { buildApiUrl } from '../../config/apiConfig';

const fadeInUp = {
    initial: { opacity: 0, y: 32 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: 'easeOut' },
    viewport: { once: true, amount: 0.3 },
};

const fadeIn = {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    transition: { duration: 0.8, ease: 'easeOut' },
    viewport: { once: true, amount: 0.2 },
};

const featureHighlights = [
    {
        title: 'Inteligencia de audio en tiempo real',
        description:
            'Analiza tempo, armonías y energía al instante para centrarte en crear mientras la plataforma optimiza cada pista.',
    },
    {
        title: 'Colaboración distribuida',
        description:
            'Comparte sesiones seguras con tu equipo, comenta versiones y aprueba masters desde cualquier dispositivo.',
    },
    {
        title: 'Distribución sin fricción',
        description:
            'Publica en tus plataformas favoritas con metadatos generados automáticamente y un pipeline listo para sellos.',
    },
];

const workflowSteps = [
    {
        step: '01',
        title: 'Captura tu idea',
        description: 'Sube stems, loops o voces y deja que BeatNow genere vistas previas inteligentes para cada take.',
    },
    {
        step: '02',
        title: 'Perfecciona con IA',
        description: 'Utiliza mastering asistido, mezclas sugeridas y automatización de efectos basada en tu estilo.',
    },
    {
        step: '03',
        title: 'Lanza con confianza',
        description: 'Exporta masters listos con control de versiones y reportes de calidad para tu sello o distribuidora.',
    },
];

const securityHighlights = [
    {
        title: 'Autenticación protegida',
        description: 'Tokens cifrados y caducidad automática para mantener tus sesiones privadas a salvo.',
    },
    {
        title: 'Infraestructura endurecida',
        description: 'Procesos aislados, cifrado TLS extremo a extremo y monitoreo continuo de integridad.',
    },
    {
        title: 'Control de acceso granular',
        description: 'Define roles por proyecto y revisa auditorías detalladas desde tu panel de control.',
    },
];

const statHighlights = [
    { value: '50K+', label: 'Proyectos renderizados' },
    { value: '120', label: 'Países con creadores activos' },
    { value: '99.99%', label: 'Disponibilidad en la nube' },
];

function Landing() {
    const downloadUrl = React.useMemo(() => buildApiUrl('/v1/api/download/android-apk/'), []);
    const [isMobile, setIsMobile] = React.useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));

    const handleResize = React.useCallback(() => {
        if (typeof window !== 'undefined') {
            setIsMobile(window.innerWidth < 768);
        }
    }, []);

    React.useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [handleResize]);

    const handleDownload = () => {
        window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="landing-page">
            <Header />
            <div className="landing-background" aria-hidden="true">
                <div className="orb orb-one" />
                <div className="orb orb-two" />
                <div className="orb orb-three" />
            </div>

            <main className="landing-main">
                <motion.section
                    className="hero"
                    initial={fadeInUp.initial}
                    whileInView={fadeInUp.whileInView}
                    transition={fadeInUp.transition}
                    viewport={fadeInUp.viewport}
                >
                    <div className="hero-content">
                        <span className="hero-eyebrow">Producción musical impulsada por IA</span>
                        <h1>
                            Diseña paisajes sonoros
                            <span className="gradient-text"> a la velocidad de tus ideas.</span>
                        </h1>
                        <p>
                            BeatNow combina análisis inteligente, colaboración remota y una infraestructura segura para que
                            transformes ideas en lanzamientos profesionales sin salir de la plataforma.
                        </p>
                        <div className="hero-actions">
                            <button type="button" className="primary-button" onClick={handleDownload}>
                                {isMobile ? 'Descargar app Android' : 'Probar BeatNow ahora'}
                            </button>
                            <Link className="ghost-button" to="/register">
                                Crear cuenta gratuita
                            </Link>
                        </div>
                        <div className="hero-meta">
                            <span>Sin tarjetas. Cancelación cuando quieras.</span>
                            <span>Infraestructura auditada y cifrada.</span>
                        </div>
                    </div>

                    <motion.div
                        className="hero-visual"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                    >
                        <div className="hero-visual-card">
                            <img src={studio} alt="Estudio de producción con BeatNow" />
                            <div className="hero-visual-glow" />
                        </div>
                        <motion.div
                            className="hero-floating"
                            animate={{ y: [0, -12, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <img src={logo} alt="Logotipo de BeatNow" />
                        </motion.div>
                    </motion.div>
                </motion.section>

                <motion.section
                    className="stats"
                    initial={fadeIn.initial}
                    whileInView={fadeIn.whileInView}
                    transition={fadeIn.transition}
                    viewport={fadeIn.viewport}
                >
                    {statHighlights.map((stat) => (
                        <div className="stat-card" key={stat.label}>
                            <span className="stat-value">{stat.value}</span>
                            <span className="stat-label">{stat.label}</span>
                        </div>
                    ))}
                </motion.section>

                <motion.section
                    className="features"
                    initial={fadeInUp.initial}
                    whileInView={fadeInUp.whileInView}
                    transition={fadeInUp.transition}
                    viewport={fadeInUp.viewport}
                >
                    <div className="section-header">
                        <span className="section-eyebrow">Lo que nos hace diferentes</span>
                        <h2>Un ecosistema completo para productores modernos</h2>
                        <p>
                            Todas las herramientas que necesitas para colaborar, versionar y publicar con la tranquilidad de
                            un flujo protegido extremo a extremo.
                        </p>
                    </div>
                    <div className="features-grid">
                        {featureHighlights.map((feature) => (
                            <motion.article
                                className="feature-card"
                                key={feature.title}
                                whileHover={{ y: -6 }}
                                transition={{ duration: 0.3 }}
                            >
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                            </motion.article>
                        ))}
                    </div>
                </motion.section>

                <motion.section
                    className="workflow"
                    initial={fadeInUp.initial}
                    whileInView={fadeInUp.whileInView}
                    transition={fadeInUp.transition}
                    viewport={fadeInUp.viewport}
                >
                    <div className="section-header">
                        <span className="section-eyebrow">Cómo funciona</span>
                        <h2>De la inspiración al lanzamiento en tres pasos</h2>
                    </div>
                    <div className="workflow-grid">
                        {workflowSteps.map((step) => (
                            <motion.article
                                className="workflow-card"
                                key={step.title}
                                whileHover={{ y: -4 }}
                                transition={{ duration: 0.3 }}
                            >
                                <span className="workflow-step">{step.step}</span>
                                <h3>{step.title}</h3>
                                <p>{step.description}</p>
                            </motion.article>
                        ))}
                    </div>
                </motion.section>

                <motion.section
                    className="security"
                    initial={fadeInUp.initial}
                    whileInView={fadeInUp.whileInView}
                    transition={fadeInUp.transition}
                    viewport={fadeInUp.viewport}
                >
                    <div className="section-header">
                        <span className="section-eyebrow">Seguridad de nivel empresarial</span>
                        <h2>Protegemos tus masters y tus datos</h2>
                        <p>
                            Diseñamos BeatNow con controles de seguridad activos desde la autenticación hasta la distribución
                            final. Nada sale al aire sin tu permiso.
                        </p>
                    </div>
                    <div className="security-grid">
                        {securityHighlights.map((item) => (
                            <motion.article
                                className="security-card"
                                key={item.title}
                                whileHover={{ y: -4 }}
                                transition={{ duration: 0.3 }}
                            >
                                <h3>{item.title}</h3>
                                <p>{item.description}</p>
                            </motion.article>
                        ))}
                    </div>
                </motion.section>

                <motion.section
                    className="download"
                    initial={fadeInUp.initial}
                    whileInView={fadeInUp.whileInView}
                    transition={fadeInUp.transition}
                    viewport={fadeInUp.viewport}
                >
                    <div className="download-card">
                        <div className="download-copy">
                            <span className="section-eyebrow">Empieza hoy mismo</span>
                            <h2>Experimenta la plataforma completa desde tu móvil</h2>
                            <p>
                                Descarga la app para Android y sincroniza al instante con la versión web. Tus ajustes, presets y
                                proyectos viven en un entorno cifrado y sincronizado.
                            </p>
                            <div className="download-actions">
                                <button type="button" className="primary-button" onClick={handleDownload}>
                                    Descargar BeatNow
                                </button>
                                <Link className="ghost-button" to="/login">
                                    Iniciar sesión
                                </Link>
                            </div>
                        </div>
                        <div className="download-visual">
                            {isMobile ? (
                                <div className="download-placeholder">
                                    <img src={logo} alt="BeatNow" />
                                </div>
                            ) : (
                                <button type="button" className="qr-wrapper" onClick={handleDownload}>
                                    <img src={qr} alt="Código QR para descargar BeatNow" />
                                    <span>Escanea con tu cámara</span>
                                </button>
                            )}
                        </div>
                    </div>
                </motion.section>
            </main>

            <footer className="landing-footer">
                <div className="landing-footer-content">
                    <div className="footer-brand">
                        <img src={logo} alt="BeatNow" />
                        <p>Impulsamos la próxima generación de productores y sellos independientes.</p>
                    </div>
                    <div className="footer-links">
                        <Link to="/login">Iniciar sesión</Link>
                        <Link to="/register">Crear cuenta</Link>
                        <span className="footer-pill">Seguridad reforzada 2024</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default Landing;
