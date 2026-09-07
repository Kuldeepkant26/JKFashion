import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        // Scroll window to top
        window.scrollTo(0, 0);
        
        // Also scroll any custom scroll containers (for desktop scroll stack)
        const homeScrollElement = document.querySelector('.home-page');
        const residentialScrollElement = document.querySelector('.interior-design-page');
        
        if (homeScrollElement) {
            homeScrollElement.scrollTo(0, 0);
        }
        if (residentialScrollElement) {
            residentialScrollElement.scrollTo(0, 0);
        }
    }, [pathname]);

    return null;
};

export default ScrollToTop;
