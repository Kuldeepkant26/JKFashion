import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import '../css/Testimonials.css';
import { FaStar, FaQuoteLeft, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

gsap.registerPlugin(ScrollTrigger);

const Testimonials = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const sectionRef = useRef(null);
    
    const { ref: intersectionRef, inView } = useInView({
        threshold: 0.2,
        triggerOnce: false,
    });

    // ---------------------------------------------------------------------
    // PLACEHOLDER TESTIMONIALS — names and quotes below are invented examples
    // written to show the layout. REPLACE THESE with real, attributed client
    // quotes (with permission) before the site goes live.
    // ---------------------------------------------------------------------
    const testimonials = [
        {
            id: 1,
            name: 'Placeholder Name',
            role: 'Merchandiser, Garment Export House',
            image: 'https://i.pravatar.cc/150?img=12',
            rating: 5,
            text: 'We sent across a reference swatch and got a sample back that was closer than we expected on the first attempt. The bulk matched the sample, which is the part that usually goes wrong.',
            project: 'Corded Schiffli Yardage'
        },
        {
            id: 2,
            name: 'Placeholder Name',
            role: 'Sourcing Head, Womenswear Brand',
            image: 'https://i.pravatar.cc/150?img=5',
            rating: 5,
            text: 'What we value most is that they tell us early when something is running behind. We can plan around a date we know about. We cannot plan around a surprise.',
            project: 'Embroidered Net Programme'
        },
        {
            id: 3,
            name: 'Placeholder Name',
            role: 'Production Manager, Fabric Trading',
            image: 'https://i.pravatar.cc/150?img=13',
            rating: 5,
            text: 'We have been reordering the same eyelet border for four seasons now and the tenth run still matches the first. That consistency is why we stopped shopping around.',
            project: 'Cotton Eyelet Border'
        },
        {
            id: 4,
            name: 'Placeholder Name',
            role: 'Designer, Occasionwear Label',
            image: 'https://i.pravatar.cc/150?img=1',
            rating: 5,
            text: 'The metallic panel we needed was difficult — too dense and the net puckered. They ran three densities before recommending one, and explained why. That is rare.',
            project: 'Bridal Metallic Panel'
        },
        {
            id: 5,
            name: 'Placeholder Name',
            role: 'Buyer, Kidswear Export',
            image: 'https://i.pravatar.cc/150?img=15',
            rating: 5,
            text: 'Our first order was small and we half expected to be deprioritised. It was not. The goods were inspected properly and shipped on the date we were given.',
            project: 'Crochet Trim Set'
        }
    ];

    const nextTestimonial = () => {
        setCurrentIndex((prevIndex) => 
            prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
        );
    };

    const prevTestimonial = () => {
        setCurrentIndex((prevIndex) => 
            prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
        );
    };

    const goToTestimonial = (index) => {
        setCurrentIndex(index);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.12,
                delayChildren: 0.05,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 1,
                ease: [0.22, 1, 0.36, 1],
            },
        },
    };

    const cardVariants = {
        enter: (direction) => ({
            x: direction > 0 ? 100 : -100,
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1,
            transition: {
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1],
            }
        },
        exit: (direction) => ({
            x: direction < 0 ? 100 : -100,
            opacity: 0,
            transition: {
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1],
            }
        })
    };

    return (
        <section className="testimonials-section" ref={sectionRef} id="testimonials-section">
            <motion.div 
                className="testimonials-container"
                ref={intersectionRef}
                variants={containerVariants}
                initial="hidden"
                animate={inView ? "visible" : "hidden"}
            >
                {/* Header */}
                <motion.div 
                    className="testimonials-header"
                    variants={itemVariants}
                >
                    <h2 className="testimonials-title">
                        What Our <span className="gradient-text">Buyers Say</span>
                    </h2>
                    <p className="testimonials-subtitle">
                        Merchandisers, sourcing heads and designers who have run programmes with us — in their words.
                    </p>
                </motion.div>

                {/* Testimonial Slider */}
                <motion.div 
                    className="testimonial-slider"
                    variants={itemVariants}
                >
                    <motion.button 
                        className="slider-btn prev-btn" 
                        onClick={prevTestimonial}
                        aria-label="Previous testimonial"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <FaChevronLeft />
                    </motion.button>

                    <div className="testimonial-content">
                        <div className="quote-icon">
                            <FaQuoteLeft />
                        </div>
                        
                        <AnimatePresence mode="wait">
                            <motion.div 
                                key={currentIndex}
                                className="testimonial-card"
                                variants={cardVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                            >
                            <div className="client-info">
                                <img 
                                    src={testimonials[currentIndex].image} 
                                    alt={testimonials[currentIndex].name}
                                    className="client-image"
                                />
                                <div className="client-details">
                                    <h3 className="client-name">{testimonials[currentIndex].name}</h3>
                                    <p className="client-role">{testimonials[currentIndex].role}</p>
                                    <div className="rating">
                                        {[...Array(testimonials[currentIndex].rating)].map((_, index) => (
                                            <FaStar key={index} className="star-icon" />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <p className="testimonial-text">
                                "{testimonials[currentIndex].text}"
                            </p>

                            <div className="project-badge">
                                Project: {testimonials[currentIndex].project}
                            </div>
                        </motion.div>
                        </AnimatePresence>
                    </div>

                    <motion.button 
                        className="slider-btn next-btn" 
                        onClick={nextTestimonial}
                        aria-label="Next testimonial"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <FaChevronRight />
                    </motion.button>
                </motion.div>

                {/* Dots Navigation */}
                <motion.div 
                    className="slider-dots"
                    variants={itemVariants}
                >
                    {testimonials.map((_, index) => (
                        <button
                            key={index}
                            className={`dot ${index === currentIndex ? 'active' : ''}`}
                            onClick={() => goToTestimonial(index)}
                            aria-label={`Go to testimonial ${index + 1}`}
                        />
                    ))}
                </motion.div>
            </motion.div>

            {/* Background Decorations */}
            <div className="testimonials-decoration testimonials-decoration-1"></div>
            <div className="testimonials-decoration testimonials-decoration-2"></div>
        </section>
    );
};

export default Testimonials;
