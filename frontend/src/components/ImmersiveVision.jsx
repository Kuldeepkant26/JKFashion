import React, { useState, useEffect, useRef } from 'react';
import '../css/ImmersiveVision.css';
import { FaEye, FaLightbulb, FaHeart, FaRocket, FaQuoteLeft } from 'react-icons/fa';

const ImmersiveVision = () => {
    const sectionRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    const [activeCard, setActiveCard] = useState(null);

    const visionData = [
        {
            id: 1,
            icon: FaEye,
            title: "Vision",
            description: "To be the supplier our buyers stop shopping around for, because the goods simply arrive right.",
            accent: "var(--color-yellow-gold)"
        },
        {
            id: 2,
            icon: FaLightbulb,
            title: "Innovation",
            description: "Design software, machine calibration and process upgrades — quietly, and only where they show in the cloth.",
            accent: "var(--color-forest-green)"
        },
        {
            id: 3,
            icon: FaHeart,
            title: "Craft",
            description: "Three hundred hands still touch this work. Machines run it; people decide whether it is good enough.",
            accent: "var(--color-yellow-gold)"
        },
        {
            id: 4,
            icon: FaRocket,
            title: "Growth",
            description: "Taking on more without letting the standard slip — the only kind of growth worth having.",
            accent: "var(--color-forest-green)"
        }
    ];

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.2 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <section 
            ref={sectionRef}
            id="immersive-vision-section"
            className={`immersive-vision immersive-vision--light ${isVisible ? 'immersive-vision--visible' : ''}`}
        >
            {/* Simple gradient background */}
            <div className="immersive-vision__bg">
                <div className="immersive-vision__bg-gradient"></div>
                <div className="immersive-vision__bg-accent"></div>
            </div>

            <div className="immersive-vision__container">
                {/* Header */}
                <div className={`immersive-vision__header ${isVisible ? 'immersive-vision__header--animate' : ''}`}>
                    <span className="immersive-vision__label">Our Philosophy</span>
                    <h2 className="immersive-vision__title">
                        What We <span className="immersive-vision__title-highlight">Stand</span> Behind
                    </h2>
                    <p className="immersive-vision__subtitle">
                        Where machine precision meets three hundred pairs of experienced hands
                    </p>
                </div>

                {/* Vision Cards Grid */}
                <div className="immersive-vision__grid">
                    {visionData.map((item, index) => {
                        const IconComponent = item.icon;
                        return (
                            <div
                                key={item.id}
                                className={`immersive-vision__card ${isVisible ? 'immersive-vision__card--animate' : ''} ${activeCard === item.id ? 'immersive-vision__card--active' : ''}`}
                                style={{ 
                                    '--card-delay': `${index * 0.15}s`,
                                    '--card-accent': item.accent
                                }}
                                onMouseEnter={() => setActiveCard(item.id)}
                                onMouseLeave={() => setActiveCard(null)}
                            >
                                <div className="immersive-vision__card-icon">
                                    <IconComponent />
                                </div>
                                <h3 className="immersive-vision__card-title">{item.title}</h3>
                                <p className="immersive-vision__card-desc">{item.description}</p>
                                <div className="immersive-vision__card-line"></div>
                            </div>
                        );
                    })}
                </div>

                {/* Quote Section */}
                <div className={`immersive-vision__quote ${isVisible ? 'immersive-vision__quote--animate' : ''}`}>
                    <FaQuoteLeft className="immersive-vision__quote-icon" />
                    <blockquote className="immersive-vision__quote-text">
                        We don't just build structures, we craft the foundations of cherished memories and lasting legacies.
                    </blockquote>
                    <cite className="immersive-vision__quote-author">— JK Fashion</cite>
                </div>

                {/* Stats Row */}
                <div className={`immersive-vision__stats ${isVisible ? 'immersive-vision__stats--animate' : ''}`}>
                    <div className="immersive-vision__stat">
                        <span className="immersive-vision__stat-number">25+</span>
                        <span className="immersive-vision__stat-label">Years in Embroidery</span>
                    </div>
                    <div className="immersive-vision__stat-divider"></div>
                    <div className="immersive-vision__stat">
                        <span className="immersive-vision__stat-number">500+</span>
                        <span className="immersive-vision__stat-label">Designs On File</span>
                    </div>
                    <div className="immersive-vision__stat-divider"></div>
                    <div className="immersive-vision__stat">
                        <span className="immersive-vision__stat-number">2M+</span>
                        <span className="immersive-vision__stat-label">Stitches Per Day</span>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ImmersiveVision;
