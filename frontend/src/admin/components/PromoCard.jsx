import { company } from '../../data/site.js';

/**
 * The card in the top-right of the dashboard. In the reference design this is
 * an upgrade prompt; here it is a live-site link, which is the thing an admin
 * actually reaches for from this screen.
 */
export default function PromoCard() {
  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br
                 from-brand-pink-soft/35 via-admin-sidebar to-admin-cream p-6
                 ring-1 ring-black/5"
    >
      {/* Decorative arcs echoing the logo's brushstroke. */}
      <svg
        viewBox="0 0 200 120"
        className="pointer-events-none absolute -right-6 -top-6 h-40 w-64 opacity-70"
        aria-hidden="true"
      >
        <path d="M60 110a70 70 0 0 1 120-50" fill="none" stroke="#FF87C2" strokeWidth="10" strokeLinecap="round" />
        <path d="M85 118a52 52 0 0 1 88-38" fill="none" stroke="#FF2E93" strokeWidth="10" strokeLinecap="round" />
        <path d="M110 126a34 34 0 0 1 58-26" fill="none" stroke="#0A0A0A" strokeWidth="10" strokeLinecap="round" />
      </svg>

      <div className="relative max-w-[62%]">
        <h2 className="font-display text-xl font-bold leading-snug text-brand-ink">
          <span className="text-brand-pink-dark">View</span> your live site
        </h2>
        <p className="mt-1.5 font-body text-sm text-brand-ink/60">
          See {company.name} as your buyers do
        </p>

        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-pink px-4 py-2
                     font-body text-sm font-semibold text-white transition-colors
                     hover:bg-brand-pink-dark focus-visible:outline-2
                     focus-visible:outline-offset-2 focus-visible:outline-brand-pink"
        >
          Open site
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden="true">
            <path
              d="M5 15 15 5m0 0H7m8 0v8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>
    </div>
  );
}
