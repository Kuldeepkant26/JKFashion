import { useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { FABRIC_FIELDS, MAX_FABRIC_ROWS, fabricRow, inputClass, labelClass } from './constants.js';

/**
 * Fabric & yarn as rows — one per fabric the design is made on. Used by the
 * sample form and the order form alike, so the two stay the same.
 *
 * Styled like every other section of those forms: the same labels, inputs and
 * spacing. A single row looks exactly like the old four-field line. With more,
 * the rows line up under one set of column labels on wide screens; on narrow
 * ones each row keeps its own labels, separated by a hairline.
 *
 * A row left blank is not saved (see fabricRowsForSave). A newly added row
 * takes the cursor, so adding one and typing is one motion.
 */
export default function FabricRows({ rows, onChange, error, disabled }) {
  const [added, setAdded] = useState(null);
  const several = rows.length > 1;

  const update = (key, name, value) =>
    onChange(rows.map((row) => (row.key === key ? { ...row, [name]: value } : row)));

  const add = () => {
    const row = fabricRow();
    setAdded(row.key);
    onChange([...rows, row]);
  };

  const remove = (key) => onChange(rows.filter((row) => row.key !== key));

  return (
    <div className="flex flex-col gap-3">
      <ol className="flex flex-col gap-4 lg:gap-3">
        {rows.map((row, i) => (
          <li
            key={row.key}
            className={`flex items-end gap-2 ${
              i ? 'border-t border-brand-ink/8 pt-4 lg:border-0 lg:pt-0' : ''
            }`}
          >
            <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {FABRIC_FIELDS.map((f, j) => (
                // justify-end keeps the boxes level if a label wraps.
                <label key={f.name} className="flex min-w-0 flex-col justify-end gap-1.5">
                  {/* Shown once, as column labels, when the rows line up. */}
                  <span className={`${labelClass} ${i ? 'lg:sr-only' : ''}`}>{f.label}</span>
                  <input
                    type="text"
                    value={row[f.name]}
                    onChange={(e) => update(row.key, f.name, e.target.value)}
                    placeholder={f.placeholder}
                    maxLength={f.maxLength}
                    disabled={disabled}
                    autoFocus={j === 0 && row.key === added}
                    className={inputClass}
                  />
                </label>
              ))}
            </div>

            {several ? (
              <button
                type="button"
                onClick={() => remove(row.key)}
                disabled={disabled}
                aria-label={`Remove fabric ${i + 1}`}
                title="Remove this fabric"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-brand-ink/45
                           ring-1 ring-brand-ink/12 transition-colors hover:bg-rose-50
                           hover:text-rose-700 disabled:opacity-40"
              >
                <FiTrash2 aria-hidden size={15} />
              </button>
            ) : null}
          </li>
        ))}
      </ol>

      {error ? <p className="text-xs text-rose-600">{error}</p> : null}

      <button
        type="button"
        onClick={add}
        disabled={disabled || rows.length >= MAX_FABRIC_ROWS}
        className="inline-flex items-center gap-1.5 self-start rounded-xl px-3 py-2 font-body text-xs
                   font-semibold text-brand-ink/70 ring-1 ring-brand-ink/12 transition-colors
                   hover:bg-brand-ink/5 disabled:opacity-40"
      >
        <FiPlus aria-hidden /> Add another fabric
      </button>
    </div>
  );
}
