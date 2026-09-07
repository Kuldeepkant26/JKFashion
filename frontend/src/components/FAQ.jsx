import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import '../css/FAQ.css';
import { FaPlus, FaMinus, FaQuestionCircle } from 'react-icons/fa';

const FAQ = () => {
    const [activeIndex, setActiveIndex] = useState(null);
    
    const { ref: intersectionRef, inView } = useInView({
        threshold: 0.2,
        triggerOnce: false,
    });

    const toggleFAQ = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    const faqs = [
        {
            question: "What kinds of embroidery do you produce?",
            answer: "Schiffli embroidered fabrics in continuous yardage, cotton and crochet laces, GPO guipure, embroidered net, and panel-cut pieces for occasionwear. We work on voile, net, viscose and cotton grounds, with viscose, cotton and metallic yarns."
        },
        {
            question: "Can you develop a design from my reference swatch?",
            answer: "Yes — that is most of what our design studio does. Send a swatch, a photo, or even a rough sketch, and we will punch it into a production-ready file, adjust the density and repeat to suit your base fabric, and send you a sample before anything goes to bulk."
        },
        {
            question: "What is your minimum order quantity?",
            answer: "It depends on the construction and whether the design is new or a repeat. New developments generally need a larger first run to justify the punching and setup; repeat colours on an existing design can go much lower. Tell us the design and quantity you have in mind and we will give you a straight answer."
        },
        {
            question: "How long does sampling take, and what does it cost?",
            answer: "A sample from an existing design is usually a few working days. A new development that needs punching from scratch takes longer, since we would rather run it two or three times and get the hand right than send you something we are not happy with. Sampling charges depend on complexity and are typically adjusted against a confirmed bulk order."
        },
        {
            question: "What are your bulk lead times?",
            answer: "Lead time depends on the order size, the construction, and whether processing is involved. We give you a date at the time of confirmation and tell you early if anything threatens it — we would rather have an uncomfortable conversation in week two than a missed shipment in week six."
        },
        {
            question: "Can you match a specific colour?",
            answer: "Yes. Send us your shade card or a physical swatch and we will match it in sampling and hold that standard through bulk. Where dyeing is involved we recommend approving a lab dip first, since a screen or a printed card will never be a reliable reference for a dyed shade."
        },
        {
            question: "How do you handle quality control?",
            answer: "Every metre passes through mending, where breaks and missed stitches are corrected by hand, then through shearing to remove connecting threads to your requirement, then a final inspection before packing. Nothing ships that has not been looked at."
        },
        {
            question: "How do I get started?",
            answer: "Send us your reference — a swatch, an image, or a description of what you need — along with your approximate quantity and delivery window. We will come back with a view on feasibility, an indicative price, and a sampling timeline. There is no charge for that conversation."
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08,
                delayChildren: 0.03,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1],
            },
        },
    };

    const headerVariants = {
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

    return (
        <section className="faq-section" id="faq-section">
            <motion.div 
                className="faq-container"
                ref={intersectionRef}
                variants={containerVariants}
                initial="hidden"
                animate={inView ? "visible" : "hidden"}
            >
                {/* Header */}
                <motion.div 
                    className="faq-header"
                    variants={headerVariants}
                >
                    <motion.div 
                        className="faq-icon-wrapper"
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                    >
                        <FaQuestionCircle className="faq-main-icon" />
                    </motion.div>
                    <h2 className="faq-title">
                        Frequently Asked <span className="gradient-text">Questions</span>
                    </h2>
                    <p className="faq-subtitle">
                        Straight answers on sampling, minimums, lead times and quality — the things buyers actually ask us first.
                    </p>
                </motion.div>

                {/* FAQ List */}
                <div className="faq-list">
                    {faqs.map((faq, index) => (
                        <motion.div 
                            key={index} 
                            className={`faq-item ${activeIndex === index ? 'active' : ''}`}
                            variants={itemVariants}
                        >
                            <button 
                                className="faq-question"
                                onClick={() => toggleFAQ(index)}
                                aria-expanded={activeIndex === index}
                            >
                                <span className="question-text">{faq.question}</span>
                                <motion.span 
                                    className="faq-icon"
                                    animate={{ rotate: activeIndex === index ? 180 : 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {activeIndex === index ? <FaMinus /> : <FaPlus />}
                                </motion.span>
                            </button>
                            <motion.div 
                                className={`faq-answer ${activeIndex === index ? 'show' : ''}`}
                                initial={false}
                                animate={{
                                    height: activeIndex === index ? "auto" : 0,
                                    opacity: activeIndex === index ? 1 : 0
                                }}
                                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            >
                                <p>{faq.answer}</p>
                            </motion.div>
                        </motion.div>
                    ))}
                </div>

                {/* CTA Section */}
                <motion.div 
                    className="faq-cta"
                    variants={itemVariants}
                >
                    <p className="faq-cta-text">Still have questions?</p>
                    <motion.button 
                        className="faq-cta-button"
                        whileHover={{ scale: 1.05, x: 5 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        Contact Us
                        <svg className="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                    </motion.button>
                </motion.div>
            </motion.div>

            {/* Background Decorations */}
            <div className="faq-decoration faq-decoration-1"></div>
            <div className="faq-decoration faq-decoration-2"></div>
        </section>
    );
};

export default FAQ;
