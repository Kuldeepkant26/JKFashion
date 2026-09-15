import React from 'react';
import '../css/Footer.css';
import SectionLink from './navbars/SectionLink.jsx';
import { NAV_LINKS } from './navbars/useNavbar.js';
import { ENQUIRY_SECTION_ID } from './EnquirySection.jsx';
import { GALLERY_SECTION_ID } from './RackGallery.jsx';
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
                                {NAV_LINKS.map((link) => (
                                    <li key={link.label}>
                                        <SectionLink id={link.id}>{link.label}</SectionLink>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="footer-column">
                            <h3 className="footer-heading">Quick Links</h3>
                            <ul className="footer-list">
                                <li>
                                    <SectionLink
                                        id={ENQUIRY_SECTION_ID}
                                        className="footer-link-btn"
                                    >
                                        Send an Enquiry
                                    </SectionLink>
                                </li>
                                <li>
                                    <SectionLink
                                        id={GALLERY_SECTION_ID}
                                        className="footer-link-btn"
                                    >
                                        Our Work
                                    </SectionLink>
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
                </div>
            </div>

            {/* Background Decorations */}
            <div className="footer-decoration footer-decoration-1"></div>
            <div className="footer-decoration footer-decoration-2"></div>
        </footer>
    );
};

export default Footer;
