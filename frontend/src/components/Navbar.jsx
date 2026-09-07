import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../css/Navbar.css';
import { company } from '../data/site';
import logo from '../assets/jk-fashion-logo.png';
import { FaQuestionCircle, FaComments, FaLightbulb, FaBuilding, FaPhone } from 'react-icons/fa';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [showMaintenancePopup, setShowMaintenancePopup] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        // Check if we're on mobile (where scroll stack is disabled)
        const isMobile = window.innerWidth <= 768;
        
        const homeScrollElement = document.querySelector('.home-page');
        const residentialScrollElement = document.querySelector('.interior-design-page');
        
        // On mobile, always use window scroll; on desktop, use container scroll for home/residential
        let scrollElement = window;
        if (!isMobile) {
            if (location.pathname === '/' && homeScrollElement) {
                scrollElement = homeScrollElement;
            } else if (location.pathname === '/residential' && residentialScrollElement) {
                scrollElement = residentialScrollElement;
            }
        }
        
        const getPosition = () => (scrollElement === window ? window.scrollY : scrollElement.scrollTop);
        let animationFrame = null;

        const updateState = () => {
            animationFrame = null;
            setIsScrolled(getPosition() > 20);
        };

        const handleScroll = () => {
            if (animationFrame) return;
            animationFrame = window.requestAnimationFrame(updateState);
        };

        handleScroll();
        scrollElement.addEventListener('scroll', handleScroll, { passive: true });
        
        // Also listen to window scroll as fallback
        if (scrollElement !== window) {
            window.addEventListener('scroll', handleScroll, { passive: true });
        }
        
        return () => {
            scrollElement.removeEventListener('scroll', handleScroll);
            if (scrollElement !== window) {
                window.removeEventListener('scroll', handleScroll);
            }
            if (animationFrame) {
                window.cancelAnimationFrame(animationFrame);
            }
        };
    }, [location.pathname]);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
        setOpenDropdown(null);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
        setOpenDropdown(null);
    };

    const toggleDropdown = (menu) => {
        setOpenDropdown(openDropdown === menu ? null : menu);
    };

    const handleNavClick = (e, itemName) => {
        if (itemName !== 'HOME' && itemName !== 'PRODUCTS') {
            e.preventDefault();
            setShowMaintenancePopup(true);
            closeSidebar();
        }
    };

    const closeMaintenancePopup = () => {
        setShowMaintenancePopup(false);
    };

    // Scroll to section handler - works across pages
    const scrollToSection = (path, sectionId) => {
        closeSidebar();
        
        if (location.pathname === path) {
            // Already on the page, just scroll
            const element = document.getElementById(sectionId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } else {
            // Navigate to the page first, then scroll
            navigate(path);
            setTimeout(() => {
                const element = document.getElementById(sectionId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }
    };

    // Only 4 items shown in navbar on larger screens
    const navbarItems = [
        { name: 'HOME', path: '/' },
        { name: 'ABOUT', path: '/about' },
        { name: 'PRODUCTS', path: '/residential' },
    ];

    const clientRouteItems = new Set(['HOME', 'ABOUT', 'PRODUCTS']);

    // All menu items for sidebar
    const menuItems = [
        { name: 'HOME', path: '/' },
        { name: 'PRODUCTS', path: '/residential' },
        { name: 'ABOUT', path: '/about' },
    ];

    // Quick links for sidebar - scrolls to sections
    const quickLinks = [
        { name: 'FAQ', icon: FaQuestionCircle, path: '/', sectionId: 'faq-section' },
        { name: 'Testimonials', icon: FaComments, path: '/', sectionId: 'testimonials-section' },
        { name: 'Our Vision', icon: FaLightbulb, path: '/about', sectionId: 'immersive-vision-section' },
        { name: 'Our Work', icon: FaBuilding, path: '/about', sectionId: 'signature-projects-section' },
        { name: 'Contact Us', icon: FaPhone, path: location.pathname, sectionId: 'footer-contact-section' },
    ];

    return (
        <>
            <nav 
                className={`navbar ${isScrolled ? 'scrolled' : ''}`}
            >
                <div className="navbar-container">
                    {/* Logo */}
                    <div className="navbar-logo">
                        <img src={logo} alt={company.name} className="navbar-logo-img" />
                    </div>

                    {/* Desktop Menu - Only 3 items */}
                    <ul className="navbar-menu">
                        {navbarItems.map((item, index) => (
                            <li key={index} className="navbar-item">
                                {clientRouteItems.has(item.name) ? (
                                    <Link
                                        to={item.path}
                                        className="navbar-link"
                                    >
                                        {item.name}
                                    </Link>
                                ) : (
                                    <a 
                                        href={item.path} 
                                        className="navbar-link"
                                        onClick={(e) => handleNavClick(e, item.name)}
                                    >
                                        {item.name}
                                    </a>
                                )}
                            </li>
                        ))}
                    </ul>

                    <div className="navbar-actions">
                        {/* Hamburger Button */}
                        <button 
                            className={`hamburger ${isSidebarOpen ? 'active' : ''}`}
                            onClick={toggleSidebar}
                            aria-label="Toggle menu"
                            type="button"
                        >
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Sidebar Overlay */}
            <div 
                className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
                onClick={toggleSidebar}
            ></div>

            {/* Sidebar */}
            <aside className={`sidebar ${isSidebarOpen ? 'active' : ''}`}>
                <div className="sidebar-header">
                    <img src={logo} alt={company.name} className="sidebar-logo-img" />
                    <button className="sidebar-close" onClick={toggleSidebar}>
                        ✕
                    </button>
                </div>
                
                {/* Scrollable Content */}
                <div className="sidebar-content">
                    {/* Main Navigation */}
                    <nav className="sidebar-nav">
                        {menuItems.map((item, index) => (
                            <div key={index} className="sidebar-item">
                                {clientRouteItems.has(item.name) ? (
                                    <Link 
                                        to={item.path} 
                                    className="sidebar-link"
                                    onClick={closeSidebar}
                                >
                                    {item.name}
                                </Link>
                            ) : (
                                <a 
                                    href={item.path} 
                                    className="sidebar-link"
                                    onClick={(e) => {
                                        if (item.submenu) {
                                            e.preventDefault();
                                            toggleDropdown(item.name);
                                        } else {
                                            handleNavClick(e, item.name);
                                        }
                                    }}
                                >
                                    {item.name}
                                    {item.submenu && (
                                        <span className={`sidebar-arrow ${openDropdown === item.name ? 'open' : ''}`}>
                                            ▼
                                        </span>
                                    )}
                                </a>
                            )}
                            {item.submenu && (
                                <div className={`sidebar-submenu ${openDropdown === item.name ? 'open' : ''}`}>
                                    {item.submenu.map((subitem, subindex) => (
                                        <a 
                                            key={subindex} 
                                            href={subitem.path}
                                            onClick={(e) => handleNavClick(e, subitem.name)}
                                        >
                                            {subitem.name}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                {/* Quick Links Section */}
                <div className="sidebar-quicklinks">
                    <h4 className="sidebar-quicklinks-title">Quick Links</h4>
                    {quickLinks.map((link, index) => {
                        const IconComponent = link.icon;
                        return (
                            <button
                                key={index}
                                className="sidebar-quicklink"
                                onClick={() => scrollToSection(link.path, link.sectionId)}
                            >
                                <IconComponent className="sidebar-quicklink-icon" />
                                <span>{link.name}</span>
                            </button>
                        );
                    })}
                </div>
                </div>
            </aside>

            {/* Maintenance Popup */}
            {showMaintenancePopup && (
                <div className="maintenance-overlay" onClick={closeMaintenancePopup}>
                    <div className="maintenance-popup" onClick={(e) => e.stopPropagation()}>
                        <div className="maintenance-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5z" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <h2>Under Maintenance</h2>
                        <p>This page is currently under construction. We're working hard to bring you an amazing experience!</p>
                        <button className="maintenance-close-btn" onClick={closeMaintenancePopup}>
                            Close
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;
