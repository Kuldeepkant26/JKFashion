import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import '../css/WebSaaSDev.css';
import { FaPencilRuler, FaCogs, FaSearch } from 'react-icons/fa';
import { process as processImgs } from '../data/images';

gsap.registerPlugin(ScrollTrigger);

const WebSaaSDev = () => {
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

  const processStages = [
    {
      id: 1,
      icon: <FaPencilRuler />,
      title: 'Design & Punching',
      description: 'Artwork developed in-house and punched into a production-ready file'
    },
    {
      id: 2,
      icon: <FaCogs />,
      title: 'Production',
      description: 'Run on calibrated machines at controlled speed for a stable ground'
    },
    {
      id: 3,
      icon: <FaSearch />,
      title: 'Mending & Inspection',
      description: 'Hand-corrected, sheared to requirement, then checked before dispatch'
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
    <section className="websaas-section" ref={sectionRef}>
      <motion.div 
        className="websaas-container"
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
            <p className="section-label">HOW WE WORK</p>
            <div className="section-line"></div>
          </div>
        </motion.div>
        
        {/* Left Content */}
        <motion.div 
          className="websaas-left"
          variants={containerVariants}
        >
          <motion.h1 
            className="websaas-main-title"
            variants={itemVariants}
          >
            From Swatch to Shipment
          </motion.h1>

          <div className="websaas-features-list">
            {processStages.map((highlight, index) => (
              <motion.div 
                key={highlight.id} 
                className="websaas-feature-item"
                variants={itemVariants}
                custom={index}
              >
                <div className="feature-icon">{highlight.icon}</div>
                <div className="feature-content">
                  <h3 className="feature-title">{highlight.title}</h3>
                  <p className="feature-description">{highlight.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Center - Building Image */}
        <motion.div 
          className="websaas-center"
          variants={imageVariants}
        >
          <div className="building-showcase">
            <div ref={imageRef}>
              <img 
                src={processImgs.design} 
                alt="Embroidery design being punched in the studio"
                className="building-image"
              />
            </div>
            <div className="building-overlay">
              <div className="building-info">
                <div className="building-badge">
                  <FaPencilRuler />
                  <span>In-House Studio</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Content */}
        <motion.div 
          className="websaas-right"
          variants={containerVariants}
        >
          <motion.h2 
            className="websaas-secondary-title"
            variants={itemVariants}
          >
            We Would Rather Sample Twice
          </motion.h2>
          <motion.p 
            className="websaas-secondary-description"
            variants={itemVariants}
          >
            A design that looks right on screen can fail on fabric — the density fights the ground,
            or the repeat drifts across the width. So we sample, look at it honestly, and sample again
            if it is not right. It costs us a few days. It saves you a rejected shipment.
          </motion.p>
          <motion.button 
            className="websaas-learn-more"
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            Start a Sample
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default WebSaaSDev;
