import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { bootstrapTheme } from './theme/applyTheme.js'

// Before createRoot, so the remembered palette is on <html> by the time
// anything paints. Deferring this to a component would show the default theme
// for a frame first, then repaint.
bootstrapTheme()

// Initialize AOS
AOS.init({
  duration: 800,
  offset: 100,
  easing: 'ease-in-out',
  once: true,
  mirror: false,
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
