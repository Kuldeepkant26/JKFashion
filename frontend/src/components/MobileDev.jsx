import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import '../css/MobileDev.css';
import { FaLayerGroup, FaCut, FaPalette } from 'react-icons/fa';
import { products } from '../data/images';

gsap.registerPlugin(ScrollTrigger);

const MobileDev = () => {
  const sectionRef = useRef(null);
  const imageRef = useRef(null);
  
  const { ref: intersectionRef, inView } = useInView({
    threshold: 0.2,
    triggerOnce: false,
  });

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        imageRef.current,
        { y: 50, scale: 0.95 },
        {
          y: -20,
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.5,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const productCapabilities = [
    {
      id: 1,
      icon: <FaLayerGroup />,
      title: 'Schiffli Yardage',
      description: 'Continuous-width embroidery run for repeat accuracy across full orders'
    },
    {
      id: 2,
      icon: <FaCut />,
      title: 'Laces & Trims',
      description: 'Cotton, crochet and GPO laces from fine edgings to wide borders'
    },
    {
      id: 3,
      icon: <FaPalette />,
      title: 'Custom Development',
      description: 'Your reference swatch punched, sampled and taken through to bulk'
    }
  ];

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

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 1.2,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <section className="mobiledev-section" ref={sectionRef}>
      <motion.div 
        className="mobiledev-container"
        ref={intersectionRef}
        variants={containerVariants}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
      >
        {/* Section Header */}
        <motion.div 
          className="section-header-center"
          variants={itemVariants}
        >
          <div className="section-tagline-wrapper">
            <p className="section-label">WHAT WE MAKE</p>
            <div className="section-line"></div>
          </div>
        </motion.div>
        
        {/* Left Content */}
        <motion.div 
          className="mobiledev-left"
          variants={containerVariants}
        >
          <motion.h1 
            className="mobiledev-main-title"
            variants={itemVariants}
          >
            Embroidery, By the Metre
          </motion.h1>

          <div className="mobiledev-features-list">
            {productCapabilities.map((feature, index) => (
              <motion.div 
                key={feature.id} 
                className="mobiledev-feature-item"
                variants={itemVariants}
                custom={index}
              >
                <div className="feature-icon">{feature.icon}</div>
                <div className="feature-content">
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Center - Building Image */}
        <motion.div 
          className="mobiledev-center"
          variants={imageVariants}
        >
          <div className="building-showcase">
            <div ref={imageRef}>
              <img 
                src={products.schiffliFabric} 
                alt="Corded floral schiffli embroidered fabric"
                className="building-image"
              />
            </div>
            <div className="building-overlay">
              <div className="building-info">
                <div className="building-badge">
                  <FaLayerGroup />
                  <span>Schiffli Fabric</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Content */}
        <motion.div 
          className="mobiledev-right"
          variants={containerVariants}
        >
          <motion.h2 
            className="mobiledev-secondary-title"
            variants={itemVariants}
          >
            Consistency Is the Hard Part
          </motion.h2>
          <motion.p 
            className="mobiledev-secondary-description"
            variants={itemVariants}
          >
            Anyone can produce one good metre. Producing the fourteen-thousandth metre to the same
            standard is what a buyer is actually paying for. Our machines are calibrated to hold
            tension across a full run, and every metre is mended and inspected before it is cleared.
          </motion.p>
          <motion.button 
            className="mobiledev-learn-more"
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            View Our Work
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default MobileDev;
