import React, { useEffect, useRef, useState } from 'react';
import '../css/CreativeJourney.css';
import { FaLandmark, FaBuilding, FaUsers, FaGem } from 'react-icons/fa';

const CreativeJourney = () => {
    const sectionRef = useRef(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [activeIndex, setActiveIndex] = useState(0);
    const [isInView, setIsInView] = useState(false);

    const journeySteps = [
        {
            year: "2000",
            title: "Design & Punching",
            description: "Artwork developed in-house and punched into a production file",
            image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80"
        },
        {
            year: "2010",
            title: "Sampling",
            description: "Run, assessed honestly, and run again until the hand is right",
            image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80"
        },
        {
            year: "2020",
            title: "Bulk Production",
            description: "Calibrated machines held at controlled speed across the full run",
            image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80"
        },
        {
            year: "2025",
            title: "Finish & Dispatch",
            description: "Mended, sheared, inspected metre by metre, then shipped",
            image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80"
        }
    ];

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsInView(entry.isIntersecting);
            },
            { threshold: 0.2 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (sectionRef.current) {
                const rect = sectionRef.current.getBoundingClientRect();
                setMousePosition({
                    x: ((e.clientX - rect.left) / rect.width) * 100,
                    y: ((e.clientY - rect.top) / rect.height) * 100
                });
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    useEffect(() => {
        if (isInView) {
            const interval = setInterval(() => {
                setActiveIndex((prev) => (prev + 1) % journeySteps.length);
            }, 4000);
            return () => clearInterval(interval);
        }
    }, [isInView, journeySteps.length]);

    return (
        <section
            ref={sectionRef}
            className={`creative-journey creative-journey--light ${isInView ? 'creative-journey--visible' : ''}`}
        >
            {/* Animated Background */}
            <div className="creative-journey__bg">
                <div
                    className="creative-journey__gradient-orb creative-journey__gradient-orb--1"
                    style={{
                        transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`
                    }}
                />
                <div
                    className="creative-journey__gradient-orb creative-journey__gradient-orb--2"
                    style={{
                        transform: `translate(${-mousePosition.x * 0.03}px, ${-mousePosition.y * 0.03}px)`
                    }}
                />
                <div className="creative-journey__grid-pattern" />
                <div className="creative-journey__noise" />
            </div>

            {/* Floating Particles */}
            <div className="creative-journey__particles">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="creative-journey__particle"
                        style={{
                            '--delay': `${i * 0.5}s`,
                            '--duration': `${15 + Math.random() * 10}s`,
                            '--x-start': `${Math.random() * 100}%`,
                            '--x-end': `${Math.random() * 100}%`,
                            '--size': `${2 + Math.random() * 4}px`
                        }}
                    />
                ))}
            </div>

            <div className="creative-journey__container">
                {/* Header */}
                <div className="creative-journey__header">
                    <div className="creative-journey__label">
                        <span className="creative-journey__label-line" />
                        <span className="creative-journey__label-text">Our Process</span>
                        <span className="creative-journey__label-line" />
                    </div>
                    <h2 className="creative-journey__title">
                        <span className="creative-journey__title-word">From</span>
                        <span className="creative-journey__title-word creative-journey__title-word--highlight">Swatch</span>
                        <span className="creative-journey__title-word">to</span>
                        <span className="creative-journey__title-word creative-journey__title-word--gold">Shipment</span>
                    </h2>
                </div>

                {/* Main Content */}
                <div className="creative-journey__content">
                    {/* Image Showcase */}
                    <div className="creative-journey__showcase">
                        <div className="creative-journey__image-stack">
                            {journeySteps.map((step, index) => (
                                <div
                                    key={index}
                                    className={`creative-journey__image-card ${activeIndex === index ? 'creative-journey__image-card--active' : ''} ${
                                        activeIndex > index ? 'creative-journey__image-card--passed' : ''
                                    }`}
                                    style={{ '--index': index }}
                                >
                                    <div className="creative-journey__image-wrapper">
                                        <img
                                            src={step.image}
                                            alt={step.title}
                                            className="creative-journey__image"
                                        />
                                        <div className="creative-journey__image-overlay" />
                                        <div className="creative-journey__image-frame" />
                                    </div>
                                    <div className="creative-journey__image-year">{step.year}</div>
                                </div>
                            ))}
                        </div>

                        {/* Decorative Elements */}
                        <div className="creative-journey__deco-ring creative-journey__deco-ring--1" />
                        <div className="creative-journey__deco-ring creative-journey__deco-ring--2" />
                        <div className="creative-journey__deco-dot creative-journey__deco-dot--1" />
                        <div className="creative-journey__deco-dot creative-journey__deco-dot--2" />
                    </div>

                    {/* Timeline */}
                    <div className="creative-journey__timeline">
                        <div className="creative-journey__timeline-track">
                            <div
                                className="creative-journey__timeline-progress"
                                style={{ '--progress': `${(activeIndex / (journeySteps.length - 1)) * 100}%` }}
                            />
                        </div>

                        {journeySteps.map((step, index) => (
                            <div
                                key={index}
                                className={`creative-journey__milestone ${activeIndex === index ? 'creative-journey__milestone--active' : ''} ${
                                    activeIndex > index ? 'creative-journey__milestone--completed' : ''
                                }`}
                                onClick={() => setActiveIndex(index)}
                            >
                                <div className="creative-journey__milestone-dot">
                                    <span className="creative-journey__milestone-pulse" />
                                </div>
                                <div className="creative-journey__milestone-content">
                                    <span className="creative-journey__milestone-year">{step.year}</span>
                                    <h3 className="creative-journey__milestone-title">{step.title}</h3>
                                    <p className="creative-journey__milestone-desc">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Stats */}
                <div className="creative-journey__stats">
                    {[
                        { value: '25+', label: 'Years in Embroidery', Icon: FaLandmark },
                        { value: '40+', label: 'Machines on Floor', Icon: FaBuilding },
                        { value: '500+', label: 'Designs on File', Icon: FaUsers },
                        { value: '2M+', label: 'Stitches Per Day', Icon: FaGem }
                    ].map((stat, index) => (
                        <div
                            key={index}
                            className="creative-journey__stat"
                            style={{ '--delay': `${index * 0.1}s` }}
                        >
                            <div className="creative-journey__stat-icon">
                                <stat.Icon />
                            </div>
                            <div className="creative-journey__stat-value">{stat.value}</div>
                            <div className="creative-journey__stat-label">{stat.label}</div>
                            <div className="creative-journey__stat-glow" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Scroll Indicator */}
            <div className="creative-journey__scroll-hint">
                <span className="creative-journey__scroll-text">Explore More</span>
                <div className="creative-journey__scroll-arrow">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 5v14M5 12l7 7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            </div>
        </section>
    );
};

export default CreativeJourney;
