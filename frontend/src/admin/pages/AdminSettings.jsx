import { useEffect, useState } from 'react';
import { THEMES } from '../../theme/themes.js';
import { useThemeStore } from '../../theme/useThemeStore.js';
import { useAppStore } from '../../store/useAppStore.js';
import * as themeApi from '../../api/theme.api.js';
import EmptyState from '../components/EmptyState.jsx';

/** Mirrors ROLES.MAIN_ADMIN on the API — the seeded owner. */
const MAIN_ADMIN = 'MAIN_ADMIN';

/** A small, realistic slice of the site so the choice can actually be judged. */
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

export default function AdminSettings() {
  const user = useAppStore((s) => s.user);
  const { themeId, saved, preview, commit, revert } = useThemeStore();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedNote, setSavedNote] = useState(false);

  const isOwner = user?.role === MAIN_ADMIN;
  const dirty = themeId !== saved;

  // Drop an unsaved preview on the way out, so leaving the page never leaves
  // the panel wearing a theme the site is not actually using.
  useEffect(() => () => useThemeStore.getState().revert(), []);

  if (!isOwner) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="font-display text-3xl font-bold tracking-tight text-brand-ink sm:text-4xl">
          Settings
        </h1>
        <EmptyState
          className="min-h-[50vh] bg-white"
          icon="🔒"
          title="Owner access only"
          hint="Only the main administrator can change the site theme."
        />
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const data = await themeApi.update(themeId);
      commit(data?.themeId ?? themeId);
      setSavedNote(true);
      setTimeout(() => setSavedNote(false), 2500);
    } catch (err) {
      // Revert the preview: leaving it applied after a failed save would show
      // a theme the site is not actually serving.
      revert();
      setError(err?.message ?? 'Could not save the theme. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-brand-ink sm:text-4xl">
            Settings
          </h1>
          <p className="mt-1 text-sm text-brand-ink/55">
            Choose the colour theme for the public website.
          </p>
        </div>

        {savedNote ? (
          <p role="status" className="text-sm font-semibold text-emerald-600">
            Theme saved
          </p>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <ThemePreview />

      <div>
        <h2 className="mb-3 font-display text-lg font-bold text-brand-ink">
          Themes <span className="font-body text-sm font-normal text-brand-ink/45">
            ({THEMES.length})
          </span>
        </h2>

        <div
          role="radiogroup"
          aria-label="Site colour theme"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {THEMES.map((t) => {
            const active = t.id === themeId;
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => preview(t.id)}
                className={`flex items-center gap-3 rounded-2xl bg-white p-3 text-left transition
                            hover:ring-2 hover:ring-brand-pink/30 focus-visible:outline-2
                            focus-visible:outline-offset-2 focus-visible:outline-brand-pink
                            ${active ? 'ring-2 ring-brand-pink' : 'ring-1 ring-black/5'}`}
              >
                {/* Data-driven hexes — inline style is the correct tool here,
                    utilities cannot express arbitrary runtime values. */}
                <span className="flex shrink-0 overflow-hidden rounded-lg ring-1 ring-black/10">
                  {['primary', 'secondary', 'accent', 'ink'].map((role) => (
                    <span
                      key={role}
                      className="h-9 w-4"
                      style={{ background: t.colors[role] }}
                    />
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

                {active ? (
                  <span aria-hidden className="text-brand-pink">✓</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {dirty ? (
        <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3
                        rounded-2xl bg-white p-4 shadow-lg ring-1 ring-black/5">
          <p className="text-sm text-brand-ink/70">
            Previewing <span className="font-semibold text-brand-ink">
              {THEMES.find((t) => t.id === themeId)?.name}
            </span> — not yet live.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={revert}
              disabled={saving}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-brand-ink/70
                         ring-1 ring-brand-ink/12 transition-colors hover:bg-brand-ink/5
                         disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-brand-pink px-5 py-2.5 text-sm font-semibold text-white
                         transition-colors hover:bg-brand-pink-dark
                         focus-visible:outline-2 focus-visible:outline-offset-2
                         focus-visible:outline-brand-pink disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save theme'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
