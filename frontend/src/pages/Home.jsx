import React, { useState, useEffect } from 'react';
import '../css/Home.css';
import Footer from '../components/Footer';
import MobileDev from '../components/MobileDev';
import HowWeWork from '../components/HowWeWork';
import RackGallery from '../components/RackGallery';
import CloseUpGallery from '../components/CloseUpGallery.jsx';
import SiteHero from '../components/heroes/index.jsx';
import EnquirySection from '../components/EnquirySection.jsx';

/**
 * The site, in one page.
 *
 * Every destination in the navbar is a section below rather than a route, so
 * the order here is the order a visitor reads: what we make, the work itself,
 * how it is made, then how to get in touch.
 */
const Home = () => {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    return (
        <div className="home-page">
            {/* Section 1 - Hero. The layout is chosen in the admin panel;
                SiteHero resolves that id to a component. */}
            <div className="home-section home-section-1" style={{ zIndex: 1 }}>
                <div className={`home-container ${isLoaded ? 'loaded' : ''}`}>
                    <SiteHero />
                </div>
            </div>

            {/* Section 2 - Content */}
            <div className="home-section home-section-2" style={{ zIndex: 2 }}>
                <div className={`home-container ${isLoaded ? 'loaded' : ''}`}>
                    <MobileDev></MobileDev>

                    {/* Rack Gallery — the navbar's "Gallery" scrolls here. */}
                    <RackGallery />
                    {/* No heading of its own — it reads as the lower half of
                        the Look Closer section above. */}
                    <CloseUpGallery />

                    {/* The navbar's "Our Process" scrolls here. */}
                    <HowWeWork />

                    {/* Last block before the footer — the Enquire buttons in
                        every navbar scroll here. */}
                    <EnquirySection />
                </div>
                <Footer />
            </div>
        </div>
    );
};

export default Home;
