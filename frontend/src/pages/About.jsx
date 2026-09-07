import React, { useRef } from 'react';
import '../css/About.css';
import Footer from '../components/Footer';
import CardSwap, { Card } from '../component/CardSwap';
import AboutShowcase from '../components/AboutShowcase';
import CreativeJourney from '../components/CreativeJourney';
import SignatureProjects from '../components/SignatureProjects';
import ImmersiveVision from '../components/ImmersiveVision';
import { gallery as galleryImgs } from '../data/images';

const About = () => {
    const heroRef = useRef(null);
    const showcaseRef = useRef(null);

    const heroImages = [galleryImgs[0], galleryImgs[1], galleryImgs[4]];



    return (
        <div className={`ventures-page ventures-page--light`}>
            <section
                ref={heroRef}
                className={`ventures-page__hero-section ventures-page__hero-section--light`}
            >
                <div className="ventures-page__hero-container">
                    <div className="ventures-page__hero-left">
                        <CardSwap
                            cardDistance={60}
                            verticalDistance={70}
                            delay={5000}
                            pauseOnHover={false}
                        >
                            {heroImages.map((src, idx) => (
                                <Card key={idx}>
                                    <div className="ventures-page__card">
                                        <img src={src} alt={`Embroidery work sample ${idx + 1}`} className="ventures-page__card-image" />
                                    </div>
                                </Card>
                            ))}
                        </CardSwap>
                    </div>

                    <div className="ventures-page__hero-right">
                        <div className="ventures-page__hero-content">
                            <h1 className="ventures-page__hero-title">
                                Thread, Needle,
                                <span className="ventures-page__hero-title-gradient"> and a Steady Hand</span>
                            </h1>
                            <p className="ventures-page__hero-description">
                                JK Fashion makes schiffli embroidered fabrics and laces for people who resell them under their own name. That means our work has to be right before it leaves us — there is no second inspection downstream, only a buyer who either reorders or does not.
                            </p>

                            <div className="ventures-page__hero-stats">
                                <div className="ventures-page__stat-item">
                                    <div className="ventures-page__stat-number">500+</div>
                                    <div className="ventures-page__stat-label">Designs On File</div>
                                </div>
                                <div className="ventures-page__stat-item">
                                    <div className="ventures-page__stat-number">2M+</div>
                                    <div className="ventures-page__stat-label">Stitches Per Day</div>
                                </div>
                                <div className="ventures-page__stat-item">
                                    <div className="ventures-page__stat-number">25+</div>
                                    <div className="ventures-page__stat-label">Years in Embroidery</div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </section>

            <div ref={showcaseRef}>
                <AboutShowcase />
            </div>

            <CreativeJourney />

            <SignatureProjects />

            <ImmersiveVision />

            <Footer />
        </div>
    );
};

export default About;
