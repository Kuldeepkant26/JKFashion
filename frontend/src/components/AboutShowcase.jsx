import React, { useState } from 'react';
import '../css/AboutShowcase.css';
import { FaHome, FaGem, FaHandshake } from 'react-icons/fa';

const AboutShowcase = () => {
    const [activeCard] = useState(0);

    const ventures = [
        {
            title: "Judged on Reorders",
            description: "Our buyers resell what we make under their own name. The only real measure of whether we did well is whether they come back next season.",
            Icon: FaHome,
            color: "#667eea"
        },
        {
            title: "Consistency Over Flash",
            description: "A striking sample is easy. Holding that same hand and density across fourteen thousand metres is the actual job, and it is where we put our attention.",
            Icon: FaGem,
            color: "#f093fb"
        },
        {
            title: "Straight Answers",
            description: "If a design will not run well on your base fabric, we say so before you order. If a date is slipping, we tell you in week two, not week six.",
            Icon: FaHandshake,
            color: "#4facfe"
        }
    ];

    return (
        <section className={`ventures-showcase ventures-showcase--light`}>
            <div className="ventures-showcase__content">
                <div className="ventures-showcase__header" data-aos="fade-up">
                    <span className="ventures-showcase__subtitle">About JK Fashion</span>
                    <h2 className="ventures-showcase__title">How We Actually Operate</h2>
                    <p className="ventures-showcase__description">
                        Not a mission statement — just the three things that decide how we run an order.
                    </p>
                </div>

                <div className="ventures-showcase__grid">
                    {ventures.map((venture, index) => {
                        const IconComponent = venture.Icon;
                        return (
                            <div
                                key={index}
                                className={`ventures-showcase__card ${activeCard === index ? 'ventures-showcase__card--active' : ''}`}
                                data-aos="fade-up"
                                data-aos-delay={index * 100}
                            >
                                <div className="ventures-showcase__card-inner">
                                    <div className="ventures-showcase__icon-wrapper">
                                        <IconComponent className="ventures-showcase__icon" />
                                        <div 
                                            className="ventures-showcase__icon-bg" 
                                            style={{ background: `linear-gradient(135deg, ${venture.color}, ${venture.color}dd)` }}
                                        />
                                    </div>
                                    
                                    <div className="ventures-showcase__card-content">
                                        <h3 className="ventures-showcase__card-title">{venture.title}</h3>
                                        <p className="ventures-showcase__card-text">{venture.description}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="ventures-showcase__stats" data-aos="fade-up" data-aos-delay="300">
                    <div className="ventures-showcase__stat-item">
                        <div className="ventures-showcase__stat-number">
                            <span className="ventures-showcase__counter" data-target="50">50</span>+
                        </div>
                        <div className="ventures-showcase__stat-label">Active Projects</div>
                    </div>
                    <div className="ventures-showcase__stat-divider" />
                    <div className="ventures-showcase__stat-item">
                        <div className="ventures-showcase__stat-number">
                            <span className="ventures-showcase__counter" data-target="100">100</span>M+
                        </div>
                        <div className="ventures-showcase__stat-label">Investment Value</div>
                    </div>
                    <div className="ventures-showcase__stat-divider" />
                    <div className="ventures-showcase__stat-item">
                        <div className="ventures-showcase__stat-number">
                            <span className="ventures-showcase__counter" data-target="25">25</span>+
                        </div>
                        <div className="ventures-showcase__stat-label">Success Stories</div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AboutShowcase;
