import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../css/Footer.css';
import { 
    FaLinkedinIn, 
    FaInstagram, 
    FaFacebookF,
    FaEnvelope,
    FaPhone,
    FaMapMarkerAlt,
    FaWhatsapp
} from 'react-icons/fa';
import { company, contact, social } from '../data/site';
import logo from '../assets/jk-fashion-logo.png';

const Footer = () => {
    const currentYear = new Date().getFullYear();
    const navigate = useNavigate();

    // Scroll to section handler
    const scrollToSection = (path, sectionId) => {
        if (window.location.pathname === path) {
            const element = document.getElementById(sectionId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } else {
            navigate(path);
            setTimeout(() => {
                const element = document.getElementById(sectionId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }
    };

    return (
        <footer className="footer-section">
            <div className="footer-container">
                {/* Top Section */}
                <div className="footer-top">
                    <div className="footer-brand">
                        <div className="footer-logo">
                            <img src={logo} alt={company.name} className="footer-logo-img" />
                        </div>
                        <p className="footer-tagline">
                            Schiffli embroidered fabrics, laces and crochet trims for garment and fabric exporters. Punched in-house, run on calibrated machines, and inspected metre by metre before it leaves our floor.
                        </p>
                        <div className="footer-social">
                            <a href={social.linkedin} target="_blank" rel="noopener noreferrer" className="social-link" aria-label="LinkedIn">
                                <FaLinkedinIn />
                            </a>
                            <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Instagram">
                                <FaInstagram />
                            </a>
                            <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Facebook">
                                <FaFacebookF />
                            </a>
                            <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noopener noreferrer" className="social-link" aria-label="WhatsApp">
                                <FaWhatsapp />
                            </a>
                        </div>
                    </div>

                    <div className="footer-links">
                        <div className="footer-column">
                            <h3 className="footer-heading">Pages</h3>
                            <ul className="footer-list">
                                <li><Link to="/">Home</Link></li>
                                <li><Link to="/about">About Us</Link></li>
                                <li><Link to="/residential">Products</Link></li>
                            </ul>
                        </div>

                        <div className="footer-column">
                            <h3 className="footer-heading">Quick Links</h3>
                            <ul className="footer-list">
                                <li>
                                    <button 
                                        className="footer-link-btn"
                                        onClick={() => scrollToSection('/', 'faq-section')}
                                    >
                                        FAQ
                                    </button>
                                </li>
                                <li>
                                    <button 
                                        className="footer-link-btn"
                                        onClick={() => scrollToSection('/', 'testimonials-section')}
                                    >
                                        Testimonials
                                    </button>
                                </li>
                                <li>
                                    <button 
                                        className="footer-link-btn"
                                        onClick={() => scrollToSection('/about', 'signature-projects-section')}
                                    >
                                        Our Projects
                                    </button>
                                </li>
                            </ul>
                        </div>

                        <div className="footer-column" id="footer-contact-section">
                            <h3 className="footer-heading">Contact Us</h3>
                            <ul className="footer-contact">
                                <li>
                                    <FaEnvelope className="contact-icon" />
                                    <a href={`mailto:${contact.email}`}>{contact.email}</a>
                                </li>
                                <li>
                                    <FaPhone className="contact-icon" />
                                    <a href={`tel:${contact.phoneHref}`}>{contact.phone}</a>
                                </li>
                                <li>
                                    <FaMapMarkerAlt className="contact-icon" />
                                    <span>{contact.address}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="footer-divider"></div>

                {/* Bottom Section */}
                <div className="footer-bottom">
                    <p className="footer-copyright">
                        © {currentYear} {company.name}. All rights reserved.
                    </p>
                    <div className="footer-legal">
                        <Link to="/about">Privacy Policy</Link>
                        <span className="legal-divider">•</span>
                        <Link to="/about">Terms of Service</Link>
                    </div>
                </div>
            </div>

            {/* Background Decorations */}
            <div className="footer-decoration footer-decoration-1"></div>
            <div className="footer-decoration footer-decoration-2"></div>
        </footer>
    );
};

export default Footer;
