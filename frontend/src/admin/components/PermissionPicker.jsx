import { FiLock } from 'react-icons/fi';
import { PERMISSIONS } from '../../constants/permissions.js';

/**
 * Which sections a staff account may open.
 *
 * Presentational: the parent owns the array and decides when to save, so this
 * works the same inside the create form (save on submit) and on a row (save on
 * change).
 */
export default function PermissionPicker({ value = [], onChange, disabled = false }) {
  const toggle = (id) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid gap-1.5 sm:grid-cols-2">
        {PERMISSIONS.map(({ id, label, hint, sensitive }) => {
          const checked = value.includes(id);

          return (
            <label
              key={id}
              className={`flex cursor-pointer items-start gap-2.5 rounded-xl p-2.5 transition-colors
                          ${checked ? 'bg-brand-pink/8' : 'bg-brand-ink/[0.03] hover:bg-brand-ink/[0.06]'}
                          ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => toggle(id)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-brand-pink"
              />
              <span className="min-w-0">
                <span className="flex items-center gap-1.5">
                  <span className="font-body text-[13px] font-semibold text-brand-ink">
                    {label}
                  </span>
                  {sensitive && checked ? (
                    <FiLock size={11} className="text-amber-600" aria-hidden="true" />
                  ) : null}
                </span>
                <span className="mt-0.5 block font-body text-[11px] leading-snug text-brand-ink/50">
                  {hint}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      {/*
        Staff is not on the list and cannot be granted. Said out loud, because
        an owner looking for it would otherwise assume it was an oversight.
      */}
      <p className="font-body text-[11px] leading-relaxed text-brand-ink/45">
        Staff accounts can never manage other accounts — that stays with you. Anyone given
        Settings can change how the public website looks.
      </p>
    </div>
  );
}
