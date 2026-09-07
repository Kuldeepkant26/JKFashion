import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useInView as useIntersectionObserver } from 'react-intersection-observer';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import '../css/InteriorShowcase.css';
import { products, hero } from '../data/images';

// Register GSAP plugin
gsap.registerPlugin(ScrollTrigger);

const InteriorShowcase = () => {
  const sectionRef = useRef(null);
  const mainImageRef = useRef(null);
  const secondaryImageRef = useRef(null);
  const contentRef = useRef(null);
  
  // Intersection Observer for triggering animations (repeatable)
  const { ref: intersectionRef, inView } = useIntersectionObserver({
    threshold: 0.2,
    triggerOnce: false, // Changed to repeat on every scroll
  });

  // GSAP Parallax and scroll animations
  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Main image parallax effect
      gsap.to(mainImageRef.current, {
        yPercent: -15,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });

      // Secondary image parallax (opposite direction)
      gsap.to(secondaryImageRef.current, {
        yPercent: 10,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });

      // Content fade and slide on scroll (slower and repeatable)
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1.5,
          ease: "power3.out",
          scrollTrigger: {
            trigger: contentRef.current,
            start: "top 80%",
            end: "top 50%",
            toggleActions: "play reverse play reverse", // Changed to repeat
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Framer Motion animation variants (slower durations)
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
    <section 
      className="showcase-section" 
      id="showcase" 
      ref={sectionRef}
    >
      <motion.div 
        className="showcase-container"
        ref={intersectionRef}
        variants={containerVariants}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
      >
        {/* Left Side - Main Image */}
        <motion.div 
          className="showcase-left"
          variants={imageVariants}
        >
          <div className="showcase-main-image">
            <div ref={mainImageRef} className="image-wrapper">
              <img 
                src={products.bridalLace} 
                alt="Bridal metallic lace panel detail"
                className="main-img"
              />
            </div>
          </div>
        </motion.div>

        {/* Right Side - Content and Secondary Image */}
        <div className="showcase-right">
          <motion.div 
            className="showcase-content"
            ref={contentRef}
            variants={containerVariants}
          >
            <motion.p 
              className="showcase-label"
              variants={itemVariants}
            >
              CUSTOM DEVELOPMENT
            </motion.p>
            
            <motion.h2 
              className="showcase-title"
              variants={itemVariants}
            >
              Bring Us a <span className="gradient-accent">Swatch</span>
              <br />
              We Will Make It Run
            </motion.h2>
            
            <motion.p 
              className="showcase-description"
              variants={itemVariants}
            >
              A photograph, a scrap of an old sample, or a sketch on paper — our studio will punch it,
              adjust the density to suit your base fabric, and send you a sample before anything goes to bulk.
            </motion.p>
            
            <motion.button 
              className="showcase-cta"
              variants={itemVariants}
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 15px 40px rgba(0, 0, 0, 0.3)",
              }}
              whileTap={{ scale: 0.98 }}
            >
              Request a Sample
            </motion.button>
          </motion.div>

          {/* Secondary Image - Bottom Right */}
          <motion.div 
            className="showcase-secondary-image"
            variants={imageVariants}
          >
            <div ref={secondaryImageRef} className="image-wrapper">
              <img 
                src={hero.threads} 
                alt="Viscose thread cones on the production floor"
                className="secondary-img"
              />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default InteriorShowcase;
