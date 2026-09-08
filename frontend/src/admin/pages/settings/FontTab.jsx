import { useEffect } from 'react';
import { FONT_PAIRINGS } from '../../../theme/fonts.js';
import { useFontStore } from '../../../theme/useFontStore.js';
import { preloadSpecimenFonts } from '../../../theme/applyFont.js';
import { useSettingsSave } from './useSettingsSave.js';
import SettingsStatus from './SettingsStatus.jsx';
import SaveBar from './SaveBar.jsx';

/**
 * Exercises both font roles: the display face only shows its character at
 * heading sizes, and a pairing that looks fine in a specimen line can still
 * read badly as body copy.
 */
function TypePreview() {
  return (
    <div
      className="flex flex-col gap-4 rounded-2xl p-6 ring-1 ring-black/5 sm:p-8"
      style={{ background: 'var(--surface-card)' }}
    >
      <p
        className="font-display text-3xl font-bold leading-tight sm:text-4xl"
        style={{ color: 'var(--text-primary)' }}
      >
        Schiffli Embroidery &amp; Lace
      </p>
      <p
        className="max-w-2xl font-body text-[15px] leading-relaxed"
        style={{ color: 'var(--text-secondary)' }}
      >
        Continuous-width embroidery run for repeat accuracy across full yardage — sampled to
        your reference, then held to that standard through bulk. This is how body copy reads
        in the selected pairing.
      </p>
    </div>
  );
}

export default function FontTab() {
  const { fontId, saved, preview, commit, revert } = useFontStore();
  const { saving, error, note, save } = useSettingsSave();

  const dirty = fontId !== saved;

  /*
   * Fetch every pairing's faces so each card can be shown in its own typeface.
   * Without it the browser only holds the ACTIVE pairing's fonts and the other
   * cards fall back to a generic serif, making the grid look uniform.
   */
  useEffect(() => {
    preloadSpecimenFonts(FONT_PAIRINGS);
  }, []);

  useEffect(() => () => useFontStore.getState().revert(), []);

  const handleSave = () =>
    save(
      { fontId },
      {
        message: 'Typography saved',
        onSuccess: (data) => commit(data?.fontId ?? fontId),
        onError: revert,
      }
    );

  return (
    <div className="flex flex-col gap-5">
      <SettingsStatus note={note} error={error} />

      <TypePreview />

      <div>
        <h2 className="mb-1 font-display text-lg font-bold text-brand-ink">Font pairing</h2>
        <p className="mb-3 text-sm text-brand-ink/55">
          One pairing for everything — headings and body text, across the website and this
          admin panel.
        </p>

        <div
          role="radiogroup"
          aria-label="Site typography"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {FONT_PAIRINGS.map((f) => {
            const active = f.id === fontId;
            return (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => preview(f.id)}
                className={`flex flex-col gap-1 rounded-2xl bg-surface-card p-4 text-left transition
                            hover:ring-2 hover:ring-brand-pink/30 focus-visible:outline-2
                            focus-visible:outline-offset-2 focus-visible:outline-brand-pink
                            ${active ? 'ring-2 ring-brand-pink' : 'ring-1 ring-black/5'}`}
              >
                {/* Specimen rendered in the pairing's OWN faces rather than the
                    active one, so the grid can be compared at a glance. */}
                <span className="flex items-baseline justify-between gap-2">
                  <span
                    className="truncate text-lg font-bold text-brand-ink"
                    style={{ fontFamily: f.display }}
                  >
                    {f.name}
                  </span>
                  {active ? (
                    <span aria-hidden className="shrink-0 text-brand-pink">✓</span>
                  ) : null}
                </span>

                <span className="text-sm text-brand-ink/70" style={{ fontFamily: f.body }}>
                  Schiffli embroidery &amp; lace — 1234
                </span>

                <span className="mt-1 text-xs text-brand-ink/45">{f.note}</span>
              </button>
            );
          })}
        </div>
      </div>

      {dirty ? (
        <SaveBar
          saving={saving}
          onDiscard={revert}
          onSave={handleSave}
          summary={
            <>
              Previewing{' '}
              <span className="font-semibold text-brand-ink">
                {FONT_PAIRINGS.find((f) => f.id === fontId)?.name}
              </span>
            </>
          }
        />
      ) : null}
    </div>
  );
}
