import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import '../css/Home.css';
import '../css/Aesthetic.css';
import Footer from '../components/Footer';
import AboutUs from '../components/AboutUs';
import MobileDev from '../components/MobileDev';
import WebSaaSDev from '../components/WebSaaSDev';
import InteriorShowcase from '../components/InteriorShowcase';
import Testimonials from '../components/Testimonials';
import CTA from '../components/CTA';
import FAQ from '../components/FAQ';
import HeroStats from '../components/HeroStats';
import Sustainability from '../components/Sustainability';
import PrestigeGallery from '../components/PrestigeGallery';
import AestheticModal from '../components/AestheticModal';
import { FaTwitter, FaFacebookF, FaInstagram } from 'react-icons/fa';
import { hero, gallery, products } from '../data/images';

const Home = () => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [currentPhilosophyImage, setCurrentPhilosophyImage] = useState(0);
    const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);

    const philosophyImages = [gallery[0], gallery[1], gallery[2]];

    // Hero carousel data
    const heroCarouselData = [
        {
            image: hero.loom,
            title: "SCHIFFLI EMBROIDERY",
            description: "Continuous-width embroidery on Lässer schiffli machines, engineered for the repeat accuracy and yardage consistency that garment exporters build their collections on."
        },
        {
            image: hero.lace,
            title: "FINE LACES",
            description: "Cotton, crochet and GPO laces developed in-house — from delicate edgings to statement borders, punched and sampled to your reference or ours."
        },
        {
            image: hero.threads,
            title: "COLOUR & YARN",
            description: "Viscose, cotton and metallic yarns matched to your shade card, with in-house processing that keeps colour consistent from first sample to final bulk."
        },
        {
            image: hero.stitching,
            title: "PRECISION AT SPEED",
            description: "Over two million stitches a day across our floor, with every metre passing through mending and inspection before it is cleared for finishing."
        },
        {
            image: hero.fabricRolls,
            title: "BULK CAPACITY",
            description: "Sampling through to full production runs under one roof — predictable lead times, honest updates, and goods that ship when we say they will."
        },
        {
            image: hero.atelier,
            title: "DESIGN STUDIO",
            description: "An in-house design team building original artwork and adapting buyer references, turning a concept into a punched, production-ready file."
        }
    ];

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

    // Hero carousel effect
    useEffect(() => {
        const heroInterval = setInterval(() => {
            setCurrentHeroIndex((prev) => (prev + 1) % heroCarouselData.length);
        }, 5000); // Change every 5 seconds
        return () => clearInterval(heroInterval);
    }, [heroCarouselData.length]);

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

    // Aesthetic showcase project details
    const aestheticProjects = [
        {
            id: 1,
            title: 'Corded Floral',
            category: 'Schiffli Yardage',
            subtitle: 'Where the repeat has to be exact',
            description: 'A corded floral run on cotton voile, developed for a spring–summer womenswear buyer. Corded work is punished by any inconsistency — the raised outline shows every variation in tension — so the file was sampled three times before we cleared it for bulk.',
            image: products.schiffliFabric,
            badge: 'Featured',
            features: [
                'Corded outline on 100% cotton voile',
                '9-inch repeat matched across full width',
                'Viscose thread to buyer shade card',
                'Tension mapped before bulk release',
                'Sheared and mended before finishing',
                '100% inspected metre by metre'
            ],
            stats: {
                area: '14,000 m',
                location: 'Womenswear export',
                year: '2025',
                style: 'Corded Schiffli'
            }
        },
        {
            id: 2,
            title: 'Eyelet Border',
            category: 'Cotton Lace',
            subtitle: 'A clean edge, every time',
            description: 'A classic eyelet border punched so the scallop cuts clean and stays closed. The design has become a standing programme for a buyer who reorders the same width each season — which means the tenth run has to match the first.',
            image: products.cottonLace,
            features: [
                'Clean-cut scallop, no fray',
                'Available 2" through 6" widths',
                'Bleached and piece-dyed to order',
                'Consistent hand across reorders',
                'Reference swatch held on file',
                'Standing repeat programme'
            ],
            stats: {
                area: '4" width',
                location: 'Kidswear export',
                year: '2025',
                style: 'Cotton Eyelet'
            }
        },
        {
            id: 3,
            title: 'Bridal Metallic',
            category: 'Occasion Panel',
            subtitle: 'Density is the whole problem',
            description: 'A heavy metallic panel worked on net for occasionwear. Punching decides everything here — too dense and the net puckers, too loose and the motif loses the weight the design depends on. We ran three densities before settling.',
            image: products.bridalLace,
            features: [
                'High-density metallic yarn work',
                'Stabilised net base',
                'Panel-cut to garment size',
                'Hand-finished edges',
                'Sample-to-bulk colour matching',
                'Individually inspected'
            ],
            stats: {
                area: 'Panel cut',
                location: 'Occasionwear',
                year: '2025',
                style: 'Metallic Bridal'
            }
        },
        {
            id: 4,
            title: 'Crochet Trims',
            category: 'Coordinated Set',
            subtitle: 'One language, six widths',
            description: 'A family of narrow crochet trims produced as a coordinated set, so a single collection can carry one visual language across cuffs, necklines and hems without the pieces fighting each other.',
            image: products.crochetLace,
            features: [
                'Six coordinated widths',
                'Cotton and viscose blends',
                'Soft hand, garment-ready',
                'Shared motif language across the set',
                'Low minimums on repeat colours',
                'Produced on crochet lace machines'
            ],
            stats: {
                area: '6 designs',
                location: 'Domestic brand',
                year: '2024',
                style: 'Crochet Trim'
            }
        },
        {
            id: 5,
            title: 'Embroidered Net',
            category: 'Apparel Yardage',
            subtitle: 'Keeping a soft ground stable',
            description: 'All-over embroidered net produced as continuous yardage for a dress programme. Net moves under the needle, so the run was held at controlled speed and checked for dimensional drift at fixed intervals across the order.',
            image: products.embroideredNet,
            features: [
                'All-over repeat on soft net',
                'Continuous yardage, full width',
                'Controlled-speed run for stability',
                'Dimensional checks at fixed intervals',
                'Mended before finishing',
                '100% inspected before dispatch'
            ],
            stats: {
                area: '9,000 m',
                location: 'Dress programme',
                year: '2024',
                style: 'All-over Net'
            }
        },
        {
            id: 6,
            title: 'GPO Guipure',
            category: 'Burnout Lace',
            subtitle: 'Lace with nothing holding it up',
            description: 'Chemical-burnout guipure, where the ground dissolves away and the motifs hold to each other alone. It is an unforgiving process — the margin between a crisp lace and a collapsed one comes down to how the connector bars were punched.',
            image: products.gpoLace,
            features: [
                'Burnout ground, self-supporting motifs',
                'Dense connector bars for strength',
                'Wide and narrow widths',
                'Piece-dyed to shade',
                'Strength-tested after burnout',
                'Edge-stabilised for cutting'
            ],
            stats: {
                area: 'Wide width',
                location: 'Occasionwear export',
                year: '2025',
                style: 'GPO Guipure'
            }
        }
    ];

    // Modal handlers
    const handleOpenModal = (project) => {
        setSelectedProject(project);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedProject(null);
    };

    const services = [
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 4h16v6a8 8 0 01-16 0V4z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8 4v6M12 4v6M16 4v6" strokeLinecap="round" />
                    <path d="M12 18v3" strokeLinecap="round" />
                </svg>
            ),
            title: 'Schiffli\nEmbroidery',
            description: 'Continuous-width embroidery on Lässer machines, run for repeat accuracy across full yardage'
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 12h18" strokeLinecap="round" />
                    <path d="M3 12c2 0 2-3 4-3s2 3 4 3 2-3 4-3 2 3 4 3" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 17c2 0 2-3 4-3s2 3 4 3 2-3 4-3 2 3 4 3" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="7" cy="6" r="1.5" />
                    <circle cx="17" cy="6" r="1.5" />
                </svg>
            ),
            title: 'Laces &\nTrims',
            description: 'Cotton, crochet and GPO laces from delicate edgings through to wide statement borders'
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 3v18" strokeLinecap="round" />
                    <path d="M12 7c3-2 6-2 8 0M12 7c-3-2-6-2-8 0" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 13c3-2 6-2 8 0M12 13c-3-2-6-2-8 0" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="3" r="1.2" fill="currentColor" />
                </svg>
            ),
            title: 'Design &\nPunching',
            description: 'In-house studio building original artwork and adapting your reference into a production file'
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 21h18" strokeLinecap="round" />
                </svg>
            ),
            title: 'Finishing &\nQuality',
            description: 'Mending, shearing and metre-by-metre inspection before anything is cleared for dispatch'
        }
    ];

    return (
        <div className="home-page">
            {/* Section 1 - Hero Section */}
            <div className="home-section home-section-1" style={{ zIndex: 1 }}>
                <div className={`home-container ${isLoaded ? 'loaded' : ''}`}>
                    <section className="home-hero-screenshot">
                        <div className="home-hero-screenshot-content">
                            <div className="home-hero-screenshot-left">
                                <div className="home-hero-screenshot-tagline-wrapper">
                                    <p className="home-hero-screenshot-tagline">TIME TO MEET YOUR</p>
                                    <div className="home-hero-screenshot-line"></div>
                                </div>
                                <h1 className="home-hero-screenshot-title" id="hero-title">
                                    <span key={currentHeroIndex} className="hero-title-text">
                                        {heroCarouselData[currentHeroIndex].title}
                                    </span>
                                </h1>
                                <p className="home-hero-screenshot-description">
                                    <span key={`desc-${currentHeroIndex}`} className="hero-description-text">
                                        {heroCarouselData[currentHeroIndex].description}
                                    </span>
                                </p>
                                <button className="home-hero-screenshot-btn">
                                    View Our Work
                                </button>
                            </div>
                            <div className="home-hero-screenshot-right">
                                <div className="home-hero-screenshot-image-wrapper">
                                    {heroCarouselData.map((item, index) => (
                                        <img
                                            key={index}
                                            src={item.image}
                                            alt={`${item.title} - Modern Architecture`}
                                            className={`home-hero-screenshot-image ${
                                                index === currentHeroIndex ? 'active' : ''
                                            }`}
                                        />
                                    ))}
                                    <div className="hero-carousel-indicators">
                                        {heroCarouselData.map((_, index) => (
                                            <button
                                                key={index}
                                                className={`carousel-indicator ${
                                                    index === currentHeroIndex ? 'active' : ''
                                                }`}
                                                onClick={() => setCurrentHeroIndex(index)}
                                                aria-label={`Go to slide ${index + 1}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* Section 2 - Content */}
            <div className="home-section home-section-2" style={{ zIndex: 2 }}>
                <div className={`home-container ${isLoaded ? 'loaded' : ''}`}>
                    <MobileDev></MobileDev>
                    <AboutUs></AboutUs>
                    <WebSaaSDev></WebSaaSDev>
                    <InteriorShowcase></InteriorShowcase>

                    {/* New premium sections added - retain existing flow */}
                    <HeroStats />

                    {/* Aesthetic Showcase Section */}
                    <section className="aesthetic-section">
                        <div className="aesthetic-container">
                            <motion.div 
                                className="aesthetic-header"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                                viewport={{ once: true }}
                            >
                                <span className="home-section-label">Visual Excellence</span>
                                <h2 className="home-section-title">Where Art Meets Architecture</h2>
                                <p className="aesthetic-subtitle">
                                    Experience the pinnacle of design sophistication through our curated collection of architectural masterpieces
                                </p>
                            </motion.div>

                            <div className="aesthetic-grid">
                                {/* Hero Card - Large Spotlight */}
                                <motion.div 
                                    className="aesthetic-card aesthetic-hero"
                                    initial={{ opacity: 0, scale: 0.95, rotateY: -5 }}
                                    whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                                    transition={{ duration: 1, delay: 0.2 }}
                                    viewport={{ once: true }}
                                    onClick={() => handleOpenModal(aestheticProjects[0])}
                                >
                                    <div className="aesthetic-image-wrapper">
                                        <img 
                                            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80" 
                                            alt="Luxury Interior" 
                                            className="aesthetic-image"
                                        />
                                        <div className="aesthetic-overlay">
                                            <div className="aesthetic-badge">Featured</div>
                                            <div className="aesthetic-content">
                                                <h3>Modern Elegance</h3>
                                                <p>Timeless design that speaks volumes</p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Vertical Showcase */}
                                <motion.div 
                                    className="aesthetic-card aesthetic-vertical"
                                    initial={{ opacity: 0, x: 50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.9, delay: 0.3 }}
                                    viewport={{ once: true }}
                                    onClick={() => handleOpenModal(aestheticProjects[1])}
                                >
                                    <div className="aesthetic-image-wrapper">
                                        <img 
                                            src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80" 
                                            alt="Contemporary Space" 
                                            className="aesthetic-image"
                                        />
                                        <div className="aesthetic-overlay">
                                            <div className="aesthetic-content">
                                                <h3>Refined Living</h3>
                                                <p>Every detail perfected</p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Square Accent */}
                                <motion.div 
                                    className="aesthetic-card aesthetic-square"
                                    initial={{ opacity: 0, scale: 0.8, rotate: 3 }}
                                    whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                                    transition={{ duration: 0.8, delay: 0.4 }}
                                    viewport={{ once: true }}
                                    onClick={() => handleOpenModal(aestheticProjects[2])}
                                >
                                    <div className="aesthetic-image-wrapper">
                                        <img 
                                            src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80" 
                                            alt="Premium Kitchen" 
                                            className="aesthetic-image"
                                        />
                                        <div className="aesthetic-overlay">
                                            <div className="aesthetic-content">
                                                <h3>Culinary Excellence</h3>
                                                <p>Design that inspires</p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Wide Panorama */}
                                <motion.div 
                                    className="aesthetic-card aesthetic-panorama"
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.9, delay: 0.5 }}
                                    viewport={{ once: true }}
                                    onClick={() => handleOpenModal(aestheticProjects[3])}
                                >
                                    <div className="aesthetic-image-wrapper">
                                        <img 
                                            src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&q=80" 
                                            alt="Luxury Bedroom" 
                                            className="aesthetic-image"
                                        />
                                        <div className="aesthetic-overlay">
                                            <div className="aesthetic-content">
                                                <h3>Sanctuary Spaces</h3>
                                                <p>Where comfort meets luxury</p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Portrait Highlight */}
                                <motion.div 
                                    className="aesthetic-card aesthetic-portrait"
                                    initial={{ opacity: 0, y: -50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: 0.6 }}
                                    viewport={{ once: true }}
                                    onClick={() => handleOpenModal(aestheticProjects[4])}
                                >
                                    <div className="aesthetic-image-wrapper">
                                        <img 
                                            src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80" 
                                            alt="Living Space" 
                                            className="aesthetic-image"
                                        />
                                        <div className="aesthetic-overlay">
                                            <div className="aesthetic-content">
                                                <h3>Inspired Interiors</h3>
                                                <p>Crafted to perfection</p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Landscape Feature */}
                                <motion.div 
                                    className="aesthetic-card aesthetic-landscape"
                                    initial={{ opacity: 0, x: -50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.9, delay: 0.7 }}
                                    viewport={{ once: true }}
                                    onClick={() => handleOpenModal(aestheticProjects[5])}
                                >
                                    <div className="aesthetic-image-wrapper">
                                        <img 
                                            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&q=80" 
                                            alt="Luxury Living" 
                                            className="aesthetic-image"
                                        />
                                        <div className="aesthetic-overlay">
                                            <div className="aesthetic-content">
                                                <h3>Elegant Ambiance</h3>
                                                <p>Sophistication redefined</p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </section>

                    <Sustainability />

                    {/* Prestige Gallery - Stunning Visual Experience */}
                    <PrestigeGallery />

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

                    {/* Services Section */}
                    <section className="home-services">
                        <div className="home-services-header">
                            <span className="home-section-label">What We Offer</span>
                            <h2 className="home-section-title">What We Produce</h2>
                            <p className="home-services-subtitle">
                                Design, embroidery, finishing and inspection — all handled on our own floor
                            </p>
                        </div>
                        <div className="home-services-grid">
                            {services.map((service, index) => (
                                <div key={index} className="home-service-card">
                                    <div className="home-service-icon">{service.icon}</div>
                                    <h3 className="home-service-title">{service.title}</h3>
                                    <p className="home-service-description">{service.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                    <Testimonials></Testimonials>
                    <FAQ></FAQ>

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

            {/* Aesthetic Modal */}
            <AestheticModal 
                isOpen={modalOpen} 
                onClose={handleCloseModal} 
                project={selectedProject} 
            />
        </div>
    );
};

export default Home;
