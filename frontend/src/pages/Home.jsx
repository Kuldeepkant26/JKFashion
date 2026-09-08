import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import '../css/Home.css';
import Footer from '../components/Footer';
import AboutUs from '../components/AboutUs';
import MobileDev from '../components/MobileDev';
import WebSaaSDev from '../components/WebSaaSDev';
import InteriorShowcase from '../components/InteriorShowcase';
import RackGallery from '../components/RackGallery';
import CloseUpGallery from '../components/CloseUpGallery.jsx';
import SiteHero from '../components/heroes/index.jsx';
import EnquirySection from '../components/EnquirySection.jsx';
import { FaTwitter, FaFacebookF, FaInstagram } from 'react-icons/fa';
import { gallery, products } from '../data/images';

const Home = () => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [currentPhilosophyImage, setCurrentPhilosophyImage] = useState(0);

    const philosophyImages = [gallery[0], gallery[1], gallery[2]];

    useEffect(() => {
        setIsLoaded(true);

        // Ensure text visibility (removed dynamic color changing that was causing issues)
        const ensureTextVisibility = () => {
            const title = document.getElementById('hero-title');
            if (title) {
                // Force consistent styling
                title.style.color = '#2d2d2d';
                title.style.background = 'none';
                title.style.webkitTextFillColor = 'initial';
                title.style.webkitBackgroundClip = 'initial';
                title.style.backgroundClip = 'initial';
            }
        };

        // Ensure text is visible on mount
        ensureTextVisibility();
        
        // Re-ensure visibility after each hero change
        const interval = setInterval(ensureTextVisibility, 100);
        
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const philosophyInterval = setInterval(() => {
            setCurrentPhilosophyImage((prev) => (prev + 1) % philosophyImages.length);
        }, 4000);
        return () => clearInterval(philosophyInterval);
    }, [philosophyImages.length]);


    const featuredDesigns = [
        {
            id: 1,
            title: 'Corded Floral Schiffli',
            category: 'Schiffli',
            image: products.schiffliFabric,
            description: 'A continuous corded floral run developed for a spring–summer womenswear buyer. The repeat was punched in-house and sampled three times before bulk, holding the same hand and density across every metre of the order.',
            features: [
                'Corded outline on 100% cotton voile base',
                '9-inch repeat, matched across full width',
                'Viscose thread, buyer shade card matched',
                'Sheared and mended before finishing'
            ],
            stats: {
                area: '14,000 m run',
                year: '2025',
                location: 'Womenswear export'
            }
        },
        {
            id: 2,
            title: 'Cotton Eyelet Border Lace',
            category: 'Lace',
            image: products.cottonLace,
            description: 'A classic eyelet border built for repeat ordering. Punched so the scallop cuts clean without fraying, it has become a standing programme for a buyer who reorders the same width every season.',
            features: [
                'Clean-cut scallop edge, no fray',
                'Available 2" to 6" widths',
                'Bleached and dyed to order',
                'Standing repeat programme'
            ],
            stats: {
                area: '4" width',
                year: '2025',
                location: 'Kidswear export'
            }
        },
        {
            id: 3,
            title: 'Crochet Trim Collection',
            category: 'Lace',
            image: products.crochetLace,
            description: 'A family of narrow crochet trims produced on our crochet lace machines. Developed as a coordinated set so a single collection can carry one visual language across cuffs, necklines and hems.',
            features: [
                'Six coordinated widths',
                'Cotton and viscose blends',
                'Soft hand, garment-ready finish',
                'Low minimums on repeat colours'
            ],
            stats: {
                area: '6 designs',
                year: '2024',
                location: 'Domestic brand'
            }
        },
        {
            id: 4,
            title: 'Bridal Metallic Panel',
            category: 'Bridal',
            image: products.bridalLace,
            description: 'A heavy metallic panel for occasionwear, worked at high stitch density on a net base. The kind of piece where punching decides everything — too dense and the net puckers, too loose and the motif loses its weight.',
            features: [
                'High-density metallic yarn work',
                'Net base, panel-cut to size',
                'Hand-finished edges',
                'Sample-to-bulk colour matching'
            ],
            stats: {
                area: 'Panel cut',
                year: '2025',
                location: 'Occasionwear'
            }
        },
        {
            id: 5,
            title: 'Embroidered Net Yardage',
            category: 'Apparel',
            image: products.embroideredNet,
            description: 'All-over embroidered net produced as continuous yardage for a dress programme. Run at controlled speed to keep the net stable, then inspected metre by metre before it left the floor.',
            features: [
                'All-over repeat on soft net',
                'Continuous yardage, full width',
                'Stabilised run for dimensional accuracy',
                '100% inspected before dispatch'
            ],
            stats: {
                area: '9,000 m run',
                year: '2024',
                location: 'Dress programme'
            }
        },
        {
            id: 6,
            title: 'GPO Guipure Lace',
            category: 'Lace',
            image: products.gpoLace,
            description: 'Chemical-burnout guipure with no visible ground — the motifs hold to each other alone. It is an unforgiving process, and the margin between a crisp lace and a collapsed one is small.',
            features: [
                'Burnout ground, self-supporting motifs',
                'Dense connector bars for strength',
                'Wide and narrow widths available',
                'Piece-dyed to shade'
            ],
            stats: {
                area: 'Wide width',
                year: '2025',
                location: 'Occasionwear export'
            }
        }
    ];

    return (
        <div className="home-page">
            {/* Section 1 - Hero. The layout is chosen in the admin panel;
                SiteHero resolves that id to a component. */}
            <div className="home-section home-section-1" style={{ zIndex: 1 }}>
                <div className={`home-container ${isLoaded ? 'loaded' : ''}`}>
                    <SiteHero />
                </div>
            </div>

            {/* Section 2 - Content */}
            <div className="home-section home-section-2" style={{ zIndex: 2 }}>
                <div className={`home-container ${isLoaded ? 'loaded' : ''}`}>
                    <MobileDev></MobileDev>

                    {/* Rack Gallery - pick a piece, magnify the embroidery */}
                    <RackGallery />
                    {/* No heading of its own — it reads as the lower half of
                        the Look Closer section above. */}
                    <CloseUpGallery />
                    <AboutUs></AboutUs>
                    <WebSaaSDev></WebSaaSDev>
                    <InteriorShowcase></InteriorShowcase>

                    {/* Philosophy Section */}
                    {/* <section className="home-philosophy">
                        <div className="home-philosophy-container">
                            <div className="home-philosophy-content">
                                <span className="home-section-label">Our Philosophy</span>
                                <h2 className="home-section-title">
                                    Punched For the Cloth It Runs On
                                </h2>
                                <p className="home-philosophy-text">
                                    A design that reads beautifully on screen can still fail on fabric. Density that suits a firm cotton will pucker a soft net; a repeat that looks clean on paper can drift across a full width. So we punch for the ground the design will actually run on.
                                </p>
                                <p className="home-philosophy-text">
                                    That is also why we would rather sample twice than ship once and hope. A few extra days in development costs far less than a rejected consignment, and it is the difference between a buyer who reorders and one who quietly stops writing.
                                </p>
                                <div className="home-philosophy-stats">
                                    <div className="home-stat">
                                        <span className="home-stat-number">200+</span>
                                        <span className="home-stat-label">Projects Completed</span>
                                    </div>
                                    <div className="home-stat">
                                        <span className="home-stat-number">15+</span>
                                        <span className="home-stat-label">Years Experience</span>
                                    </div>
                                    <div className="home-stat">
                                        <span className="home-stat-number">98%</span>
                                        <span className="home-stat-label">Client Satisfaction</span>
                                    </div>
                                </div>
                            </div>
                            <div className="home-philosophy-image">
                                <div className="home-image-wrapper home-slider-wrapper">
                                    <div className="home-image-carousel">
                                        {philosophyImages.map((image, index) => (
                                            <img
                                                key={index}
                                                src={image}
                                                alt={`Embroidery sample ${index + 1}`}
                                                className={`home-carousel-image ${index === currentPhilosophyImage ? 'active' : ''}`}
                                            />
                                        ))}
                                    </div>
                                    <div className="home-carousel-dots">
                                        {philosophyImages.map((_, index) => (
                                            <button
                                                key={index}
                                                className={`home-dot ${index === currentPhilosophyImage ? 'active' : ''}`}
                                                onClick={() => setCurrentPhilosophyImage(index)}
                                                aria-label={`Go to slide ${index + 1}`}
                                            ></button>
                                        ))}
                                    </div>
                                    <div className="home-image-overlay"></div>
                                </div>
                            </div>
                        </div>
                    </section> */}

                    {/* Last block before the footer — the Enquire buttons in
                        every navbar scroll here. */}
                    <EnquirySection />

                    {/* Featured Designs Section */}
                    {/* <section className="home-featured-designs">
                        <div className="home-featured-header">
                            <span className="home-section-label">Our Masterpieces</span>
                            <h2 className="home-section-title">Featured Designs</h2>
                            <p className="home-featured-subtitle">
                                Discover our most celebrated projects that showcase innovation, elegance, and timeless design excellence
                            </p>
                        </div>

                        <div className="home-featured-grid">
                            {featuredDesigns.map((design, index) => (
                                <div
                                    key={design.id}
                                    className={`home-featured-item ${index % 2 === 1 ? 'reverse' : ''}`}
                                >
                                    <div className="home-featured-image">
                                        <img src={design.image} alt={design.title} loading="lazy" />
                                        <div className="home-featured-image-overlay"></div>
                                    </div>
                                    <div className="home-featured-content">
                                        <span className="home-featured-badge">{design.category}</span>
                                        <h3 className="home-featured-title">{design.title}</h3>
                                        <p className="home-featured-description">{design.description}</p>
                                        <ul className="home-featured-features">
                                            {design.features.map((feature, idx) => (
                                                <li key={idx}>{feature}</li>
                                            ))}
                                        </ul>
                                        <div className="home-featured-stats">
                                            <div className="home-stat-item">
                                                <span className="stat-label">Area</span>
                                                <span className="stat-value">{design.stats.area}</span>
                                            </div>
                                            <div className="home-stat-item">
                                                <span className="stat-label">Year</span>
                                                <span className="stat-value">{design.stats.year}</span>
                                            </div>
                                            <div className="home-stat-item">
                                                <span className="stat-label">Location</span>
                                                <span className="stat-value">{design.stats.location}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section> */}

                    {/* Process Section */}
                    {/* <section className="home-process">
                        <div className="home-process-header">
                            <span className="home-section-label">Our Process</span>
                            <h2 className="home-section-title">From Vision to Reality</h2>
                        </div>
                        <div className="home-process-timeline">
                            <div className="home-process-step">
                                <div className="home-step-number">01</div>
                                <div className="home-step-content">
                                    <h3 className="home-step-title">Discovery</h3>
                                    <p className="home-step-description">
                                        Understanding your vision, lifestyle, and unique requirements
                                    </p>
                                </div>
                            </div>
                            <div className="home-process-step">
                                <div className="home-step-number">02</div>
                                <div className="home-step-content">
                                    <h3 className="home-step-title">Concept Design</h3>
                                    <p className="home-step-description">
                                        Creating mood boards, sketches, and 3D visualizations
                                    </p>
                                </div>
                            </div>
                            <div className="home-process-step">
                                <div className="home-step-number">03</div>
                                <div className="home-step-content">
                                    <h3 className="home-step-title">Development</h3>
                                    <p className="home-step-description">
                                        Detailed planning, material selection, and technical drawings
                                    </p>
                                </div>
                            </div>
                            <div className="home-process-step">
                                <div className="home-step-number">04</div>
                                <div className="home-step-content">
                                    <h3 className="home-step-title">Execution</h3>
                                    <p className="home-step-description">
                                        Bringing the design to life with meticulous attention to detail
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section> */}

                    {/* CTA Section */}
                    {/* <section className="home-cta">
                        <div className="home-cta-content">
                            <h2 className="home-cta-title">Ready to Transform Your Space?</h2>
                            <p className="home-cta-description">
                                Let's create something extraordinary together. Schedule a consultation with our design experts.
                            </p>
                            <a href="#contact" className="home-cta-btn">
                                Get Started Today
                            </a>
                        </div>
                    </section> */}
                </div>
                <Footer />
            </div>
        </div>
    );
};

export default Home;
