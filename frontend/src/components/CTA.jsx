import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import '../css/CTA.css';
import { FaRocket, FaArrowRight, FaPhone, FaEnvelope } from 'react-icons/fa';
import { contact } from '../data/site';

const CTA = () => {
    const { ref: intersectionRef, inView } = useInView({
        threshold: 0.3,
        triggerOnce: false,
    });

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.04,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1],
            },
        },
    };

    return (
        <section className="cta-section" id="cta-section">
            <div className="cta-container">
                <motion.div 
                    className="cta-content"
                    ref={intersectionRef}
                    variants={containerVariants}
                    initial="hidden"
                    animate={inView ? "visible" : "hidden"}
                >
                    {/* Icon */}
                    <motion.div 
                        className="cta-icon"
                        variants={itemVariants}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                        <FaRocket />
                    </motion.div>

                    {/* Main Content */}
                    <motion.h2 
                        className="cta-title"
                        variants={itemVariants}
                    >
                        Have a <span className="gradient-text">Reference</span> in Hand?
                    </motion.h2>
                    <motion.p 
                        className="cta-subtitle"
                        variants={itemVariants}
                    >
                        Send us a swatch, a photograph, or a rough sketch. We will tell you honestly whether
                        we can make it, roughly what it will cost, and how long sampling will take.
                    </motion.p>

                    {/* Features */}
                    <motion.div 
                        className="cta-features"
                        variants={itemVariants}
                    >
                        <div className="cta-feature">
                            <span className="feature-check">✓</span>
                            <span>Sampling Available</span>
                        </div>
                        <div className="cta-feature">
                            <span className="feature-check">✓</span>
                            <span>In-House Design Studio</span>
                        </div>
                        <div className="cta-feature">
                            <span className="feature-check">✓</span>
                            <span>Bulk Capacity</span>
                        </div>
                        <div className="cta-feature">
                            <span className="feature-check">✓</span>
                            <span>100% Inspected</span>
                        </div>
                    </motion.div>

                    {/* Buttons */}
                    <motion.div 
                        className="cta-buttons"
                        variants={itemVariants}
                    >
                        <motion.button 
                            className="cta-btn primary-btn"
                            whileHover={{ scale: 1.05, x: 5 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Request a Sample
                            <FaArrowRight />
                        </motion.button>
                        <motion.button 
                            className="cta-btn secondary-btn"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <FaPhone />
                            Talk to Us
                        </motion.button>
                    </motion.div>

                    {/* Contact Info */}
                    <motion.div 
                        className="cta-contact"
                        variants={itemVariants}
                    >
                        <a href={`mailto:${contact.email}`} className="contact-link">
                            <FaEnvelope />
                            {contact.email}
                        </a>
                        <span className="contact-divider">|</span>
                        <a href={`tel:${contact.phoneHref}`} className="contact-link">
                            <FaPhone />
                            {contact.phone}
                        </a>
                    </motion.div>
                </motion.div>

                {/* Decorative Elements */}
                <div className="cta-shape cta-shape-1"></div>
                <div className="cta-shape cta-shape-2"></div>
                <div className="cta-shape cta-shape-3"></div>
            </div>
        </section>
    );
};

export default CTA;
