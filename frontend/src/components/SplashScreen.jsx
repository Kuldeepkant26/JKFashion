import React from 'react'
import '../css/SplashScreen.css'

/**
 * Splash screen: a logo-completion animation.
 *
 * Sequence (total ~2.6s):
 *   0.15s  pink brushstroke sweeps in left-to-right (clip-path wipe)
 *   0.95s  "JK" monogram draws on, stroke by stroke
 *   1.70s  "FASHION" letterspacing settles in
 *   2.20s  whole lockup breathes once, then the screen lifts away
 *
 * The mark is rebuilt as SVG rather than shown as a flat PNG so the
 * brushstroke can paint itself on and the script can draw — that is what
 * makes it read as the logo *completing* rather than merely appearing.
 */
const SplashScreen = ({ exiting = false }) => {
  return (
    <div
      className={`splash ${exiting ? 'splash--exit' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="JK Fashion"
    >
      <div className="splash__stage">
        <svg
          className="splash__mark"
          viewBox="0 0 720 360"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            {/* Pink gradient along the brush sweep */}
            <linearGradient id="jkBrush" x1="60" y1="240" x2="660" y2="130"
                            gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor="#F4207E" />
              <stop offset="30%"  stopColor="#FF3D96" />
              <stop offset="65%"  stopColor="#FF57A8" />
              <stop offset="100%" stopColor="#FF87C2" />
            </linearGradient>

            {/* Soft bloom around the stroke, mirroring the logo's glow */}
            <filter id="jkGlow" x="-35%" y="-80%" width="170%" height="260%">
              <feGaussianBlur stdDeviation="18" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Ragged dry-brush edge — bristle streaks along the sweep */}
            <filter id="jkBristle" x="-12%" y="-55%" width="124%" height="210%">
              <feTurbulence type="fractalNoise" baseFrequency="0.014 0.42"
                            numOctaves="4" seed="11" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="26"
                                 xChannelSelector="R" yChannelSelector="G" />
            </filter>

            {/* Left-to-right reveal for the brush */}
            <clipPath id="jkWipe">
              <rect className="splash__wipe" x="0" y="0" width="720" height="360" />
            </clipPath>
          </defs>

          {/* ---- 1. the pink brushstroke ---- */}
          <g clipPath="url(#jkWipe)" filter="url(#jkGlow)">
            <path
              className="splash__brush"
              d="M44 268 C 150 236, 268 206, 384 180 C 486 157, 578 140, 676 118
                 L 668 196 C 566 220, 474 240, 372 262 C 258 287, 150 310, 52 330 Z"
              fill="url(#jkBrush)"
              filter="url(#jkBristle)"
            />
          </g>

          {/* ---- 2. the JK monogram, drawn on ---- */}
          <g
            className="splash__script"
            stroke="#080808"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          >
            {/* J — long descending bowl hooking left into a loop */}
            <path
              className="splash__stroke splash__stroke--1"
              d="M330 62 C 312 132, 292 206, 272 262 C 254 314, 210 332, 184 312
                 C 164 296, 172 268, 200 268"
              strokeWidth="13"
            />
            {/* J — crossbar flourish sweeping right */}
            <path
              className="splash__stroke splash__stroke--2"
              d="M244 158 C 292 142, 350 134, 402 140"
              strokeWidth="10"
            />
            {/* K — spine */}
            <path
              className="splash__stroke splash__stroke--3"
              d="M438 58 C 424 132, 408 208, 392 276"
              strokeWidth="13"
            />
            {/* K — upper arm reaching up and out */}
            <path
              className="splash__stroke splash__stroke--4"
              d="M548 74 C 500 122, 452 160, 408 184"
              strokeWidth="11"
            />
            {/* K — lower leg kicking out to the right */}
            <path
              className="splash__stroke splash__stroke--5"
              d="M414 180 C 448 208, 486 244, 520 288"
              strokeWidth="11"
            />
          </g>
        </svg>

        {/* ---- 3. the wordmark ---- */}
        <div className="splash__wordmark" aria-hidden="true">
          <span className="splash__brandname">JK</span>
          <span className="splash__brandword">Fashion</span>
        </div>
      </div>
    </div>
  )
}

export default SplashScreen
