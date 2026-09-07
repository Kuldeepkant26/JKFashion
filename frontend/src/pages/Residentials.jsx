import React, { useState, useEffect } from 'react';
import '../css/Residentials.css';
import Footer from '../components/Footer';

import { products as productImgs, gallery as galleryImgs, hero as heroImgs } from '../data/images';

const Residentials = () => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [currentHeroImage, setCurrentHeroImage] = useState(0);
    const [currentPhilosophyImage, setCurrentPhilosophyImage] = useState(0);

    // Hero carousel images (remote assets requested)
    const heroImages = [heroImgs.lace, heroImgs.loom, heroImgs.threads];
    
    // Philosophy section carousel images
    const philosophyImages = [galleryImgs[0], galleryImgs[2], galleryImgs[3], galleryImgs[5], galleryImgs[7]];

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    // Hero background carousel
    useEffect(() => {
        const heroInterval = setInterval(() => {
            setCurrentHeroImage((prev) => (prev + 1) % heroImages.length);
        }, 5000);
        return () => clearInterval(heroInterval);
    }, [heroImages.length]);

    // Philosophy image carousel
    useEffect(() => {
        const philosophyInterval = setInterval(() => {
            setCurrentPhilosophyImage((prev) => (prev + 1) % philosophyImages.length);
        }, 4000);
        return () => clearInterval(philosophyInterval);
    }, [philosophyImages.length]);

    // Featured Designs Data
    const featuredDesigns = [
        {
            id: 1,
            title: 'Corded Floral on Voile',
            category: 'Schiffli',
            image: productImgs.schiffliFabric,
            description: 'A raised corded floral developed for a spring–summer buyer. Corded work shows every variation in tension, so the file was sampled three times before we cleared it for bulk.',
            features: [
                'Corded outline on 100% cotton voile',
                'Nine-inch repeat matched across full width',
                'Viscose thread matched to buyer shade card',
                'Sheared, mended and fully inspected'
            ],
            stats: {
                area: 'Full width',
                year: '2025',
                location: 'Womenswear export'
            }
        },
        {
            id: 2,
            title: 'Cotton Eyelet Border',
            category: 'Lace',
            image: productImgs.cottonLace,
            description: 'A classic eyelet punched so the scallop cuts clean and stays closed. A standing programme for a buyer who reorders each season — which means run ten has to match run one.',
            features: [
                'Clean-cut scallop, no fray',
                'Available two through six inch widths',
                'Bleached and piece-dyed to order',
                'Reference swatch held on file'
            ],
            stats: {
                area: '2"–6"',
                year: '2025',
                location: 'Kidswear export'
            }
        },
        {
            id: 3,
            title: 'GPO Guipure',
            category: 'Lace',
            image: productImgs.gpoLace,
            description: 'Chemical-burnout guipure where the ground dissolves and the motifs hold to each other alone. The margin between a crisp lace and a collapsed one is in the connector bars.',
            features: [
                'Burnout ground, self-supporting motifs',
                'Dense connector bars for strength',
                'Strength-tested after burnout',
                'Piece-dyed to shade'
            ],
            stats: {
                area: 'Wide width',
                year: '2025',
                location: 'Occasionwear'
            }
        },
        {
            id: 4,
            title: 'Bridal Metallic Panel',
            category: 'Bridal',
            image: productImgs.bridalLace,
            description: 'A heavy metallic panel on net. Too dense and the net puckers; too loose and the motif loses its weight. We ran three densities before recommending one.',
            features: [
                'High-density metallic yarn work',
                'Stabilised net base',
                'Panel-cut to garment size',
                'Hand-finished edges'
            ],
            stats: {
                area: 'Panel cut',
                year: '2025',
                location: 'Occasionwear'
            }
        }
    ];

    const services = [
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 4h16v6a8 8 0 01-16 0V4z" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 4v6M12 4v6M16 4v6" strokeLinecap="round"/>
                </svg>
            ),
            title: 'Schiffli Yardage',
            description: 'Continuous-width embroidery on voile, net, cotton and viscose grounds'
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 12c2 0 2-3 4-3s2 3 4 3 2-3 4-3 2 3 4 3" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 17c2 0 2-3 4-3s2 3 4 3 2-3 4-3 2 3 4 3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            ),
            title: 'Laces & Trims',
            description: 'Cotton eyelet, crochet and GPO guipure in narrow and wide widths'
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 3v18M12 7c3-2 6-2 8 0M12 7c-3-2-6-2-8 0" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="3" r="1.2" fill="currentColor"/>
                </svg>
            ),
            title: 'Custom Development',
            description: 'Your swatch or sketch punched, sampled and taken through to bulk'
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            ),
            title: 'Finishing',
            description: 'Mending, shearing and full inspection before anything is dispatched'
        }
    ];

    return (
        <div className="interior-design-page">
            {/* Section 1 - Hero Section */}
            <div className="interior-section interior-section-1" style={{ zIndex: 1 }}>
                <div className={`interior-design-container ${isLoaded ? 'loaded' : ''}`}>
                    {/* Hero Section */}
                    <section className="interior-hero">
                        {/* Background Image Carousel */}
                        <div className="interior-hero-backgrounds">
                            {heroImages.map((image, index) => (
                                <div
                                    key={index}
                                    className={`interior-hero-bg ${index === currentHeroImage ? 'active' : ''}`}
                                    style={{ backgroundImage: `url(${image})` }}
                                ></div>
                            ))}
                        </div>
                        <div className="interior-hero-overlay"></div>
                        <div className="interior-hero-content">
                            <h1 className="interior-hero-title">
                                <span className="interior-hero-subtitle">Our</span>
                                Products
                            </h1>
                            <p className="interior-hero-description">
                                Schiffli embroidered yardage, cotton and crochet laces, GPO guipure and panel work — made for garment and fabric exporters who resell under their own name.
                            </p>
                            <div className="interior-hero-buttons">
                                <a href="#portfolio" className="interior-hero-btn primary">
                                    View Products
                                </a>
                            </div>
                        </div>
                        <div className="interior-hero-scroll">
                            <div className="scroll-indicator">
                                <span></span>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* Section 2 - Content */}
            <div className="interior-section interior-section-2" style={{ zIndex: 2 }}>
                <div className={`interior-design-container ${isLoaded ? 'loaded' : ''}`}>

                {/* Immersive Showcase Section */}
                <section className="residential-showcase-immersive">
                    <div className="showcase-immersive-container">
                        {/* Animated Background Elements */}
                        <div className="showcase-bg-elements">
                            <div className="showcase-orb showcase-orb-1"></div>
                            <div className="showcase-orb showcase-orb-2"></div>
                            <div className="showcase-orb showcase-orb-3"></div>
                        </div>

                        {/* Main Content Grid */}
                        <div className="showcase-grid-wrapper">
                            {/* Left Side - Animated Numbers */}
                            <div className="showcase-metrics-column">
                                <div className="showcase-metric-card" data-index="0">
                                    <div className="metric-icon-wrap">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M9 22V12h6v10" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                    <div className="metric-value">500+</div>
                                    <div className="metric-label">Designs On File</div>
                                    <div className="metric-glow"></div>
                                </div>

                                <div className="showcase-metric-card" data-index="1">
                                    <div className="metric-icon-wrap">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                    <div className="metric-value">100%</div>
                                    <div className="metric-label">Goods Inspected</div>
                                    <div className="metric-glow"></div>
                                </div>

                                <div className="showcase-metric-card" data-index="2">
                                    <div className="metric-icon-wrap">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M12 2L2 7l10 5 10-5-10-5z" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                    <div className="metric-value">2M+</div>
                                    <div className="metric-label">Stitches Per Day</div>
                                    <div className="metric-glow"></div>
                                </div>
                            </div>

                            {/* Center - Hero Content */}
                            <div className="showcase-hero-center">
                                <div className="showcase-label-pill">
                                    <span className="pill-dot"></span>
                                    Made To Reorder
                                </div>
                                <h2 className="showcase-main-title">
                                    Where a Swatch Meets
                                    <span className="title-highlight"> a Machine</span>
                                </h2>
                                <p className="showcase-description">
                                    Every design here has run in bulk, not just as a studio sample. Widths, base fabrics and colourways can be adapted — and if none of it is quite right, send us a reference and we will develop it from scratch.
                                </p>
                                
                                {/* Feature Tags */}
                                <div className="showcase-feature-tags">
                                    <div className="feature-tag">
                                        <div className="tag-icon">✓</div>
                                        <span>Export Quality</span>
                                    </div>
                                    <div className="feature-tag">
                                        <div className="tag-icon">✓</div>
                                        <span>Green Building</span>
                                    </div>
                                    <div className="feature-tag">
                                        <div className="tag-icon">✓</div>
                                        <span>Smart Homes</span>
                                    </div>
                                    <div className="feature-tag">
                                        <div className="tag-icon">✓</div>
                                        <span>25 Years Legacy</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side - Visual Elements */}
                            <div className="showcase-visual-column">
                                <div className="visual-sphere-container">
                                    <div className="visual-sphere">
                                        <div className="sphere-ring ring-1"></div>
                                        <div className="sphere-ring ring-2"></div>
                                        <div className="sphere-ring ring-3"></div>
                                        <div className="sphere-core"></div>
                                    </div>
                                    <div className="visual-particles">
                                        {[...Array(12)].map((_, i) => (
                                            <div key={i} className="particle" data-particle={i}></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Marquee */}
                        <div className="showcase-marquee">
                            <div className="marquee-content">
                                <span>Schiffli Yardage</span>
                                <span className="marquee-dot">•</span>
                                <span>Cotton &amp; Crochet Lace</span>
                                <span className="marquee-dot">•</span>
                                <span>GPO Guipure</span>
                                <span className="marquee-dot">•</span>
                                <span>Custom Punching</span>
                                <span className="marquee-dot">•</span>
                                <span>100% Inspected</span>
                                <span className="marquee-dot">•</span>
                                <span>Schiffli Yardage</span>
                                <span className="marquee-dot">•</span>
                                <span>Cotton &amp; Crochet Lace</span>
                                <span className="marquee-dot">•</span>
                                <span>GPO Guipure</span>
                                <span className="marquee-dot">•</span>
                                <span>Custom Punching</span>
                                <span className="marquee-dot">•</span>
                                <span>100% Inspected</span>
                                <span className="marquee-dot">•</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Philosophy Section */}
                <section className="interior-philosophy">
                    <div className="interior-philosophy-container">
                        <div className="interior-philosophy-content">
                            <span className="interior-section-label">How We Work</span>
                            <h2 className="interior-section-title">
                                Built To Run, Not Just To Sample
                            </h2>
                            <p className="interior-philosophy-text">
                                A design has to survive contact with a production floor. Density that looks right on a screen can pucker a net ground; a repeat that reads clean on paper can drift across a full width. So we punch for the fabric the design will actually run on, not for the render.
                            </p>
                            <p className="interior-philosophy-text">
                                Everything below is work we have run in bulk, not studio pieces. Widths, bases and colourways can be adapted, and most of these designs exist in several variations already. If none of them is quite what you need, send a reference and we will develop it.
                            </p>
                            <div className="interior-philosophy-stats">
                                <div className="interior-stat">
                                    <span className="interior-stat-number">500+</span>
                                    <span className="interior-stat-label">Designs On File</span>
                                </div>
                                <div className="interior-stat">
                                    <span className="interior-stat-number">2M+</span>
                                    <span className="interior-stat-label">Stitches Per Day</span>
                                </div>
                                <div className="interior-stat">
                                    <span className="interior-stat-number">40+</span>
                                    <span className="interior-stat-label">Machines Running</span>
                                </div>
                            </div>
                        </div>
                        <div className="interior-philosophy-image">
                            <div className="interior-image-wrapper interior-slider-wrapper">
                                {/* Image Carousel */}
                                <div className="interior-image-carousel">
                                    {philosophyImages.map((image, index) => (
                                        <img
                                            key={index}
                                            src={image}
                                            alt={`Embroidery sample ${index + 1}`}
                                            className={`interior-carousel-image ${index === currentPhilosophyImage ? 'active' : ''}`}
                                        />
                                    ))}
                                </div>
                                {/* Navigation Dots */}
                                <div className="interior-carousel-dots">
                                    {philosophyImages.map((_, index) => (
                                        <button
                                            key={index}
                                            className={`interior-dot ${index === currentPhilosophyImage ? 'active' : ''}`}
                                            onClick={() => setCurrentPhilosophyImage(index)}
                                            aria-label={`Go to slide ${index + 1}`}
                                        ></button>
                                    ))}
                                </div>
                                <div className="interior-image-overlay"></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Services Section */}
                <section className="interior-services">
                    <div className="interior-services-header">
                        <span className="interior-section-label">What We Offer</span>
                        <h2 className="interior-section-title">What We Produce</h2>
                        <p className="interior-services-subtitle">
                            Design, embroidery, finishing and inspection handled on our own floor
                        </p>
                    </div>
                    <div className="interior-services-grid">
                        {services.map((service, index) => (
                            <div key={index} className="interior-service-card">
                                <div className="interior-service-icon">{service.icon}</div>
                                <h3 className="interior-service-title">{service.title}</h3>
                                <p className="interior-service-description">{service.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Featured Designs Section */}
                <section className="interior-featured-designs">
                    <div className="interior-featured-header">
                        <span className="interior-section-label">Selected Work</span>
                        <h2 className="interior-section-title">Featured Designs</h2>
                        <p className="interior-featured-subtitle">
                            Four constructions that show the range — corded yardage, cut-edge lace, burnout guipure and dense panel work
                        </p>
                    </div>

                    <div className="interior-featured-grid">
                        {featuredDesigns.map((design, index) => (
                            <div 
                                key={design.id} 
                                className={`interior-featured-item ${index % 2 === 1 ? 'reverse' : ''}`}
                            >
                                <div className="interior-featured-image">
                                    <img src={design.image} alt={design.title} loading="lazy" />
                                    <div className="interior-featured-image-overlay"></div>
                                </div>
                                <div className="interior-featured-content">
                                    <span className="interior-featured-badge">{design.category}</span>
                                    <h3 className="interior-featured-title">{design.title}</h3>
                                    <p className="interior-featured-description">{design.description}</p>
                                    <ul className="interior-featured-features">
                                        {design.features.map((feature, idx) => (
                                            <li key={idx}>{feature}</li>
                                        ))}
                                    </ul>
                                    <div className="interior-featured-stats">
                                        <div className="interior-stat-item">
                                            <span className="stat-label">Area</span>
                                            <span className="stat-value">{design.stats.area}</span>
                                        </div>
                                        <div className="interior-stat-item">
                                            <span className="stat-label">Year</span>
                                            <span className="stat-value">{design.stats.year}</span>
                                        </div>
                                        <div className="interior-stat-item">
                                            <span className="stat-label">Location</span>
                                            <span className="stat-value">{design.stats.location}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Process Section */}
                <section className="interior-process">
                    <div className="interior-process-header">
                        <span className="interior-section-label">Our Process</span>
                        <h2 className="interior-section-title">From Swatch to Shipment</h2>
                    </div>
                    <div className="interior-process-timeline">
                        <div className="interior-process-step">
                            <div className="interior-step-number">01</div>
                            <div className="interior-step-content">
                                <h3 className="interior-step-title">Design & Punching</h3>
                                <p className="interior-step-description">
                                    Your reference worked into a production file, punched for the base fabric
                                </p>
                            </div>
                        </div>
                        <div className="interior-process-step">
                            <div className="interior-step-number">02</div>
                            <div className="interior-step-content">
                                <h3 className="interior-step-title">Sampling</h3>
                                <p className="interior-step-description">
                                    Run, assessed honestly, and run again until the hand and density are right
                                </p>
                            </div>
                        </div>
                        <div className="interior-process-step">
                            <div className="interior-step-number">03</div>
                            <div className="interior-step-content">
                                <h3 className="interior-step-title">Bulk Production</h3>
                                <p className="interior-step-description">
                                    Calibrated machines at controlled speed, with checks at fixed intervals
                                </p>
                            </div>
                        </div>
                        <div className="interior-process-step">
                            <div className="interior-step-number">04</div>
                            <div className="interior-step-content">
                                <h3 className="interior-step-title">Finish & Dispatch</h3>
                                <p className="interior-step-description">
                                    Mended by hand, sheared to requirement, inspected, then packed and shipped
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="interior-cta">
                    <div className="interior-cta-content">
                        <h2 className="interior-cta-title">Send Us a Reference</h2>
                        <p className="interior-cta-description">
                            A swatch, a photograph, or a sketch is enough to start. We will tell you whether we can make it, roughly what it will cost, and how long sampling will take.
                        </p>
                        <a href="#contact" className="interior-cta-btn">
                            Request a Sample
                        </a>
                    </div>
                </section>
                </div>
            <Footer />
            </div>

            {/* Footer */}
        </div>
    );
};

export default Residentials;
