import React, { useEffect, useRef, useState } from 'react';
import '../css/SignatureProjects.css';
import { FaTrophy, FaStar, FaAward } from 'react-icons/fa';
import { products as productImgs } from '../data/images';

const SignatureProjects = () => {
    const sectionRef = useRef(null);
    const [isInView, setIsInView] = useState(false);
    const [activeProject, setActiveProject] = useState(0);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);

    const projects = [
        {
            id: 1,
            title: "Corded Floral Yardage",
            location: "Womenswear Export",
            category: "Schiffli Fabric",
            year: "2025",
            image: productImgs.schiffliFabric,
            stats: { units: "14,000 m", area: '9" repeat', value: "Cotton Voile" }
        },
        {
            id: 2,
            title: "Cotton Eyelet Border",
            location: "Kidswear Export",
            category: "Lace",
            year: "2025",
            image: productImgs.cottonLace,
            stats: { units: "Standing order", area: '2"–6" widths', value: "Piece Dyed" }
        },
        {
            id: 3,
            title: "Embroidered Net",
            location: "Dress Programme",
            category: "All-over Yardage",
            year: "2024",
            image: productImgs.embroideredNet,
            stats: { units: "9,000 m", area: "Full width", value: "Soft Net" }
        },
        {
            id: 4,
            title: "Bridal Metallic Panel",
            location: "Occasionwear",
            category: "Panel Work",
            year: "2025",
            image: productImgs.bridalLace,
            stats: { units: "Panel cut", area: "High density", value: "Metallic Yarn" }
        }
    ];

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => setIsInView(entry.isIntersecting),
            { threshold: 0.15 }
        );
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (sectionRef.current) {
                const rect = sectionRef.current.getBoundingClientRect();
                setCursorPos({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                });
            }
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    useEffect(() => {
        if (isInView) {
            const interval = setInterval(() => {
                setActiveProject((prev) => (prev + 1) % projects.length);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [isInView, projects.length]);

    return (
        <section
            ref={sectionRef}
            id="signature-projects-section"
            className={`signature-projects signature-projects--light ${isInView ? 'signature-projects--visible' : ''}`}
        >
            {/* Custom Cursor */}
            <div
                className={`signature-projects__cursor ${isHovering ? 'signature-projects__cursor--active' : ''}`}
                style={{ left: cursorPos.x, top: cursorPos.y }}
            >
                <span>View</span>
            </div>

            {/* Morphing Background */}
            <div className="signature-projects__morph-bg">
                {projects.map((project, index) => (
                    <div
                        key={project.id}
                        className={`signature-projects__morph-layer ${activeProject === index ? 'signature-projects__morph-layer--active' : ''}`}
                        style={{ backgroundImage: `url(${project.image})` }}
                    />
                ))}
                <div className="signature-projects__morph-overlay" />
            </div>

            {/* Animated Lines */}
            <div className="signature-projects__lines">
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className="signature-projects__line"
                        style={{ '--line-delay': `${i * 0.2}s` }}
                    />
                ))}
            </div>

            <div className="signature-projects__container">
                {/* Header */}
                <div className="signature-projects__header">
                    <div className="signature-projects__header-top">
                        <span className="signature-projects__count">
                            {String(activeProject + 1).padStart(2, '0')}
                            <span className="signature-projects__count-total">/{String(projects.length).padStart(2, '0')}</span>
                        </span>
                        <div className="signature-projects__label">
                            <div className="signature-projects__label-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                            </div>
                            <span>Selected Work</span>
                        </div>
                    </div>
                    <h2 className="signature-projects__title">
                        <span className="signature-projects__title-line">Work We Are</span>
                        <span className="signature-projects__title-line signature-projects__title-line--accent">Glad To Show</span>
                    </h2>
                </div>

                {/* Main Content */}
                <div className="signature-projects__content">
                    {/* Project Cards - Left Side */}
                    <div className="signature-projects__cards">
                        {projects.map((project, index) => (
                            <div
                                key={project.id}
                                className={`signature-projects__card ${activeProject === index ? 'signature-projects__card--active' : ''}`}
                                onClick={() => setActiveProject(index)}
                                onMouseEnter={() => setIsHovering(true)}
                                onMouseLeave={() => setIsHovering(false)}
                            >
                                <div className="signature-projects__card-number">
                                    {String(index + 1).padStart(2, '0')}
                                </div>
                                <div className="signature-projects__card-content">
                                    <span className="signature-projects__card-category">{project.category}</span>
                                    <h3 className="signature-projects__card-title">{project.title}</h3>
                                    <p className="signature-projects__card-location">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                            <circle cx="12" cy="10" r="3" />
                                        </svg>
                                        {project.location}
                                    </p>
                                </div>
                                <div className="signature-projects__card-year">{project.year}</div>
                                <div className="signature-projects__card-arrow">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                        <polyline points="12 5 19 12 12 19" />
                                    </svg>
                                </div>
                                <div className="signature-projects__card-bg" />
                            </div>
                        ))}
                    </div>

                    {/* Featured Image - Right Side */}
                    <div className="signature-projects__featured">
                        <div className="signature-projects__featured-frame">
                            {/* Rotating Border */}
                            <div className="signature-projects__featured-border">
                                <svg viewBox="0 0 400 500" fill="none">
                                    <rect x="2" y="2" width="396" height="496" rx="22" stroke="url(#borderGradient)" strokeWidth="2" strokeDasharray="20 10" />
                                    <defs>
                                        <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="var(--brand-primary)" />
                                            <stop offset="50%" stopColor="var(--brand-ink)" />
                                            <stop offset="100%" stopColor="var(--brand-primary)" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>

                            {/* Image Container */}
                            <div className="signature-projects__featured-images">
                                {projects.map((project, index) => (
                                    <div
                                        key={project.id}
                                        className={`signature-projects__featured-image ${activeProject === index ? 'signature-projects__featured-image--active' : ''}`}
                                    >
                                        <img src={project.image} alt={project.title} />
                                        <div className="signature-projects__featured-shine" />
                                    </div>
                                ))}
                            </div>

                            {/* Floating Stats */}
                            <div className="signature-projects__featured-stats">
                                <div className="signature-projects__featured-stat">
                                    <span className="signature-projects__featured-stat-value">
                                        {projects[activeProject].stats.units}
                                    </span>
                                    <span className="signature-projects__featured-stat-label">Quantity</span>
                                </div>
                                <div className="signature-projects__featured-stat">
                                    <span className="signature-projects__featured-stat-value">
                                        {projects[activeProject].stats.area}
                                    </span>
                                    <span className="signature-projects__featured-stat-label">Spec</span>
                                </div>
                                <div className="signature-projects__featured-stat">
                                    <span className="signature-projects__featured-stat-value">
                                        {projects[activeProject].stats.value}
                                    </span>
                                    <span className="signature-projects__featured-stat-label">Base</span>
                                </div>
                            </div>

                            {/* Corner Accents */}
                            <div className="signature-projects__corner signature-projects__corner--tl" />
                            <div className="signature-projects__corner signature-projects__corner--tr" />
                            <div className="signature-projects__corner signature-projects__corner--bl" />
                            <div className="signature-projects__corner signature-projects__corner--br" />
                        </div>

                        {/* Project Info Overlay */}
                        <div className="signature-projects__featured-info">
                            <div className="signature-projects__featured-title">
                                {projects[activeProject].title}
                            </div>
                            <div className="signature-projects__featured-category">
                                {projects[activeProject].category}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="signature-projects__progress">
                    {projects.map((_, index) => (
                        <div
                            key={index}
                            className={`signature-projects__progress-item ${activeProject === index ? 'signature-projects__progress-item--active' : ''} ${activeProject > index ? 'signature-projects__progress-item--complete' : ''}`}
                            onClick={() => setActiveProject(index)}
                        >
                            <div className="signature-projects__progress-bar">
                                <div className="signature-projects__progress-fill" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <div className="signature-projects__cta">
                    <button className="signature-projects__cta-btn">
                        <span className="signature-projects__cta-text">Explore All Projects</span>
                        <span className="signature-projects__cta-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </span>
                        <span className="signature-projects__cta-bg" />
                    </button>
                </div>
            </div>

            {/* Floating Elements */}
            <div className="signature-projects__float signature-projects__float--1">
                <FaTrophy />
            </div>
            <div className="signature-projects__float signature-projects__float--2">
                <FaStar />
            </div>
            <div className="signature-projects__float signature-projects__float--3">
                <FaAward />
            </div>
        </section>
    );
};

export default SignatureProjects;
