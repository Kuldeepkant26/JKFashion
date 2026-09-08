import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { bootstrapTheme } from './theme/applyTheme.js'
import { bootstrapFont } from './theme/applyFont.js'

// Before createRoot, so the remembered palette and typeface are on <html> by
// the time anything paints. Deferring either to a component would show the
// default for a frame first, then repaint.
bootstrapTheme()
bootstrapFont()

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
