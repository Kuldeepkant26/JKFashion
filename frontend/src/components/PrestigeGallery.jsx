import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlay, FaExpand, FaAward, FaStar, FaCrown, FaGem } from 'react-icons/fa';
import '../css/PrestigeGallery.css';
import { gallery as galleryImgs } from '../data/images';

const PrestigeGallery = () => {
    const [activeSlide, setActiveSlide] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    const prestigeSlides = [
        {
            id: 1,
            title: 'Punched In-House',
            subtitle: 'Design Studio',
            description: 'Original artwork and buyer references worked into production files by our own team, not outsourced.',
            image: galleryImgs[1],
            icon: FaGem,
            stat: '500+',
            statLabel: 'Designs On File',
            accentColor: 'var(--brand-primary)'
        },
        {
            id: 2,
            title: 'Yardage That Holds',
            subtitle: 'Schiffli Production',
            description: 'Calibrated machines and controlled speeds, so the last metre of an order matches the first.',
            image: galleryImgs[0],
            icon: FaCrown,
            stat: '2M+',
            statLabel: 'Stitches Per Day',
            accentColor: 'var(--brand-secondary)'
        },
        {
            id: 3,
            title: 'Checked By Hand',
            subtitle: 'Mending & Inspection',
            description: 'Every metre passes through mending and a final inspection before it is cleared to ship.',
            image: galleryImgs[4],
            icon: FaAward,
            stat: '100%',
            statLabel: 'Inspected',
            accentColor: 'var(--brand-primary)'
        },
        {
            id: 4,
            title: 'Built For Repeats',
            subtitle: 'Standing Programmes',
            description: 'Reference swatches held on file so a reorder two seasons later still matches the original.',
            image: galleryImgs[3],
            icon: FaStar,
            stat: '25+',
            statLabel: 'Years Running',
            accentColor: 'var(--brand-secondary)'
        }
    ];

    useEffect(() => {
        if (!isAutoPlaying) return;

        const interval = setInterval(() => {
            setActiveSlide((prev) => (prev + 1) % prestigeSlides.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [isAutoPlaying, prestigeSlides.length]);

    const handleSlideChange = (index) => {
        setActiveSlide(index);
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    const currentSlide = prestigeSlides[activeSlide];
    const Icon = currentSlide.icon;

    return (
        <section className="prestige-gallery">
            {/* Animated Background */}
            <div className="prestige-bg-effects">
                <div className="prestige-gradient-orb prestige-orb-1"></div>
                <div className="prestige-gradient-orb prestige-orb-2"></div>
                <div className="prestige-gradient-orb prestige-orb-3"></div>
            </div>

            <div className="prestige-container">
                {/* Section Header */}
                <motion.div 
                    className="prestige-header"
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                    viewport={{ once: true }}
                >
                    <span className="prestige-label">Our Floor</span>
                    <h2 className="prestige-title">Where the Work Happens</h2>
                    <p className="prestige-subtitle">
                        Design, production and inspection under one roof — the four stages every order passes through
                    </p>
                </motion.div>

                {/* Main Gallery Display */}
                <div className="prestige-gallery-wrapper">
                    {/* Large Image Showcase */}
                    <div className="prestige-main-display">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeSlide}
                                className="prestige-slide"
                                initial={{ opacity: 0, scale: 1.1 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.8, ease: "easeInOut" }}
                            >
                                {/* Background Image */}
                                <div 
                                    className="prestige-image"
                                    style={{ backgroundImage: `url(${currentSlide.image})` }}
                                >
                                    <div className="prestige-image-overlay"></div>
                                </div>

                                {/* Content Overlay */}
                                <div className="prestige-content">
                                    <motion.div
                                        className="prestige-icon-wrapper"
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ duration: 0.6, delay: 0.3 }}
                                    >
                                        <Icon className="prestige-icon" />
                                    </motion.div>

                                    <motion.h3
                                        className="prestige-slide-title"
                                        initial={{ opacity: 0, x: -50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.6, delay: 0.4 }}
                                    >
                                        {currentSlide.title}
                                    </motion.h3>

                                    <motion.p
                                        className="prestige-slide-subtitle"
                                        initial={{ opacity: 0, x: -50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.6, delay: 0.5 }}
                                    >
                                        {currentSlide.subtitle}
                                    </motion.p>

                                    <motion.p
                                        className="prestige-slide-description"
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, delay: 0.6 }}
                                    >
                                        {currentSlide.description}
                                    </motion.p>

                                    <motion.div
                                        className="prestige-stat-box"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.6, delay: 0.7 }}
                                        style={{ borderColor: currentSlide.accentColor }}
                                    >
                                        <span className="prestige-stat-number" style={{ color: currentSlide.accentColor }}>
                                            {currentSlide.stat}
                                        </span>
                                        <span className="prestige-stat-label">{currentSlide.statLabel}</span>
                                    </motion.div>
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {/* Navigation Dots */}
                        <div className="prestige-dots">
                            {prestigeSlides.map((slide, index) => (
                                <button
                                    key={slide.id}
                                    className={`prestige-dot ${activeSlide === index ? 'active' : ''}`}
                                    onClick={() => handleSlideChange(index)}
                                    aria-label={`Go to slide ${index + 1}`}
                                >
                                    <span className="prestige-dot-inner"></span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Side Thumbnails */}
                    <div className="prestige-thumbnails">
                        {prestigeSlides.map((slide, index) => {
                            const ThumbIcon = slide.icon;
                            return (
                                <motion.div
                                    key={slide.id}
                                    className={`prestige-thumbnail ${activeSlide === index ? 'active' : ''}`}
                                    onClick={() => handleSlideChange(index)}
                                    initial={{ opacity: 0, x: 50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                    whileHover={{ scale: 1.05, x: -10 }}
                                >
                                    <div 
                                        className="prestige-thumb-image"
                                        style={{ backgroundImage: `url(${slide.image})` }}
                                    >
                                        <div className="prestige-thumb-overlay"></div>
                                    </div>
                                    <div className="prestige-thumb-content">
                                        <ThumbIcon className="prestige-thumb-icon" />
                                        <div className="prestige-thumb-text">
                                            <h4>{slide.title}</h4>
                                            <p>{slide.subtitle}</p>
                                        </div>
                                    </div>
                                    <div className="prestige-thumb-indicator"></div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Bottom Feature Cards */}
                <div className="prestige-features">
                    <motion.div 
                        className="prestige-feature-card"
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        viewport={{ once: true }}
                        whileHover={{ y: -10 }}
                    >
                        <div className="prestige-feature-icon">
                            <FaAward />
                        </div>
                        <h3>Repeat Accuracy</h3>
                        <p>The tenth run matches the first, because the reference stays on file</p>
                    </motion.div>

                    <motion.div 
                        className="prestige-feature-card"
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        viewport={{ once: true }}
                        whileHover={{ y: -10 }}
                    >
                        <div className="prestige-feature-icon">
                            <FaCrown />
                        </div>
                        <h3>Honest Timelines</h3>
                        <p>We tell you early when something slips, not after the ship date</p>
                    </motion.div>

                    <motion.div 
                        className="prestige-feature-card"
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        viewport={{ once: true }}
                        whileHover={{ y: -10 }}
                    >
                        <div className="prestige-feature-icon">
                            <FaGem />
                        </div>
                        <h3>Custom Development</h3>
                        <p>Bring a swatch or a sketch — we will punch it and sample it</p>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default PrestigeGallery;
