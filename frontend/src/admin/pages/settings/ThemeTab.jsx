import { useEffect, useState } from 'react';
import { THEMES } from '../../../theme/themes.js';
import { useThemeStore } from '../../../theme/useThemeStore.js';
import { useHiddenThemesStore } from '../../../theme/useHiddenThemesStore.js';
import { useSettingsSave } from './useSettingsSave.js';
import SettingsStatus from './SettingsStatus.jsx';
import SaveBar from './SaveBar.jsx';

/** A small, realistic slice of the site so the palette can actually be judged. */
function ThemePreview() {
  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-black/5">
      <div
        className="flex flex-col gap-3 p-6 sm:p-8"
        style={{ background: 'var(--gradient-brand)' }}
      >
        <p
          className="font-display text-2xl font-bold sm:text-3xl"
          style={{ color: 'var(--on-primary)' }}
        >
          Fashion Beyond Limits
        </p>
        <p className="max-w-md text-sm" style={{ color: 'var(--on-primary)', opacity: 0.85 }}>
          This is how a hero section reads in the selected theme.
        </p>
      </div>

      <div className="flex flex-col gap-4 p-6" style={{ background: 'var(--surface-card)' }}>
        <p style={{ color: 'var(--text-primary)' }} className="font-body text-sm">
          Body copy sits on the page surface.{' '}
          <span style={{ color: 'var(--text-secondary)' }}>
            Secondary text steps back from it.
          </span>
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <span
            className="rounded-xl px-4 py-2 text-sm font-semibold"
            style={{ background: 'var(--brand-primary)', color: 'var(--on-primary)' }}
          >
            Primary action
          </span>
          <span
            className="rounded-xl px-4 py-2 text-sm font-semibold"
            style={{
              border: '1px solid var(--control-border)',
              color: 'var(--text-primary)',
              background: 'var(--control-surface)',
            }}
          >
            Secondary
          </span>
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              background: 'color-mix(in oklab, var(--brand-accent) 35%, transparent)',
              color: 'var(--text-primary)',
            }}
          >
            Accent chip
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ThemeTab() {
  const { themeId, saved, preview, commit, revert } = useThemeStore();
  const hidden = useHiddenThemesStore((s) => s.hidden);
  const setHidden = useHiddenThemesStore((s) => s.set);
  const { saving, error, note, setError, save } = useSettingsSave();

  const [showHidden, setShowHidden] = useState(false);
  const dirty = themeId !== saved;

  // Drop an unsaved preview on the way out, so leaving never leaves the panel
  // wearing a theme the site is not actually using.
  useEffect(() => () => useThemeStore.getState().revert(), []);

  const handleSave = () =>
    save(
      { themeId },
      {
        message: 'Theme saved',
        onSuccess: (data) => commit(data?.themeId ?? themeId),
        onError: revert,
      }
    );

  /**
   * Hiding and restoring save immediately rather than joining the Save bar:
   * they are list edits, not previews — there is nothing to look at before
   * committing.
   */
  const setHiddenList = async (next, message) => {
    const before = hidden;
    setHidden(next); // optimistic — the grid should respond to the click at once
    setError('');
    try {
      const data = await save({ hiddenThemeIds: next }, { message });
      if (data) setHidden(data.hiddenThemeIds ?? next);
      else setHidden(before);
    } catch {
      setHidden(before);
    }
  };

  const hideTheme = (id) => setHiddenList([...hidden, id], 'Theme hidden');
  const restoreTheme = (id) =>
    setHiddenList(hidden.filter((h) => h !== id), 'Theme restored');

  const visible = THEMES.filter((t) => !hidden.includes(t.id));
  const hiddenList = THEMES.filter((t) => hidden.includes(t.id));

  return (
    <div className="flex flex-col gap-5">
      <SettingsStatus note={note} error={error} />

      <ThemePreview />

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-brand-ink">
            Themes{' '}
            <span className="font-body text-sm font-normal text-brand-ink/45">
              ({visible.length})
            </span>
          </h2>

          {hiddenList.length ? (
            <button
              type="button"
              onClick={() => setShowHidden((v) => !v)}
              aria-expanded={showHidden}
              className="rounded-lg px-2.5 py-1.5 text-sm font-semibold text-brand-ink/60
                         transition-colors hover:bg-brand-ink/5 focus-visible:outline-2
                         focus-visible:outline-offset-2 focus-visible:outline-brand-pink"
            >
              {showHidden ? 'Hide' : 'Show'} hidden ({hiddenList.length})
            </button>
          ) : null}
        </div>

        <div
          role="radiogroup"
          aria-label="Site colour theme"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {visible.map((t) => {
            const active = t.id === themeId;
            return (
              /* A plain <div>, not a nested button: the radio and the hide
                 control are two separate actions, and a button inside a button
                 is invalid HTML that browsers resolve unpredictably. */
              <div
                key={t.id}
                className={`group relative flex items-center rounded-2xl bg-surface-card transition
                            ${active ? 'ring-2 ring-brand-pink' : 'ring-1 ring-black/5'}`}
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => preview(t.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl p-3 text-left
                             transition focus-visible:outline-2 focus-visible:outline-offset-2
                             focus-visible:outline-brand-pink"
                >
                  {/* Data-driven hexes — inline style is the correct tool here,
                      utilities cannot express arbitrary runtime values. */}
                  <span className="flex shrink-0 overflow-hidden rounded-lg ring-1 ring-black/10">
                    {['primary', 'secondary', 'accent', 'ink'].map((role) => (
                      <span key={role} className="h-9 w-4" style={{ background: t.colors[role] }} />
                    ))}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-brand-ink">
                      {t.name}
                    </span>
                    <span className="block text-xs text-brand-ink/45">
                      {t.scheme === 'dark' ? 'Dark' : 'Light'}
                    </span>
                  </span>

                  {active ? <span aria-hidden className="text-brand-pink">✓</span> : null}
                </button>

                {/* The active theme has no hide control: the API refuses to hide
                    the theme the site is wearing, so offering it would be
                    offering a guaranteed error. */}
                {active ? null : (
                  <button
                    type="button"
                    onClick={() => hideTheme(t.id)}
                    aria-label={`Hide ${t.name}`}
                    title={`Hide ${t.name}`}
                    className="mr-2 grid h-8 w-8 shrink-0 place-items-center rounded-lg
                               text-brand-ink/30 opacity-0 transition
                               hover:bg-rose-50 hover:text-rose-600
                               focus-visible:opacity-100 focus-visible:outline-2
                               focus-visible:outline-offset-2 focus-visible:outline-brand-pink
                               group-hover:opacity-100 max-sm:opacity-100"
                  >
                    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
                      <path
                        d="M6 6l8 8M14 6l-8 8"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {showHidden && hiddenList.length ? (
          <div className="mt-4 rounded-2xl bg-brand-ink/[0.03] p-4">
            <p className="mb-3 text-sm font-semibold text-brand-ink/70">
              Hidden themes{' '}
              <span className="font-normal text-brand-ink/45">
                — not offered in the picker. Restore to bring one back.
              </span>
            </p>

            <ul className="flex flex-wrap gap-2">
              {hiddenList.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => restoreTheme(t.id)}
                    className="flex items-center gap-2 rounded-xl bg-surface-card py-1.5 pl-1.5 pr-3
                               text-sm ring-1 ring-black/5 transition hover:ring-2
                               hover:ring-brand-pink/30 focus-visible:outline-2
                               focus-visible:outline-offset-2 focus-visible:outline-brand-pink"
                  >
                    <span className="flex shrink-0 overflow-hidden rounded-md ring-1 ring-black/10">
                      {['primary', 'secondary'].map((role) => (
                        <span
                          key={role}
                          className="h-5 w-2.5"
                          style={{ background: t.colors[role] }}
                        />
                      ))}
                    </span>
                    <span className="font-medium text-brand-ink/70">{t.name}</span>
                    <span aria-hidden className="text-brand-pink">↩</span>
                    <span className="sr-only">Restore</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
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
                {THEMES.find((t) => t.id === themeId)?.name}
              </span>
            </>
          }
        />
      ) : null}
    </div>
  );
}
