import { useEffect, useState } from 'react';
import { FiHash, FiLink } from 'react-icons/fi';
import * as inventoryApi from '../../../api/inventory.api.js';
import { invalidate } from '../../../api/useCachedQuery.js';
import Modal from '../../components/Modal.jsx';
import DesignImageField from './DesignImageField.jsx';
import {
  ORDER_STATUSES,
  STATUS_LABELS,
  inputClass,
  labelClass,
  toDateInput,
  formatMetres,
} from './constants.js';

/**
 * The order's fields, as data.
 *
 * A table plus one renderer keeps them uniform and puts the grouping — which is
 * what the floor actually reads — in one visible place.
 *
 * What is NOT here: the "Floor" group (machine, operator, mendings, rejected,
 * remarks). Those are recorded as the work happens, not when the order is
 * raised, so asking for them on this form only ever produced blanks. They are
 * still shown on the order's detail view, where the history lives.
 */
const SECTIONS = [
  {
    title: 'Order',
    fields: [
      { name: 'designNumber', label: 'Design number', required: true, placeholder: 'D-55' },
      {
        name: 'orderedMetres',
        label: 'Quantity ordered (m)',
        required: true,
        type: 'number',
        step: '0.1',
        min: '0',
      },
      { name: 'status', label: 'Status', type: 'select', options: ORDER_STATUSES },
    ],
  },
  {
    title: 'Fabric & yarn',
    fields: [
      { name: 'fabricType', label: 'Fabric type', placeholder: 'Cambric' },
      { name: 'fabricWidth', label: 'Fabric width', placeholder: '44 inch' },
      { name: 'yarnType', label: 'Yarn type', placeholder: 'Viscose rayon' },
      { name: 'yarnColor', label: 'Yarn colour', placeholder: 'Ivory' },
    ],
  },
  {
    title: 'Repeat & stitches',
    fields: [
      { name: 'repeat', label: 'Repeat (inch)', type: 'number', step: '0.01', min: '0' },
      { name: 'stitches', label: 'Stitches per repeat', type: 'number', step: '1', min: '0' },
    ],
  },
  {
    title: 'Schedule',
    fields: [
      { name: 'startDate', label: 'Start date', type: 'date' },
      { name: 'deadline', label: 'Delivery deadline', type: 'date' },
      { name: 'estCompletion', label: 'Est. completion', type: 'date' },
    ],
  },
];

/** The design fields an approved sample hands to the order raised from it. */
const FROM_SAMPLE = [
  'designNumber',
  'fabricType',
  'fabricWidth',
  'yarnType',
  'yarnColor',
  'repeat',
  'stitches',
];

/** An order opens at PENDING: the sample it came from is already approved. */
const EMPTY = {
  companyId: '',
  sampleId: '',
  designNumber: '',
  orderedMetres: '',
  status: 'PENDING',
  fabricType: '',
  fabricWidth: '',
  yarnType: '',
  yarnColor: '',
  repeat: '',
  stitches: '',
  startDate: '',
  deadline: '',
  estCompletion: '',
};

const fromOrder = (order) => ({
  ...EMPTY,
  ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, order[k] ?? ''])),
  companyId: order.company ?? '',
  sampleId: order.sample ?? '',
  // A pre-split SAMPLING row cannot be saved back as SAMPLING; PENDING is
  // what it becomes the first time anyone edits it.
  status: ORDER_STATUSES.includes(order.status) ? order.status : 'PENDING',
  startDate: toDateInput(order.startDate),
  deadline: toDateInput(order.deadline),
  estCompletion: toDateInput(order.estCompletion),
});

/** Copy a sample's design onto the form, without overwriting what is typed. */
const applySample = (form, sample, { overwrite = false } = {}) => {
  const next = { ...form, sampleId: sample._id };
  for (const key of FROM_SAMPLE) {
    const value = sample[key];
    if (value === undefined || value === null || value === '') continue;
    if (overwrite || form[key] === '' || form[key] === undefined) next[key] = value;
  }
  return next;
};

export default function OrderForm({
  open,
  initial,
  companies,
  /** Inside a company's dashboard the buyer is fixed and not asked for. */
  companyId: fixedCompanyId,
  /** Raising an order from an approved sample: prefills buyer and design. */
  fromSample,
  onSaved,
  onCancel,
  setError,
}) {
  const editing = Boolean(initial?._id);
  const [form, setForm] = useState(() => {
    if (initial) return fromOrder(initial);
    const base = { ...EMPTY, companyId: fromSample?.company ?? fixedCompanyId ?? '' };
    return fromSample ? applySample(base, fromSample, { overwrite: true }) : base;
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);

  /** Copy the sample's design image — explicit, and on by default when there is one. */
  const [useSampleImage, setUseSampleImage] = useState(true);

  const [numberPreview, setNumberPreview] = useState('');

  /** The buyer's approved samples, for the picker. */
  const [samples, setSamples] = useState([]);

  /** The chosen sample in full — with what has already been ordered from it. */
  const [sample, setSample] = useState(fromSample ?? null);

  /*
   * Ask the API what the next number for this buyer is, whenever the buyer
   * changes. Only on create: an existing order keeps the number it was issued.
   */
  useEffect(() => {
    if (editing || !form.companyId) {
      setNumberPreview('');
      return undefined;
    }

    let cancelled = false;
    inventoryApi
      .previewOrderNumber(form.companyId)
      .then((result) => {
        if (!cancelled) setNumberPreview(result.orderNumber);
      })
      .catch(() => {
        // The number is still issued on save; a failed preview is not worth a
        // banner over a form the user is part-way through.
        if (!cancelled) setNumberPreview('');
      });

    return () => {
      cancelled = true;
    };
  }, [form.companyId, editing]);

  /* The approved samples this buyer has, whenever the buyer changes. */
  useEffect(() => {
    if (!form.companyId) {
      setSamples([]);
      return undefined;
    }

    let cancelled = false;
    inventoryApi
      .listSamples({ companyId: form.companyId, status: 'APPROVED', limit: 100 })
      .then((r) => !cancelled && setSamples(r.items ?? []))
      .catch(() => !cancelled && setSamples([]));

    return () => {
      cancelled = true;
    };
  }, [form.companyId]);

  /* The chosen sample in full, for its running totals. */
  useEffect(() => {
    if (!form.sampleId) {
      setSample(null);
      return undefined;
    }

    let cancelled = false;
    inventoryApi
      .getSample(form.sampleId)
      .then((s) => !cancelled && setSample(s))
      .catch(() => !cancelled && setSample(null));

    return () => {
      cancelled = true;
    };
  }, [form.sampleId]);

  const sampleImage = sample?.designImage?.url;

  const set = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const chooseCompany = (companyId) =>
    // A sample belongs to one buyer; changing buyer drops it.
    setForm((f) => ({ ...f, companyId, sampleId: '' }));

  const chooseSample = (sampleId) => {
    const picked = samples.find((s) => s._id === sampleId);
    setForm((f) => (picked ? applySample(f, picked) : { ...f, sampleId: '' }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setFieldErrors({});
    try {
      if (editing) {
        await inventoryApi.updateOrder(initial._id, {
          ...form,
          // '' means "no sample" on the form; the API unlinks on null.
          sampleId: form.sampleId || (initial.sample ? null : undefined),
        });
        if (file) await inventoryApi.setOrderImage(initial._id, file);
        else if (removeImage) await inventoryApi.clearOrderImage(initial._id);
      } else {
        await inventoryApi.createOrder(
          {
            ...form,
            useSampleImage: Boolean(form.sampleId && useSampleImage && !file && sampleImage),
          },
          file
        );
      }

      // The list, the pill counts, the gauge and the sample's totals all move with it.
      invalidate('orders', 'summary', 'samples', 'companies', 'company-overview');
      onSaved(editing ? 'Order saved' : 'Order created');
    } catch (err) {
      setError(err?.message ?? 'Could not save that order.');
      setFieldErrors(err.fieldErrors ?? {});
    } finally {
      setSaving(false);
    }
  };

  const renderField = (f) => {
    const invalid = fieldErrors[f.name];
    const common = {
      value: form[f.name] ?? '',
      onChange: (e) => set(f.name, e.target.value),
      className: `${inputClass} ${invalid ? 'ring-rose-300' : ''}`,
      required: f.required,
    };

    return (
      <label key={f.name} className="flex flex-col gap-1.5">
        <span className={labelClass}>
          {f.label}
          {f.required ? ' *' : ''}
        </span>

        {f.type === 'select' ? (
          <select {...common}>
            {f.options.map((o) => (
              <option key={o} value={o}>
                {STATUS_LABELS[o] ?? o}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={f.type ?? 'text'}
            step={f.step}
            min={f.min}
            placeholder={f.placeholder}
            {...common}
          />
        )}

        {invalid ? <span className="text-xs text-rose-600">{invalid}</span> : null}

        {/* Ordered vs produced, right where the quantity is changed. */}
        {f.name === 'orderedMetres' && editing ? (
          <span className="font-body text-xs text-brand-ink/50">
            {formatMetres(initial.completedMetres)}m produced ·{' '}
            {formatMetres(Math.max(0, Number(form.orderedMetres || 0) - initial.completedMetres))}m
            remaining
          </span>
        ) : null}
      </label>
    );
  };

  const formId = editing ? `order-${initial._id}` : 'order-new';
  const shownNumber = editing ? initial.orderNumber : numberPreview;

  /*
   * The picker lists approved samples. When editing, the order's current
   * sample is kept as an option even if it has since been reopened, so the
   * select does not silently show "No sample" for a linked order.
   */
  const sampleOptions =
    form.sampleId && sample && !samples.some((s) => s._id === form.sampleId)
      ? [sample, ...samples]
      : samples;

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onCancel}
      title={editing ? `Edit order ${initial.orderNumber}` : 'New production order'}
      description={
        editing
          ? 'Changes apply to this order only.'
          : 'Pick the approved sample this order was confirmed from. The order number is generated on save.'
      }
      closeOnBackdrop={false}
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-xl px-4 py-2.5 font-body text-sm font-semibold text-brand-ink/70
                       ring-1 ring-brand-ink/12 transition-colors hover:bg-brand-ink/5
                       disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            disabled={saving}
            className="rounded-xl bg-brand-pink px-5 py-2.5 font-body text-sm font-semibold
                       text-on-primary transition-colors hover:bg-brand-pink-dark
                       focus-visible:outline-2 focus-visible:outline-offset-2
                       focus-visible:outline-brand-pink disabled:opacity-60"
          >
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create order'}
          </button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {fixedCompanyId ? null : (
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Buyer *</span>
              <select
                required
                value={form.companyId}
                onChange={(e) => chooseCompany(e.target.value)}
                className={`${inputClass} ${fieldErrors.companyId ? 'ring-rose-300' : ''}`}
              >
                <option value="">Choose a company…</option>
                {companies.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {fieldErrors.companyId ? (
                <span className="text-xs text-rose-600">{fieldErrors.companyId}</span>
              ) : null}
            </label>
          )}

          {/* Read-only by design: the server issues the number from an atomic
              per-buyer counter, so two people raising an order at the same
              moment cannot land on the same one. */}
          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>Order number</span>
            <div className="flex items-center gap-2 rounded-xl bg-admin-cream px-3.5 py-2.5 ring-1 ring-brand-ink/12">
              <FiHash aria-hidden className="shrink-0 text-brand-ink/35" />
              <output
                className={`min-w-0 flex-1 truncate font-body text-sm font-semibold ${
                  shownNumber ? 'text-brand-ink' : 'text-brand-ink/40'
                }`}
              >
                {shownNumber || 'Choose a buyer first'}
              </output>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------ source sample */}
        <fieldset className="flex flex-col gap-3 rounded-2xl bg-admin-cream p-4">
          <legend className="sr-only">Source sample</legend>
          <label className="flex flex-col gap-1.5">
            <span className={`${labelClass} inline-flex items-center gap-1.5`}>
              <FiLink aria-hidden /> Confirmed from sample
            </span>
            <select
              value={form.sampleId}
              onChange={(e) => chooseSample(e.target.value)}
              disabled={!form.companyId}
              className={`${inputClass} ${fieldErrors.sampleId ? 'ring-rose-300' : ''}`}
            >
              <option value="">
                {!form.companyId
                  ? 'Choose a buyer first'
                  : sampleOptions.length
                    ? 'No sample — repeat or direct order'
                    : 'No approved samples for this buyer'}
              </option>
              {sampleOptions.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.sampleNumber} · Design {s.designNumber}
                </option>
              ))}
            </select>
            {fieldErrors.sampleId ? (
              <span className="text-xs text-rose-600">{fieldErrors.sampleId}</span>
            ) : null}
          </label>

          {sample?.orderTotals ? (
            <p className="font-body text-xs text-brand-ink/60">
              {sample.orders?.length ? (
                <>
                  Already from this sample: <b>{formatMetres(sample.orderTotals.ordered)}m</b>{' '}
                  ordered, <b>{formatMetres(sample.orderTotals.produced)}m</b> produced,{' '}
                  <b>{formatMetres(sample.orderTotals.remaining)}m</b> remaining across{' '}
                  {sample.orders.length} order{sample.orders.length === 1 ? '' : 's'}.
                </>
              ) : (
                'First order from this sample. Its design details have been filled in below.'
              )}
            </p>
          ) : null}
        </fieldset>

        <div className="flex flex-col gap-2">
          <DesignImageField
            existingUrl={initial?.designImage?.url}
            file={file}
            onFile={setFile}
            removed={removeImage}
            onRemovedChange={editing ? setRemoveImage : undefined}
            setError={setError}
          />

          {/* Only an explicit, visible choice copies the sample's image. */}
          {!editing && sampleImage && !file ? (
            <label className="flex items-center gap-2 font-body text-xs text-brand-ink/70">
              <input
                type="checkbox"
                checked={useSampleImage}
                onChange={(e) => setUseSampleImage(e.target.checked)}
                className="h-4 w-4 accent-brand-pink"
              />
              <img src={sampleImage} alt="" className="h-6 w-6 rounded object-cover" />
              Use the sample&apos;s design image
            </label>
          ) : null}
        </div>

        {SECTIONS.map((section) => (
          <fieldset key={section.title} className="flex flex-col gap-3">
            <legend className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-brand-pink">
              {section.title}
            </legend>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {section.fields.map(renderField)}
            </div>
          </fieldset>
        ))}

        <p className="font-body text-xs text-brand-ink/50">
          {editing
            ? 'Metres completed are not edited here — they come from the production log, so the total always matches its history.'
            : 'Machine, operator and remarks are recorded against the order as work happens, from its detail view.'}
        </p>
      </form>
    </Modal>
  );
}
