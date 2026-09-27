import { REPEAT_PRESETS, inputClass, normalizeRepeat } from './constants.js';

/**
 * The Repeat field: typed the way the floor writes it — "8/4" — with the
 * common repeats as one-tap buttons underneath, so a phone keyboard's hidden
 * slash is never in the way.
 *
 * Tidied on blur rather than on every keystroke ("8//4" → "8/4"), so the
 * field never rewrites what someone is still typing. The API tidies it again.
 */
export default function RepeatInput({ id, value, onChange, invalid }) {
  const current = normalizeRepeat(value);

  return (
    <div className="flex flex-col gap-2">
      <input
        id={id}
        type="text"
        inputMode="text"
        autoComplete="off"
        placeholder="8/4"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onChange(normalizeRepeat(e.target.value))}
        // A number, optionally over another: 8/4, 16/4, or an older 13.5.
        pattern="\s*\d+(\.\d+)?\s*(\/+\s*\d+(\.\d+)?)?\s*"
        title="Write the repeat like 8/4"
        className={`${inputClass} ${invalid ? 'ring-rose-300' : ''}`}
      />
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Common repeats">
        {REPEAT_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            aria-pressed={current === preset}
            className={`rounded-lg px-2.5 py-1 font-body text-xs font-semibold transition-colors ${
              current === preset
                ? 'bg-brand-pink text-on-primary'
                : 'text-brand-ink/60 ring-1 ring-brand-ink/12 hover:bg-brand-ink/5'
            }`}
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
}
