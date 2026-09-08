import { useEffect } from 'react';
import { NAVBAR_VARIANTS, HERO_VARIANTS } from '../../../theme/layouts.js';
import { useLayoutStore } from '../../../theme/useLayoutStore.js';
import { useSettingsSave } from './useSettingsSave.js';
import SettingsStatus from './SettingsStatus.jsx';
import SaveBar from './SaveBar.jsx';

/**
 * Schematic thumbnails.
 *
 * Deliberately abstract rather than a live render: a real iframe of the site
 * per card would be sixteen page loads, and at thumbnail scale the actual
 * layout is unreadable anyway. What matters is the ARRANGEMENT — where the
 * logo sits, where the type sits, where the artwork sits — which a diagram
 * carries better than a shrunken screenshot.
 */
const Bar = ({ className = '', style }) => (
  <span className={`block rounded-[2px] ${className}`} style={style} />
);

const ink = (o) => ({ background: `color-mix(in oklab, var(--brand-ink) ${o}%, transparent)` });
const brand = { background: 'var(--brand-primary)' };

const NAVBAR_THUMBS = {
  'floating-pill': (
    <div className="flex h-full items-start justify-center pt-3">
      <div
        className="flex w-[86%] items-center justify-between rounded-full px-2 py-1.5 shadow-sm"
        style={{ background: 'var(--surface-card)' }}
      >
        <Bar className="h-1.5 w-5" style={brand} />
        <span className="flex gap-1">
          <Bar className="h-1 w-3" style={ink(30)} />
          <Bar className="h-1 w-3" style={ink(30)} />
          <Bar className="h-1 w-3" style={ink(30)} />
        </span>
        <Bar className="h-2 w-5 rounded-full" style={brand} />
      </div>
    </div>
  ),
  'minimal-rule': (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-3 pt-4">
        <Bar className="h-1.5 w-5" style={brand} />
        <span className="flex gap-2.5">
          <Bar className="h-1 w-3.5" style={ink(30)} />
          <Bar className="h-1 w-3.5" style={ink(30)} />
          <Bar className="h-1 w-3.5" style={ink(30)} />
        </span>
      </div>
      <Bar className="mx-3 mt-3 h-px" style={ink(14)} />
    </div>
  ),
  'centered-logo': (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-3 items-center px-3 pt-4">
        <span className="flex justify-end gap-2">
          <Bar className="h-1 w-3.5" style={ink(30)} />
        </span>
        <span className="flex justify-center">
          <Bar className="h-2.5 w-7" style={brand} />
        </span>
        <span className="flex justify-start gap-2">
          <Bar className="h-1 w-3.5" style={ink(30)} />
          <Bar className="h-1 w-3.5" style={ink(30)} />
        </span>
      </div>
      <Bar className="mx-3 mt-3 h-px" style={ink(12)} />
    </div>
  ),
  'edge-bar': (
    <div className="flex h-full flex-col">
      <Bar className="h-2.5 w-full rounded-none" style={{ background: 'var(--brand-secondary)' }} />
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ background: 'var(--surface-card)' }}
      >
        <Bar className="h-1.5 w-5" style={brand} />
        <span className="flex gap-2">
          <Bar className="h-1 w-3" style={ink(30)} />
          <Bar className="h-1 w-3" style={ink(30)} />
        </span>
        <Bar className="h-2 w-5 rounded-none" style={brand} />
      </div>
    </div>
  ),
};

const HERO_THUMBS = {
  'classic-split': (
    <div className="grid h-full grid-cols-2 items-center gap-2 px-3">
      <span className="flex flex-col gap-1.5">
        <Bar className="h-1 w-6" style={brand} />
        <Bar className="h-2.5 w-full" style={ink(55)} />
        <Bar className="h-1 w-11/12" style={ink(20)} />
        <Bar className="mt-1 h-2 w-8 rounded-full" style={brand} />
      </span>
      <span className="flex h-[72%] items-end justify-center">
        <Bar className="h-full w-8 rounded-t-full" style={ink(22)} />
      </span>
    </div>
  ),
  'centre-stage': (
    <div className="flex h-full flex-col items-center gap-1.5 px-4 pt-4">
      <Bar className="h-1 w-5" style={brand} />
      <Bar className="h-2.5 w-3/4" style={ink(55)} />
      <Bar className="h-1 w-2/3" style={ink(20)} />
      <Bar className="mt-0.5 h-2 w-8 rounded-full" style={brand} />
      <Bar className="mt-1 h-6 w-9 rounded-t-full" style={ink(22)} />
    </div>
  ),
  'full-bleed': (
    <div
      className="relative flex h-full items-center px-3"
      style={{
        background:
          'linear-gradient(115deg, color-mix(in oklab, var(--brand-accent) 30%, var(--surface-card)) 0%, var(--surface-card) 100%)',
      }}
    >
      <span className="absolute bottom-0 right-3 h-[78%] w-9 rounded-t-full" style={ink(20)} />
      <span className="relative flex flex-col gap-1.5">
        <Bar className="h-1 w-5" style={brand} />
        <Bar className="h-2.5 w-16" style={ink(60)} />
        <Bar className="h-1 w-12" style={ink(22)} />
      </span>
    </div>
  ),
  editorial: (
    <div className="relative flex h-full items-center px-3">
      <span className="absolute bottom-0 right-2 h-[82%] w-10 rounded-t-full" style={ink(16)} />
      <span className="relative flex flex-col gap-1.5">
        <span className="flex items-center gap-1">
          <Bar className="h-px w-4" style={brand} />
          <Bar className="h-1 w-6" style={brand} />
        </span>
        <Bar className="h-4 w-20" style={ink(60)} />
        <Bar className="h-1 w-14" style={ink(20)} />
      </span>
    </div>
  ),
};

/** One picker, used for both rows — they differ only in their data. */
function VariantGrid({ label, variants, thumbs, selected, onSelect }) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      {variants.map((v) => {
        const active = v.id === selected;
        return (
          <button
            key={v.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onSelect(v.id)}
            className={`flex flex-col overflow-hidden rounded-2xl bg-surface-card text-left
                        transition hover:ring-2 hover:ring-brand-pink/30 focus-visible:outline-2
                        focus-visible:outline-offset-2 focus-visible:outline-brand-pink
                        ${active ? 'ring-2 ring-brand-pink' : 'ring-1 ring-black/5'}`}
          >
            <span
              className="block h-24 w-full overflow-hidden border-b border-black/5"
              style={{ background: 'var(--surface-primary)' }}
              aria-hidden
            >
              {thumbs[v.id]}
            </span>

            <span className="flex flex-1 flex-col gap-1 p-3">
              <span className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-brand-ink">{v.name}</span>
                {active ? <span aria-hidden className="text-brand-pink">✓</span> : null}
              </span>
              <span className="text-xs leading-snug text-brand-ink/45">{v.note}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function LayoutTab() {
  const {
    navbarId, heroId, savedNavbarId, savedHeroId,
    previewNavbar, previewHero, commitNavbar, commitHero, revert,
  } = useLayoutStore();
  const { saving, error, note, save } = useSettingsSave();

  const dirty = navbarId !== savedNavbarId || heroId !== savedHeroId;

  useEffect(() => () => useLayoutStore.getState().revert(), []);

  const handleSave = () =>
    save(
      { navbarId, heroId },
      {
        message: 'Layout saved',
        onSuccess: (data) => {
          commitNavbar(data?.navbarId ?? navbarId);
          commitHero(data?.heroId ?? heroId);
        },
        onError: revert,
      }
    );

  return (
    <div className="flex flex-col gap-6">
      <SettingsStatus note={note} error={error} />

      <p className="rounded-xl bg-brand-pink/8 px-4 py-3 text-sm text-brand-ink/70">
        These change the public website. Save, then open the site in a new tab to see them —
        the admin panel keeps its own chrome.
      </p>

      <div>
        <h2 className="mb-1 font-display text-lg font-bold text-brand-ink">Navigation bar</h2>
        <p className="mb-3 text-sm text-brand-ink/55">
          Every option carries the same links and the same full-screen menu on phones.
        </p>
        <VariantGrid
          label="Navbar layout"
          variants={NAVBAR_VARIANTS}
          thumbs={NAVBAR_THUMBS}
          selected={navbarId}
          onSelect={previewNavbar}
        />
      </div>

      <div>
        <h2 className="mb-1 font-display text-lg font-bold text-brand-ink">Hero section</h2>
        <p className="mb-3 text-sm text-brand-ink/55">
          The first screen of the home page. All four use the same copy and artwork.
        </p>
        <VariantGrid
          label="Hero layout"
          variants={HERO_VARIANTS}
          thumbs={HERO_THUMBS}
          selected={heroId}
          onSelect={previewHero}
        />
      </div>

      {dirty ? (
        <SaveBar
          saving={saving}
          onDiscard={revert}
          onSave={handleSave}
          summary={
            <>
              <span className="font-semibold text-brand-ink">
                {NAVBAR_VARIANTS.find((v) => v.id === navbarId)?.name}
              </span>
              {' · '}
              <span className="font-semibold text-brand-ink">
                {HERO_VARIANTS.find((v) => v.id === heroId)?.name}
              </span>
            </>
          }
        />
      ) : null}
    </div>
  );
}
