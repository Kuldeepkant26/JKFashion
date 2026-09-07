import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import '../css/AboutUs.css';
import { hero } from '../data/images';

gsap.registerPlugin(ScrollTrigger);

const AboutUs = () => {
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
        { opacity: 0, scale: 0.95, y: 30 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 1.5,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            end: "top 50%",
            toggleActions: "play reverse play reverse",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

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
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 1.2,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <section className="aboutus-section" ref={sectionRef}>
      <motion.div 
        className="aboutus-container"
        ref={intersectionRef}
        variants={containerVariants}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
      >
        {/* Left Side - Icon and Image */}
        <motion.div 
          className="aboutus-left"
          variants={imageVariants}
        >
          <div className="icon-and-image">
            <div className="aboutus-icon">
              <svg viewBox="0 0 100 100" className="icon-svg">
                <g transform="translate(50, 50)">
                  {[...Array(16)].map((_, i) => (
                    <line
                      key={i}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="-40"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      transform={`rotate(${i * 22.5})`}
                    />
                  ))}
                </g>
              </svg>
            </div>
            <div className="aboutus-image" ref={imageRef}>
              <div className="image-placeholder">
                <img 
                  src={hero.loom} 
                  alt="Schiffli embroidery machine running production"
                  className="aboutus-actual-image"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side - Content */}
        <motion.div 
          className="aboutus-right"
          variants={containerVariants}
        >
          <motion.h2 
            className="aboutus-title"
            variants={itemVariants}
          >
            OUR <span className="gradient-accent">EXPERTISE</span>
          </motion.h2>
          <motion.div 
            className="aboutus-text"
            variants={itemVariants}
          >
            <p className="aboutus-paragraph">
              JK Fashion manufactures <span className="gradient-accent">schiffli embroidered fabrics</span> and <span className="gradient-accent">laces</span> for garment and fabric exporters. Designs are punched in our own studio, run on calibrated machines, and checked metre by metre before anything is cleared to leave the floor.
            </p>
            <p className="aboutus-paragraph">
              We work across <span className="gradient-accent">cotton and crochet laces</span>, <span className="gradient-accent">GPO guipure</span>, and <span className="gradient-accent">all-over yardage</span> on voile, net and viscose grounds. Whether you arrive with a reference swatch or a rough idea, we develop it into a production-ready file, sample it until the hand is right, and hold that standard through bulk.
            </p>
          </motion.div>

          <motion.div 
            className="aboutus-cta"
            variants={itemVariants}
          >
            <motion.button 
              className="circle-btn"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="btn-line"></span>
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default AboutUs;
