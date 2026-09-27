import { useState } from 'react';
import { FiX } from 'react-icons/fi';
import Modal from '../../components/Modal.jsx';
import RepeatInput from './RepeatInput.jsx';
import { inputClass, labelClass, normalizeRepeat, repeatToMm } from './constants.js';

/**
 * Repeat, stitch and time/cost working for a design.
 *
 * Everything is derived from three facts about the design — the quantity, its
 * repeat along the fabric and the stitches in one repeat — plus two about the
 * floor that are optional: the machine's speed and the stitching rate. Nothing
 * here is saved; the repeat and stitch count themselves live on the sample or
 * order, and this is prefilled from them.
 *
 * The speed and rate are remembered per browser, because they describe the
 * floor rather than a design and retyping them for every order is friction.
 */

const FLOOR_KEY = 'jk.calculator.floor';

const readFloor = () => {
  try {
    return JSON.parse(localStorage.getItem(FLOOR_KEY) ?? '{}') ?? {};
  } catch {
    return {};
  }
};

const writeFloor = (floor) => {
  try {
    localStorage.setItem(FLOOR_KEY, JSON.stringify(floor));
  } catch {
    // Private mode or blocked storage — the calculator still works, it just forgets.
  }
};

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const fmt = (n, digits = 0) =>
  Number(n).toLocaleString('en-IN', { maximumFractionDigits: digits });

const duration = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (!h) return `${m} min`;
  return m ? `${fmt(h)} h ${m} min` : `${fmt(h)} h`;
};

/** The working itself. Pure, so what is shown is exactly what is computed. */
const calculate = ({ quantity, repeat, stitches, speed, rate }) => {
  const qty = num(quantity);
  const repeatM = repeatToMm(repeat) / 1000;
  const perRepeat = num(stitches);

  const out = {};
  if (repeatM) out.repeatsPerMetre = 1 / repeatM;
  if (repeatM && perRepeat) out.stitchesPerMetre = perRepeat / repeatM;
  if (repeatM && qty) out.repeats = Math.ceil(qty / repeatM);
  if (out.repeats && perRepeat) out.totalStitches = out.repeats * perRepeat;
  if (out.totalStitches && num(speed)) out.minutes = out.totalStitches / num(speed);
  if (out.totalStitches && num(rate)) out.cost = (out.totalStitches / 1000) * num(rate);
  return out;
};

const FIELDS = [
  { name: 'quantity', label: 'Quantity (m)', step: '0.1', placeholder: '1000' },
  { name: 'repeat', label: 'Repeat', type: 'repeat' },
  { name: 'stitches', label: 'Stitches', step: '1', placeholder: '24000' },
  { name: 'speed', label: 'Machine speed (stitches/min)', step: '1', placeholder: 'Optional' },
  { name: 'rate', label: 'Rate per 1,000 stitches (₹)', step: '0.01', placeholder: 'Optional' },
];

function Result({ label, value, hint }) {
  return (
    <div className="rounded-xl bg-surface-card px-3 py-2.5 ring-1 ring-brand-ink/8">
      <dt className="font-body text-[10px] font-semibold uppercase tracking-wider text-brand-ink/45">
        {label}
      </dt>
      <dd className="mt-0.5 font-display text-lg font-bold text-brand-ink">{value ?? '—'}</dd>
      {hint ? <p className="font-body text-[11px] text-brand-ink/45">{hint}</p> : null}
    </div>
  );
}

/**
 * The calculator body. `initial` prefills the design's own figures; the
 * section-wide calculator passes none.
 */
export function StitchCalculatorPanel({ initial = {} }) {
  const [values, setValues] = useState(() => ({
    quantity: initial.quantity ?? '',
    repeat: initial.repeat ?? '',
    stitches: initial.stitches ?? '',
    ...readFloor(),
  }));

  const set = (name, value) =>
    setValues((v) => {
      const next = { ...v, [name]: value };
      if (name === 'speed' || name === 'rate') writeFloor({ speed: next.speed, rate: next.rate });
      return next;
    });

  const r = calculate(values);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {FIELDS.map((f) =>
          f.type === 'repeat' ? (
            <label key={f.name} className="flex flex-col gap-1.5 sm:col-span-2">
              <span className={labelClass}>{f.label}</span>
              <RepeatInput value={values.repeat} onChange={(value) => set('repeat', value)} />
              {/* What the working below actually uses, so a mistyped repeat shows. */}
              <span className="font-body text-xs text-brand-ink/50">
                {repeatToMm(values.repeat)
                  ? `${normalizeRepeat(values.repeat)} = ${fmt(repeatToMm(values.repeat), 2)} mm`
                  : 'Write it like 8/4'}
              </span>
            </label>
          ) : (
            <label key={f.name} className="flex flex-col gap-1.5">
              <span className={labelClass}>{f.label}</span>
              <input
                type="number"
                min="0"
                step={f.step}
                inputMode="decimal"
                value={values[f.name] ?? ''}
                placeholder={f.placeholder}
                onChange={(e) => set(f.name, e.target.value)}
                className={inputClass}
              />
            </label>
          )
        )}
      </div>

      <dl className="grid gap-2 rounded-2xl bg-admin-cream p-3 sm:grid-cols-3">
        <Result
          label="Repeats needed"
          value={r.repeats ? fmt(r.repeats) : null}
          hint="Quantity ÷ repeat, rounded up"
        />
        <Result
          label="Total stitches"
          value={r.totalStitches ? fmt(r.totalStitches) : null}
          hint="Repeats × stitches"
        />
        <Result
          label="Stitches per metre"
          value={r.stitchesPerMetre ? fmt(r.stitchesPerMetre) : null}
          hint={r.repeatsPerMetre ? `${fmt(r.repeatsPerMetre, 2)} repeats per metre` : null}
        />
        <Result
          label="Machine time"
          value={r.minutes ? duration(r.minutes) : null}
          hint="Total stitches ÷ speed"
        />
        <Result
          label="Stitching cost"
          value={
            r.cost
              ? `₹${r.cost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : null
          }
          hint="Total stitches ÷ 1,000 × rate"
        />
      </dl>

      <p className="font-body text-xs text-brand-ink/50">
        Repeat is written the floor&apos;s way: 4/4 is one Swiss inch (27.07 mm), so 8/4 is
        54.14 mm. Machine speed and rate are remembered on this device.
      </p>
    </div>
  );
}

/** The calculator as a dialog. */
export default function StitchCalculator({ open, onClose, initial, title }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title ?? 'Repeat & stitch calculator'}
      description="Work out repeats, stitches, machine time and cost for a design."
      footer={
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 font-body text-sm
                     font-semibold text-brand-ink/70 ring-1 ring-brand-ink/12
                     transition-colors hover:bg-brand-ink/5"
        >
          <FiX aria-hidden /> Close
        </button>
      }
    >
      {/* Keyed on open so each opening starts from the design it was opened for. */}
      {open ? <StitchCalculatorPanel initial={initial} /> : null}
    </Modal>
  );
}
