import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaMapMarkerAlt, FaRuler, FaCalendar, FaAward } from 'react-icons/fa';
import '../css/AestheticModal.css';

const AestheticModal = ({ isOpen, onClose, project }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!project) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    className="aesthetic-modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div 
                        className="aesthetic-modal-content"
                        initial={{ scale: 0.9, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 50 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button className="modal-close-btn" onClick={onClose}>
                            <FaTimes />
                        </button>

                        <div className="modal-layout">
                            {/* Image Section */}
                            <motion.div 
                                className="modal-image-section"
                                initial={{ x: -50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <div className="modal-image-wrapper">
                                    <img src={project.image} alt={project.title} />
                                    <div className="modal-image-badge">{project.badge}</div>
                                </div>
                            </motion.div>

                            {/* Details Section */}
                            <motion.div 
                                className="modal-details-section"
                                initial={{ x: 50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                <div className="modal-header">
                                    <span className="modal-category">{project.category}</span>
                                    <h2 className="modal-title">{project.title}</h2>
                                    <p className="modal-subtitle">{project.subtitle}</p>
                                </div>

                                <div className="modal-description">
                                    <p>{project.description}</p>
                                </div>

                                <div className="modal-stats">
                                    {project.area && (
                                        <div className="modal-stat-item">
                                            <div className="stat-icon">
                                                <FaRuler />
                                            </div>
                                            <div className="stat-content">
                                                <span className="stat-label">Area</span>
                                                <span className="stat-value">{project.area}</span>
                                            </div>
                                        </div>
                                    )}
                                    {project.location && (
                                        <div className="modal-stat-item">
                                            <div className="stat-icon">
                                                <FaMapMarkerAlt />
                                            </div>
                                            <div className="stat-content">
                                                <span className="stat-label">Location</span>
                                                <span className="stat-value">{project.location}</span>
                                            </div>
                                        </div>
                                    )}
                                    {project.year && (
                                        <div className="modal-stat-item">
                                            <div className="stat-icon">
                                                <FaCalendar />
                                            </div>
                                            <div className="stat-content">
                                                <span className="stat-label">Completed</span>
                                                <span className="stat-value">{project.year}</span>
                                            </div>
                                        </div>
                                    )}
                                    {project.style && (
                                        <div className="modal-stat-item">
                                            <div className="stat-icon">
                                                <FaAward />
                                            </div>
                                            <div className="stat-content">
                                                <span className="stat-label">Style</span>
                                                <span className="stat-value">{project.style}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {project.features && (
                                    <div className="modal-features">
                                        <h3>Key Features</h3>
                                        <ul className="features-list">
                                            {project.features.map((feature, index) => (
                                                <motion.li 
                                                    key={index}
                                                    initial={{ x: -20, opacity: 0 }}
                                                    animate={{ x: 0, opacity: 1 }}
                                                    transition={{ delay: 0.4 + index * 0.1 }}
                                                >
                                                    <span className="feature-bullet"></span>
                                                    {feature}
                                                </motion.li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <motion.div 
                                    className="modal-actions"
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                >
                                    <button className="modal-btn-primary">View Full Project</button>
                                    <button className="modal-btn-secondary">Contact Us</button>
                                </motion.div>
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AestheticModal;
