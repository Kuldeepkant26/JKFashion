import { useEffect, useState } from 'react';
import { FiHash, FiImage, FiArrowLeft } from 'react-icons/fi';
import * as inventoryApi from '../../../api/inventory.api.js';
import { invalidate } from '../../../api/useCachedQuery.js';
import Modal from '../../components/Modal.jsx';
import DesignImageField from './DesignImageField.jsx';
import {
  ORDER_STATUSES,
  STATUS_LABELS,
  SAMPLE_STATUS_LABELS,
  SAMPLE_STATUS_STYLES,
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

/** The design fields a sample hands to the order it is converted into. */
const FROM_SAMPLE = [
  'designNumber',
  'fabricType',
  'fabricWidth',
  'yarnType',
  'yarnColor',
  'repeat',
  'stitches',
];

/** An order opens at PENDING: the buyer has said yes, the floor has not started. */
const EMPTY = {
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
  // Only an order from before samples can change buyer; see the Buyer field.
  companyId: order.company ?? '',
  // A pre-split SAMPLING row cannot be saved back as SAMPLING; PENDING is
  // what it becomes the first time anyone edits it.
  status: ORDER_STATUSES.includes(order.status) ? order.status : 'PENDING',
  startDate: toDateInput(order.startDate),
  deadline: toDateInput(order.deadline),
  estCompletion: toDateInput(order.estCompletion),
});

const fromSampleFields = (sample) => ({
  ...EMPTY,
  ...Object.fromEntries(FROM_SAMPLE.map((k) => [k, sample[k] ?? ''])),
});

/** The sample an order is (or was) converted from, as a read-only card. */
function SourceSample({ sample, caption, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-admin-cream p-3 ring-1 ring-brand-ink/8">
      {sample.designImage?.url ? (
        <img
          src={sample.designImage.url}
          alt={`Design ${sample.designNumber}`}
          className="h-12 w-12 shrink-0 rounded-lg object-cover ring-1 ring-brand-ink/8"
        />
      ) : (
        <span
          aria-hidden
          className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-brand-ink/5 text-brand-ink/30"
        >
          <FiImage />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate font-body text-sm font-semibold text-brand-ink">
          {sample.companyName} · Design {sample.designNumber}
        </p>
        <p className="font-body text-xs text-brand-ink/55">
          Sample {sample.sampleNumber}
          {sample.status && sample.status !== 'IN_PRODUCTION' ? (
            <span
              className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                SAMPLE_STATUS_STYLES[sample.status]
              }`}
            >
              {SAMPLE_STATUS_LABELS[sample.status]}
            </span>
          ) : null}
        </p>
        {caption ? <p className="mt-0.5 font-body text-xs text-brand-ink/45">{caption}</p> : null}
      </div>

      {onChange ? (
        <button
          type="button"
          onClick={onChange}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 font-body text-xs
                     font-semibold text-brand-ink/70 ring-1 ring-brand-ink/12 transition-colors
                     hover:bg-surface-card"
        >
          <FiArrowLeft aria-hidden /> Change sample
        </button>
      ) : null}
    </div>
  );
}

/**
 * A production order: converting a sample into one, or editing one.
 *
 * There is no blank "new order" — every order is converted from a sample,
 * which is picked first (see SamplePicker) and arrives here as `fromSample`.
 * The buyer and the design come from it; what is asked for is what the sample
 * cannot know: the quantity ordered and the schedule.
 *
 * @param fromSample the sample being converted (create)
 * @param initial    the order being edited (edit)
 * @param onBack     back to the sample list, to pick a different one
 */
export default function OrderForm({
  open,
  initial,
  companies,
  /** Inside a company's dashboard the buyer is fixed and not asked for. */
  companyId: fixedCompanyId,
  fromSample,
  onBack,
  onSaved,
  onCancel,
  error,
  setError,
}) {
  const editing = Boolean(initial?._id);
  const [form, setForm] = useState(() =>
    initial ? fromOrder(initial) : fromSampleFields(fromSample)
  );
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);

  /** Copy the sample's design image — explicit, and on by default when there is one. */
  const [useSampleImage, setUseSampleImage] = useState(true);

  const [numberPreview, setNumberPreview] = useState('');

  const buyerId = editing ? form.companyId : fromSample?.company;

  /*
   * Ask the API what the next number for this buyer is. Only on create: an
   * existing order keeps the number it was issued.
   */
  useEffect(() => {
    if (editing || !buyerId) {
      setNumberPreview('');
      return undefined;
    }

    let cancelled = false;
    inventoryApi
      .previewOrderNumber(buyerId)
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
  }, [buyerId, editing]);

  const set = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  /* An order converted from a sample keeps that sample's buyer. */
  const buyerLocked = editing && Boolean(initial.sample);
  const sampleImage = fromSample?.designImage?.url;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setFieldErrors({});
    try {
      if (editing) {
        const { companyId, ...fields } = form;
        await inventoryApi.updateOrder(
          initial._id,
          buyerLocked || fixedCompanyId ? fields : { ...fields, companyId }
        );
        if (file) await inventoryApi.setOrderImage(initial._id, file);
        else if (removeImage) await inventoryApi.clearOrderImage(initial._id);
      } else {
        await inventoryApi.createOrder(
          {
            ...form,
            sampleId: fromSample._id,
            useSampleImage: Boolean(useSampleImage && !file && sampleImage),
          },
          file
        );
      }

      // The list, the pill counts, the gauge and the sample's own status all move with it.
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

  const formId = editing ? `order-${initial._id}` : `order-from-${fromSample?._id}`;
  const shownNumber = editing ? initial.orderNumber : numberPreview;

  return (
    <Modal
      error={error}
      open={open}
      onClose={saving ? undefined : onCancel}
      title={editing ? `Edit order ${initial.orderNumber}` : 'New production order'}
      description={
        editing
          ? 'Changes apply to this order only.'
          : 'Enter what the buyer ordered. Saving converts the sample into this order.'
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
        {/* Where the order comes from. On create it can still be swapped. */}
        {!editing ? (
          <SourceSample
            sample={fromSample}
            caption="Buyer and design details come from this sample."
            onChange={saving ? undefined : onBack}
          />
        ) : initial.sample ? (
          <SourceSample
            sample={{
              companyName: initial.companyName,
              designNumber: initial.designNumber,
              sampleNumber: initial.sampleNumber,
              designImage: initial.designImage,
            }}
            caption="Converted from this sample, so the buyer is fixed."
          />
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Only an order from before samples has a buyer that can be changed. */}
          {editing && !buyerLocked && !fixedCompanyId ? (
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Buyer *</span>
              <select
                required
                value={form.companyId}
                onChange={(e) => set('companyId', e.target.value)}
                className={`${inputClass} ${fieldErrors.companyId ? 'ring-rose-300' : ''}`}
              >
                {companies.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

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
                {shownNumber || 'Generated on save'}
              </output>
            </div>
          </div>
        </div>

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
